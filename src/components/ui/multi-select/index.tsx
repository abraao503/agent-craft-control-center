import React, { useState, useRef } from "react";
import { Check, ChevronsUpDown, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export type Option = {
  value: string;
  label: string;
  color?: string;
  [key: string]: string | number | boolean | undefined;
};

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  renderOption?: (option: Option) => React.ReactNode;
  renderSelection?: (selected: Option[]) => React.ReactNode;
  onOpenChange?: (open: boolean) => void;
  onCreate?: (value: string) => void;
  onSearchChange?: (value: string) => void;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Selecione opções...",
  className,
  renderOption,
  renderSelection,
  onOpenChange,
  onCreate,
  onSearchChange,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);
    if (!newOpen) {
      setSearchValue("");
      onSearchChange?.("");
    }
  };

  // Mapear os IDs selecionados para objetos de opção completos
  const selectedOptions = selected
    .map((value) => options.find((option) => option.value === value))
    .filter((option): option is Option => !!option);

  const handleSelect = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleRemove = (value: string) => {
    onChange(selected.filter((item) => item !== value));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Backspace" && !searchValue && selected.length > 0) {
      onChange(selected.slice(0, -1));
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          ref={buttonRef}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between text-left font-normal",
            selected.length > 0 ? "h-auto" : "h-10",
            className
          )}
          onClick={() => handleOpenChange(!open)}
        >
          <div className="flex flex-wrap gap-1 py-1">
            {selected.length > 0 ? (
              renderSelection ? (
                renderSelection(selectedOptions)
              ) : (
                <div className="flex flex-wrap gap-1">
                  {selectedOptions.map((option) => (
                    <Badge
                      key={option.value}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {option.label}
                      <button
                        type="button"
                        className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemove(option.value);
                        }}
                      >
                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                        <span className="sr-only">Remover {option.label}</span>
                      </button>
                    </Badge>
                  ))}
                </div>
              )
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command onKeyDown={handleKeyDown}>
          <CommandInput
            placeholder="Pesquisar ou criar tags..."
            value={searchValue}
            onValueChange={(val) => {
              setSearchValue(val);
              onSearchChange?.(val);
            }}
          />
          <CommandList>
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selected.includes(option.value)
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {renderOption ? (
                      renderOption(option)
                    ) : (
                      <span>{option.label}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            {onCreate && searchValue && !options.some((o) => o.label.toLowerCase() === searchValue.toLowerCase()) && (
              <CommandGroup>
                <CommandItem
                  value={searchValue}
                  onSelect={(val) => {
                     // Not using val because of lucide lowercase transformation issues sometimes, using exact searchValue
                     onCreate(searchValue);
                     // Clear state is done externally or here, but popover stays open when adding. We manually handle it in the callback
                  }}
                  className="cursor-pointer border border-dashed hover:bg-muted font-medium"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Criar tag "{searchValue}"
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
