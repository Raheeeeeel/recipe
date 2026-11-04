const MAX_BODY_BYTES = 64 * 1024;
const MAX_ITEMS = 100;
const RECIPES_PATH = 'recipes.json';

function respond(statusCode, data) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    },
    body: JSON.stringify(data)
  };
}

function getSettings() {
  const token = process.env.RECIPE_GITHUB_TOKEN;
  const repository = process.env.RECIPE_GITHUB_REPOSITORY;
  const branch = process.env.RECIPE_GITHUB_BRANCH;

  if (!token || !repository || !branch) {
    throw new Error('Recipe saving is not configured. Set RECIPE_GITHUB_TOKEN, RECIPE_GITHUB_REPOSITORY, and RECIPE_GITHUB_BRANCH in Netlify.');
  }
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
    throw new Error('RECIPE_GITHUB_REPOSITORY must use the owner/repository format.');
  }

  return { token, repository, branch };
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

function recipesUrl(repository, branch) {
  const url = new URL(`https://api.github.com/repos/${repository}/contents/${RECIPES_PATH}`);
  return url;
}

async function githubRequest(url, token, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'recipe-table-netlify-function',
      ...options.headers
    }
  });
}

async function readRecipes(repository, branch, token) {
  const url = recipesUrl(repository, branch);
  url.searchParams.set('ref', branch);
  const response = await githubRequest(url, token);
  if (response.status === 404) {
    return { data: { recipes: [] }, sha: null };
  }
  if (!response.ok) {
    console.error(`GitHub recipe read failed with status ${response.status}.`);
    throw new Error('Could not read recipes.json from GitHub. Check the repository and token permissions.');
  }

  const file = await response.json();
  if (file.encoding !== 'base64' || typeof file.content !== 'string') {
    throw new Error('GitHub returned recipes.json in an unsupported format.');
  }

  let data;
  try {
    data = JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
  } catch {
    throw new Error('recipes.json in GitHub is not valid JSON.');
  }
  if (!data || !Array.isArray(data.recipes)) {
    throw new Error('recipes.json must contain a recipes array.');
  }

  return { data, sha: file.sha };
}

async function writeRecipes(repository, branch, token, data, sha) {
  const body = {
    message: 'Add recipe from the recipe site',
    content: Buffer.from(JSON.stringify(data, null, 2), 'utf8').toString('base64'),
    branch
  };
  if (sha) body.sha = sha;

  const response = await githubRequest(recipesUrl(repository, branch), token, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (response.status === 409 || response.status === 422) {
    return false;
  }
  if (!response.ok) {
    console.error(`GitHub recipe write failed with status ${response.status}.`);
    throw new Error('Could not update recipes.json in GitHub. Check that the token has Contents: Read and write permission.');
  }
  return true;
}

exports.handler = async event => {
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return {
      ...respond(405, { error: 'Method not allowed.' }),
      headers: { ...respond(405, {}).headers, Allow: 'GET, POST' }
    };
  }

  let settings;
  try {
    settings = getSettings();
  } catch (error) {
    return respond(503, { error: error.message });
  }

  if (event.httpMethod === 'GET') {
    try {
      const { data } = await readRecipes(settings.repository, settings.branch, settings.token);
      return respond(200, data);
    } catch (error) {
      console.error('Unable to load recipes:', error);
      return respond(500, { error: error.message || 'Unable to load recipes.' });
    }
  }

  if (typeof event.body !== 'string' || Buffer.byteLength(event.body, 'utf8') > MAX_BODY_BYTES) {
    return respond(413, { error: 'Recipe submission is missing or too large.' });
  }

  let submitted;
  try {
    submitted = JSON.parse(event.body);
  } catch {
    return respond(400, { error: 'Request must contain valid JSON.' });
  }

  const recipe = validateRecipe(submitted);
  if (typeof recipe === 'string') {
    return respond(400, { error: recipe });
  }

  try {
    const { data, sha } = await readRecipes(settings.repository, settings.branch, settings.token);
    data.recipes.push(recipe);
    const saved = await writeRecipes(settings.repository, settings.branch, settings.token, data, sha);
    if (!saved) {
      return respond(409, { error: 'Another recipe was saved at the same time. Please submit your recipe again.' });
    }
    return respond(201, {
      success: true,
      totalRecipes: data.recipes.length,
      recipes: data.recipes
    });
  } catch (error) {
    console.error('Unable to save recipe:', error);
    return respond(500, { error: error.message || 'Unable to save the recipe.' });
  }
};
