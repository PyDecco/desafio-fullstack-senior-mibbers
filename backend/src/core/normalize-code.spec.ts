import { normalizeCode, InvalidCouponCodeError } from './normalize-code';

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

  it('remove NBSP (\\u00A0)', () => {
    expect(normalizeCode('LANC 10')).toBe('LANC10');
  });

  it('remove zero-width space (\\u200B)', () => {
    expect(normalizeCode('LANC​10')).toBe('LANC10');
  });

  it('normaliza caracteres fullwidth via NFKC', () => {
    expect(normalizeCode('ＬＡＮＣ１０')).toBe('LANC10');
  });

  it('rejeita string vazia', () => {
    expect(() => normalizeCode('')).toThrow(InvalidCouponCodeError);
  });

  it('rejeita string so com espacos', () => {
    expect(() => normalizeCode('   ')).toThrow(InvalidCouponCodeError);
  });

  it('rejeita string so com caracteres invisiveis', () => {
    expect(() => normalizeCode(' ​')).toThrow(InvalidCouponCodeError);
  });

  it('rejeita caractere fora de [A-Z0-9] (hifen)', () => {
    expect(() => normalizeCode('LANC-10')).toThrow(InvalidCouponCodeError);
  });

  it('rejeita simbolo fora do charset', () => {
    expect(() => normalizeCode('LANC@10')).toThrow(InvalidCouponCodeError);
  });
});
