import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const { updateOfferVerification, updateOfferStatus } = await import('../src/services/database.ts');
  const testId = "efebe0e0-7ae0-4af0-a0e9-a04e43e805cb";
  try {
    console.log('Testing updateOfferVerification...');
    const res1 = await updateOfferVerification(testId, 'verified');
    console.log('Result 1:', res1);

    console.log('Testing updateOfferStatus...');
    const res2 = await updateOfferStatus(testId, 'joined');
    console.log('Result 2:', res2);
  } catch (err) {
    console.error('Caught error during run:', err);
  }
}

run();
