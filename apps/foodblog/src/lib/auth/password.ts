import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  type ScryptOptions,
} from 'node:crypto';
import { promisify } from 'node:util';

// `promisify` picks the three-argument overload, so the options-aware
// signature is restated here.
const scrypt = promisify(scryptCallback) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: ScryptOptions,
) => Promise<Buffer>;

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 } as const;

/**
 * Password hashes are stored as `scrypt$N$r$p$salt$hash` so the cost
 * parameters can be raised later without invalidating existing hashes.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const derived = await scrypt(password.normalize('NFKC'), salt, KEY_LENGTH, { ...SCRYPT_PARAMS });

  const { N, r, p } = SCRYPT_PARAMS;
  return ['scrypt', N, r, p, salt.toString('hex'), derived.toString('hex')].join('$');
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const [, rawN, rawR, rawP, saltHex, hashHex] = parts;
  const N = Number(rawN);
  const r = Number(rawR);
  const p = Number(rawP);
  if (
    !saltHex ||
    !hashHex ||
    !Number.isInteger(N) ||
    !Number.isInteger(r) ||
    !Number.isInteger(p)
  ) {
    return false;
  }

  const expected = Buffer.from(hashHex, 'hex');
  const derived = await scrypt(
    password.normalize('NFKC'),
    Buffer.from(saltHex, 'hex'),
    expected.length,
    { N, r, p, maxmem: SCRYPT_PARAMS.maxmem },
  );

  return derived.length === expected.length && timingSafeEqual(derived, expected);
}
