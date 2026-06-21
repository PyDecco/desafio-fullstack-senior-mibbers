import type { RefObject } from 'react';
import { TextField, Button } from '@/components/ui';

interface CouponInputProps {
  value: string;
  onChange: (value: string) => void;
  onApply: () => void;
  onClear: () => void;
  loading: boolean;
  showClear: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
}

export function CouponInput({ value, onChange, onApply, onClear, loading, showClear, inputRef }: CouponInputProps) {
  const canApply = value.trim() !== '' && !loading;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (canApply) onApply();
      }}
      className="flex items-stretch gap-2"
    >
      <label htmlFor="coupon-code" className="sr-only">
        Código do cupom
      </label>
      <TextField
        id="coupon-code"
        ref={inputRef}
        value={value}
        onChange={(event) => onChange(event.target.value.toUpperCase())}
        placeholder="Código do cupom"
        autoComplete="off"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        className="flex-1 uppercase"
      />
      {showClear ? (
        <Button type="button" variant="ghost" onClick={onClear}>
          Limpar
        </Button>
      ) : null}
      <Button type="submit" disabled={!canApply} className="min-w-[7.5rem]">
        {loading ? 'Aplicando…' : 'Aplicar'}
      </Button>
    </form>
  );
}
