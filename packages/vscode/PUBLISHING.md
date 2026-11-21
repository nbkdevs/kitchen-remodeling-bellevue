# Publishing

The publisher id is a placeholder (`nbkdevs`). To change it, edit one field:

```bash
npm pkg set publisher=<your-publisher-id>
```

VS Code Marketplace (needs an Azure DevOps PAT with Marketplace > Manage, publisher created at
https://marketplace.visualstudio.com/manage):

```bash
VSCE_PAT=... npx --yes @vscode/vsce publish --no-dependencies
```

Open VSX (token from https://open-vsx.org/user-settings/tokens; namespace must exist once):

```bash
npx --yes ovsx create-namespace <publisher> -p "$OVSX_PAT"
npx --yes ovsx publish kitchen-remodeling-cost-planner-1.0.0.vsix -p "$OVSX_PAT"
```
