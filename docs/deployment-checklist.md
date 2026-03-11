# Deployment Checklist

Steps to publish GitMoveRight to GitHub and the VS Code Marketplace.

---

## 1. Prepare the Repository

- [x] Create a `.gitignore` file in the project root with the following content:
  ```
  node_modules/
  out/
  *.vsix
  ```
- [x] Add a `LICENSE` file to the project root (MIT is standard for VS Code extensions — the Marketplace will warn without one)
- [ ] Add the repository URL to `package.json` once the GitHub repo is created:
  ```json
  "repository": {
    "type": "git",
    "url": "https://github.com/<your-username>/gitmoveright"
  }
  ```

---

## 2. Push to GitHub

- [ ] Go to [https://github.com/new](https://github.com/new) and create a new **public** repository named `gitmoveright`
- [ ] Do not initialise it with a README, .gitignore, or licence (the project already has these)
- [ ] In the project folder, run:
  ```bash
  git init
  git add .
  git commit -m "Initial commit"
  git remote add origin https://github.com/<your-username>/gitmoveright.git
  git branch -M main
  git push -u origin main
  ```
- [ ] Verify the repo is visible at `https://github.com/<your-username>/gitmoveright`

---

## 3. Create a VS Code Marketplace Publisher

- [ ] Sign in at [https://marketplace.visualstudio.com/manage](https://marketplace.visualstudio.com/manage) with a Microsoft account
- [ ] Click **Create publisher**
- [ ] Choose a publisher ID (e.g. `andrewseaford`) — this is permanent and will form part of your extension's unique ID
- [ ] Update the `publisher` field in `package.json` to match your chosen publisher ID

---

## 4. Create an Azure DevOps Personal Access Token (PAT)

The `vsce` packaging tool uses a PAT to authenticate with the Marketplace.

- [ ] Go to [https://dev.azure.com](https://dev.azure.com) and sign in with the same Microsoft account
- [ ] Click your profile icon (top right) and select **Personal access tokens**
- [ ] Click **New Token** and configure it:
  - Name: `vsce-gitmoveright` (or any label you'll recognise)
  - Organisation: **All accessible organisations**
  - Expiration: set a date that suits you
  - Scopes: select **Custom defined**, then tick **Marketplace > Manage**
- [ ] Click **Create** and copy the token immediately — it is only shown once
- [ ] Store the token somewhere safe (e.g. a password manager)

---

## 5. Pre-publish Checks

- [ ] Run `npm run compile` and confirm there are no TypeScript errors
- [ ] Confirm `README.md` looks good — this is what users see on the Marketplace listing
- [ ] Confirm `CHANGELOG.md` reflects the current version
- [ ] Check the version in `package.json` is correct (currently `0.0.1`)
- [ ] Run `npx vsce ls` to preview exactly which files will be bundled — verify no sensitive files are included

---

## 6. Log in with vsce

- [ ] Run:
  ```bash
  npx vsce login <your-publisher-id>
  ```
- [ ] Paste the PAT when prompted

---

## 7. Publish

- [ ] Run:
  ```bash
  npx vsce publish
  ```
- [ ] `vsce` will package the extension and upload it to the Marketplace automatically

---

## 8. Verify the Listing

- [ ] Go to [https://marketplace.visualstudio.com/manage](https://marketplace.visualstudio.com/manage) and confirm the extension appears
- [ ] Click through to the public listing and check the README renders correctly
- [ ] Search for `GitMoveRight` in the VS Code Extensions panel to confirm it is discoverable (this can take a few minutes to propagate)

---

## Future Releases

When publishing an update:

1. Update `CHANGELOG.md` with the new version's changes
2. Bump the version in `package.json` (e.g. `0.0.1` to `0.1.0`)
3. Commit and push to GitHub
4. Run `npx vsce publish` — the Marketplace version updates automatically
