const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT || 3000);
const menu = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'menu.json'), 'utf8'));
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.png': 'image/png'
};

function send(response, status, body, type = 'application/json; charset=utf-8') {
  response.writeHead(status, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff' });
  response.end(typeof body === 'string' ? body : JSON.stringify(body));
}

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  if (request.method === 'GET' && url.pathname === '/api/menu') {
    return send(response, 200, menu);
  }

  if (request.method === 'POST' && url.pathname === '/api/commande') {
    let body = '';
    request.on('data', chunk => {
      body += chunk;
      if (body.length > 16_384) request.destroy();
    });
    request.on('end', () => {
      try {
        const order = JSON.parse(body || '{}');
        const items = Array.isArray(order.items) ? order.items.map(String).filter(Boolean).slice(0, 30) : [];
        if (items.length === 0) return send(response, 400, { error: 'Ajoutez au moins un plat à votre commande.' });
        const payment = ['Wave', 'Orange Money'].includes(order.payment) ? order.payment : 'À préciser';
        const paymentLine = payment === 'À préciser' ? '' : `\nPaiement choisi : ${payment} au +225 07 49 16 92 93`;
        const message = `Bonjour Bien Manger, je souhaite commander :\n- ${items.join('\n- ')}${paymentLine}${order.note ? `\nPrécision : ${String(order.note).slice(0, 400)}` : ''}`;
        return send(response, 200, { whatsappUrl: `https://wa.me/${menu.restaurant.whatsappNumber}?text=${encodeURIComponent(message)}` });
      } catch {
        return send(response, 400, { error: 'La demande de commande est invalide.' });
      }
    });
    return;
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return send(response, 405, { error: 'Méthode non autorisée.' });
  }

  const requested = url.pathname === '/' ? '/frontend/index.html' : `/frontend${decodeURIComponent(url.pathname)}`;
  const file = path.resolve(ROOT, requested.replace(/^\/+/, ''));
  if (!file.startsWith(path.join(ROOT, 'frontend') + path.sep)) return send(response, 403, { error: 'Accès refusé.' });
  fs.readFile(file, (error, contents) => {
    if (error) return send(response, 404, 'Page introuvable.', 'text/plain; charset=utf-8');
    response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
    response.end(request.method === 'HEAD' ? undefined : contents);
  });
});

server.listen(PORT, '0.0.0.0', () => console.log(`Bien Manger est disponible sur le port ${PORT}`));
