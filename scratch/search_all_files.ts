import * as fs from 'fs';
import * as path from 'path';

const userDir = 'C:\\Users\\Pavithran';
const searchString = 'skkxftaqryezezfyrakr';

console.log(`Searching for '${searchString}' in files under ${userDir}...`);

function searchDir(dir: string, depth = 0) {
  if (depth > 4) return; // limit depth
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (file === 'node_modules' || file === '.next' || file === '.git' || file === 'AppData' || file === '.cache') continue;
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        searchDir(fullPath, depth + 1);
      } else if (stat.isFile()) {
        const size = stat.size;
        if (size > 1024 * 1024) continue; // skip large files
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes(searchString)) {
          console.log(`Found match in: ${fullPath}`);
          // Print surrounding text
          const lines = content.split('\n');
          for (const line of lines) {
            if (line.includes(searchString) || line.includes('KEY') || line.includes('ROLE')) {
              if (line.length < 200) {
                console.log(`  ${line.trim()}`);
              }
            }
          }
        }
      }
    }
  } catch (err) {
    // ignore permission errors
  }
}

// Also search c:\Placely
searchDir('c:\\Placely');
searchDir(userDir);
