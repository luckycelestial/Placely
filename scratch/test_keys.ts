import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('Keys in process.env:');
for (const key of Object.keys(process.env)) {
  if (key.includes('SUPABASE') || key.includes('KEY') || key.includes('SECRET') || key.includes('PASSWORD')) {
    console.log(`${key}: ${process.env[key] ? 'PRESENT (len ' + process.env[key].length + ')' : 'EMPTY'}`);
  }
}
