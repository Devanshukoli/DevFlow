import test from 'node:test';
import assert from 'node:assert/strict';
import { validateGithubRepositoryUrl } from './analysis-service.js';

test('validateGithubRepositoryUrl accepts valid GitHub repository URLs', () => {
  assert.equal(
    validateGithubRepositoryUrl('https://github.com/facebook/react'),
    'https://github.com/facebook/react'
  );
  assert.equal(
    validateGithubRepositoryUrl('https://github.com/facebook/react/'),
    'https://github.com/facebook/react'
  );
  assert.equal(
    validateGithubRepositoryUrl('https://github.com/vercel/next.js'),
    'https://github.com/vercel/next.js'
  );
});

test('validateGithubRepositoryUrl rejects invalid URLs or subpaths', () => {
  // Non-HTTPS
  assert.equal(validateGithubRepositoryUrl('http://github.com/facebook/react'), null);
  // Non-GitHub domain
  assert.equal(validateGithubRepositoryUrl('https://google.com/facebook/react'), null);
  // Missing repo or owner
  assert.equal(validateGithubRepositoryUrl('https://github.com/'), null);
  assert.equal(validateGithubRepositoryUrl('https://github.com/facebook'), null);
  // Subpaths
  assert.equal(validateGithubRepositoryUrl('https://github.com/facebook/react/tree/main'), null);
  // Empty or invalid types
  assert.equal(validateGithubRepositoryUrl(''), null);
  assert.equal(validateGithubRepositoryUrl('   '), null);
  assert.equal(validateGithubRepositoryUrl(null), null);
  assert.equal(validateGithubRepositoryUrl(undefined), null);
  assert.equal(validateGithubRepositoryUrl(12345), null);
});
