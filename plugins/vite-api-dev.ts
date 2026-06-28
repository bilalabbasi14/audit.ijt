import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import dotenv from 'dotenv';
import type { Connect, Plugin, ViteDevServer } from 'vite';
import { loadEnv } from 'vite';

type ApiRoute = {
  pattern: RegExp;
  file: string;
  paramNames: string[];
};

const API_ROUTES: ApiRoute[] = [
  { pattern: /^\/api\/admin\/me$/, file: 'api/admin/me.ts', paramNames: [] },
  { pattern: /^\/api\/admin\/users$/, file: 'api/admin/users.ts', paramNames: [] },
  {
    pattern: /^\/api\/admin\/users\/([^/]+)\/muawineen\/monthly-report$/,
    file: 'api/admin/users/[id]/muawineen/monthly-report.ts',
    paramNames: ['id'],
  },
  {
    pattern: /^\/api\/admin\/users\/([^/]+)\/muawineen\/([^/]+)$/,
    file: 'api/admin/users/[id]/muawineen/[muawinId].ts',
    paramNames: ['id', 'muawinId'],
  },
  {
    pattern: /^\/api\/admin\/users\/([^/]+)\/muawineen$/,
    file: 'api/admin/users/[id]/muawineen.ts',
    paramNames: ['id'],
  },
  {
    pattern: /^\/api\/admin\/users\/([^/]+)\/reset-password$/,
    file: 'api/admin/users/[id]/reset-password.ts',
    paramNames: ['id'],
  },
  {
    pattern: /^\/api\/admin\/users\/([^/]+)$/,
    file: 'api/admin/users/[id].ts',
    paramNames: ['id'],
  },
];

function applyEnv(root: string, mode: string) {
  dotenv.config({ path: path.join(root, '.env') });
  dotenv.config({ path: path.join(root, '.env.local'), override: true });

  const env = loadEnv(mode, root, '');
  for (const [key, value] of Object.entries(env)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

async function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function createVercelResponse(res: ServerResponse): VercelResponse {
  let statusCode = 200;
  const vercelRes = res as VercelResponse;

  vercelRes.status = (code: number) => {
    statusCode = code;
    return vercelRes;
  };

  vercelRes.json = (body: unknown) => {
    if (!res.headersSent) {
      res.statusCode = statusCode;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.end(JSON.stringify(body));
    }
    return vercelRes;
  };

  vercelRes.send = (body: string | Buffer) => {
    if (!res.headersSent) {
      res.statusCode = statusCode;
      res.setHeader('Cache-Control', 'no-store');
      res.end(body);
    }
    return vercelRes;
  };

  return vercelRes;
}

function createVercelRequest(
  req: IncomingMessage,
  pathname: string,
  params: Record<string, string>,
  body: unknown,
): VercelRequest {
  const vercelReq = req as VercelRequest;
  const url = new URL(pathname, 'http://localhost');

  const query: Record<string, string | string[]> = { ...params };
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  vercelReq.query = query;
  vercelReq.body = body;
  return vercelReq;
}

function matchRoute(pathname: string): { route: ApiRoute; params: Record<string, string> } | null {
  for (const route of API_ROUTES) {
    const match = pathname.match(route.pattern);
    if (!match) continue;

    const params: Record<string, string> = {};
    route.paramNames.forEach((name, index) => {
      params[name] = match[index + 1] ?? '';
    });

    return { route, params };
  }

  return null;
}

function createApiMiddleware(server: ViteDevServer, root: string): Connect.NextHandleFunction {
  return async (req, res, next) => {
    const url = req.url ?? '/';
    const pathname = url.split('?')[0] ?? '/';

    if (!pathname.startsWith('/api/')) {
      next();
      return;
    }

    const matched = matchRoute(pathname);
    if (!matched) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      res.end(JSON.stringify({ error: 'API route not found' }));
      return;
    }

    const filePath = path.join(root, matched.route.file);
    if (!fs.existsSync(filePath)) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'API handler file missing' }));
      return;
    }

    try {
      const rawBody =
        req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH'
          ? await readBody(req)
          : '';

      let parsedBody: unknown = undefined;
      if (rawBody) {
        try {
          parsedBody = JSON.parse(rawBody);
        } catch {
          parsedBody = rawBody;
        }
      }

      const vercelReq = createVercelRequest(req, url, matched.params, parsedBody);
      const vercelRes = createVercelResponse(res);

      const moduleUrl = pathToFileURL(filePath).href;
      const mod = await server.ssrLoadModule(moduleUrl);
      const handler = mod.default;

      if (typeof handler !== 'function') {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: 'API handler is not a function' }));
        return;
      }

      await handler(vercelReq, vercelRes);

      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: 'API handler did not send a response' }));
      }
    } catch (err) {
      console.error('[api-dev] handler error:', err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    }
  };
}

export function viteApiDevPlugin(): Plugin {
  let root = process.cwd();
  let mode = 'development';

  return {
    name: 'vite-api-dev',
    configResolved(config) {
      root = config.root;
      mode = config.mode;
      applyEnv(root, mode);
    },
    configureServer(server) {
      server.middlewares.use(createApiMiddleware(server, root));
    },
  };
}
