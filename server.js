<<<<<<< HEAD
const http = require('http');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const PORT = Number(process.env.PORT) || 3000;
const DATA_FILE = path.join(__dirname, 'recipes.json');
const MAX_BODY_BYTES = 64 * 1024;
const MAX_ITEMS = 100;

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ recipes: [] }, null, 2));
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(JSON.stringify(data));
}

function readRecipes() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  if (!data || !Array.isArray(data.recipes)) {
    throw new Error('Recipe data must contain a recipes array.');
  }
  return data;
}

function validateRecipe(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return 'Recipe must be a JSON object.';
  }

  const name = typeof value.name === 'string' ? value.name.trim() : '';
  const description = typeof value.description === 'string' ? value.description.trim() : '';
  const ingredients = Array.isArray(value.ingredients)
    ? value.ingredients.filter(item => typeof item === 'string').map(item => item.trim()).filter(Boolean)
    : [];
  const instructions = Array.isArray(value.instructions)
    ? value.instructions.filter(item => typeof item === 'string').map(item => item.trim()).filter(Boolean)
    : [];

  if (!name || name.length > 100) return 'Recipe name is required and must be 100 characters or fewer.';
  if (description.length > 500) return 'Description must be 500 characters or fewer.';
  if (ingredients.length === 0 || ingredients.length > MAX_ITEMS) {
    return `Add between 1 and ${MAX_ITEMS} ingredients.`;
  }
  if (ingredients.some(item => item.length > 160)) return 'Each ingredient must be 160 characters or fewer.';
  if (instructions.length === 0 || instructions.length > MAX_ITEMS) {
    return `Add between 1 and ${MAX_ITEMS} steps.`;
  }
  if (instructions.some(item => item.length > 500)) return 'Each step must be 500 characters or fewer.';

  return {
    name,
    description,
    ingredients,
    instructions,
    id: randomUUID(),
    createdAt: new Date().toISOString()
  };
}

const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;

  if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
    fs.readFile(path.join(__dirname, 'index.html'), (error, data) => {
      if (error) {
        console.error('Unable to read index.html:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Unable to load the recipe page.');
        return;
      }
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Content-Type-Options': 'nosniff'
      });
      res.end(data);
    });
    return;
  }

  if (pathname === '/api/recipes' && req.method === 'GET') {
    try {
      sendJson(res, 200, readRecipes());
    } catch (error) {
      console.error('Unable to read recipes.json:', error);
      sendJson(res, 500, { error: 'Unable to load recipes. Check the server data file.' });
    }
    return;
  }

  if ((pathname === '/api/recipes' || pathname === '/add-recipe') && req.method === 'POST') {
    let body = '';
    let bodyTooLarge = false;
    req.on('data', chunk => {
      if (bodyTooLarge) return;
      body += chunk;
      if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) {
        bodyTooLarge = true;
        body = '';
      }
    });
    req.on('end', () => {
      if (bodyTooLarge) {
        sendJson(res, 413, { error: 'Recipe submission is too large.' });
        return;
      }

      let submitted;
      try {
        submitted = JSON.parse(body);
      } catch {
        sendJson(res, 400, { error: 'Request must contain valid JSON.' });
        return;
      }

      const recipe = validateRecipe(submitted);
      if (typeof recipe === 'string') {
        sendJson(res, 400, { error: recipe });
        return;
      }

      try {
        const data = readRecipes();
        data.recipes.push(recipe);
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        sendJson(res, 201, { success: true, totalRecipes: data.recipes.length, recipes: data.recipes });
      } catch (error) {
        console.error('Unable to save recipe:', error);
        sendJson(res, 500, { error: 'Unable to save the recipe. Check the server data file.' });
      }
    });
    return;
  }

  if (pathname === '/api/recipes' && req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    sendJson(res, 405, { error: 'Method not allowed.' });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
});

server.on('error', error => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. The recipe server may already be running at http://localhost:${PORT}.`);
    console.error(`To use another port in PowerShell: $env:PORT=3001; node server.js`);
    process.exitCode = 1;
    return;
  }

  console.error('Unable to start the recipe server:', error);
  process.exitCode = 1;
});

server.listen(PORT, () => {
  console.log(`Recipe table running at http://localhost:${PORT}`);
  console.log(`Shared recipes are stored in: ${DATA_FILE}`);
});
=======
const http = require('http');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const PORT = Number(process.env.PORT) || 3000;
const DATA_FILE = path.join(__dirname, 'recipes.json');
const MAX_BODY_BYTES = 64 * 1024;
const MAX_ITEMS = 100;

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ recipes: [] }, null, 2));
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(JSON.stringify(data));
}

function readRecipes() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  if (!data || !Array.isArray(data.recipes)) {
    throw new Error('Recipe data must contain a recipes array.');
  }
  return data;
}

function validateRecipe(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return 'Recipe must be a JSON object.';
  }

  const name = typeof value.name === 'string' ? value.name.trim() : '';
  const description = typeof value.description === 'string' ? value.description.trim() : '';
  const ingredients = Array.isArray(value.ingredients)
    ? value.ingredients.filter(item => typeof item === 'string').map(item => item.trim()).filter(Boolean)
    : [];
  const instructions = Array.isArray(value.instructions)
    ? value.instructions.filter(item => typeof item === 'string').map(item => item.trim()).filter(Boolean)
    : [];

  if (!name || name.length > 100) return 'Recipe name is required and must be 100 characters or fewer.';
  if (description.length > 500) return 'Description must be 500 characters or fewer.';
  if (ingredients.length === 0 || ingredients.length > MAX_ITEMS) {
    return `Add between 1 and ${MAX_ITEMS} ingredients.`;
  }
  if (ingredients.some(item => item.length > 160)) return 'Each ingredient must be 160 characters or fewer.';
  if (instructions.length === 0 || instructions.length > MAX_ITEMS) {
    return `Add between 1 and ${MAX_ITEMS} steps.`;
  }
  if (instructions.some(item => item.length > 500)) return 'Each step must be 500 characters or fewer.';

  return {
    name,
    description,
    ingredients,
    instructions,
    id: randomUUID(),
    createdAt: new Date().toISOString()
  };
}

const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;

  if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
    fs.readFile(path.join(__dirname, 'index.html'), (error, data) => {
      if (error) {
        console.error('Unable to read index.html:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Unable to load the recipe page.');
        return;
      }
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Content-Type-Options': 'nosniff'
      });
      res.end(data);
    });
    return;
  }

  if (pathname === '/api/recipes' && req.method === 'GET') {
    try {
      sendJson(res, 200, readRecipes());
    } catch (error) {
      console.error('Unable to read recipes.json:', error);
      sendJson(res, 500, { error: 'Unable to load recipes. Check the server data file.' });
    }
    return;
  }

  if ((pathname === '/api/recipes' || pathname === '/add-recipe') && req.method === 'POST') {
    let body = '';
    let bodyTooLarge = false;
    req.on('data', chunk => {
      if (bodyTooLarge) return;
      body += chunk;
      if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) {
        bodyTooLarge = true;
        body = '';
      }
    });
    req.on('end', () => {
      if (bodyTooLarge) {
        sendJson(res, 413, { error: 'Recipe submission is too large.' });
        return;
      }

      let submitted;
      try {
        submitted = JSON.parse(body);
      } catch {
        sendJson(res, 400, { error: 'Request must contain valid JSON.' });
        return;
      }

      const recipe = validateRecipe(submitted);
      if (typeof recipe === 'string') {
        sendJson(res, 400, { error: recipe });
        return;
      }

      try {
        const data = readRecipes();
        data.recipes.push(recipe);
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        sendJson(res, 201, { success: true, totalRecipes: data.recipes.length, recipes: data.recipes });
      } catch (error) {
        console.error('Unable to save recipe:', error);
        sendJson(res, 500, { error: 'Unable to save the recipe. Check the server data file.' });
      }
    });
    return;
  }

  if (pathname === '/api/recipes' && req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    sendJson(res, 405, { error: 'Method not allowed.' });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not found');
});

server.on('error', error => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. The recipe server may already be running at http://localhost:${PORT}.`);
    console.error(`To use another port in PowerShell: $env:PORT=3001; node server.js`);
    process.exitCode = 1;
    return;
  }

  console.error('Unable to start the recipe server:', error);
  process.exitCode = 1;
});

server.listen(PORT, () => {
  console.log(`Recipe table running at http://localhost:${PORT}`);
  console.log(`Shared recipes are stored in: ${DATA_FILE}`);
});
>>>>>>> 9272a6c7dd3b678c0546cfb83cafd2b58170c8c1
