import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import health from '../api/health.js';
const port = Number(process.env.PORT || 3100);
const files = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8']],
]);
createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405); response.end(); return; }
  if (request.url.split('?')[0] === '/api/health') {
    response.status = code => { response.statusCode = code; return response; };
    response.json = value => { response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify(value)); };
    return health(request, response);
  }
  const file = files.get(request.url.split('?')[0]);
  if (!file) { response.writeHead(404); response.end('Not found'); return; }
  try {
    const body = await readFile(new URL(`../public/${file[0]}`, import.meta.url));
    response.writeHead(200, {'Content-Type': file[1], 'Cache-Control': 'no-store'});
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch { response.writeHead(500); response.end('Unable to load the application.'); }
}).listen(port, '127.0.0.1', () => console.log(`Launchpad: http://localhost:${port} (${process.env.APP_ENV || 'dev'})`));
