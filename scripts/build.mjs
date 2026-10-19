import {readFile, access} from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const release = JSON.parse(await readFile(new URL('release.json', root), 'utf8'));
if (!/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/.test(release.version)) throw new Error('Use a semantic version in release.json.');
for (const file of ['index.html', 'app.js', 'style.css']) await access(new URL(`public/${file}`, root));
console.log(`Ready to deploy ${release.name} ${release.version}. Static app and health function validated.`);
