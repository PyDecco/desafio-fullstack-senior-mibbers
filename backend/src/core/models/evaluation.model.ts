import type { Cents } from './money.model';

export interface EvaluationContext {
  now: Date;
  subtotalCents: Cents;
}
