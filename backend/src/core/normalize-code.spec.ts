import { normalizeCode, InvalidCouponCodeError } from './normalize-code';

const NBSP = String.fromCharCode(0x00a0);
const ZERO_WIDTH = String.fromCharCode(0x200b);
const FULLWIDTH_LANC10 = String.fromCodePoint(0xff2c, 0xff21, 0xff2e, 0xff23, 0xff11, 0xff10);

describe('core/normalize-code', () => {
  it('mantem um codigo ja canonico', () => {
    expect(normalizeCode('LANC10')).toBe('LANC10');
  });

  it('aplica trim e maiusculas', () => {
    expect(normalizeCode('  lanc10  ')).toBe('LANC10');
  });

  it('remove espaco interno', () => {
    expect(normalizeCode('lanc 10')).toBe('LANC10');
  });

  it('remove NBSP', () => {
    expect(normalizeCode(`LANC${NBSP}10`)).toBe('LANC10');
  });

  it('remove zero-width space', () => {
    expect(normalizeCode(`LANC${ZERO_WIDTH}10`)).toBe('LANC10');
  });

  it('normaliza caracteres fullwidth via NFKC', () => {
    expect(normalizeCode(FULLWIDTH_LANC10)).toBe('LANC10');
  });

  it('rejeita string vazia', () => {
    expect(() => normalizeCode('')).toThrow(InvalidCouponCodeError);
  });

  it('rejeita string so com espacos', () => {
    expect(() => normalizeCode('   ')).toThrow(InvalidCouponCodeError);
  });

  it('rejeita string so com caracteres invisiveis', () => {
    expect(() => normalizeCode(`${NBSP}${ZERO_WIDTH}`)).toThrow(InvalidCouponCodeError);
  });

  it('rejeita caractere fora de [A-Z0-9] (hifen)', () => {
    expect(() => normalizeCode('LANC-10')).toThrow(InvalidCouponCodeError);
  });

  it('rejeita simbolo fora do charset', () => {
    expect(() => normalizeCode('LANC@10')).toThrow(InvalidCouponCodeError);
  });
});
