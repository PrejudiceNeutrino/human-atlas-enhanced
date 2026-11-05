import { createReadStream, existsSync, realpathSync, statSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import type { Plugin } from 'vite';

// Deliberately outside public/ and the module graph. Never emits production assets.
export function localGalleryPlugin(root: string, enabled: boolean): Plugin {
  const directory = resolve(root, '.local-gallery/digestive');
  return {
    name: 'local-educational-gallery',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        let pathname: string;
        try { pathname = decodeURIComponent(url.pathname); } catch { res.writeHead(400); res.end(); return; }
        if (pathname.split('/').includes('.local-gallery')) { res.writeHead(403); res.end('Private local files.'); return; }
        if (!url.pathname.startsWith('/__local-gallery/')) { next(); return; }
        const relative = url.pathname.slice('/__local-gallery/digestive/'.length);
        const allowed = url.pathname.startsWith('/__local-gallery/digestive/') &&
          (relative === 'gallery.json' || /^(images|thumbnails)\/[ap](0[1-9]|1[0-5])\.webp$/.test(relative));
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
        const file = resolve(directory, relative);
        if (!enabled || !allowed || !existsSync(file) || !existsSync(directory) ||
            !realpathSync(file).startsWith(realpathSync(directory) + sep) || !statSync(file).isFile()) {
          res.writeHead(404); res.end('Local gallery unavailable.'); return;
        }
        if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end(); return; }
        res.setHeader('Content-Type', relative.endsWith('.json') ? 'application/json; charset=utf-8' : 'image/webp');
        res.setHeader('Content-Length', statSync(file).size);
        if (req.method === 'HEAD') { res.end(); return; }
        const stream = createReadStream(file);
        stream.on('error', () => res.destroy());
        stream.pipe(res);
      });
    },
  };
}
