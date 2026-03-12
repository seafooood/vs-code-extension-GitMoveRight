# Extension Build

- Build

```bash
npm run compile
```

- Install vsce (VS Code Extension CLI)**
  - Run `npm install -g vsce` globally
  - This tool is required to package and publish the extension

- Generate Extension Package

```bash
vsce package
```

- Publish to Marketplace
  - Run `vsce publish` to publish directly to the marketplace
  - Or upload the .vsix file manually through the marketplace website