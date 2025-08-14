import React, { useState, useEffect } from "react";
import { TimeUnitPicker } from "@/components/ui/time-unit-picker";
import { TimeValue, minutesToTimeValue, timeValueToMinutes } from "@/lib/time-utils";

interface InactiveChatRangePickerProps {
  minValue: number;
  maxValue: number;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
  maxDays?: number;
  minTotalMinutes?: number;
}

export function InactiveChatRangePicker({
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  maxDays = 7,
  minTotalMinutes = 60,
}: InactiveChatRangePickerProps) {
  // Converter minutos para o formato de dias, horas e minutos
  const [minTimeValue, setMinTimeValue] = useState<TimeValue>(
    minutesToTimeValue(minValue || 60)
  );
  
  const [maxTimeValue, setMaxTimeValue] = useState<TimeValue>(
    minutesToTimeValue(maxValue || 120)
  );

  // Atualizar o campo quando o minTimeValue mudar
  const handleMinTimeValueChange = (newTimeValue: TimeValue) => {
    setMinTimeValue(newTimeValue);
    const totalMinutes = timeValueToMinutes(newTimeValue);
    onMinChange(totalMinutes);
  };
  
  // Atualizar o campo quando o maxTimeValue mudar
  const handleMaxTimeValueChange = (newTimeValue: TimeValue) => {
    setMaxTimeValue(newTimeValue);
    const totalMinutes = timeValueToMinutes(newTimeValue);
    onMaxChange(totalMinutes);
  };

  // Sincronizar quando os valores dos campos mudarem externamente
  useEffect(() => {
    setMinTimeValue(minutesToTimeValue(minValue || 60));
  }, [minValue]);
  
  useEffect(() => {
    setMaxTimeValue(minutesToTimeValue(maxValue || 120));
  }, [maxValue]);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1 block">Tempo mínimo</label>
        <TimeUnitPicker
          value={minTimeValue}
          onChange={handleMinTimeValueChange}
          maxDays={maxDays}
          minTotalMinutes={minTotalMinutes}
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Tempo máximo</label>
        <TimeUnitPicker
          value={maxTimeValue}
          onChange={handleMaxTimeValueChange}
          maxDays={maxDays}
          minTotalMinutes={minTotalMinutes}
        />
      </div>
    </div>
  );
}
