import { RejectionReason, type NonMinimumReason } from '@/types/api';
import type { Rejection } from '@/types/coupon';
import { formatBRL } from '@/lib/utils';

const STATIC_COPY: Record<NonMinimumReason, string> = {
  [RejectionReason.NotFound]: 'Esse código não existe',
  [RejectionReason.Inactive]: 'Cupom indisponível',
  [RejectionReason.NotStarted]: 'Ainda não disponível',
  [RejectionReason.Expired]: 'Esse cupom expirou',
  [RejectionReason.LimitReached]: 'Todos os usos foram consumidos',
};

export const INVALID_REQUEST_MESSAGE = 'Não foi possível validar';
export const NETWORK_ERROR_MESSAGE = 'Erro de conexão. Tente novamente.';

export function rejectionCopy(rejection: Rejection): string {
  if (rejection.reason === RejectionReason.MinimumNotMet) {
    return `Faltam ${formatBRL(rejection.missingCents)} para desbloquear`;
  }
  return STATIC_COPY[rejection.reason];
}
