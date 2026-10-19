const values = process.argv.slice(2);
const targets = ['dev', 'staging', 'prod'].map(environment => {
  const index = values.indexOf(`--${environment}`);
  if (index === -1 || !values[index + 1]) throw new Error(`Provide --${environment} https://your-project.vercel.app`);
  const url = new URL(values[index + 1]);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Use public HTTPS URLs without credentials.');
  return {environment, url: new URL('/api/health', url)};
});
const results = await Promise.all(targets.map(async ({environment, url}) => {
  const response = await fetch(url, {cache: 'no-store', signal: AbortSignal.timeout(15000), redirect: 'error'});
  if (!response.ok) throw new Error(`${environment}: health endpoint returned HTTP ${response.status}.`);
  let result;
  try {result = await response.json();} catch {throw new Error(`${environment}: expected JSON. Check Vercel deployment protection.`);}
  if (result.status !== 'ok' || result.environment !== environment || !result.version || !result.commit || !result.deploymentId || result.deploymentId === 'local') throw new Error(`${environment}: incorrect deployment identity or environment configuration.`);
  return {environment, version: result.version, commit: result.commit, deployment: result.deploymentId};
}));
console.table(results);
if (new Set(results.map(result => result.version)).size !== 1 || new Set(results.map(result => result.commit)).size !== 1) {
  throw new Error('Environments are reachable but do not all serve the same release version and commit.');
}
console.log('All three environments are healthy and serve the same release version and commit.');
