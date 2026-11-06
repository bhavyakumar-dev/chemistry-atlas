# Push Chemistry Atlas V5 to GitHub (Windows)

The connected GitHub integration in the preparation session rejected repository writes with HTTP 403. The V5 source package is prepared locally, but it has **not** been pushed or deployed by this session.

The public repository already contains its MIT `LICENSE`. Use a fresh clone so that its existing `main` history and licence are preserved.

1. Download `chemistry-atlas-v5-0.5.3.zip` and extract it.
2. Open PowerShell in a parent folder and clone the repository:

   ```powershell
   git clone https://github.com/bhavyakumar-dev/chemistry-atlas.git
   ```

3. Copy the **contents** of the extracted project folder into the freshly cloned `chemistry-atlas` folder. Merge/replace project files when prompted. Keep the clone's hidden `.git` folder. The included MIT `LICENSE` matches the repository's current licence.
4. Run checks, build and push:

   ```powershell
   cd chemistry-atlas
   npm install
   npm run validate:all
   npm run typecheck
   npm run build:editions
   git add -A
   git commit -m "feat: release Chemistry Atlas V5 0.5.3 quality preview"
   git push origin main
   ```

5. Open the repository's **Actions** tab. Confirm `Build and publish Chemistry Atlas editions` succeeds. Do not announce deployment until the workflow succeeds and live routes have been checked.

## Expected GitHub Pages entry routes

- V5 root: `https://bhavyakumar-dev.github.io/chemistry-atlas/`
- V1: `https://bhavyakumar-dev.github.io/chemistry-atlas/versions/v1/`
- V2: `https://bhavyakumar-dev.github.io/chemistry-atlas/versions/v2/`
- V3: `https://bhavyakumar-dev.github.io/chemistry-atlas/versions/v3/`
- V4: `https://bhavyakumar-dev.github.io/chemistry-atlas/versions/v4/`
- V5: `https://bhavyakumar-dev.github.io/chemistry-atlas/versions/v5/`

These are edition entry points built from the same current source. They are not immutable historical snapshots. Git commits and tags are the actual source history.

## Cloudflare backend

GitHub Pages publishes only the static frontend. Cloudflare Pages Functions, D1, Workers AI and R2 must be configured separately for accounts, school-wide settings, AI tutoring, teacher analytics and private portfolios. Apply D1 migrations in order and configure exact trusted origins before enabling cookie-authenticated actions. Never paste Cloudflare tokens, passwords or API secrets into chat or the repository.
