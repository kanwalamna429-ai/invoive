# Deploy Invoice Studio to Cloudflare

Invoice Studio is a static React/Vite single-page app. Both Cloudflare Pages and Cloudflare Workers can serve it; choose one deployment target for a given hostname. Neither option needs an application server or secrets. Invoice data is kept in browser storage, and PDF/PNG files are generated in the browser.

## Before you deploy

- Push the project to a GitHub or GitLab repository if using Pages Git integration.
- Use a supported Node.js release (Node 20 or later is recommended) and npm.
- From the project root, install locked dependencies and confirm a production build:

  ```sh
  npm ci
  npm run build
  ```

Vite writes the static site to `dist/`. The app uses browser-history routes such as `/invoice-generator/`, `/uk-invoice-generator/`, and `/invoices`; the host must serve the SPA entry point on direct route requests.

## Option 1: Cloudflare Pages (recommended)

Git integration builds and deploys production commits automatically and creates preview deployments for other branches and pull requests.

1. In the Cloudflare dashboard, open **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
2. Authorize the Git provider and select this repository.
3. Configure the build:
   - **Framework preset:** React (Vite), or **None**
   - **Root directory:** `/` (the repository root)
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Environment variables:** none required
4. Select the production branch (usually `main`) and deploy.
5. Open the generated `*.pages.dev` URL and check the production checklist below.
6. To use your own domain, open the Pages project **Custom domains** settings, add the hostname, and follow the DNS instructions. Cloudflare provisions HTTPS for a correctly configured domain.

Do not add a top-level `404.html` unless you intentionally want to replace Pages' SPA routing behavior. Pages treats a project without that file as a single-page app and routes unmatched paths to `/`, allowing React Router to render each generator page on direct visits.

### Manual Pages deploy with Wrangler

Use this when deploying a prebuilt site from a local checkout or CI pipeline rather than connecting the repository to Git. **A Pages project created as Direct Upload cannot later be converted to a Git-integrated project**, so choose this method deliberately.

1. Authenticate the local Wrangler CLI:

   ```sh
   npx wrangler login
   ```

2. Create the Pages Direct Upload project once. Choose `invoice-studio` as the project name and the production branch (for example, `main`):

   ```sh
   npx wrangler pages project create
   ```

3. Build and deploy:

   ```sh
   npm run deploy:pages
   ```

The project name in that npm command is `invoice-studio`. For a different Pages project name, change the `--project-name` value in `package.json` or run:

```sh
npm run build
npx wrangler pages deploy dist --project-name YOUR_PROJECT_NAME
```

To create a preview deployment for a branch:

```sh
npm run build
npx wrangler pages deploy dist --project-name invoice-studio --branch YOUR_BRANCH_NAME
```

## Option 2: Cloudflare Workers Static Assets

This repository includes [`wrangler.jsonc`](../wrangler.jsonc), which tells Workers to serve the Vite `dist/` output and fall back to the SPA entry point for non-file routes.

1. Authenticate Wrangler:

   ```sh
   npx wrangler login
   ```

2. Preview the built app locally using the Workers runtime:

   ```sh
   npm run dev:worker
   ```

   Open the local URL printed by Wrangler, then test a deep route such as `/uk-invoice-generator/`.

3. Deploy to Workers:

   ```sh
   npm run deploy:worker
   ```

4. Wrangler prints the deployed `*.workers.dev` URL. Open both `/` and a direct route such as `/invoice-generator/` to confirm that the SPA fallback works.
5. To add a custom domain, use the Worker's **Settings** → **Domains & Routes** configuration in the Cloudflare dashboard. Follow Cloudflare's DNS and certificate instructions.

The included Worker is intentionally static-only: it has no API, database, authentication, or server-side invoice storage. If server-side routes are added later, configure Worker routing deliberately rather than assuming static asset fallback is an API.

## Production verification

After every first deploy or host/domain change, check:

- The root redirects to `/invoice-generator/`.
- Refreshing or directly opening `/invoice-generator/`, `/document-tools/`, `/uk-invoice-generator/`, `/hourly-rate-calculator`, and `/invoices` renders the app rather than a host-level 404.
- A draft can be saved, reopened, duplicated, and deleted.
- PDF and PNG exports download successfully.
- The browser console has no failed asset requests or runtime errors.
- The custom domain serves HTTPS and the canonical URL uses the intended hostname.

## Privacy and moving existing drafts

Saved documents live in `localStorage` for the exact browser origin (scheme, hostname, and port). A `pages.dev` URL, `workers.dev` URL, custom domain, or local-development origin each has a separate storage area; deploying does not migrate drafts between them. Before changing origins, use **Saved invoices** → **Export backup** in the old origin, then open the new origin and import that JSON backup.

The optional PKR estimate sends the selected currency code to the exchange-rate provider. Invoice amounts, business details, and client data are not sent. Any future API or analytics integrations should be reviewed separately before making privacy claims.

## Official Cloudflare references

- [Pages Git integration](https://developers.cloudflare.com/pages/get-started/git-integration/)
- [Pages Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)
- [Pages build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/)
- [Pages SPA serving behavior](https://developers.cloudflare.com/pages/configuration/serving-pages/)
- [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [Workers SPA configuration](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/)
- [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
