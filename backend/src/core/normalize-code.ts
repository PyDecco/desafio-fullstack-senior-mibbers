export class InvalidCouponCodeError extends Error {}

const ZERO_WIDTH = new RegExp('[\\u200B-\\u200D\\uFEFF]', 'gu');
const WHITESPACE = /\s+/gu;
const ALLOWED = /^[A-Z0-9]+$/;

export function normalizeCode(raw: string): string {
  const normalized = raw
    .normalize('NFKC')
    .replace(WHITESPACE, '')
    .replace(ZERO_WIDTH, '')
    .toUpperCase();

  if (!ALLOWED.test(normalized)) {
    throw new InvalidCouponCodeError(`codigo de cupom invalido: ${raw}`);
  }

  return normalized;
}
