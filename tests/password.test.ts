import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("password hashing", () => {
  it("hash + verify round-trip succeeds", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash).toMatch(/^[0-9a-f]+:[0-9a-f]+$/);
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(true);
  });

  it("rejects wrong password", async () => {
    const hash = await hashPassword("hunter2hunter");
    expect(await verifyPassword("hunter2hunter!", hash)).toBe(false);
  });

  it("produces unique salts (different hashes for same password)", async () => {
    const a = await hashPassword("samepass1");
    const b = await hashPassword("samepass1");
    expect(a).not.toBe(b);
    expect(await verifyPassword("samepass1", a)).toBe(true);
    expect(await verifyPassword("samepass1", b)).toBe(true);
  });

  it("returns false on malformed hash", async () => {
    expect(await verifyPassword("anything", "not-a-real-hash")).toBe(false);
    expect(await verifyPassword("anything", "")).toBe(false);
  });
});
