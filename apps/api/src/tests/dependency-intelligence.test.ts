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

  test('extractDependencyIntelligence handles monorepo setup with multiple nested manifests', async () => {
    const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'devflow-dep-monorepo-'));

    try {
      // 1. Root package.json
      await fs.promises.writeFile(
        path.join(tmpDir, 'package.json'),
        JSON.stringify({
          name: 'monorepo-root',
          workspaces: ['packages/*'],
          devDependencies: { turbo: '^1.10.0' }
        })
      );

      // 2. packages/shared package.json
      await fs.promises.mkdir(path.join(tmpDir, 'packages', 'shared'), { recursive: true });
      await fs.promises.writeFile(
        path.join(tmpDir, 'packages', 'shared', 'package.json'),
        JSON.stringify({
          name: '@scope/shared',
          dependencies: { lodash: '^4.17.21' }
        })
      );

      // 3. packages/app/Cargo.toml (Rust crate nested inside monorepo)
      await fs.promises.mkdir(path.join(tmpDir, 'packages', 'app'), { recursive: true });
      await fs.promises.writeFile(
        path.join(tmpDir, 'packages', 'app', 'Cargo.toml'),
        `
[package]
name = "rust-app"
version = "0.1.0"

[dependencies]
tokio = "1.35.0"
`
      );

      const result = await extractDependencyIntelligence(tmpDir);

      // Verify discovered manifests are exact relative paths
      assert.equal(result.dependencyManifests.length, 3);
      assert.ok(result.dependencyManifests.includes('package.json'));
      assert.ok(result.dependencyManifests.includes('packages/shared/package.json'));
      assert.ok(result.dependencyManifests.includes('packages/app/Cargo.toml'));

      // Verify dependencies are extracted correctly with corresponding sources
      const turboDep = result.dependencies.find((d) => d.name === 'turbo');
      const lodashDep = result.dependencies.find((d) => d.name === 'lodash');
      const tokioDep = result.dependencies.find((d) => d.name === 'tokio');

      assert.ok(turboDep);
      assert.equal(turboDep?.source, 'package.json');
      assert.equal(turboDep?.type, 'development');

      assert.ok(lodashDep);
      assert.equal(lodashDep?.source, 'packages/shared/package.json');
      assert.equal(lodashDep?.type, 'production');

      assert.ok(tokioDep);
      assert.equal(tokioDep?.source, 'packages/app/Cargo.toml');
      assert.equal(tokioDep?.type, 'production');

      assert.equal(result.dependencyCount, 3);
      assert.equal(result.productionDependencyCount, 2); // lodash, tokio
      assert.equal(result.developmentDependencyCount, 1); // turbo
    } finally {
      await fs.promises.rm(tmpDir, { recursive: true, force: true });
    }
  });

  test('extractDependencyIntelligence handles malformed manifests safely without crashing', async () => {
    const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'devflow-dep-malformed-'));

    try {
      // 1. Malformed JSON package.json
      await fs.promises.writeFile(
        path.join(tmpDir, 'package.json'),
        '{ name: "stale-json", dependencies: { "react": "^19.0.0" ' // Missing closing braces
      );

      // 2. Malformed Cargo.toml
      await fs.promises.writeFile(
        path.join(tmpDir, 'Cargo.toml'),
        `
[dependencies
serde = "1.0"
` // Missing closing square bracket for section header
      );

      // 3. Malformed requirements.txt (empty or invalid lines)
      await fs.promises.writeFile(
        path.join(tmpDir, 'requirements.txt'),
        `
# Invalid requirements
-r non-existent-file.txt
===invalid-format===
`
      );

      // 4. Malformed pyproject.toml
      await fs.promises.writeFile(
        path.join(tmpDir, 'pyproject.toml'),
        `
[tool.poetry.dependencies]
= "invalid-key-value"
`
      );

      const result = await extractDependencyIntelligence(tmpDir);

      // Manifests are still identified as dependency manifests, but dependencies parsed from malformed blocks are skipped safely
      assert.ok(result.dependencyManifests.includes('package.json'));
      assert.ok(result.dependencyManifests.includes('Cargo.toml'));
      assert.ok(result.dependencyManifests.includes('requirements.txt'));
      assert.ok(result.dependencyManifests.includes('pyproject.toml'));

      // Assert that we did not crash and no partial/malformed dependencies are returned
      assert.equal(result.dependencies.length, 0);
      assert.equal(result.dependencyCount, 0);
    } finally {
      await fs.promises.rm(tmpDir, { recursive: true, force: true });
    }
  });

  test('extractDependencyIntelligence ignores specific directories and handles oversized files', async () => {
    const tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'devflow-dep-ignored-'));

    try {
      // 1. Create a valid root package.json
      await fs.promises.writeFile(
        path.join(tmpDir, 'package.json'),
        JSON.stringify({
          dependencies: { express: '^5.0.0' }
        })
      );

      // 2. Create ignored folder content (.git, node_modules)
      await fs.promises.mkdir(path.join(tmpDir, 'node_modules', 'foo'), { recursive: true });
      await fs.promises.writeFile(
        path.join(tmpDir, 'node_modules', 'foo', 'package.json'),
        JSON.stringify({ dependencies: { bar: '^1.0.0' } })
      );

      await fs.promises.mkdir(path.join(tmpDir, '.git', 'hooks'), { recursive: true });
      await fs.promises.writeFile(
        path.join(tmpDir, '.git', 'package.json'),
        JSON.stringify({ dependencies: { bar: '^1.0.0' } })
      );

      // 3. Create an oversized requirements.txt (exceeding 1MB safety cap)
      const oversizedContent = 'a'.repeat(1024 * 1024 + 100); // 1MB + 100 bytes
      await fs.promises.writeFile(
        path.join(tmpDir, 'requirements.txt'),
        oversizedContent
      );

      const result = await extractDependencyIntelligence(tmpDir);

      // The bar dependency inside node_modules and .git is ignored. requirements.txt is skipped due to size.
      assert.equal(result.dependencyManifests.length, 1);
      assert.equal(result.dependencyManifests[0], 'package.json');
      assert.equal(result.dependencyCount, 1);
      assert.equal(result.dependencies[0].name, 'express');
    } finally {
      await fs.promises.rm(tmpDir, { recursive: true, force: true });
    }
  });

});
