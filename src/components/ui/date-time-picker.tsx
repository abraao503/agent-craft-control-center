import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState, useEffect } from "react";
import { Input } from "./input";
import { Label } from "./label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

interface DateTimePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  placeholder?: string;
}

export function DateTimePicker({ date, setDate, placeholder }: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(date);
  const [time, setTime] = useState<string>(
    date ? format(date, "HH:mm") : "00:00"
  );
  
  // Atualizar o estado interno quando a prop date mudar externamente
  useEffect(() => {
    setSelectedDate(date);
    if (date) {
      setTime(format(date, "HH:mm"));
    }
  }, [date]);

  const handleTimeChange = (value: string) => {
    setTime(value);
    
    if (selectedDate && value && value.includes(":")) {
      const [hoursStr, minutesStr] = value.split(":");
      
      // Validar se os valores são números válidos
      const hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr, 10);
      
      if (!isNaN(hours) && !isNaN(minutes)) {
        const newDate = new Date(selectedDate);
        newDate.setHours(hours, minutes);
        setDate(newDate);
      }
    }
  };

  const handleDateChange = (newDate: Date | undefined) => {
    setSelectedDate(newDate);
    
    if (newDate && time && time.includes(":")) {
      const [hoursStr, minutesStr] = time.split(":");
      
      // Validar se os valores são números válidos
      const hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr, 10);
      
      if (!isNaN(hours) && !isNaN(minutes)) {
        const dateWithTime = new Date(newDate);
        dateWithTime.setHours(hours, minutes);
        setDate(dateWithTime);
      } else {
        setDate(newDate); // Usa apenas a data se a hora for inválida
      }
    } else if (newDate) {
      setDate(newDate); // Usa apenas a data se não houver hora definida
    } else {
      setDate(undefined);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date
            ? format(date, "PPP", { locale: ptBR }) + " " + format(date, "HH:mm")
            : placeholder || "Selecione data e hora"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Tabs defaultValue="date">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="date">Data</TabsTrigger>
            <TabsTrigger value="time">Hora</TabsTrigger>
          </TabsList>
          <TabsContent value="date" className="p-0">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateChange}
              initialFocus
              locale={ptBR}
            />
          </TabsContent>
          <TabsContent value="time" className="p-4">
            <div className="space-y-2">
              <Label htmlFor="time">Hora</Label>
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
