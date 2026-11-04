"# Recipe Table

## Let published-site visitors add recipes to this computer

The Netlify page can submit to `recipes.json` on this computer through a public HTTPS tunnel. This uses no Netlify storage or API keys, but this computer must stay on, connected to the internet, and running both the Node server and tunnel. Anyone who can reach the published page can submit recipes.

1. In PowerShell, start the server in this folder:

   ```powershell
   $env:PORT = "3101"
   node server.js
   ```

   Browser requests are restricted to `https://recipewebs.netlify.app` by default.
2. Start a temporary HTTPS tunnel in another terminal: `cloudflared tunnel --url http://127.0.0.1:3101`.
3. Copy the `https://....trycloudflare.com` address printed by cloudflared.
4. In `index.html`, set the `recipe-api-base` meta tag’s `content` to that HTTPS address, for example `<meta name="recipe-api-base" content="https://example.trycloudflare.com">`.
5. Publish the updated `index.html` to Netlify. The tunnel URL changes each time a temporary tunnel is restarted, so update and republish the address whenever it changes.

For a permanent address, configure a named Cloudflare Tunnel and use its stable hostname instead of a temporary `trycloudflare.com` URL. Restrict browser access to your exact Netlify site origin by setting `RECIPE_ALLOWED_ORIGIN` before starting the server:

```powershell
$env:RECIPE_ALLOWED_ORIGIN = "https://your-site.netlify.app"
node server.js
```

The default allowed origin is `https://recipewebs.netlify.app`. To change it, set `RECIPE_ALLOWED_ORIGIN` to your exact Netlify site origin before starting the server.

The public JSON endpoint is the tunnel address followed by `/recipes.json`. The public API accepts unauthenticated recipe submissions; only share the site with people you trust.

## Run locally

Open this project folder in a terminal and run:

```powershell
$env:PORT = "3101"
node server.js
```

Then open `http://localhost:3101` in your browser. Keep the terminal open while using the app. Recipes are saved to the project’s `recipes.json` on this computer. The server listens only on this computer unless you deliberately expose it with a secure tunnel.

Do not open `index.html` directly or use a static preview server: browsers cannot write submissions to the project's JSON file."
