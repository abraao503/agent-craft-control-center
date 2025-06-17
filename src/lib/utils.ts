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
    .replace(/<\/p>\s*<p>/gi, "\n") // Converte </p><p> em \n
    .replace(/<\/?p>/gi, "") // Remove tags <p> e </p> restantes
    .trim();
}

export function convertTextToHtmlString(text: string) {
  // Primeiro substitui os campos personalizados
  console.log("convertTextToHtmlString", text);

  const withSpans = text.replace(
    /\{get_([a-zA-Z0-9_]+)\(\)\}/g,
    (_, nomeCampo) =>
      `<span data-type="mention" data-id="${nomeCampo}" data-label="${nomeCampo}" class="mention">${nomeCampo}</span>`
  );

  // Divide por quebras de linha e converte cada linha em <p>...</p> ou <p></p> se vazia
  const paragraphs = withSpans
    .split("\n")
    .map((line) => (line.trim() === "" ? "<p></p>" : `<p>${line}</p>`))
    .join("");

  console.log("convertTextToHtmlString result", paragraphs);

  return paragraphs;
}

export function removeAllSpacesAndSpecialChars(str: string) {
  return str.replace(/[^\w]/g, "");
}
