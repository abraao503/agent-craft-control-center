import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, ChevronDown } from "lucide-react";
import { PeriodPreset } from "@/types/dashboard-v2";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const periods: { value: PeriodPreset; label: string }[] = [
    { value: "today", label: t("dashboard.today") },
    { value: "yesterday", label: t("dashboard.yesterday") },
    { value: "last_7_days", label: t("dashboard.last7Days") },
    { value: "last_30_days", label: t("dashboard.last30Days") },
    { value: "this_month", label: t("dashboard.thisMonth") },
    { value: "last_month", label: t("dashboard.lastMonth") },
    { value: "this_quarter", label: t("dashboard.thisQuarter") },
  ];
  const currentLabel =
    periods.find((p) => p.value === value)?.label ?? t("dashboard.last30Days");

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
        {periods.map((period) => (
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
