import { StreamDeckClient } from './streamdeck-client.js';
import type { ButtonPosition, ButtonStyle } from './types';

/** 
 * Preview bridge utilities 
 * 
 * Small, dependency-free preview UI and bridge helpers so you can mount a 
 * lightweight preview of your StreamDeck page in a browser. Exposes middleware
 * and handlers for Express/node/fetch-based runtimes plus a `handleWsConnection` 
 * helper to wire WebSocket updates from the `StreamDeckClient`. 
 */ 
export interface PreviewOptions {
  basePath?: string; // where the preview is mounted, default '/preview'
}

const DEFAULT_BASE = '/preview';

// Simple inlined static assets for the preview UI (small, dependency-free)
const INDEX_HTML = (basePath: string) => `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>StreamDeck Preview</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; background:#111; color:#eee }
    .grid { display: grid; grid-template-columns: repeat(5, 80px); gap: 8px; padding: 12px }
    .btn { width: 80px; height: 80px; border-radius: 8px; display:flex;align-items:center;justify-content:center;cursor:pointer; user-select:none }
  </style>
</head>
<body>
  <h3 style="padding:12px">StreamDeck Preview</h3>
  <div id="grid" class="grid"></div>

  <script>
  (function(){
    const base = '${basePath.replace(/\/$/, '')}';
    // WebSocket connects to same origin + base + '/ws'
    const wsUrl = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + base + '/ws';
    const ws = new WebSocket(wsUrl);
    const grid = document.getElementById('grid');

    // build a default 3x5 grid
    const rows = 3, cols = 5;
    const buttons = [];
    for (let r=0;r<rows;r++){
      for (let c=0;c<cols;c++){
        const el = document.createElement('div');
        el.className = 'btn';
        el.style.background = '#000';
        el.textContent = '\${r},\${c}';
        grid.appendChild(el);
        buttons.push(el);
        // send a preview-only request when clicking
        el.addEventListener('click', ()=>{
          const pos = { page:1, row:r, column:c };
          const msg = { type: 'preview-click', position: pos };
          ws.send(JSON.stringify(msg));
        });
      }
    }

    ws.addEventListener('message', ev => {
      try{
        const m = JSON.parse(ev.data);
        if (m.type === 'update' && m.position && m.style) {
          const idx = m.position.row * cols + m.position.column;
          const el = buttons[idx];
          if (el) {
            el.style.background = m.style.bgcolor || '#000';
            el.style.color = m.style.color || '#fff';
            el.textContent = m.style.text || '\${m.position.row},\${m.position.column}';
          }
        }
      }catch(e){/* ignore */}
    });
  })();
  </script>
</body>
</html>`;

const CLIENT_JS = `// (placeholder) no extra JS needed inlined in index.html`;

// Utility to create preview handlers that are easy to mount in any server.
export function createPreviewBridge(client: StreamDeckClient, opts: PreviewOptions = {}) {
  const basePath = (opts.basePath || DEFAULT_BASE).replace(/\/$/, '');

  // Express-compatible middleware (req,res,next)
  function expressMiddleware(req: any, res: any, next: any) {
    const url = req.originalUrl || req.url || '';
    if (!url.startsWith(basePath)) return next();

    const sub = url.slice(basePath.length) || '/';
    if (sub === '/' || sub === '') {
      res.setHeader('Content-Type', 'text/html');
      res.end(INDEX_HTML(basePath));
      return;
    }

    if (sub === '/client.js') {
      res.setHeader('Content-Type', 'application/javascript');
      res.end(CLIENT_JS);
      return;
    }

    // leave /ws to the consumer (they must attach WS and call handleWsConnection)
    next();
  }

  // Node/http handler (req: IncomingMessage, res: ServerResponse)
  function nodeHandler(req: any, res: any) {
    const url = req.url || '';
    if (!url.startsWith(basePath)) return false; // not handled

    const sub = url.slice(basePath.length) || '/';
    if (sub === '/' || sub === '') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(INDEX_HTML(basePath));
      return true;
    }

    if (sub === '/client.js') {
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(CLIENT_JS);
      return true;
    }

    return false;
  }

  // Fetch handler for Bun/Cloudflare/Deno (Request -> Response)
  async function fetchHandler(request: Request) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith(basePath)) return null as any;
    const sub = url.pathname.slice(basePath.length) || '/';
    if (sub === '/' || sub === '') {
      return new Response(INDEX_HTML(basePath), { headers: { 'content-type': 'text/html' } });
    }
    if (sub === '/client.js') {
      return new Response(CLIENT_JS, { headers: { 'content-type': 'application/javascript' } });
    }
    return new Response(null, { status: 404 });
  }

  // WS connection handler: consumers should call this when they accept a WS connection
  // ws: any websocket instance with .on('message',...), .send(...) (works with ws, uWebSockets, Bun)
  function handleWsConnection(ws: any, req?: any) {
    ws.on('message', async (data: any) => {
      try {
        const msg = typeof data === 'string' ? JSON.parse(data) : JSON.parse(data.toString());
        // Preview click: optionally run the button press on the actual client
        if (msg.type === 'preview-click' && msg.position) {
          // fire a press to the actual device
          try { await client.pressButton(msg.position as ButtonPosition); } catch (e) { /* ignore */ }
        }

        // If UI sends a style update, apply it and broadcast back
        if (msg.type === 'style' && msg.position && msg.style) {
          try {
            await client.updateButtonStyleBody(msg.position as ButtonPosition, msg.style as ButtonStyle);
            // echo update to the same ws connection (and consumer may broadcast to other UIs)
            const update = JSON.stringify({ type: 'update', position: msg.position, style: msg.style });
            ws.send(update);
          } catch (e) {
            // ignore errors
          }
        }
      } catch (e) { /* ignore parse errors */ }
    });

    // Push events from client library to the UI (optional - using client event listeners)
    const unsub = client.addEventListener((ev: any) => {
      // Only send style updates to the UI (simple filter)
      if (ev.type === 'style' && ev.position && ev.data) {
        try {
          ws.send(JSON.stringify({ type: 'update', position: ev.position, style: ev.data }));
        } catch (e) { /* ignore */ }
      }
    });

    // cleanup on close
    if (ws.on) {
      ws.on('close', () => { if (unsub) unsub(); });
    }
  }

  return {
    basePath,
    expressMiddleware,
    nodeHandler,
    fetchHandler,
    handleWsConnection
  };
}
