import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';

export const TextField = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function TextField({ className = '', ...props }, ref) {
    return (
      <input
        ref={ref}
        className={`w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-[15px] text-[#1d1d1f] placeholder:text-black/35 transition-colors duration-150 focus:border-[#0071e3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0071e3]/30 motion-reduce:transition-none ${className}`}
        {...props}
      />
    );
  },
);

type Variant = 'primary' | 'ghost';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-[#0071e3] text-white hover:bg-[#0077ed] active:bg-[#006edb] disabled:bg-[#0071e3]/40 disabled:cursor-not-allowed',
  ghost: 'text-[#0071e3] hover:bg-[#0071e3]/10 disabled:text-[#0071e3]/40 disabled:cursor-not-allowed',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-xl px-5 py-3 text-[15px] font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071e3] motion-reduce:transition-none ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1d8a3f]/10 px-3 py-1 text-[13px] font-medium text-[#1d8a3f]">
      {children}
    </span>
  );
}

interface PriceRowProps {
  label: string;
  value: string;
  emphasis?: boolean;
  muted?: boolean;
}

export function PriceRow({ label, value, emphasis = false, muted = false }: PriceRowProps) {
  const tone = emphasis ? 'text-[#1d1d1f]' : muted ? 'text-black/50' : 'text-[#1d1d1f]';
  const size = emphasis ? 'text-lg font-semibold' : 'text-[15px]';
  return (
    <div className={`flex items-baseline justify-between ${tone} ${size}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

interface StepperProps {
  quantity: number;
  label: string;
  min?: number;
  max?: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

export function Stepper({ quantity, label, min = 1, max = 99, onIncrement, onDecrement }: StepperProps) {
  return (
    <div className="inline-flex items-center rounded-full border border-black/10 bg-white">
      <button
        type="button"
        aria-label={`Diminuir ${label}`}
        onClick={onDecrement}
        disabled={quantity <= min}
        className="grid h-9 w-9 place-items-center rounded-full text-lg text-[#1d1d1f] transition-colors duration-150 hover:bg-black/5 disabled:text-black/25 disabled:hover:bg-transparent motion-reduce:transition-none"
      >
        −
      </button>
      <span className="w-8 text-center text-[15px] tabular-nums" aria-label={`Quantidade de ${label}`}>
        {quantity}
      </span>
      <button
        type="button"
        aria-label={`Aumentar ${label}`}
        onClick={onIncrement}
        disabled={quantity >= max}
        className="grid h-9 w-9 place-items-center rounded-full text-lg text-[#1d1d1f] transition-colors duration-150 hover:bg-black/5 disabled:text-black/25 disabled:hover:bg-transparent motion-reduce:transition-none"
      >
        +
      </button>
    </div>
  );
}

export function Disclosure({ summary, children }: { summary: string; children: ReactNode }) {
  return (
    <details className="group">
      <summary className="cursor-pointer list-none text-[13px] text-black/50 transition-colors duration-150 hover:text-black/70 motion-reduce:transition-none">
        <span className="inline-flex items-center gap-1">
          <span className="transition-transform duration-150 group-open:rotate-90 motion-reduce:transition-none">›</span>
          {summary}
        </span>
      </summary>
      <div className="pt-3">{children}</div>
    </details>
  );
}
