import * as bcrypt from 'bcryptjs';

async function generateHash() {
  const password = 'Lightyear@123';
  const hash = await bcrypt.hash(password, 12);
  console.log('Password:', password);
  console.log('New Hash:', hash);

  // Verify it works
  const isValid = await bcrypt.compare(password, hash);
  console.log('Verification:', isValid ? 'PASS' : 'FAIL');

  // Also test the old hash
  const oldHash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.K5mPjRXrBh4GSe';
  const oldValid = await bcrypt.compare(password, oldHash);
  console.log('Old hash verification:', oldValid ? 'PASS' : 'FAIL');
}

generateHash();
