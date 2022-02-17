import fs from 'fs';
import { ensureDir } from 'fs-extra';
import path from 'path';

export async function writeJSON(filePath, obj) {
  await ensureDir(path.dirname(filePath));

  return new Promise((resolve) => {  
    fs.writeFileSync(filePath, JSON.stringify(obj, null, 4) + '\n', 'utf8');
    resolve();
  });
}
