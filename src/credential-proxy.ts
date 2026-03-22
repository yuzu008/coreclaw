/**
 * Credential proxy for container isolation.
 * Containers connect here instead of directly to the GitHub API.
 * The proxy injects the real GITHUB_TOKEN so containers never see it.
 */
import { createServer, Server } from 'http';
import { request as httpsRequest } from 'https';
import { request as httpRequest, RequestOptions } from 'http';

import { readEnvFile } from './env.js';
import { logger } from './logger.js';

export function startCredentialProxy(
  port: number,
  host = '127.0.0.1',
): Promise<Server> {
  const secrets = readEnvFile(['GITHUB_TOKEN']);
  const githubToken = secrets.GITHUB_TOKEN;

  if (!githubToken) {
    logger.warn('No GITHUB_TOKEN found — credential proxy will pass requests without auth');
  }

  // Copilot CLI uses the GitHub API; we proxy to api.github.com by default
  const upstreamUrl = new URL(
    process.env.COPILOT_API_URL || 'https://api.github.com',
  );
  const isHttps = upstreamUrl.protocol === 'https:';
  const makeRequest = isHttps ? httpsRequest : httpRequest;

  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => {
        const body = Buffer.concat(chunks);
        const headers: Record<string, string | number | string[] | undefined> =
          {
            ...(req.headers as Record<string, string>),
            host: upstreamUrl.host,
            'content-length': body.length,
          };

        // Strip hop-by-hop headers
        delete headers['connection'];
        delete headers['keep-alive'];
        delete headers['transfer-encoding'];

        // Inject GitHub token
        if (githubToken) {
          delete headers['authorization'];
          headers['authorization'] = `Bearer ${githubToken}`;
        }

        const upstream = makeRequest(
          {
            hostname: upstreamUrl.hostname,
            port: upstreamUrl.port || (isHttps ? 443 : 80),
            path: req.url,
            method: req.method,
            headers,
          } as RequestOptions,
          (upRes) => {
            res.writeHead(upRes.statusCode!, upRes.headers);
            upRes.pipe(res);
          },
        );

        upstream.on('error', (err) => {
          logger.error(
            { err, url: req.url },
            'Credential proxy upstream error',
          );
          if (!res.headersSent) {
            res.writeHead(502);
            res.end('Bad Gateway');
          }
        });

        upstream.write(body);
        upstream.end();
      });
    });

    server.listen(port, host, () => {
      logger.info({ port, host }, 'Credential proxy started');
      resolve(server);
    });

    server.on('error', reject);
  });
}
