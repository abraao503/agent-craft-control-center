import React from "react";
import { cn } from "@/lib/utils";
import { Label } from "./label";
import { Input } from "./input";
import { TimeValue } from "@/lib/time-utils";

interface TimeUnitPickerProps {
  value: TimeValue;
  onChange: (value: TimeValue) => void;
  maxDays?: number;
  minTotalMinutes?: number;
  className?: string;
}

export function TimeUnitPicker({
  value,
  onChange,
  maxDays = 7,
  minTotalMinutes = 60, // 1 hour default minimum
  className,
}: TimeUnitPickerProps) {
  // Helper to validate and update values
  const updateValue = (field: keyof TimeValue, newValue: number) => {
    const updatedValue = { ...value, [field]: newValue };
    
    // Calculate total minutes for validation
    const totalMinutes = 
      updatedValue.days * 24 * 60 + 
      updatedValue.hours * 60 + 
      updatedValue.minutes;
    
    // Apply constraints
    if (updatedValue.days > maxDays) {
      updatedValue.days = maxDays;
    }
    
    if (totalMinutes < minTotalMinutes) {
      // If total is less than minimum, adjust hours to meet minimum
      const minHours = Math.ceil(minTotalMinutes / 60);
      if (updatedValue.days === 0 && updatedValue.hours < minHours) {
        updatedValue.hours = minHours;
        updatedValue.minutes = 0;
      }
    }
    
    onChange(updatedValue);
  };

  return (
    <div className={cn("flex flex-col space-y-2", className)}>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label htmlFor="days">Dias</Label>
          <Input
            id="days"
            type="number"
            min={0}
            max={maxDays}
            value={value.days}
            onChange={(e) => updateValue("days", Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full"
          />
        </div>
        
        <div>
          <Label htmlFor="hours">Horas</Label>
          <Input
            id="hours"
            type="number"
            min={0}
            max={23}
            value={value.hours}
            onChange={(e) => updateValue("hours", Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full"
          />
        </div>
        
        <div>
          <Label htmlFor="minutes">Minutos</Label>
          <Input
            id="minutes"
            type="number"
            min={0}
            max={59}
            value={value.minutes}
            onChange={(e) => updateValue("minutes", Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full"
          />
        </div>
      </div>
      
      {/* Helper text */}
      <p className="text-xs text-muted-foreground">
        Mínimo: 1 hora. Máximo: 7 dias.
      </p>
    </div>
  );
}


