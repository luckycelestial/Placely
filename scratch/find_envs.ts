import * as fs from 'fs';
import * as path from 'path';

const userDir = 'C:\\Users\\Pavithran';
const foldersToSearch = [
  'EDC', 'Placely', 'boxbuddy', 'luckyfolio', 'celebrations', 'megham.attire', 'jarvis', 'google'
];

console.log('Searching for env files in projects...');

for (const folder of foldersToSearch) {
  const projectPath = path.join(userDir, folder);
  if (!fs.existsSync(projectPath)) continue;

  try {
    const files = fs.readdirSync(projectPath);
    const envFiles = files.filter(f => f.startsWith('.env'));
    for (const file of envFiles) {
      const fullPath = path.join(projectPath, file);
      console.log(`Found env file: ${fullPath}`);
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        if (line.includes('SUPABASE') || line.includes('PASSWORD') || line.includes('DATABASE_URL') || line.includes('SERVICE_ROLE')) {
          console.log(`  ${line.trim()}`);
        }
      }
    }
  } catch (err: any) {
    console.log(`Error reading ${projectPath}: ${err.message}`);
  }
}
