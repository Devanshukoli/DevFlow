import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateWorkerStages, getStageDescription, WORKER_STAGES } from '../../../../src/components/analysis/stages.js';
import { parseRepoUrl } from '../../../../src/utils/repo-url.js';

describe('Task 7 - Analysis Progress Page Logic & Components', () => {

  test('parseRepoUrl extracts owner and name correctly', () => {
    const parsed = parseRepoUrl('https://github.com/FalkorDB/FalkorDB');
    assert.equal(parsed.owner, 'FalkorDB');
    assert.equal(parsed.name, 'FalkorDB');
    assert.equal(parsed.display, 'FalkorDB / FalkorDB');
  });

  test('parseRepoUrl handles trailing slashes', () => {
    const parsed = parseRepoUrl('https://github.com/facebook/react/');
    assert.equal(parsed.owner, 'facebook');
    assert.equal(parsed.name, 'react');
    assert.equal(parsed.display, 'facebook / react');
  });

  test('evaluateWorkerStages handles queued job', () => {
    const stages = evaluateWorkerStages('queued', 0, 'Queued');
    assert.equal(stages.length, 8);
    // All pending when queued
    stages.forEach((s) => {
      assert.equal(s.status, 'pending');
    });
  });

  test('evaluateWorkerStages handles running job at Inspecting repository stage', () => {
    const stages = evaluateWorkerStages('running', 50, 'Inspecting repository');
    
    // Preparing (5%), Cloning (20%), Cloned (35%) should be completed
    assert.equal(stages[0].status, 'completed');
    assert.equal(stages[1].status, 'completed');
    assert.equal(stages[2].status, 'completed');

    // Inspecting repository (50%) should be current
    assert.equal(stages[3].name, 'Inspecting repository');
    assert.equal(stages[3].status, 'current');

    // Collecting metadata (65%), Deriving intelligence (80%), Persisting (90%), Completed (100%) should be pending
    assert.equal(stages[4].status, 'pending');
    assert.equal(stages[5].status, 'pending');
    assert.equal(stages[6].status, 'pending');
    assert.equal(stages[7].status, 'pending');
  });

  test('evaluateWorkerStages handles completed job', () => {
    const stages = evaluateWorkerStages('completed', 100, 'Completed');
    assert.equal(stages.length, 8);
    stages.forEach((s) => {
      assert.equal(s.status, 'completed');
    });
  });

  test('evaluateWorkerStages handles failed job', () => {
    const stages = evaluateWorkerStages('failed', 35, 'Cloning repository');
    assert.equal(stages[0].status, 'completed'); // Preparing
    assert.equal(stages[1].status, 'failed'); // Cloning failed
    assert.equal(stages[2].status, 'pending');
  });

  test('getStageDescription returns factual description', () => {
    const desc = getStageDescription('Cloning repository', 'running');
    assert.ok(desc.includes('shallow Git clone'));

    const descQueued = getStageDescription(null, 'queued');
    assert.ok(descQueued.includes('queued in DevFlow'));
  });

});
