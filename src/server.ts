import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
app.set('trust proxy', true);
const angularApp = new AngularNodeAppEngine();

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Proxy all /api requests to the backend service.
 */
app.use('/api', (req, res) => {
  const backendUrl = process.env['API_URL'] || 'http://localhost:8080';
  const targetUrl = new URL(req.originalUrl, backendUrl);
  
  const client = backendUrl.startsWith('https') ? https : http;
  
  const headers = { ...req.headers };
  headers['host'] = targetUrl.host;
  
  const proxyReq = client.request(
    targetUrl.toString(),
    {
      method: req.method,
      headers: headers,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );
  
  proxyReq.on('error', (err) => {
    console.error('Error forwarding request to backend:', err.message);
    res.status(502).send('Bad Gateway: Error communicating with backend service.');
  });
  
  req.pipe(proxyReq);
});

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  if (!process.env['API_URL']) {
    const host = req.get('host') || '';
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      process.env['API_URL'] = 'http://localhost:8080';
    } else {
      process.env['API_URL'] = `${req.protocol}://${host}`;
    }
  }
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
