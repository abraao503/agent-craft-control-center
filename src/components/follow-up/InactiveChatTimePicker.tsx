import React, { useState, useEffect } from "react";
import { TimeUnitPicker } from "@/components/ui/time-unit-picker";
import { TimeValue, minutesToTimeValue, timeValueToMinutes } from "@/lib/time-utils";

interface InactiveChatTimePickerProps {
  value: number;
  onChange: (value: number) => void;
  maxDays?: number;
  minTotalMinutes?: number;
}

export function InactiveChatTimePicker({
  value,
  onChange,
  maxDays = 7,
  minTotalMinutes = 60,
}: InactiveChatTimePickerProps) {
  // Converter minutos para o formato de dias, horas e minutos
  const [timeValue, setTimeValue] = useState<TimeValue>(
    minutesToTimeValue(value || 60)
  );

  // Atualizar o campo quando o timeValue mudar
  const handleTimeValueChange = (newTimeValue: TimeValue) => {
    setTimeValue(newTimeValue);
    const totalMinutes = timeValueToMinutes(newTimeValue);
    onChange(totalMinutes);
  };

  // Sincronizar quando o valor do campo mudar externamente
  useEffect(() => {
    setTimeValue(minutesToTimeValue(value || 60));
  }, [value]);

  return (
    <TimeUnitPicker
      value={timeValue}
      onChange={handleTimeValueChange}
      maxDays={maxDays}
      minTotalMinutes={minTotalMinutes}
    />
  );
}
