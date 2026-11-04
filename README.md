"# Recipe Table

## Publish on Netlify

The Netlify Function updates `recipes.json` in the connected GitHub repository whenever someone submits a recipe.

1. In GitHub, create a fine-grained personal access token limited to this repository with **Contents: Read and write** permission.
2. In Netlify, open **Site configuration → Environment variables** and add:
   - `RECIPE_GITHUB_TOKEN`: the token (keep it secret; never put it in the page).
   - `RECIPE_GITHUB_REPOSITORY`: the repository as `owner/repository`.
   - `RECIPE_GITHUB_BRANCH`: the branch Netlify deploys, such as `main`.
3. Redeploy the site so the function receives the variables.

The page reads and writes recipes through `/api/recipes`; each successful submission commits an update to the repository’s `recipes.json`. GitHub commits can trigger a new Netlify deploy.

## Run locally

Open this project folder in a terminal and run:

```powershell
node server.js
```

Then open `http://localhost:3000` in your browser. Keep the terminal open while using the app. The server creates `recipes.json` if it is missing or empty, and each new recipe is written to that file.

Do not open `index.html` directly or use a static preview server: browsers cannot write submissions to the project's JSON file."
