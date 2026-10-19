# Launchpad — the Release Night target app

A small, dependency-free task board to deploy independently into Development, Staging, and Production. Add a task, mark it complete, reload to check persistence, and delete it. The page displays the current environment, release version, Git commit, and Vercel deployment ID. Tasks stay in the current browser; there is no account system or database.

## Run locally

Use Node.js 22 or newer. No package installation or API keys are required.

```bash
npm run dev
```

Open http://localhost:3100. To run all three environments locally, use three terminal windows:

```bash
APP_ENV=dev PORT=3100 npm run dev
APP_ENV=staging PORT=3101 npm run dev
APP_ENV=prod PORT=3102 npm run dev
```

## Publish the source

Keep this app at `/Users/harish/Desktop/simple-app` and publish it in its own GitHub repository, for example `simple-app`. The sample is a separate app; it does not replace the Release Night dashboard.

## One Vercel project, three application environments

Import the `simple-app` GitHub repository **once**, creating a single Vercel project named `simple-app`:

| Setting | Value |
| --- | --- |
| Project name | `simple-app` |
| Framework preset | **Other** |
| Root directory | `./` |
| Build command | `npm run build` |
| Output directory | `public` |
| Node.js | 22.x or newer |

Release Night is the separate controller at `release-night-project.vercel.app`. Its Dev, Staging, and Production buttons should deploy this same application into the corresponding environment of the single `simple-app` Vercel project.

### Hobby / Free: preview branches

Use `dev` and `staging` Git branches for the two preview environments and `main` as the Production branch. In this single project's environment settings, configure:

| Application environment | Vercel target | Git branch | `APP_ENV` |
| --- | --- | --- | --- |
| Development | Preview | `dev` | `dev` |
| Staging | Preview | `staging` | `staging` |
| Production | Production | `main` | `prod` |

Scope the Preview `APP_ENV` values to their corresponding Git branches. Set Production `APP_ENV=prod`. Choose **Config** for these public labels. Use the stable branch URL for each preview environment and the production domain for Production. Record the actual URLs Vercel assigns; do not create separate Vercel projects for these targets.

Preview URLs may require Vercel authentication. For a publicly testable POC, configure access to those preview URLs deliberately; Standard Protection leaves Production public but protects previews.

### Pro: named custom environments

Alternatively, create Development and Staging as custom environments in the same project and use the built-in Production environment for Production. Set `APP_ENV=dev`, `staging`, and `prod` in their corresponding scopes. Custom environments require a supported paid plan.

## Check the hosted environments

Each environment exposes `GET /api/health` with `Cache-Control: no-store`:

```json
{
  "status": "ok",
  "app": "Launchpad",
  "environment": "dev",
  "version": "1.0.0",
  "headline": "Small tasks. Confident releases.",
  "commit": "<git-commit-sha>",
  "deploymentId": "<vercel-deployment-id>",
  "deploymentUrl": "https://<deployment-url>"
}
```

A hosted deployment with a missing or invalid `APP_ENV` returns HTTP 503. The endpoint exposes only public release information, not environment secrets.

Verify all three assigned URLs from this folder:

```bash
node scripts/verify-environments.mjs \
  --dev https://YOUR-DEV-DOMAIN.vercel.app \
  --staging https://YOUR-STAGING-DOMAIN.vercel.app \
  --prod https://YOUR-PROD-DOMAIN.vercel.app
```

This checks reachability, environment identity, deployment IDs, and matching version/commit across environments. During a rollout, different versions across targets are expected; run the combined check after all stages have deployed.

For a manual end-to-end check, add a task, mark it complete, reload, and confirm it remains complete. Delete it and reload again. Repeat for each environment and confirm tasks do not appear in other environments.

## Connect Release Night's Deploy buttons

The integration is a separate change to the Release Night controller. The intended flow is:

1. Click Deploy for an environment in Release Night.
2. The controller's authenticated server route requests a real deployment of the single `simple-app` Vercel project into that target environment.
3. Display the provider's queued/building state and track the exact deployment ID.
4. Enable tests only after Vercel reports that deployment ready.
5. Passing the current checks unlocks the next environment's Deploy button.

The project remains the same at every stage; only the environment changes. Keep provider credentials or any deployment hook URLs on Release Night's server. The app does not need those credentials.

The existing Release Night buttons have not been connected yet. Its Python checks still produce passing fixtures. The chosen Vercel environment strategy and project configuration are needed before implementing and testing the controller connection.

Git-triggered deployments can bypass a controller's UI gates. Enforced promotion requires a controlled deployment workflow and authorization and state persisted server-side.

## Change the release

Update `release.json` to change the visible version or headline, commit the change, then deploy the desired target. The version is kept in source so the same commit carries the same version through all environments. Vercel supplies each deployment's identity.

## Validation

```bash
npm test
npm run build
```

Reference: [Vercel Deploy Hooks](https://vercel.com/docs/deploy-hooks), [Vercel environments](https://vercel.com/docs/deployments/environments).
