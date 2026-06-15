import * as React from "react";
import { ChevronsUpDown, CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

export type Currency = {
  code: string;
  name: string;
  symbol: string;
};

export const CURRENCIES: Currency[] = [
  { code: "BRL", name: "Real Brasileiro", symbol: "R$" },
  { code: "USD", name: "Dólar Americano", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "Libra Esterlina", symbol: "£" },
  { code: "ARS", name: "Peso Argentino", symbol: "$" },
  { code: "CLP", name: "Peso Chileno", symbol: "$" },
  { code: "COP", name: "Peso Colombiano", symbol: "$" },
  { code: "MXN", name: "Peso Mexicano", symbol: "$" },
  { code: "PEN", name: "Sol Peruano", symbol: "S/" },
  { code: "UYU", name: "Peso Uruguaio", symbol: "$" },
  { code: "PYG", name: "Guarani Paraguaio", symbol: "₲" },
  { code: "BOB", name: "Boliviano", symbol: "Bs." },
  { code: "VEF", name: "Bolívar Venezuelano", symbol: "Bs.F" },
  { code: "JPY", name: "Iene Japonês", symbol: "¥" },
  { code: "CNY", name: "Yuan Chinês", symbol: "¥" },
  { code: "CAD", name: "Dólar Canadense", symbol: "$" },
  { code: "AUD", name: "Dólar Australiano", symbol: "$" },
  { code: "CHF", name: "Franco Suíço", symbol: "Fr" },
];

/**
 * Formata centavos (inteiro) para exibição.
 * 5 → "0,05" | 510 → "5,10" | 100050 → "1.000,50"
 */
export function formatCents(cents: number): string {
  const intPart = Math.floor(cents / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const decPart = String(cents % 100).padStart(2, "0");
  return `${intPart},${decPart}`;
}

/** Centavos → float: 510 → 5.10 */
export function centsToNumber(cents: number): number {
  return cents / 100;
}

/** Float → centavos: 5.10 → 510 */
export function numberToCents(value: number): number {
  return Math.round(value * 100);
}

// ─── CurrencySelect ───────────────────────────────────────────────────────────

type CurrencySelectProps = {
  value: string;
  onChange: (currency: string) => void;
  disabled?: boolean;
};

const CurrencySelect = ({ value, onChange, disabled }: CurrencySelectProps) => {
  const [open, setOpen] = React.useState(false);
  const selected = CURRENCIES.find((c) => c.code === value) ?? CURRENCIES[0];

  return (
    <Popover open={open} modal onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="flex gap-1 rounded-e-none rounded-s-lg border-r-0 px-3 focus:z-10 min-w-[72px]"
        >
          <span className="text-xs font-medium">{selected.code}</span>
          <ChevronsUpDown
            className={cn(
              "-mr-2 size-4 opacity-50",
              disabled ? "hidden" : "opacity-100",
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0">
        <Command>
          <CommandInput placeholder="Buscar moeda..." />
          <CommandList>
            <CommandEmpty>Moeda não encontrada.</CommandEmpty>
            <CommandGroup>
              {CURRENCIES.map((c) => (
                <CommandItem
                  key={c.code}
                  value={`${c.code} ${c.name}`}
                  onSelect={() => {
                    onChange(c.code);
                    setOpen(false);
                  }}
                  className="gap-2"
                >
                  <span className="w-8 text-xs font-medium text-muted-foreground">
                    {c.symbol}
                  </span>
                  <span className="flex-1 text-sm">{c.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {c.code}
                  </span>
                  <CheckIcon
                    className={cn(
                      "ml-auto size-4",
                      c.code === value ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

// ─── CurrencyInput ────────────────────────────────────────────────────────────

export type CurrencyInputProps = {
  /** Valor numérico bruto (ex: 1234.56) */
  numericValue: number | undefined;
  /** Código da moeda (ex: "BRL") */
  currency: string;
  onNumericValueChange: (value: number | undefined) => void;
  onCurrencyChange: (currency: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
};

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      numericValue,
      currency,
      onNumericValueChange,
      onCurrencyChange,
      onBlur,
      disabled,
      placeholder = "0,00",
      className,
    },
    ref,
  ) => {
    // Armazena internamente em centavos (inteiro) para a lógica de "dígito pela direita"
    const [cents, setCents] = React.useState<number>(() =>
      numericValue != null ? numberToCents(numericValue) : 0,
    );

    // Sincroniza quando o valor externo muda (carregamento inicial / reset externo)
    const prevExternalRef = React.useRef<number | undefined>(numericValue);
    React.useEffect(() => {
      // Só sincroniza se o valor externo mudou de fora (não por digitação do usuário)
      const externalCents =
        numericValue != null ? numberToCents(numericValue) : 0;
      if (prevExternalRef.current !== numericValue) {
        prevExternalRef.current = numericValue;
        setCents(externalCents);
      }
    }, [numericValue]);

    const displayValue = cents === 0 ? "" : formatCents(cents);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        e.preventDefault();
        const next = Math.floor(cents / 10);
        setCents(next);
        onNumericValueChange(next === 0 ? undefined : centsToNumber(next));
        return;
      }

      if (e.key === "Delete") {
        e.preventDefault();
        setCents(0);
        onNumericValueChange(undefined);
        return;
      }

      // Ignora tudo que não seja dígito
      if (!/^\d$/.test(e.key)) return;

      e.preventDefault();
      // Limita a ~99.999.999.999,99
      if (cents >= 9_999_999_999_99) return;

      const next = cents * 10 + parseInt(e.key, 10);
      setCents(next);
      onNumericValueChange(centsToNumber(next));
    };

    return (
      <div className={cn("flex", className)}>
        <CurrencySelect
          value={currency}
          onChange={onCurrencyChange}
          disabled={disabled}
        />
        <Input
          ref={ref}
          inputMode="numeric"
          value={displayValue}
          // onChange é necessário para evitar warning do React em inputs controlados;
          // toda a lógica de edição fica em onKeyDown.
          onChange={() => undefined}
          onKeyDown={handleKeyDown}
          onBlur={onBlur}
          disabled={disabled}
          placeholder={placeholder}
          className="rounded-e-lg rounded-s-none"
        />
      </div>
    );
  },
);
CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
