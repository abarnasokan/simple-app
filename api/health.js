import release from '../release.json' with {type: 'json'};

export function deploymentInfo(env = process.env) {
  const environment = env.APP_ENV || (env.VERCEL ? '' : 'dev');
  if (!['dev', 'staging', 'prod'].includes(environment)) {
    throw new Error('Set APP_ENV to dev, staging, or prod.');
  }
  return {
    status: 'ok',
    app: release.name,
    environment,
    version: release.version,
    headline: release.headline,
    commit: env.VERCEL_GIT_COMMIT_SHA || 'local',
    deploymentId: env.VERCEL_DEPLOYMENT_ID || 'local',
    deploymentUrl: env.VERCEL_URL ? `https://${env.VERCEL_URL}` : null,
  };
}

export default function handler(_request, response) {
  response.setHeader('Cache-Control', 'no-store, max-age=0');
  try {
    response.status(200).json(deploymentInfo());
  } catch (error) {
    response.status(503).json({status: 'unavailable', error: error.message});
  }
}
