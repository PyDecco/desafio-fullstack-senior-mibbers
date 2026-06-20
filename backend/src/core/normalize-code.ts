export class InvalidCouponCodeError extends Error {}

const INVISIBLE = /\p{Cf}/gu;
const WHITESPACE = /\s+/gu;
const ALLOWED = /^[A-Z0-9]+$/;

export function normalizeCode(raw: string): string {
  const normalized = raw
    .normalize('NFKC')
    .replace(WHITESPACE, '')
    .replace(INVISIBLE, '')
    .toUpperCase();

  if (!ALLOWED.test(normalized)) {
    throw new InvalidCouponCodeError(`codigo de cupom invalido: ${raw}`);
  }

  return normalized;
}
