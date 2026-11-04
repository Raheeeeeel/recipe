const { getStore } = require('@netlify/blobs');

const MAX_BODY_BYTES = 64 * 1024;
const MAX_ITEMS = 100;
const STORE_NAME = 'recipe-table';
const RECIPES_KEY = 'recipes.json';
const MAX_SAVE_ATTEMPTS = 5;

function respond(statusCode, data, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders
    },
    body: JSON.stringify(data)
  };
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
    id: require('crypto').randomUUID(),
    createdAt: new Date().toISOString()
  };
}

async function readRecipes(store) {
  const entry = await store.getWithMetadata(RECIPES_KEY, { type: 'json' });
  if (!entry) {
    return { data: { recipes: [] }, etag: null };
  }

  if (!entry.data || !Array.isArray(entry.data.recipes)) {
    throw new Error('Stored recipe data must contain a recipes array.');
  }

  return { data: entry.data, etag: entry.etag };
}

async function appendRecipe(store, recipe) {
  for (let attempt = 0; attempt < MAX_SAVE_ATTEMPTS; attempt += 1) {
    const { data, etag } = await readRecipes(store);
    data.recipes.push(recipe);
    const options = etag ? { onlyIfMatch: etag } : { onlyIfNew: true };
    const result = await store.setJSON(RECIPES_KEY, data, options);
    if (result.modified) {
      return data;
    }
  }

  return null;
}

exports.handler = async event => {
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return respond(405, { error: 'Method not allowed.' }, { Allow: 'GET, POST' });
  }

  let store;
  try {
    store = getStore(STORE_NAME);
  } catch (error) {
    console.error('Unable to access Netlify Blobs:', error);
    return respond(503, { error: 'Recipe storage is not available in this Netlify deployment.' });
  }

  if (event.httpMethod === 'GET') {
    try {
      const { data } = await readRecipes(store);
      return respond(200, data);
    } catch (error) {
      console.error('Unable to load stored recipes:', error);
      return respond(500, { error: 'Unable to load recipes from Netlify storage.' });
    }
  }

  if (typeof event.body !== 'string') {
    return respond(400, { error: 'Request must contain valid JSON.' });
  }

  const body = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;
  if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) {
    return respond(413, { error: 'Recipe submission is too large.' });
  }

  let submitted;
  try {
    submitted = JSON.parse(body);
  } catch {
    return respond(400, { error: 'Request must contain valid JSON.' });
  }

  const recipe = validateRecipe(submitted);
  if (typeof recipe === 'string') {
    return respond(400, { error: recipe });
  }

  try {
    const data = await appendRecipe(store, recipe);
    if (!data) {
      return respond(409, { error: 'Recipes are being updated. Please submit your recipe again.' });
    }
    return respond(201, {
      success: true,
      totalRecipes: data.recipes.length,
      recipes: data.recipes
    });
  } catch (error) {
    console.error('Unable to save recipe to Netlify Blobs:', error);
    return respond(500, { error: 'Unable to save the recipe to Netlify storage.' });
  }
};
