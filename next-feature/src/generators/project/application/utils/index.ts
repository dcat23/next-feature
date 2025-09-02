
export function generateSecret(): string {
  return require('crypto').randomBytes(32).toString('hex');
}
