import { describe, it, expect } from 'vitest';
import { rejectionCopy } from '@/lib/messages';
import { RejectionReason } from '@/types/api';
import type { Rejection } from '@/types/coupon';

const ALL_REASONS: RejectionReason[] = [
  RejectionReason.NotFound,
  RejectionReason.Inactive,
  RejectionReason.NotStarted,
  RejectionReason.Expired,
  RejectionReason.LimitReached,
  RejectionReason.MinimumNotMet,
];

const rejectionFor = (reason: RejectionReason): Rejection =>
  reason === RejectionReason.MinimumNotMet ? { reason, missingCents: 4000 } : { reason };

describe('rejectionCopy', () => {
  it('retorna copy nao-vazia para todo reason (exaustivo)', () => {
    for (const reason of ALL_REASONS) {
      expect(rejectionCopy(rejectionFor(reason)).length).toBeGreaterThan(0);
    }
  });

  it('mapeia cada reason nao-minimo para a copy esperada', () => {
    expect(rejectionCopy({ reason: RejectionReason.NotFound })).toBe('Esse código não existe');
    expect(rejectionCopy({ reason: RejectionReason.Inactive })).toBe('Cupom indisponível');
    expect(rejectionCopy({ reason: RejectionReason.NotStarted })).toBe('Ainda não disponível');
    expect(rejectionCopy({ reason: RejectionReason.Expired })).toBe('Esse cupom expirou');
    expect(rejectionCopy({ reason: RejectionReason.LimitReached })).toBe('Todos os usos foram consumidos');
  });

  it('interpola missingCents no caso de minimo', () => {
    const copy = rejectionCopy({ reason: RejectionReason.MinimumNotMet, missingCents: 4000 }).replace(/\s/g, ' ');
    expect(copy).toBe('Faltam R$ 40,00 para desbloquear');
  });
});
