import { useState, useCallback, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Repeat, Info, CalendarClock } from "lucide-react";
import {
  Recurrence,
  RecurrenceFrequency,
  MonthlyRule,
} from "@/types/deal-follow-up";
import { getRecurrenceDescription } from "./followUpUtils";

interface RecurrenceSelectorProps {
  value?: Recurrence;
  onChange: (value: Recurrence | undefined) => void;
  disabled?: boolean;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Dom", fullLabel: "Domingo" },
  { value: 1, label: "Seg", fullLabel: "Segunda-feira" },
  { value: 2, label: "Ter", fullLabel: "Terça-feira" },
  { value: 3, label: "Qua", fullLabel: "Quarta-feira" },
  { value: 4, label: "Qui", fullLabel: "Quinta-feira" },
  { value: 5, label: "Sex", fullLabel: "Sexta-feira" },
  { value: 6, label: "Sáb", fullLabel: "Sábado" },
];

const NTH_LABELS = [
  { value: 1, label: "1ª" },
  { value: 2, label: "2ª" },
  { value: 3, label: "3ª" },
  { value: 4, label: "4ª" },
  { value: 5, label: "5ª (última)" },
];

type MonthlyRuleType =
  | "MONTHLY_DAY"
  | "MONTHLY_NTH_WEEKDAY"
  | "MONTHLY_LAST_DAY";

function getIntervalLabel(
  frequency: RecurrenceFrequency,
  interval: number,
): string {
  if (interval === 1) {
    switch (frequency) {
      case "DAILY":
        return "dia";
      case "WEEKLY":
        return "semana";
      case "MONTHLY":
        return "mês";
    }
  }
  switch (frequency) {
    case "DAILY":
      return "dias";
    case "WEEKLY":
      return "semanas";
    case "MONTHLY":
      return "meses";
  }
}

export function RecurrenceSelector({
  value,
  onChange,
  disabled = false,
}: RecurrenceSelectorProps) {
  const [enabled, setEnabled] = useState(!!value);
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(
    value?.frequency ?? "DAILY",
  );
  const [interval, setInterval] = useState(value?.interval ?? 1);
  const [endAt, setEndAt] = useState(value?.endAt ?? "");

  // Weekly state
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    value?.frequency === "WEEKLY" ? value.rule.daysOfWeek : [1], // Default: Segunda
  );

  // Monthly state
  const [monthlyRuleType, setMonthlyRuleType] = useState<MonthlyRuleType>(
    value?.frequency === "MONTHLY" ? value.rule.type : "MONTHLY_DAY",
  );
  const [monthlyDay, setMonthlyDay] = useState(
    value?.frequency === "MONTHLY" && value.rule.type === "MONTHLY_DAY"
      ? value.rule.day
      : 1,
  );
  const [monthlyWeekday, setMonthlyWeekday] = useState(
    value?.frequency === "MONTHLY" && value.rule.type === "MONTHLY_NTH_WEEKDAY"
      ? value.rule.weekday
      : 1,
  );
  const [monthlyNth, setMonthlyNth] = useState(
    value?.frequency === "MONTHLY" && value.rule.type === "MONTHLY_NTH_WEEKDAY"
      ? value.rule.nth
      : 1,
  );
  const [invalidDatePolicy, setInvalidDatePolicy] = useState<
    "SKIP" | "LAST_DAY"
  >(
    value?.frequency === "MONTHLY" && value.invalidDatePolicy
      ? value.invalidDatePolicy
      : "LAST_DAY",
  );

  const buildRecurrence = useCallback((): Recurrence | undefined => {
    if (!enabled) return undefined;

    const base = {
      interval,
      ...(endAt ? { endAt } : {}),
    };

    switch (frequency) {
      case "DAILY":
        return { frequency: "DAILY", ...base };

      case "WEEKLY":
        return {
          frequency: "WEEKLY",
          ...base,
          rule: { type: "WEEKLY", daysOfWeek },
        };

      case "MONTHLY": {
        let rule: MonthlyRule;
        switch (monthlyRuleType) {
          case "MONTHLY_DAY":
            rule = { type: "MONTHLY_DAY", day: monthlyDay };
            break;
          case "MONTHLY_NTH_WEEKDAY":
            rule = {
              type: "MONTHLY_NTH_WEEKDAY",
              weekday: monthlyWeekday,
              nth: monthlyNth,
            };
            break;
          case "MONTHLY_LAST_DAY":
            rule = { type: "MONTHLY_LAST_DAY" };
            break;
        }
        return {
          frequency: "MONTHLY",
          ...base,
          rule,
          ...(monthlyRuleType === "MONTHLY_DAY" && monthlyDay > 28
            ? { invalidDatePolicy }
            : {}),
        };
      }
    }
  }, [
    enabled,
    frequency,
    interval,
    endAt,
    daysOfWeek,
    monthlyRuleType,
    monthlyDay,
    monthlyWeekday,
    monthlyNth,
    invalidDatePolicy,
  ]);

  // Emit changes whenever config changes
  useEffect(() => {
    onChange(buildRecurrence());
  }, [buildRecurrence]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    if (!checked) {
      onChange(undefined);
    }
  };

  const handleDayOfWeekToggle = (day: number) => {
    setDaysOfWeek((prev) => {
      if (prev.includes(day)) {
        // Não permitir desmarcar todos
        if (prev.length === 1) return prev;
        return prev.filter((d) => d !== day);
      }
      return [...prev, day].sort();
    });
  };

  // Minimum date for end recurrence
  const getMinEndDate = () => {
    const now = new Date();
    now.setDate(now.getDate() + 1);
    return now.toISOString().split("T")[0];
  };

  const currentRecurrence = buildRecurrence();

  return (
    <div className="space-y-4">
      {/* Toggle de recorrência */}
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="flex items-center gap-2">
          <Repeat className="h-4 w-4 text-muted-foreground" />
          <Label
            htmlFor="recurrence-toggle"
            className="cursor-pointer font-medium"
          >
            Repetir envio
          </Label>
        </div>
        <Switch
          id="recurrence-toggle"
          checked={enabled}
          onCheckedChange={handleToggle}
          disabled={disabled}
        />
      </div>

      {enabled && (
        <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
          {/* Frequência + Intervalo */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Frequência</Label>
              <Select
                value={frequency}
                onValueChange={(v) => setFrequency(v as RecurrenceFrequency)}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">Diário</SelectItem>
                  <SelectItem value="WEEKLY">Semanal</SelectItem>
                  <SelectItem value="MONTHLY">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>A cada</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={frequency === "DAILY" ? 365 : 12}
                  value={interval}
                  onChange={(e) =>
                    setInterval(Math.max(1, parseInt(e.target.value) || 1))
                  }
                  disabled={disabled}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">
                  {getIntervalLabel(frequency, interval)}
                </span>
              </div>
            </div>
          </div>

          {/* Opções Semanais */}
          {frequency === "WEEKLY" && (
            <div className="space-y-2">
              <Label>Dias da semana</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = daysOfWeek.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => handleDayOfWeekToggle(day.value)}
                      disabled={disabled}
                      className={`
                        inline-flex h-9 w-11 items-center justify-center rounded-md text-sm font-medium
                        transition-colors border
                        ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-input hover:bg-accent hover:text-accent-foreground"
                        }
                        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                      `}
                      title={day.fullLabel}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Opções Mensais */}
          {frequency === "MONTHLY" && (
            <div className="space-y-2">
              <Label>Repetir no</Label>
              <Select
                value={monthlyRuleType}
                onValueChange={(v) => setMonthlyRuleType(v as MonthlyRuleType)}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY_DAY">
                    Dia específico do mês
                  </SelectItem>
                  <SelectItem value="MONTHLY_NTH_WEEKDAY">
                    Dia da semana específico
                  </SelectItem>
                  <SelectItem value="MONTHLY_LAST_DAY">
                    Último dia do mês
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Dia específico do mês */}
              {monthlyRuleType === "MONTHLY_DAY" && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">No dia</span>
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      value={monthlyDay}
                      onChange={(e) =>
                        setMonthlyDay(
                          Math.min(
                            31,
                            Math.max(1, parseInt(e.target.value) || 1),
                          ),
                        )
                      }
                      disabled={disabled}
                      className="w-16 h-8"
                    />
                    <span className="text-muted-foreground">de cada mês</span>
                  </div>

                  {/* Aviso para dias > 28 */}
                  {monthlyDay > 28 && (
                    <div className="flex items-start gap-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-2">
                      <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                      <div className="space-y-1">
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                          Nem todos os meses possuem o dia {monthlyDay}.
                        </p>
                        <Select
                          value={invalidDatePolicy}
                          onValueChange={(v) =>
                            setInvalidDatePolicy(v as "SKIP" | "LAST_DAY")
                          }
                          disabled={disabled}
                        >
                          <SelectTrigger className="h-7 text-sm w-auto">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LAST_DAY">
                              Enviar no último dia do mês
                            </SelectItem>
                            <SelectItem value="SKIP">Pular o mês</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Nth weekday do mês — frase contínua legível */}
              {monthlyRuleType === "MONTHLY_NTH_WEEKDAY" && (
                <div className="flex items-center gap-2 flex-wrap text-sm pt-1">
                  <span className="text-muted-foreground">Na</span>
                  <Select
                    value={String(monthlyNth)}
                    onValueChange={(v) => setMonthlyNth(parseInt(v))}
                    disabled={disabled}
                  >
                    <SelectTrigger className="h-8 w-[110px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NTH_LABELS.map((nth) => (
                        <SelectItem key={nth.value} value={String(nth.value)}>
                          {nth.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={String(monthlyWeekday)}
                    onValueChange={(v) => setMonthlyWeekday(parseInt(v))}
                    disabled={disabled}
                  >
                    <SelectTrigger className="h-8 w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day) => (
                        <SelectItem key={day.value} value={String(day.value)}>
                          {day.fullLabel}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-muted-foreground">de cada mês</span>
                </div>
              )}
            </div>
          )}

          {/* Data final */}
          <div className="space-y-2">
            <Label>Repetir até (opcional)</Label>
            <Input
              type="date"
              value={endAt ? endAt.split("T")[0] : ""}
              min={getMinEndDate()}
              onChange={(e) =>
                setEndAt(
                  e.target.value ? new Date(e.target.value).toISOString() : "",
                )
              }
              disabled={disabled}
              className="w-auto"
            />
            <p className="text-xs text-muted-foreground">
              Deixe em branco para repetir indefinidamente.
            </p>
          </div>

          {/* Resumo visual — rodapé informativo */}
          {currentRecurrence && (
            <div className="flex items-center gap-2 rounded-md bg-muted/60 px-3 py-2 text-sm font-medium">
              <CalendarClock className="h-3.5 w-3.5 shrink-0" />
              <span>{getRecurrenceDescription(currentRecurrence)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
