const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const RECIPES_FILE = path.join(__dirname, 'recipes.json');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Read recipes
app.get('/api/recipes', (req, res) => {
  fs.readFile(RECIPES_FILE, 'utf8', (err, data) => {
    if (err) return res.json([]);
    res.json(JSON.parse(data || '[]'));
  });
});

// Add new recipe
app.post('/api/recipes', (req, res) => {
  fs.readFile(RECIPES_FILE, 'utf8', (err, data) => {
    const recipes = err ? [] : JSON.parse(data || '[]');
    recipes.push(req.body);
    fs.writeFile(RECIPES_FILE, JSON.stringify(recipes, null, 2), 'utf8', (err) => {
      if (err) return res.status(500).json({ error: 'Not saved' });
      res.json({ success: true, recipes });
    });
  });
});

app.listen(PORT, () => {
  console.log(`✅ Open: http://localhost:${PORT}`);
  console.log(`📁 Your file: ${RECIPES_FILE}`);
});
