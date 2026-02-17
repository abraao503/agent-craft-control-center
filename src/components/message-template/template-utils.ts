/**
 * Available template variables for message templates.
 * `id` is the internal key used in the API as {{customer.<id>}}.
 * `displayLabel` is the friendly label shown to the user (without braces).
 */
export const TEMPLATE_VARIABLES = [
  { id: "firstName", displayLabel: "NOME", apiKey: "firstName" },
  { id: "name", displayLabel: "NOME COMPLETO", apiKey: "name" },
  { id: "email", displayLabel: "EMAIL", apiKey: "email" },
] as const;

export type TemplateVariable = (typeof TEMPLATE_VARIABLES)[number];

/** Map from variable id to friendly display label */
const DISPLAY_LABELS: Record<string, string> = Object.fromEntries(
  TEMPLATE_VARIABLES.map((v) => [v.id, v.displayLabel]),
);

/** Get the friendly display label for a variable id, fallback to id itself */
export function getVariableDisplayLabel(id: string): string {
  return DISPLAY_LABELS[id] || id;
}

/**
 * Convert editor HTML to plain text with `{{customer.xxx}}` placeholders for the API.
 */
export function templateHtmlToApiText(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;

  // Replace template variable spans with {{customer.xxx}}
  div.querySelectorAll("span[data-type='template-variable']").forEach((el) => {
    const id = el.getAttribute("data-id") || el.getAttribute("data-label");
    const textNode = document.createTextNode(`{{customer.${id}}}`);
    el.replaceWith(textNode);
  });

  // Convert paragraphs to text with line breaks
  const paragraphs = div.querySelectorAll("p");
  if (paragraphs.length === 0) return div.textContent || "";

  return Array.from(paragraphs)
    .map((p) => p.textContent || "")
    .join("\n");
}

/**
 * Convert API text with `{{customer.xxx}}` to editor-compatible HTML.
 */
export function apiTextToTemplateHtml(text: string): string {
  if (!text) return "<p></p>";

  const lines = text.split("\n");
  return lines
    .map((line) => {
      const escaped = line
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      // Replace {{customer.xxx}} with template variable spans
      const withVars = escaped.replace(
        /\{\{customer\.(\w+)\}\}/g,
        (_match, key) => {
          const display = getVariableDisplayLabel(key);
          return `<span data-type="template-variable" data-id="${key}" data-label="${key}">${display}</span>`;
        },
      );

      return `<p>${withVars || "<br>"}</p>`;
    })
    .join("");
}

/**
 * Split API text into segments of plain text and template variables.
 * Useful for rendering highlighted variables in read-only contexts.
 */
export function parseTemplateSegments(
  text: string,
): Array<{ type: "text" | "variable"; value: string }> {
  const segments: Array<{ type: "text" | "variable"; value: string }> = [];
  const regex = /\{\{customer\.(\w+)\}\}/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        value: text.slice(lastIndex, match.index),
      });
    }
    segments.push({ type: "variable", value: match[1] });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }

  return segments;
}
