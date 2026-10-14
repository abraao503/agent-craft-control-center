import { Copy, ExternalLink, Phone } from "lucide-react";
import { useState } from "react";

type TemplateButton = {
  type?: string;
  text?: string;
  url?: string;
  phoneNumber?: string;
  code?: string;
};

type TemplateSnapshot = {
  header?: string | null;
  body?: string | null;
  footer?: string | null;
  buttons?: TemplateButton[];
};

function readSnapshot(value: unknown): TemplateSnapshot | null {
  if (!value || typeof value !== "object") return null;

  const snapshot = value as Record<string, unknown>;
  const buttons = Array.isArray(snapshot.buttons)
    ? snapshot.buttons.filter(
        (button): button is TemplateButton =>
          Boolean(button && typeof button === "object"),
      )
    : [];

  return {
    header: typeof snapshot.header === "string" ? snapshot.header : null,
    body: typeof snapshot.body === "string" ? snapshot.body : null,
    footer: typeof snapshot.footer === "string" ? snapshot.footer : null,
    buttons,
  };
}

export function TemplateMessage({
  snapshot: rawSnapshot,
  fallbackBody,
}: {
  snapshot?: unknown;
  fallbackBody: string;
}) {
  const snapshot = readSnapshot(rawSnapshot);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!snapshot || (!snapshot.header && !snapshot.body && !snapshot.footer)) {
    return <p className="whitespace-pre-wrap break-words">{fallbackBody}</p>;
  }

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode(null), 1500);
    } catch {
      // Clipboard permissions are optional; the code remains visible.
    }
  };

  return (
    <div className="space-y-2">
      {snapshot.header ? (
        <p className="font-semibold whitespace-pre-wrap break-words">
          {snapshot.header}
        </p>
      ) : null}
      {snapshot.body ? (
        <p className="whitespace-pre-wrap break-words">{snapshot.body}</p>
      ) : null}
      {snapshot.footer ? (
        <p className="text-xs opacity-70 whitespace-pre-wrap break-words">
          {snapshot.footer}
        </p>
      ) : null}
      {snapshot.buttons?.length ? (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {snapshot.buttons.map((button, index) => {
            const type = String(button.type ?? "").toUpperCase();
            const label = button.text ||
              (type === "COPY_CODE" ? "Copiar código" : "Opção");

            if (type === "URL" && button.url) {
              return (
                <a
                  key={`${type}-${index}`}
                  href={button.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium underline-offset-2 hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  {label}
                </a>
              );
            }

            if (type === "PHONE_NUMBER" && button.phoneNumber) {
              return (
                <a
                  key={`${type}-${index}`}
                  href={`tel:${button.phoneNumber}`}
                  className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium underline-offset-2 hover:underline"
                >
                  <Phone className="h-3 w-3" />
                  {label}
                </a>
              );
            }

            if (type === "COPY_CODE" && button.code) {
              return (
                <button
                  key={`${type}-${index}`}
                  type="button"
                  onClick={() => void copyCode(button.code!)}
                  className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <Copy className="h-3 w-3" />
                  {copiedCode === button.code ? "Copiado" : `${label}: ${button.code}`}
                </button>
              );
            }

            return (
              <span
                key={`${type}-${index}`}
                className="inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium"
              >
                {label}
              </span>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
