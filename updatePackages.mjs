import path from 'path';
import semver from 'semver';
import { fileURLToPath } from "url";
import { intermediateToSourcePath, slash } from "@ms-cloudpack/path-utilities";
import { resolveImportFromPackagePath } from '@ms-cloudpack/package-utilities';
import { glob, readJSON, writeJSON } from './utilities/index.mjs';

const currentPath = path.dirname(fileURLToPath(import.meta.url));

function sortExports(exports) {
  const newExports = {};

  const keys = Object.keys(exports);

  // Don't sort non-import path keys.
  if (!keys.length || !keys[0].startsWith('.')) {
    return exports;
  }

  const exportNames = Object.keys(exports).sort();
  
  for (const name of exportNames) {
    const value = exports[name];

    newExports[name] = typeof value === 'object' ? sortExports(value) : value;    
  }

  return newExports;
}

function safeImportPath(importPath) {
  if (!importPath.startsWith('.')) {
    importPath = './' + importPath;
  }

  return slash(importPath);
}

export async function updatePackageExports(packageJsonPath, allPackageExports) {
  const packagePath = path.dirname(packageJsonPath);
  const definitionPath = path.join(packageJsonPath);
  const packageDefinition = await readJSON(definitionPath);

  const packageExportVersions = allPackageExports[packageDefinition.name];

  if (packageExportVersions) {
    const exports = { };

    // Iterate through the versions available for this package.
    for (const [version, packageExports] of Object.entries(packageExportVersions)) {
      if (Object.keys(packageExports).length <= 2 || packageDefinition.exports) {
        // console.log(`Package ${packageDefinition.name} has these entries:`, JSON.stringify(packageExportVersions, null, 2));
    
        // only root entries.
        if (semver.satisfies(packageDefinition.version, `^${version}`)) {

          console.log(`Updating "${packageDefinition.name}"`);

          if (typeof exports !== 'object') {
            throw new Error(`Package with quirky exports: ${packageJsonPath}`);
          }

          console.log(`Reviewing ${Object.keys(packageExports).length} export(s) for "${packageDefinition.name}@${packageDefinition.version}"`);

          for (const exportKey of Object.keys(packageExports)) {
            // This exportKey needs an entry.
            const newExport = exports[exportKey] = {};
            const importPath = await resolveImportFromPackagePath(packagePath, exportKey);
            const sourcePath = intermediateToSourcePath(importPath, packagePath);
            
            console.log(`  ${exportKey}: "${importPath}" sourcePath: "${sourcePath}"`);

            
            if (sourcePath && ['.ts', '.tsx'].indexOf(path.extname(sourcePath)) >= 0) {

              newExport.types = safeImportPath(path.join(path.dirname(importPath), path.basename(importPath, path.extname(importPath)) + '.d.ts'));
            }
            
            newExport.source = safeImportPath(sourcePath);
              
            if (exportKey.startsWith('./lib/')) {
              exports[exportKey.replace('./lib/', './src/')] = {
                source: safeImportPath(sourcePath)
              }
            }                          

            newExport.import = safeImportPath(importPath);
          }
        } else {
          console.log(`Semver "^${version}" not satisfied for ${packageDefinition.name}@${packageDefinition.version}, ignoring entries.`);
        }

        // populate the default entry.
        const typesEntry = packageDefinition.typings || packageDefinition.types;
        const esmEntry = (packageDefinition.type === 'module' ? packageDefinition.main : packageDefinition.module) || packageDefinition.module || packageDefinition.main;
        if (!exports['.'] && typesEntry && esmEntry) {
          exports['.'] = exports['.'] || {
            'types': safeImportPath(typesEntry),
            'source': './' + slash(await resolveImportFromPackagePath(packagePath, undefined, { preferSource: true })),
            'import': safeImportPath(esmEntry)
          };  
        }

        packageDefinition.exports = sortExports(exports);

        const exportsSet = new Set();
        for (const [a, b] of Object.entries(packageDefinition.exports)) {
          if (a.startsWith('./lib/') && exportsSet.has(b.import)) {
            console.log(`Redundant export entry detected in: ${packagePath}`, packageDefinition.exports);
            // throw new Error('oops');
          }
          exportsSet.add(b.import);
        }
        
        console.log(`Saving "${packageDefinition.name}" package.json.`);

        // Update package.
        await writeJSON(definitionPath, packageDefinition);
      }
    }
  }
}

async function startFromGlob() {
  const matches = Array.from(await glob('**/package.json', { cwd: process.cwd(), ignore: ['**/node_modules/**'] })).map(relativePath => path.join(process.cwd(), relativePath));
  console.log(`Patching package.json`, matches);
  const allPackageExports = await readJSON(path.join(currentPath, 'package-exports.json'));

  for (const match of matches) {
    await updatePackageExports(match, allPackageExports);
  }
}

// Start from glob in cwd.
startFromGlob();
