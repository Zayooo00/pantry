import { scrypt as _scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(_scrypt) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
) => Promise<Buffer>;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = await scrypt(password, salt, 64);
  return `${salt}:${key.toString("hex")}`;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, keyHex] = hash.split(":");
  if (!salt || !keyHex) {
    return false;
  }
  const expected = Buffer.from(keyHex, "hex");
  const got = await scrypt(password, salt, 64);
  if (expected.length !== got.length) {
    return false;
  }
  return timingSafeEqual(expected, got);
}
