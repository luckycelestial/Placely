import { db } from '../services/database';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function run() {
  try {
    const drivesData = await db.getDrives({
      excludeCompleted: true
    });
    console.log('--- Number of drives fetched ---', drivesData ? drivesData.length : 0);
    if (drivesData && drivesData.length > 0) {
      console.log('--- Sample drive companies ---', drivesData.slice(0, 3).map((d: any) => ({
        id: d.id,
        role: d.role_title,
        companies: d.companies
      })));
    }
  } catch (err) {
    console.error('Error running test:', err);
  }
}

run();
