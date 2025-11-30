import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

/**
 * Creates a short-lived JWT for a secure signing link.
 */
export function generateSigningToken(payload: { requestId: string; signerEmail: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Validates a signing token and returns its payload.
 */
export function validateSigningToken(token: string): { requestId: string; signerEmail: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { requestId: string; signerEmail: string };
  } catch (error) {
    return null;
  }
}