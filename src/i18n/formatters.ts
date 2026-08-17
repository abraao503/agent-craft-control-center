import { format, formatDistanceToNow } from "date-fns";
import { enUS, es, ptBR } from "date-fns/locale";
import { SupportedLocale } from "./index";

export const dateFnsLocales = { "pt-BR": ptBR, "en-US": enUS, "es-ES": es } as const;

export function getDateFnsLocale(locale: SupportedLocale) {
  return dateFnsLocales[locale];
}

export function formatDateLocalized(
  value: Date | string | number,
  locale: SupportedLocale,
  pattern = "P",
) {
  return format(new Date(value), pattern, { locale: getDateFnsLocale(locale) });
}

export function formatRelativeLocalized(
  value: Date | string | number,
  locale: SupportedLocale,
) {
  return formatDistanceToNow(new Date(value), {
    addSuffix: true,
    locale: getDateFnsLocale(locale),
  });
}

export function formatNumberLocalized(
  value: number,
  locale: SupportedLocale,
  options?: Intl.NumberFormatOptions,
) {
  return new Intl.NumberFormat(locale, options).format(value);
}

export function formatCurrencyLocalized(
  value: number,
  locale: SupportedLocale,
  currency = "BRL",
) {
  return formatNumberLocalized(value, locale, {
    style: "currency",
    currency,
  });
}
