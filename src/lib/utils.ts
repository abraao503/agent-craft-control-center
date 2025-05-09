import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function convertHtmlStringToText(htmlString: string) {
  return htmlString
    .replace(
      /<span[^>]*data-id="([^"]+)"[^>]*>.*?<\/span>/g,
      (_, nomeCampo) => `{get_${nomeCampo}()}`
    )
    .replace(/<\/?p>/g, ""); // Remove <p> e </p> se necessário
}

export function convertTextToHtmlString(text: string) {
  return text.replace(
    /\{get_([a-zA-Z0-9_]+)\(\)\}/g,
    (_, nomeCampo) =>
      `<span data-type="mention" data-id="${nomeCampo}" data-label="${nomeCampo}" class="mention">${nomeCampo}</span>`
  );
}
