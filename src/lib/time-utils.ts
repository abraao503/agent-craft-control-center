export interface TimeValue {
  days: number;
  hours: number;
  minutes: number;
}

// Convert minutes to days, hours, minutes
export function minutesToTimeValue(minutes: number): TimeValue {
  const days = Math.floor(minutes / (24 * 60));
  const remainingMinutes = minutes % (24 * 60);
  const hours = Math.floor(remainingMinutes / 60);
  const mins = remainingMinutes % 60;
  
  return {
    days,
    hours,
    minutes: mins
  };
}

// Convert days, hours, minutes to total minutes
export function timeValueToMinutes(timeValue: TimeValue): number {
  return (
    timeValue.days * 24 * 60 +
    timeValue.hours * 60 +
    timeValue.minutes
  );
}
