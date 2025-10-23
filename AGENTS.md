# Repository Guidelines

## Project Structure & Module Organization
- Production pages live at the repository root: `index.html`, `styles.css`, and static assets in `assets/`; landscape photos stay in `hernandez_images/`.
- Tailwind source utilities belong in `src/input.css`; the build scripts overwrite `styles.css`, so treat it as generated output.
- The admin uploader is in `admin/` and loads config files generated at `admin/firebase-config.js` and `assets/js/firebase-config.js`.
- Automation helpers sit in `scripts/`, especially `scripts/create-firebase-config.mjs`, which pulls environment variables and writes those configs.

## Build, Test, and Development Commands
- `npm install` — install Tailwind, dotenv, and Playwright dependencies.
- `npm run watch-css` — watch `src/input.css` and rebuild `styles.css` during local work.
- `npm run build-css` — trigger a one-off Tailwind compile after updating markup utilities.
- `npm run create-configs` — refresh Firebase configs without compiling CSS.
- `npm run build` — run config generation and Tailwind compile in a single deploy-ready step.

## Coding Style & Naming Conventions
- Favor semantic HTML with 4-space indentation; list Tailwind classes roughly layout → spacing → color for legibility.
- Keep custom CSS in `src/input.css` under concise comment blocks. Never modify `styles.css` manually.
- JavaScript modules rely on ES imports, 2-space indentation, `const` declarations, and camelCase identifiers; store shared logic in `scripts/` or `assets/js/`.
- Name assets and generated outputs in lowercase-kebab-case (for example, `gallery-spring-2025.jpg`).

## Testing Guidelines
- Automated tests are not wired yet; plan Playwright end-to-end coverage under `tests/e2e/`.
- When adding tests, use the `*.spec.ts` suffix and capture flows such as homepage render, admin sign-in, upload success, and gallery refresh.
- Manual smoke tests remain mandatory: run `npm run create-configs`, execute an admin upload, and confirm new images surface on the public gallery.

## Commit & Pull Request Guidelines
- Follow the Conventional Commit pattern already in history (`feat:`, `fix:`, `chore:`) with imperative subjects under 72 characters; split unrelated changes across commits.
- Pull requests should summarize scope, list manual test results (or Playwright output once available), link issues, and attach screenshots for visual changes.
- Highlight environment-variable updates and note that reviewers must rerun `npm run build` to regenerate Firebase configs before verifying.

## Security & Configuration Tips
- Keep Firebase credentials and the `ADMIN_PHONE_ALLOWLIST` in your shell or `.env`; the build script writes git-ignored config files from those values.
- Prune the allowlist to trusted numbers, regenerate configs after changes, and re-test the admin portal before promoting a deploy.
