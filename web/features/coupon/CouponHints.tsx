import { Disclosure } from '@/components/ui';

interface CouponHintsProps {
  codes: string[];
  onSelect: (code: string) => void;
}

export function CouponHints({ codes, onSelect }: CouponHintsProps) {
  return (
    <Disclosure summary="Códigos para testar">
      <div className="flex flex-wrap gap-2">
        {codes.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => onSelect(code)}
            className="rounded-full border border-black/10 bg-white px-3 py-1 text-[12px] font-medium tabular-nums text-[#1d1d1f] transition-colors duration-150 hover:bg-black/5 motion-reduce:transition-none"
          >
            {code}
          </button>
        ))}
      </div>
    </Disclosure>
  );
}
