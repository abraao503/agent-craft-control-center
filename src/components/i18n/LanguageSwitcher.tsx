import { ChevronDown, Globe2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SupportedLocale } from "@/i18n/index";
import { useAppLocale } from "@/i18n/LocaleProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  compact?: boolean;
  className?: string;
}

export function LanguageSwitcher({ compact = false, className = "" }: LanguageSwitcherProps) {
  const { t } = useTranslation();
  const { locale, setLocale } = useAppLocale();
  const options: Array<{ value: SupportedLocale; label: string }> = [
    { value: "pt-BR", label: t("common.portugueseBrazil") },
    { value: "es-ES", label: t("common.spanishSpain") },
  ];
  const selectedOption = options.find((option) => option.value === locale) ?? options[0];

  const handleLocaleChange = (nextLocale: string) => {
    if (nextLocale === "pt-BR" || nextLocale === "es-ES") {
      void setLocale(nextLocale);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`${t("common.language")}: ${selectedOption.label}`}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium text-foreground/80 outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            compact ? "h-9 w-9 shrink-0 p-0" : "h-9 max-w-[13rem] px-2.5",
            className,
          )}
        >
          <Globe2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          {compact ? (
            <span className="sr-only">{selectedOption.label}</span>
          ) : (
            <>
              <span className="truncate">{selectedOption.label}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden="true" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64 rounded-md border border-border bg-popover p-1.5 text-popover-foreground shadow-md"
      >
        <DropdownMenuRadioGroup value={locale} onValueChange={handleLocaleChange}>
          {options.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
              className="h-10 rounded-sm px-3 py-0 text-sm hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground data-[state=checked]:bg-accent data-[state=checked]:font-medium data-[state=checked]:text-accent-foreground data-[state=checked]:hover:bg-accent data-[state=checked]:hover:text-accent-foreground data-[state=checked]:focus:bg-accent data-[state=checked]:focus:text-accent-foreground [&>span:first-child]:hidden"
            >
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
