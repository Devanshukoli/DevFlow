import fs from 'node:fs';
import path from 'node:path';
import {
  RepositoryApiSurface,
  ApiRoute,
  ApiFramework,
  GraphqlSurface,
  RpcSurface,
  ApiSurfaceSignal
} from '@devflow/shared';

const IGNORED_DIRECTORIES = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.next',
  '.cache',
  '.turbo',
  'target',
  'vendor'
]);

const ALLOWED_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.go',
  '.proto',
  '.graphql',
  '.gql',
  '.yaml',
  '.yml',
  '.json'
]);

interface RawRoute {
  method: string;
  path: string | null;
  routerVar: string | null;
  file: string;
  line: number;
  framework: string;
  confidence: 'high' | 'medium' | 'low';
}

interface RawMount {
  parentVar: string;
  prefix: string;
  childVar: string;
  file: string;
}

export async function analyzeApiSurface(repoDir: string): Promise<RepositoryApiSurface> {
  const routes: ApiRoute[] = [];
  const frameworks: ApiFramework[] = [];
  const graphql: GraphqlSurface[] = [];
  const rpc: RpcSurface[] = [];
  const signals: ApiSurfaceSignal[] = [];

  // Walk the repository and collect file contents/paths
  const filesToScan: string[] = [];

  async function walk(currentDir: string) {
    let entries;
    try {
      entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (IGNORED_DIRECTORIES.has(entry.name)) {
          continue;
        }
        await walk(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (ALLOWED_EXTENSIONS.has(ext)) {
          filesToScan.push(fullPath);
        }
      }
    }
  }

  await walk(repoDir);

  // Framework detection from package.json if it exists
  let packageJsonPath = path.join(repoDir, 'package.json');
  let hasPackageJson = false;
  let deps: Record<string, string> = {};
  let devDeps: Record<string, string> = {};

  try {
    const pkgContent = await fs.promises.readFile(packageJsonPath, 'utf-8');
    const pkg = JSON.parse(pkgContent);
    hasPackageJson = true;
    deps = pkg.dependencies || {};
    devDeps = pkg.devDependencies || {};
  } catch {
    // No package.json or invalid
  }

  // Framework rules mapping pkg names to framework keys
  const frameworkRules = [
    { key: 'express', name: 'Express', dep: 'express' },
    { key: 'fastify', name: 'Fastify', dep: 'fastify' },
    { key: 'nestjs', name: 'NestJS', dep: '@nestjs/core' },
    { key: 'hono', name: 'Hono', dep: 'hono' },
    { key: 'koa', name: 'Koa', dep: 'koa' },
    { key: 'elysia', name: 'Elysia', dep: 'elysia' },
    { key: 'hapi', name: 'Hapi', dep: '@hapi/hapi' }
  ];

  const detectedFrameworkKeys = new Set<string>();

  for (const rule of frameworkRules) {
    if (deps[rule.dep] || devDeps[rule.dep]) {
      frameworks.push({
        name: rule.name,
        version: deps[rule.dep] || devDeps[rule.dep],
        confidence: 'high'
      });
      detectedFrameworkKeys.add(rule.key);
    }
  }

  // Additional framework detection based on sources
  let hasGoFiles = false;
  let hasProtoFiles = false;
  let hasGraphQLFiles = false;
  let hasGraphQLDeps = false;
  let graphqlEndpoint: string | null = null;

  // Track raw routes & router mounts across codebase
  const rawRoutes: RawRoute[] = [];
  const rawMounts: RawMount[] = [];
  const routerDeclarations = new Map<string, { file: string; prefix?: string }>();

  // GraphQL dependencies check
  const gqlDeps = ['graphql', 'apollo-server', 'graphql-yoga', 'express-graphql', '@apollo/server'];
  for (const gd of gqlDeps) {
    if (deps[gd] || devDeps[gd]) {
      hasGraphQLDeps = true;
    }
  }

  // Scan all target files (safely, respecting size limit)
  for (const file of filesToScan) {
    const relPath = path.relative(repoDir, file);
    let stats;
    try {
      stats = await fs.promises.stat(file);
    } catch {
      continue;
    }

    // Skip oversized files (> 250KB)
    if (stats.size > 250000) {
      continue;
    }

    const ext = path.extname(file).toLowerCase();
    const fileName = path.basename(file).toLowerCase();

    if (ext === '.go') {
      hasGoFiles = true;
    }
    if (ext === '.proto') {
      hasProtoFiles = true;
    }
    if (ext === '.graphql' || ext === '.gql') {
      hasGraphQLFiles = true;
    }

    // Read file content
    let content = '';
    try {
      content = await fs.promises.readFile(file, 'utf-8');
    } catch {
      continue;
    }

    // 1. OpenAPI / Swagger files detection
    const isOpenApiFile = [
      'openapi.yaml', 'openapi.yml', 'openapi.json',
      'swagger.yaml', 'swagger.yml', 'swagger.json'
    ].includes(fileName);

    if (isOpenApiFile) {
      let title = 'OpenAPI Specification';
      let version = '1.0.0';
      let pathCount = 0;

      if (ext === '.json') {
        try {
          const parsed = JSON.parse(content);
          title = parsed.info?.title || title;
          version = parsed.info?.version || version;
          pathCount = Object.keys(parsed.paths || {}).length;
        } catch {
          // ignore parsing error
        }
      } else {
        // Parse basic YAML info via regex
        const titleMatch = content.match(/title:\s*['"]?(.*?)['"]?$/m);
        const versionMatch = content.match(/version:\s*['"]?(.*?)['"]?$/m);
        if (titleMatch) title = titleMatch[1];
        if (versionMatch) version = versionMatch[1];

        // Match YAML paths (e.g., "  /users:")
        const pathsRegex = /^\s*\/([a-zA-Z0-9_{}\/:-]+):/gm;
        const matchedPaths = new Set<string>();
        let pMatch;
        while ((pMatch = pathsRegex.exec(content)) !== null) {
          matchedPaths.add(pMatch[1]);
        }
        pathCount = matchedPaths.size;
      }

      signals.push({
        signal: 'OpenAPI specification detected',
        evidence: [relPath, `Title: ${title}`, `Version: ${version}`, `${pathCount} paths`],
        confidence: 'high'
      });
    }

    // 2. GraphQL detection within source code
    if (ext === '.graphql' || ext === '.gql') {
      signals.push({
        signal: 'GraphQL schema detected',
        evidence: [relPath],
        confidence: 'high'
      });
    }

    if (content.includes('type Query') || content.includes('type Mutation')) {
      hasGraphQLFiles = true;
    }

    // Search for explicit GraphQL endpoint usage
    const gqlEndpointMatch = content.match(/(?:app|server|router)\.use\(\s*(['"`])(\/graphql)\1/i);
    if (gqlEndpointMatch) {
      graphqlEndpoint = gqlEndpointMatch[2];
    }

    // 3. gRPC Protobuf definition parsing
    if (ext === '.proto') {
      const serviceRegex = /service\s+(\w+)\s*\{/g;
      let sMatch;
      while ((sMatch = serviceRegex.exec(content)) !== null) {
        const serviceName = sMatch[1];
        // Extract methods inside the file or simple globally-mapped methods
        const methods: string[] = [];
        const methodRegex = /rpc\s+(\w+)\s*\((.*?)\)\s+returns\s*\((.*?)\)/g;
        let mMatch;
        while ((mMatch = methodRegex.exec(content)) !== null) {
          methods.push(mMatch[1]);
        }
        rpc.push({
          serviceName,
          methods,
          sourceFile: relPath,
          confidence: 'high'
        });
      }
    }

    // 4. TS/JS Route scanning (Express, Fastify, NestJS, Hono, Koa, Elysia, Hapi)
    if (['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'].includes(ext)) {
      // Find Express router declarations
      const expressRouterRegex = /(?:const|let|var)\s+(\w+)\s*=\s*(?:express\.)?Router\(/g;
      let erMatch;
      while ((erMatch = expressRouterRegex.exec(content)) !== null) {
        routerDeclarations.set(erMatch[1], { file: relPath });
      }

      // Find Hono declarations
      const honoAppRegex = /(?:const|let|var)\s+(\w+)\s*=\s*new\s+Hono\(/g;
      let haMatch;
      while ((haMatch = honoAppRegex.exec(content)) !== null) {
        routerDeclarations.set(haMatch[1], { file: relPath });
        if (!detectedFrameworkKeys.has('hono')) {
          detectedFrameworkKeys.add('hono');
          frameworks.push({ name: 'Hono', confidence: 'high' });
        }
      }

      // Find NestJS controller definitions
      const nestControllerRegex = /@Controller\s*\(\s*(?:(['"`])(.*?)\1)?\s*\)\s*export\s+class\s+(\w+)/g;
      let ncMatch;
      let fileControllerPrefix: string | null = null;
      if ((ncMatch = nestControllerRegex.exec(content)) !== null) {
        fileControllerPrefix = ncMatch[2] || '';
        // If not empty, normalize prefix to ensure leading slash
        if (fileControllerPrefix && !fileControllerPrefix.startsWith('/')) {
          fileControllerPrefix = '/' + fileControllerPrefix;
        }
        if (!detectedFrameworkKeys.has('nestjs')) {
          detectedFrameworkKeys.add('nestjs');
          frameworks.push({ name: 'NestJS', confidence: 'high' });
        }
      }

      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const lineText = lines[i];
        const lineNumber = i + 1;

        // Express / Hono / Fastify / Koa Route matches
        const routeMethodsRegex = /(?:router|app|route)\.(get|post|put|delete|patch)\s*\(\s*(['"`])(.*?)\2/gi;
        let rMatch;
        while ((rMatch = routeMethodsRegex.exec(lineText)) !== null) {
          const method = rMatch[1].toUpperCase();
          const routePath = rMatch[3];
          // Guess framework based on detected package, Hono, or fallback Express
          let fw = 'express';
          if (content.includes('Hono') || content.includes('hono')) fw = 'hono';
          else if (content.includes('fastify') || content.includes('Fastify')) fw = 'fastify';

          rawRoutes.push({
            method,
            path: routePath,
            routerVar: lineText.match(/(\w+)\.(?:get|post|put|delete|patch)/)?.[1] || null,
            file: relPath,
            line: lineNumber,
            framework: fw,
            confidence: 'high'
          });
        }

        // Catch dynamic routes that cannot be statically resolved (e.g. router.get(USER_ROUTE, ...))
        const unresolvableRouteRegex = /(?:router|app|route)\.(get|post|put|delete|patch)\s*\(\s*([a-zA-Z0-9_]+)\s*,/gi;
        let urMatch;
        while ((urMatch = unresolvableRouteRegex.exec(lineText)) !== null) {
          const method = urMatch[1].toUpperCase();
          let fw = 'express';
          if (content.includes('Hono') || content.includes('hono')) fw = 'hono';

          rawRoutes.push({
            method,
            path: null,
            routerVar: lineText.match(/(\w+)\.(?:get|post|put|delete|patch)/)?.[1] || null,
            file: relPath,
            line: lineNumber,
            framework: fw,
            confidence: 'medium'
          });
        }

        // NestJS routes matching within controller file
        const nestMethodRegex = /@(Get|Post|Put|Delete|Patch)\s*\(\s*(?:(['"`])(.*?)\2)?\s*\)/g;
        let nmMatch;
        while ((nmMatch = nestMethodRegex.exec(lineText)) !== null) {
          const method = nmMatch[1].toUpperCase();
          const decoratorPath = nmMatch[3] || '';
          let finalPath: string | null = null;

          if (fileControllerPrefix !== null) {
            let p1 = fileControllerPrefix;
            let p2 = decoratorPath;
            if (p2 && !p2.startsWith('/')) p2 = '/' + p2;
            finalPath = `${p1}${p2}`.replace(/\/+/g, '/');
            if (!finalPath.startsWith('/')) finalPath = '/' + finalPath;
          } else {
            finalPath = decoratorPath.startsWith('/') ? decoratorPath : '/' + decoratorPath;
          }

          rawRoutes.push({
            method,
            path: finalPath,
            routerVar: null,
            file: relPath,
            line: lineNumber,
            framework: 'nestjs',
            confidence: 'high'
          });
        }

        // Express / Hono Router mounting: app.use('/api', userRouter) or app.route('/api', apiRouter)
        const mountRegex = /(?:app|router|route)\.(?:use|route)\s*\(\s*(['"`])(.*?)\1\s*,\s*(\w+)/gi;
        let mMatch;
        while ((mMatch = mountRegex.exec(lineText)) !== null) {
          const parentVar = lineText.match(/(\w+)\.(?:use|route)/)?.[1] || 'app';
          const prefix = mMatch[2];
          const childVar = mMatch[3];
          rawMounts.push({
            parentVar,
            prefix,
            childVar,
            file: relPath
          });
        }
      }
    }

    // 5. Go route mapping
    if (ext === '.go') {
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const lineText = lines[i];
        const lineNumber = i + 1;

        // r.GET("/path", ...) style (Gin/Fiber)
        const goGinRegex = /(?:r|router|app|group)\.(GET|POST|PUT|DELETE|PATCH)\s*\(\s*(['"`])(.*?)\2/gi;
        let ggMatch;
        while ((ggMatch = goGinRegex.exec(lineText)) !== null) {
          const method = ggMatch[1].toUpperCase();
          const routePath = ggMatch[3];
          rawRoutes.push({
            method,
            path: routePath,
            routerVar: null,
            file: relPath,
            line: lineNumber,
            framework: 'Go standard/gin',
            confidence: 'high'
          });
        }

        // HandleFunc("/path", ...)
        const goHandleFunc = /(?:http|r|router)\.HandleFunc\s*\(\s*(['"`])(.*?)\1/g;
        let ghMatch;
        while ((ghMatch = goHandleFunc.exec(lineText)) !== null) {
          const routePath = ghMatch[2];
          // Check if method is chained, e.g., .Methods("POST")
          const methodMatch = lineText.match(/\.Methods\s*\(\s*(['"`])(.*?)\1/i);
          const method = methodMatch ? methodMatch[2].toUpperCase() : 'GET';
          rawRoutes.push({
            method,
            path: routePath,
            routerVar: null,
            file: relPath,
            line: lineNumber,
            framework: 'Go standard',
            confidence: 'high'
          });
        }
      }
    }
  }

  // 6. Router Path Composition (Composition of mounted routes)
  // For each route, if there's a mount statement matching its routerVar, prefix its path
  const mountedRouterPrefixes = new Map<string, string>();
  for (const m of rawMounts) {
    mountedRouterPrefixes.set(m.childVar, m.prefix);
  }

  for (const r of rawRoutes) {
    let finalPath = r.path;
    if (r.routerVar && mountedRouterPrefixes.has(r.routerVar)) {
      const prefix = mountedRouterPrefixes.get(r.routerVar)!;
      if (finalPath) {
        let p1 = prefix;
        let p2 = finalPath;
        if (!p2.startsWith('/')) p2 = '/' + p2;
        finalPath = `${p1}${p2}`.replace(/\/+/g, '/');
      } else {
        finalPath = prefix;
      }
    }

    // Normalize final paths to ensure leading slash
    if (finalPath && !finalPath.startsWith('/')) {
      finalPath = '/' + finalPath;
    }

    routes.push({
      method: r.method,
      path: finalPath,
      sourceFile: r.file,
      framework: r.framework,
      confidence: r.confidence,
      line: r.line
    });
  }

  // GraphQL handling
  if (hasGraphQLFiles || hasGraphQLDeps) {
    graphql.push({
      provider: hasGraphQLDeps ? 'apollo-server/graphql-yoga' : 'graphql',
      endpoint: graphqlEndpoint || null,
      confidence: graphqlEndpoint ? 'high' : 'medium'
    });

    signals.push({
      signal: 'GraphQL schema detected',
      evidence: graphqlEndpoint ? [`Endpoint: ${graphqlEndpoint}`] : ['GraphQL patterns found in files'],
      confidence: 'medium'
    });
  }

  // Ensure unique framework listings
  const uniqueFws = new Map<string, ApiFramework>();
  for (const fw of frameworks) {
    uniqueFws.set(fw.name, fw);
  }
  // Fill from detected keys if missing
  for (const key of detectedFrameworkKeys) {
    const name = key.charAt(0).toUpperCase() + key.slice(1);
    if (!uniqueFws.has(name)) {
      uniqueFws.set(name, { name, confidence: 'medium' });
    }
  }

  // Build RPC signals
  if (hasProtoFiles || rpc.length > 0) {
    signals.push({
      signal: 'gRPC service definitions detected',
      evidence: rpc.map((r) => `${r.serviceName} (${r.methods.length} methods)`),
      confidence: 'high'
    });
  }

  // Produce Framework Signals
  uniqueFws.forEach((fw) => {
    signals.push({
      signal: `${fw.name} HTTP API detected`,
      evidence: routes.filter((r) => r.framework.toLowerCase().includes(fw.name.toLowerCase())).map((r) => r.sourceFile).slice(0, 3),
      confidence: 'high'
    });
  });

  // REST pattern signals
  const hasRestRoutes = routes.some((r) => r.path && (r.path.includes('/:id') || r.path.includes('/api/')));
  if (hasRestRoutes) {
    signals.push({
      signal: 'REST-style route structure detected',
      evidence: routes.filter((r) => r.path && r.path.includes('/:id')).map((r) => `${r.method} ${r.path}`).slice(0, 3),
      confidence: 'high'
    });
  }

  // File organization signals
  const organizedInRoutes = routes.some((r) => r.sourceFile.includes('/routes/') || r.sourceFile.includes('routes/'));
  if (organizedInRoutes) {
    signals.push({
      signal: 'API routes are organized under routes/',
      evidence: routes.filter((r) => r.sourceFile.includes('routes/')).map((r) => r.sourceFile).slice(0, 1),
      confidence: 'high'
    });
  }
  const organizedInControllers = routes.some((r) => r.sourceFile.includes('/controllers/') || r.sourceFile.includes('controllers/'));
  if (organizedInControllers) {
    signals.push({
      signal: 'API routes are organized under controllers/',
      evidence: routes.filter((r) => r.sourceFile.includes('controllers/')).map((r) => r.sourceFile).slice(0, 1),
      confidence: 'high'
    });
  }

  // Fallback for CLI or pure frontends
  if (routes.length === 0 && graphql.length === 0 && rpc.length === 0 && signals.length === 0) {
    signals.push({
      signal: 'CLI-oriented project or static frontend',
      evidence: ['No server routing or backend frameworks identified'],
      confidence: 'high'
    });
  }

  return {
    frameworks: Array.from(uniqueFws.values()),
    routes,
    graphql,
    rpc,
    signals
  };
}
