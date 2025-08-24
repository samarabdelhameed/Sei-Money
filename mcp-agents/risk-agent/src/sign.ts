import crypto from "crypto";

export function hmac(payload: unknown, secret: string): string {
  const body = typeof payload === "string" ? payload : JSON.stringify(payload);
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

export function verifyHmac(payload: unknown, signature: string, secret: string): boolean {
  const expected = hmac(payload, secret);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}