import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('ALL environment keys:');
for (const key of Object.keys(process.env).sort()) {
  console.log(`${key}: ${process.env[key] ? 'PRESENT (len ' + process.env[key].length + ')' : 'EMPTY'}`);
}
