import { describe, it, expect, vi } from 'vitest';
import { useRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CouponInput } from '@/features/coupon/CouponInput';

function Harness({ onApply = () => {}, loading = false }: { onApply?: () => void; loading?: boolean }) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <CouponInput
      value={value}
      onChange={setValue}
      onApply={onApply}
      onClear={() => setValue('')}
      loading={loading}
      showClear={false}
      inputRef={inputRef}
    />
  );
}

describe('CouponInput', () => {
  it('exibe o valor em maiusculas ao digitar', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText('Código do cupom') as HTMLInputElement;
    await user.type(input, 'lanc10');
    expect(input.value).toBe('LANC10');
  });

  it('habilita Aplicar somente quando ha texto', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const apply = screen.getByRole('button', { name: 'Aplicar' });
    expect(apply).toBeDisabled();
    await user.type(screen.getByLabelText('Código do cupom'), 'X');
    expect(apply).toBeEnabled();
  });

  it('dispara onApply ao submeter', async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    render(<Harness onApply={onApply} />);
    await user.type(screen.getByLabelText('Código do cupom'), 'LANC10');
    await user.click(screen.getByRole('button', { name: 'Aplicar' }));
    expect(onApply).toHaveBeenCalledOnce();
  });

  it('troca o rotulo do botao no loading (sem spinner)', () => {
    render(<Harness loading />);
    expect(screen.getByRole('button', { name: 'Aplicando…' })).toBeInTheDocument();
  });
});
