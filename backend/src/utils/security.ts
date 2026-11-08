import { createHash, randomBytes, scrypt as callbackScrypt, timingSafeEqual } from 'node:crypto';

const scrypt = (password: string, salt: string, keyLength: number) =>
  new Promise<Buffer>((resolve, reject) => {
    callbackScrypt(password, salt, keyLength, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });

export const hashPassword = async (password: string) => {
  const salt = randomBytes(16).toString('hex');
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${hash.toString('hex')}`;
};

export const isLegacyPasswordHash = (storedHash: string) => !storedHash.startsWith('scrypt$');

export const verifyPassword = async (password: string, storedHash: string) => {
  if (storedHash.startsWith('scrypt$')) {
    const [, salt, hash] = storedHash.split('$');
    if (!salt || !/^[a-f0-9]{32}$/i.test(salt) || !hash || !/^[a-f0-9]{128}$/i.test(hash)) {
      return false;
    }

    const expected = Buffer.from(hash, 'hex');
    const actual = await scrypt(password, salt, expected.length);
    return timingSafeEqual(actual, expected);
  }

  if (!/^[a-f0-9]{64}$/i.test(storedHash)) return false;
  const expected = Buffer.from(storedHash, 'hex');
  const actual = createHash('sha256').update(password).digest();
  return timingSafeEqual(actual, expected);
};

export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (secret) {
    if (process.env.NODE_ENV === 'production' && secret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters in production.');
    }
    return secret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be configured in production.');
  }

  return 'dev-secret';
};
