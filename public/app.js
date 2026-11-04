const form = document.getElementById('recipeForm');
const list = document.getElementById('recipesList');

// Load recipes on open
async function loadRecipes() {
  const res = await fetch('/api/recipes');
  const recipes = await res.json();
  list.innerHTML = '';
  recipes.forEach(r => {
    list.innerHTML += `
      <div class="recipe-card">
        <h3>${escapeHtml(r.name)}</h3>
        <p><strong>Ingredients:</strong><br>${escapeHtml(r.ingredients).replace(/\n/g, '<br>')}</p>
        <p><strong>Instructions:</strong><br>${escapeHtml(r.steps).replace(/\n/g, '<br>')}</p>
      </div>
    `;
  });
}

// Save new recipe
form.addEventListener('submit', async e => {
  e.preventDefault();
  const newRecipe = {
    name: document.getElementById('name').value,
    ingredients: document.getElementById('ingredients').value,
    steps: document.getElementById('steps').value,
    createdAt: new Date().toLocaleString()
  };

  await fetch('/api/recipes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newRecipe)
  });

  form.reset();
  loadRecipes();
  alert('✅ Saved! Check VS Code → recipes.json updated instantly!');
});

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

loadRecipes();
