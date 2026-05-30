import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createStudyPlan } from './planner.js';

const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = fileURLToPath(new URL('../public/', import.meta.url));
const MAX_BODY_BYTES = 16 * 1024;

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(payload));
}

function sendText(response, status, text) {
  response.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(text);
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';

    request.on('data', (chunk) => {
      body += chunk;

      if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
        reject(new Error('Слишком большой запрос.'));
        request.destroy();
      }
    });

    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

async function handlePlanRequest(request, response) {
  if (request.method !== 'POST') {
    sendJson(response, 405, { error: 'Метод не поддерживается.' });
    return;
  }

  const contentType = request.headers['content-type'] || '';

  if (!contentType.includes('application/json')) {
    sendJson(response, 415, { error: 'Отправьте данные в формате JSON.' });
    return;
  }

  try {
    const body = await readRequestBody(request);
    const input = JSON.parse(body);
    const plan = createStudyPlan(input);

    sendJson(response, 200, { plan });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось рассчитать план.';
    sendJson(response, 400, { error: message });
  }
}

async function serveStatic(request, response) {
  const requestUrl = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  const pathname = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname;
  const safePath = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  const filePath = join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    sendText(response, 403, 'Forbidden');
    return;
  }

  try {
    const file = await readFile(filePath);
    const type = contentTypes[extname(filePath)] || 'application/octet-stream';

    response.writeHead(200, {
      'Content-Type': type,
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(file);
  } catch {
    sendText(response, 404, 'Not found');
  }
}

export function createAppServer() {
  return createServer(async (request, response) => {
    if (request.url?.startsWith('/api/plan')) {
      await handlePlanRequest(request, response);
      return;
    }

    await serveStatic(request, response);
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = createAppServer();

  server.on('error', (error) => {
    console.error('Не удалось запустить сервер:', error.message);
    process.exitCode = 1;
  });

  server.listen(PORT, HOST, () => {
    console.log(`Study Planner is running: http://${HOST}:${PORT}`);
  });
}
