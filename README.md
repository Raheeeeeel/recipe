"# Recipe Table

## Publish on Netlify

The Netlify Function stores recipes as JSON in a site-wide Netlify Blobs store. The store is shared across visitors and deployments, so submissions appear without rebuilding the site. Netlify provides the function’s access to Blobs; no API keys or secrets need to be created or added.

The live JSON is available from the page’s **View the latest recipes JSON** link at `/api/recipes`. This is Netlify-managed JSON data, not a commit to the source repository’s `recipes.json`.

Netlify installs `@netlify/blobs` from `package.json` when it builds the site.

## Run locally

Open this project folder in a terminal and run:

```powershell
node server.js
```

Then open `http://localhost:3000` in your browser. Keep the terminal open while using the app. Locally, recipes are written to the project’s `recipes.json`; on Netlify, they are saved to Netlify Blobs.

Do not open `index.html` directly or use a static preview server: browsers cannot write submissions to the project's JSON file."
