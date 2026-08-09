import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  parsePackageJsonManifest,
  parseCargoTomlManifest,
  parseRequirementsTxtManifest,
  parsePyprojectTomlManifest,
  parseGoModManifest,
  parsePomXmlManifest,
  extractDependencyIntelligence,
} from '../services/dependency-extractor.js';

describe('Task 9 - Dependency Intelligence Unit Tests', () => {

  test('parsePackageJsonManifest extracts production, dev, optional, peer dependencies', () => {
    const content = JSON.stringify({
      name: 'sample-app',
      dependencies: { express: '^5.1.0', dotenv: '^16.0.0' },
      devDependencies: { typescript: '^5.8.0', vitest: '^3.2.0' },
      optionalDependencies: { fsevents: '^2.3.2' },
      peerDependencies: { react: '^19.0.0' },
    });

    const deps = parsePackageJsonManifest(content, 'package.json');

    assert.equal(deps.length, 6);

    const expressDep = deps.find((d) => d.name === 'express');
    assert.ok(expressDep);
    assert.equal(expressDep?.version, '^5.1.0');
    assert.equal(expressDep?.type, 'production');
    assert.equal(expressDep?.source, 'package.json');

    const tsDep = deps.find((d) => d.name === 'typescript');
    assert.ok(tsDep);
    assert.equal(tsDep?.type, 'development');

    const fsDep = deps.find((d) => d.name === 'fsevents');
    assert.ok(fsDep);
    assert.equal(fsDep?.type, 'optional');

    const reactDep = deps.find((d) => d.name === 'react');
    assert.ok(reactDep);
    assert.equal(reactDep?.type, 'peer');
  });

  test('parseCargoTomlManifest extracts Rust dependencies and dev-dependencies', () => {
    const content = `
[package]
name = "my-crate"
version = "0.1.0"

[dependencies]
serde = "1.0.197"
tokio = { version = "1.35", features = ["full"] }

[dev-dependencies]
tempfile = "3.8"
`;

    const deps = parseCargoTomlManifest(content, 'Cargo.toml');
    assert.equal(deps.length, 3);

    const serdeDep = deps.find((d) => d.name === 'serde');
    assert.ok(serdeDep);
    assert.equal(serdeDep?.version, '1.0.197');
    assert.equal(serdeDep?.type, 'production');

    const tokioDep = deps.find((d) => d.name === 'tokio');
    assert.ok(tokioDep);
    assert.equal(tokioDep?.version, '1.35');
    assert.equal(tokioDep?.type, 'production');

    const tempfileDep = deps.find((d) => d.name === 'tempfile');
    assert.ok(tempfileDep);
    assert.equal(tempfileDep?.type, 'development');
  });

  test('parseRequirementsTxtManifest extracts Python dependencies and comments handling', () => {
    const content = `
# Comment line
fastapi==0.115.0
requests>=2.31.0
numpy # inline comment
-r base.txt
`;

    const deps = parseRequirementsTxtManifest(content, 'requirements.txt');
    assert.equal(deps.length, 3);

    const fastapiDep = deps.find((d) => d.name === 'fastapi');
    assert.ok(fastapiDep);
    assert.equal(fastapiDep?.version, '==0.115.0');
    assert.equal(fastapiDep?.type, 'production');

    const numpyDep = deps.find((d) => d.name === 'numpy');
    assert.ok(numpyDep);
    assert.equal(numpyDep?.type, 'production');
  });

  test('parsePyprojectTomlManifest extracts dependencies and dev-dependencies', () => {
    const content = `
[tool.poetry.dependencies]
python = "^3.11"
fastapi = "0.115.0"

[tool.poetry.group.dev.dependencies]
pytest = "^8.0.0"
`;

    const deps = parsePyprojectTomlManifest(content, 'pyproject.toml');
    assert.equal(deps.length, 2);

    const fastapiDep = deps.find((d) => d.name === 'fastapi');
    assert.ok(fastapiDep);
    assert.equal(fastapiDep?.version, '0.115.0');
    assert.equal(fastapiDep?.type, 'production');

    const pytestDep = deps.find((d) => d.name === 'pytest');
    assert.ok(pytestDep);
    assert.equal(pytestDep?.type, 'development');
  });

  test('parseGoModManifest extracts require blocks and single line requires', () => {
    const content = `
module example.com/myapp

go 1.22

require (
	github.com/gin-gonic/gin v1.9.1
	github.com/google/uuid v1.6.0
)

require github.com/stretchr/testify v1.9.0
`;

    const deps = parseGoModManifest(content, 'go.mod');
    assert.equal(deps.length, 3);

    const ginDep = deps.find((d) => d.name === 'github.com/gin-gonic/gin');
    assert.ok(ginDep);
    assert.equal(ginDep?.version, 'v1.9.1');
    assert.equal(ginDep?.type, 'production');

    const testDep = deps.find((d) => d.name === 'github.com/stretchr/testify');
    assert.ok(testDep);
    assert.equal(testDep?.version, 'v1.9.0');
  });

  test('parsePomXmlManifest extracts Java dependencies and scope', () => {
    const content = `
<project>
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
      <version>3.2.3</version>
    </dependency>
    <dependency>
      <groupId>org.junit.jupiter</groupId>
      <artifactId>junit-jupiter</artifactId>
      <version>5.10.2</version>
      <scope>test</scope>
    </dependency>
  </dependencies>
</project>
`;

    const deps = parsePomXmlManifest(content, 'pom.xml');
    assert.equal(deps.length, 2);

    const springDep = deps.find((d) => d.name === 'org.springframework.boot:spring-boot-starter-web');
    assert.ok(springDep);
    assert.equal(springDep?.version, '3.2.3');
    assert.equal(springDep?.type, 'production');

    const junitDep = deps.find((d) => d.name === 'org.junit.jupiter:junit-jupiter');
    assert.ok(junitDep);
    assert.equal(junitDep?.type, 'development');
  });

  test('extractDependencyIntelligence handles monorepo, ignored dirs, duplicates, and malformed files', async () => {
    const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'devflow-dep-test-'));

    try {
      // Create root package.json
      await fs.promises.writeFile(
        path.join(tmpDir, 'package.json'),
        JSON.stringify({
          dependencies: { react: '^19.0.0' },
          devDependencies: { typescript: '^5.8.0' },
        })
      );

      // Create apps/api/package.json (monorepo manifest)
      await fs.promises.mkdir(path.join(tmpDir, 'apps', 'api'), { recursive: true });
      await fs.promises.writeFile(
        path.join(tmpDir, 'apps', 'api', 'package.json'),
        JSON.stringify({
          dependencies: { express: '^5.1.0', react: '^19.0.0' }, // Duplicate react
        })
      );

      // Create ignored node_modules manifest that should NOT be parsed
      await fs.promises.mkdir(path.join(tmpDir, 'node_modules', 'express'), { recursive: true });
      await fs.promises.writeFile(
        path.join(tmpDir, 'node_modules', 'express', 'package.json'),
        JSON.stringify({ name: 'express', dependencies: { mime: '1.0' } })
      );

      // Create malformed manifest
      await fs.promises.mkdir(path.join(tmpDir, 'apps', 'web'), { recursive: true });
      await fs.promises.writeFile(
        path.join(tmpDir, 'apps', 'web', 'package.json'),
        '{ INVALID JSON syntax...'
      );

      const result = await extractDependencyIntelligence(tmpDir);

      // Manifests detected: root package.json, apps/api/package.json, apps/web/package.json (node_modules ignored)
      assert.ok(result.dependencyManifests.includes('package.json'));
      assert.ok(result.dependencyManifests.includes('apps/api/package.json'));
      assert.ok(!result.dependencyManifests.some((m) => m.includes('node_modules')));

      // Duplicate 'react' preserved with different sources
      const reactDeps = result.dependencies.filter((d) => d.name === 'react');
      assert.equal(reactDeps.length, 2);
      assert.ok(reactDeps.some((d) => d.source === 'package.json'));
      assert.ok(reactDeps.some((d) => d.source === 'apps/api/package.json'));

      // Metrics counts
      assert.equal(result.dependencyCount, 4); // react(root), typescript(root), express(api), react(api)
      assert.equal(result.productionDependencyCount, 3); // react(root), express(api), react(api)
      assert.equal(result.developmentDependencyCount, 1); // typescript(root)

    } finally {
      await fs.promises.rm(tmpDir, { recursive: true, force: true });
    }
  });

});
