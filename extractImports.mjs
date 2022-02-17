import process from 'process';
import path from 'path';
import { fileURLToPath } from 'url';
import { evaluateImportsFromEntries } from '@ms-cloudpack/package-utilities';
import { readJSON, glob, writeJSON } from './utilities/index.mjs';

const currentPath = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(currentPath, 'data');
const packageExportsPath = path.join(dataPath, 'package-exports.json');
const statsPath = path.join(dataPath, 'package-exports.stats.json');

async function startFromCurrentDirectory() {
  const matches = Array.from(await glob('!(node_modules)/**/!(.d|.test|.spec|.Example).{ts,tsx}', { cwd: process.cwd(), ignore: [ '**/node_modules/**', '**/lib/**', '**/*test*/**'] })).map(relativePath => path.join(process.cwd(), relativePath));
  start(matches);
}

async function start(entries) {  
  console.log(`Starting from ${entries.length} entries.`);
  const allPackages = fs.existsSync(packageExportsPath) ? await readJSON(packageExportsPath) : {};  
  const { stats } = await evaluateImportsFromEntries(entries, null, allPackages);
  
  console.log(`Updating package-exports.json.`);
  await writeJSON(packageExportsPath, allPackages);

  console.log(`Updating stats file.`);
  await writeJSON(statsPath, stats);
}

if (process.argv[2]) {
  start([path.resolve(process.cwd(), process.argv[2])]);
} else {
  startFromCurrentDirectory();
}
