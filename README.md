# patch-exports-maps
A set of tools for adding exports maps to package.jsons in a monorepo.

## Instructions

1. Clone this repo

```bash
git clone https://github.com/dzearing/patch-exports-maps
```

1. Run the `extractImports.mjs` script from your repo root. This finds all TypeScript source files and builds up a dictionary of packages and the entry points referenced in the repo. Results are updated in `patch-exports-maps/data/package-exports.json`.

```bash
cd git/my-repo
node ../patch-exports-maps/extractImports.mjs
```

You can run this on multiple repos to build up the `package-exports.json` dictionary.

2. Once you're ready to add exports to packages, you can run the `updatePackages.mjs` script in your repo. It will glob all package.jsons and add `exports` with the list.

