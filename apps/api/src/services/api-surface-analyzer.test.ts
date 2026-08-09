import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { analyzeApiSurface } from './api-surface-analyzer.js';

describe('API Surface Intelligence V1 deterministic logic', () => {
  let tempRepoDir: string;

  before(async () => {
    // Create temporary repository directory
    tempRepoDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'devflow-test-api-surface-'));

    // 1. Root package.json
    await fs.promises.writeFile(path.join(tempRepoDir, 'package.json'), JSON.stringify({
      name: 'api-surface-test',
      private: true,
      dependencies: {
        express: '^4.19.2',
        graphql: '^16.8.1',
        '@grpc/grpc-js': '^1.9.0'
      }
    }));

    // Create directories
    await fs.promises.mkdir(path.join(tempRepoDir, 'src/routes'), { recursive: true });
    await fs.promises.mkdir(path.join(tempRepoDir, 'src/controllers'), { recursive: true });
    await fs.promises.mkdir(path.join(tempRepoDir, 'node_modules/some-lib'), { recursive: true });
    await fs.promises.mkdir(path.join(tempRepoDir, 'dist'), { recursive: true });

    // 2. Express application
    await fs.promises.writeFile(
      path.join(tempRepoDir, 'src/server.ts'),
      `
      import express from 'express';
      const app = express();
      app.get('/health', (req, res) => res.send('ok'));
      app.post('/users', (req, res) => res.send('created'));
      app.use('/api/v1', v1Router);
      `
    );

    // 3. Express router mounting (Express router file)
    await fs.promises.writeFile(
      path.join(tempRepoDir, 'src/routes/v1Router.ts'),
      `
      import { Router } from 'express';
      const v1Router = Router();
      v1Router.get('/users/:id', (req, res) => res.json({}));
      v1Router.delete('/users/:userId/posts/:postId', (req, res) => res.json({}));
      `
    );

    // 4. Fastify routing
    await fs.promises.writeFile(
      path.join(tempRepoDir, 'src/fastify-routes.ts'),
      `
      fastify.get('/fastify-ping', async (request, reply) => {
        return 'pong'
      });
      fastify.post('/fastify-items', async (request, reply) => {
        return 'created'
      });
      `
    );

    // 5. NestJS Decorators
    await fs.promises.writeFile(
      path.join(tempRepoDir, 'src/controllers/user.controller.ts'),
      `
      import { Controller, Get, Post, Delete, Param } from '@nestjs/common';

      @Controller('nestjs-users')
      export class UserController {
        @Get()
        findAll() {
          return [];
        }

        @Post(':id')
        createOne(@Param('id') id: string) {
          return { id };
        }
      }
      `
    );

    // 6. Hono lightweight framework routes
    await fs.promises.writeFile(
      path.join(tempRepoDir, 'src/hono-app.ts'),
      `
      import { Hono } from 'hono';
      const app = new Hono();
      app.get('/hono-welcome', (c) => c.text('Hello Hono!'));
      `
    );

    // 7. GraphQL schemas & queries
    await fs.promises.writeFile(
      path.join(tempRepoDir, 'src/schema.graphql'),
      `
      type Query {
        getUser(id: ID!): User
      }
      type Mutation {
        createUser(name: String!): User
      }
      `
    );

    // 8. gRPC Service Definition (.proto)
    await fs.promises.writeFile(
      path.join(tempRepoDir, 'src/users.proto'),
      `
      syntax = "proto3";
      package users;

      service UserService {
        rpc GetUser(UserRequest) returns (UserResponse);
        rpc ListUsers(ListUsersRequest) returns (ListUsersResponse);
      }
      `
    );

    // 9. OpenAPI / Swagger files
    await fs.promises.writeFile(
      path.join(tempRepoDir, 'openapi.yaml'),
      `
      openapi: 3.0.0
      info:
        title: Test Mock API
        version: 1.2.3
      paths:
        /openapi-health:
          get:
            summary: Health check
        /openapi-users/{id}:
          get:
            summary: Get user
      `
    );

    // 10. Dynamic routes whose paths cannot be statically resolved
    await fs.promises.writeFile(
      path.join(tempRepoDir, 'src/dynamic-routes.ts'),
      `
      const MY_DYNAMIC_PATH = '/dynamic-resolved-path';
      app.get(MY_DYNAMIC_PATH, handler);
      `
    );

    // 11. Ignored node_modules/dist route-like files
    await fs.promises.writeFile(
      path.join(tempRepoDir, 'node_modules/some-lib/routes.js'),
      `app.get('/ignored-node-modules-route', handler);`
    );
    await fs.promises.writeFile(
      path.join(tempRepoDir, 'dist/bundle.js'),
      `app.get('/ignored-dist-route', handler);`
    );

    // 12. Oversized source file (greater than 250KB)
    const largeLine = `app.get('/oversized-route', handler);\n`;
    const largeContent = largeLine.repeat(8000); // ~280KB
    await fs.promises.writeFile(
      path.join(tempRepoDir, 'src/oversized.ts'),
      largeContent
    );
  });

  after(async () => {
    if (tempRepoDir) {
      await fs.promises.rm(tempRepoDir, { recursive: true, force: true });
    }
  });

  test('detects Express and Hono frameworks correctly from package.json and source', async () => {
    const result = await analyzeApiSurface(tempRepoDir);

    const expressFw = result.frameworks.find((f) => f.name === 'Express');
    assert.ok(expressFw);
    assert.equal(expressFw?.confidence, 'high');

    const nestsFw = result.frameworks.find((f) => f.name === 'NestJS');
    assert.ok(nestsFw);

    const honoFw = result.frameworks.find((f) => f.name === 'Hono');
    assert.ok(honoFw);
  });

  test('extracts HTTP routes with correct methods, paths and file paths', async () => {
    const result = await analyzeApiSurface(tempRepoDir);

    // Express App route check
    const healthRoute = result.routes.find((r) => r.path === '/health');
    assert.ok(healthRoute);
    assert.equal(healthRoute?.method, 'GET');
    assert.equal(healthRoute?.framework, 'express');

    const usersPost = result.routes.find((r) => r.path === '/users');
    assert.ok(usersPost);
    assert.equal(usersPost?.method, 'POST');
  });

  test('resolves and composes Express mounted router prefixes correctly', async () => {
    const result = await analyzeApiSurface(tempRepoDir);

    // /api/v1 prefix mounted in server.ts and /users/:id route in v1Router.ts
    const mountedUserGet = result.routes.find((r) => r.path === '/api/v1/users/:id');
    assert.ok(mountedUserGet, 'Should resolve mounted prefix composition');
    assert.equal(mountedUserGet?.method, 'GET');

    const mountedUserDelete = result.routes.find((r) => r.path === '/api/v1/users/:userId/posts/:postId');
    assert.ok(mountedUserDelete);
    assert.equal(mountedUserDelete?.method, 'DELETE');
  });

  test('parses NestJS controller decorators and composes paths correctly', async () => {
    const result = await analyzeApiSurface(tempRepoDir);

    const nestGet = result.routes.find((r) => r.path === '/nestjs-users');
    assert.ok(nestGet);
    assert.equal(nestGet?.method, 'GET');
    assert.equal(nestGet?.framework, 'nestjs');

    const nestPost = result.routes.find((r) => r.path === '/nestjs-users/:id');
    assert.ok(nestPost);
    assert.equal(nestPost?.method, 'POST');
  });

  test('parses Hono routes correctly', async () => {
    const result = await analyzeApiSurface(tempRepoDir);

    const honoRoute = result.routes.find((r) => r.path === '/hono-welcome');
    assert.ok(honoRoute);
    assert.equal(honoRoute?.method, 'GET');
    assert.equal(honoRoute?.framework, 'hono');
  });

  test('ignores routes inside node_modules and dist directories', async () => {
    const result = await analyzeApiSurface(tempRepoDir);

    const nodeModulesRoute = result.routes.find((r) => r.path === '/ignored-node-modules-route');
    assert.equal(nodeModulesRoute, undefined);

    const distRoute = result.routes.find((r) => r.path === '/ignored-dist-route');
    assert.equal(distRoute, undefined);
  });

  test('ignores routes inside oversized files', async () => {
    const result = await analyzeApiSurface(tempRepoDir);

    const oversizedRoute = result.routes.find((r) => r.path === '/oversized-route');
    assert.equal(oversizedRoute, undefined);
  });

  test('extracts dynamic unresolvable route paths as null with medium confidence', async () => {
    const result = await analyzeApiSurface(tempRepoDir);

    const unresolvable = result.routes.find((r) => r.path === null);
    assert.ok(unresolvable);
    assert.equal(unresolvable?.method, 'GET');
    assert.equal(unresolvable?.confidence, 'medium');
  });

  test('detects GraphQL files, dependencies, schemas and signals', async () => {
    const result = await analyzeApiSurface(tempRepoDir);

    assert.equal(result.graphql.length, 1);
    assert.equal(result.graphql[0].confidence, 'medium');

    const gqlSignal = result.signals.find((s) => s.signal === 'GraphQL schema detected');
    assert.ok(gqlSignal);
  });

  test('detects and parses gRPC protobuf services and methods', async () => {
    const result = await analyzeApiSurface(tempRepoDir);

    assert.equal(result.rpc.length, 1);
    const service = result.rpc[0];
    assert.equal(service.serviceName, 'UserService');
    assert.deepEqual(service.methods, ['GetUser', 'ListUsers']);

    const grpcSignal = result.signals.find((s) => s.signal === 'gRPC service definitions detected');
    assert.ok(grpcSignal);
  });

  test('detects OpenAPI files and parses basic title, version and path counts', async () => {
    const result = await analyzeApiSurface(tempRepoDir);

    const openapiSignal = result.signals.find((s) => s.signal === 'OpenAPI specification detected');
    assert.ok(openapiSignal);
    assert.ok(openapiSignal?.evidence.includes('Version: 1.2.3'));
    assert.ok(openapiSignal?.evidence.includes('Title: Test Mock API'));
    assert.ok(openapiSignal?.evidence.includes('2 paths'));
  });

  test('handles empty repository or repository without API surfaces gracefully', async () => {
    const emptyRepoDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'devflow-empty-test-'));
    try {
      await fs.promises.writeFile(path.join(emptyRepoDir, 'README.md'), '# Pure docs');

      const result = await analyzeApiSurface(emptyRepoDir);
      assert.equal(result.routes.length, 0);
      assert.equal(result.frameworks.length, 0);
      assert.equal(result.graphql.length, 0);
      assert.equal(result.rpc.length, 0);

      const noApiSignal = result.signals.find((s) => s.signal === 'CLI-oriented project or static frontend');
      assert.ok(noApiSignal);
    } finally {
      await fs.promises.rm(emptyRepoDir, { recursive: true, force: true });
    }
  });
});
