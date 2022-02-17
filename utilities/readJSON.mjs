import fs from 'fs';

export async function readJSON(filePath) {
  return new Promise((resolve) => {
    resolve(JSON.parse(fs.readFileSync(filePath, 'utf8')));
  });
}
