import {test} from 'node:test';
import assert from 'node:assert/strict';
import handler, {deploymentInfo} from '../api/health.js';

test('each target reports its own environment and deployment identity', () => {
  for (const environment of ['dev', 'staging', 'prod']) {
    const info = deploymentInfo({APP_ENV: environment, VERCEL: '1', VERCEL_GIT_COMMIT_SHA: 'abc123', VERCEL_DEPLOYMENT_ID: `deployment-${environment}`, VERCEL_URL: `${environment}.vercel.app`, SECRET_TOKEN: 'must-not-leak'});
    assert.equal(info.environment, environment);
    assert.equal(info.commit, 'abc123');
    assert.equal(info.deploymentId, `deployment-${environment}`);
    assert.equal(info.deploymentUrl, `https://${environment}.vercel.app`);
    assert.equal(JSON.stringify(info).includes('must-not-leak'), false);
  }
});
test('a missing or invalid hosted environment is not reported healthy', () => {
  assert.throws(() => deploymentInfo({VERCEL: '1'}), /APP_ENV/);
  assert.throws(() => deploymentInfo({APP_ENV: 'production'}), /APP_ENV/);
  assert.equal(deploymentInfo({}).environment, 'dev');
});
test('health responses prevent cached status and identify misconfiguration', () => {
  const original = process.env.APP_ENV;
  process.env.APP_ENV = 'invalid';
  const response = {headers: {}, setHeader(name, value) {this.headers[name] = value;}, status(code) {this.code = code; return this;}, json(body) {this.body = body;}};
  try {
    handler({}, response);
    assert.equal(response.code, 503);
    assert.equal(response.body.status, 'unavailable');
    assert.match(response.headers['Cache-Control'], /no-store/);
  } finally {if (original === undefined) delete process.env.APP_ENV; else process.env.APP_ENV = original;}
});
