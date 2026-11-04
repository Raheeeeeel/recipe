const form = document.getElementById('recipeForm');
const list = document.getElementById('recipesList');

// Load from localStorage
function loadRecipes() {
  const recipes = JSON.parse(localStorage.getItem('recipes') || '[]');
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

// Save to localStorage
form.addEventListener('submit', e => {
  e.preventDefault();
  const recipes = JSON.parse(localStorage.getItem('recipes') || '[]');
  recipes.push({
    name: document.getElementById('name').value,
    ingredients: document.getElementById('ingredients').value,
    steps: document.getElementById('steps').value,
    createdAt: new Date().toLocaleString()
  });
  localStorage.setItem('recipes', JSON.stringify(recipes, null, 2));
  form.reset();
  loadRecipes();
  alert('✅ Saved! Stored in your browser');
});

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

loadRecipes();
