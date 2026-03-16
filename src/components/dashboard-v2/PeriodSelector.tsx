import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, ChevronDown } from "lucide-react";
import { PeriodPreset } from "@/types/dashboard-v2";

interface PeriodSelectorProps {
  value: PeriodPreset;
  onChange: (period: PeriodPreset) => void;
}

const PERIODS: { value: PeriodPreset; label: string }[] = [
  { value: "today", label: "Hoje" },
  { value: "yesterday", label: "Ontem" },
  { value: "last_7_days", label: "Últimos 7 dias" },
  { value: "last_30_days", label: "Últimos 30 dias" },
  { value: "this_month", label: "Este mês" },
  { value: "last_month", label: "Mês passado" },
  { value: "this_quarter", label: "Este trimestre" },
];

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const currentLabel =
    PERIODS.find((p) => p.value === value)?.label ?? "Últimos 30 dias";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Calendar className="h-4 w-4" />
          {currentLabel}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {PERIODS.map((period) => (
          <DropdownMenuItem
            key={period.value}
            onClick={() => onChange(period.value)}
            className={value === period.value ? "bg-accent" : ""}
          >
            {period.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
