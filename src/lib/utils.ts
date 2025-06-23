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

  return paragraphs;
}

/**
 * Remove all spaces and special characters from a given string.
 * 
 * @param {string} str - The string to be processed.
 * @returns {string} - The string with all spaces and special characters removed.
 */
export function removeAllSpacesAndSpecialChars(str: string) {
  return str.replace(/[^\w]/g, "");
}


export function isColorDark(hexColor: string): boolean {
  // Remove o # se existir
  const hex = hexColor.replace('#', '');
  
  // Converte hex para RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calcula a luminosidade (fórmula YIQ)
  // Esta fórmula leva em conta a percepção humana de luminosidade
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  
  // YIQ < 128 é considerado escuro
  return yiq < 128;
};