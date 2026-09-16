const REDACTED_VALUE = "[REDACTED]";
const MAX_DEPTH = 4;
const MAX_STRING_LENGTH = 240;
const MAX_ARRAY_ITEMS = 20;
const MAX_OBJECT_KEYS = 40;

const SENSITIVE_KEY_PATTERN =
  /(?:authorization|cookie|set-cookie|access[_-]?token|refresh[_-]?token|id[_-]?token|token|secret|password|credential|api[_-]?key|access[_-]?key|client[_-]?secret|private[_-]?key|request[_-]?hash|hash|payload|body|raw|result|phone|email|prompt|instruction)/i;

const SENSITIVE_ASSIGNMENT_PATTERN =
  /((?:authorization|access[_-]?token|refresh[_-]?token|id[_-]?token|token|secret|password|credential|api[_-]?key|access[_-]?key|client[_-]?secret|private[_-]?key|request[_-]?hash|hash)\s*[:=]\s*)(["']?)([^"'\s,;}\]]+)/gi;

const SENSITIVE_QUERY_PARAMETER_PATTERN =
  /([?&](?:authorization|access[_-]?token|refresh[_-]?token|id[_-]?token|token|secret|password|credential|api[_-]?key|access[_-]?key|client[_-]?secret|private[_-]?key|request[_-]?hash)=)[^&#\s]+/gi;

const BEARER_TOKEN_PATTERN = /\bBearer\s+[^\s,;]+/gi;

export type SanitizedObservabilityValue =
  | string
  | number
  | boolean
  | null
  | SanitizedObservabilityValue[]
  | { [key: string]: SanitizedObservabilityValue };

export type HighlightMetadataValue = string | number | boolean;

/**
 * Removes credentials and limits diagnostic data before it reaches telemetry
 * or the operational UI. Unknown object values are kept only after recursive
 * key/value sanitization.
 */
export function sanitizeObservabilityValue(
  value: unknown,
  depth = 0,
): SanitizedObservabilityValue {
  if (value === null) return null;
  if (value === undefined) return "[UNAVAILABLE]";

  if (typeof value === "string") {
    return sanitizeObservabilityText(value);
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "boolean") return value;

  if (depth >= MAX_DEPTH) return "[TRUNCATED]";

  if (value instanceof Error) {
    return {
      name: sanitizeObservabilityText(value.name),
      message: sanitizeObservabilityText(value.message),
    };
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? "[INVALID_DATE]"
      : value.toISOString();
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_ARRAY_ITEMS)
      .map((item) => sanitizeObservabilityValue(item, depth + 1));
  }

  if (typeof value === "object") {
    const sanitized: Record<string, SanitizedObservabilityValue> = {};

    for (const [key, nestedValue] of Object.entries(value).slice(
      0,
      MAX_OBJECT_KEYS,
    )) {
      if (isSensitiveObservabilityKey(key)) continue;
      sanitized[key] = sanitizeObservabilityValue(nestedValue, depth + 1);
    }

    return sanitized;
  }

  return "[UNAVAILABLE]";
}

export function serializeObservabilityValue(
  value: unknown,
  maxLength = 1000,
): string {
  try {
    const serialized = JSON.stringify(sanitizeObservabilityValue(value));
    if (!serialized) return "[UNAVAILABLE]";
    if (serialized.length <= maxLength) return serialized;

    return `${serialized.slice(0, Math.max(0, maxLength - 1))}…`;
  } catch {
    return "[UNAVAILABLE]";
  }
}

export function sanitizeObservabilityText(
  value: unknown,
  maxLength = MAX_STRING_LENGTH,
): string {
  if (typeof value !== "string") return "";

  const sanitized = value
    .replace(BEARER_TOKEN_PATTERN, `Bearer ${REDACTED_VALUE}`)
    .replace(SENSITIVE_QUERY_PARAMETER_PATTERN, `$1${REDACTED_VALUE}`)
    .replace(SENSITIVE_ASSIGNMENT_PATTERN, `$1${REDACTED_VALUE}`);

  if (sanitized.length <= maxLength) return sanitized;
  return `${sanitized.slice(0, Math.max(0, maxLength - 1))}…`;
}

export function sanitizeObservabilityUrl(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "unknown";

  try {
    const parsed = new URL(value, "http://observability.invalid");
    return sanitizeObservabilityText(parsed.pathname || "/");
  } catch {
    return sanitizeObservabilityText(value.split(/[?#]/, 1)[0] || "unknown");
  }
}

export function getSafeObservabilityCode(value: unknown): string | undefined {
  const candidate =
    typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>).code
      : value;

  if (typeof candidate !== "string") return undefined;

  const normalized = candidate.trim();
  if (!/^[A-Za-z][A-Za-z0-9_.:-]{0,79}$/.test(normalized)) {
    return undefined;
  }

  return normalized.toUpperCase();
}

export function sanitizeHighlightMetadata(
  metadata: Record<string, unknown>,
): Record<string, HighlightMetadataValue> {
  const sanitized = sanitizeObservabilityValue(metadata);
  if (!isSanitizedObject(sanitized)) return {};

  return Object.fromEntries(
    Object.entries(sanitized).flatMap(([key, value]) => {
      if (value === null) return [];
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        return [[key, value]];
      }

      return [[key, serializeObservabilityValue(value, MAX_STRING_LENGTH)]];
    }),
  );
}

export function sanitizeHighlightStringMetadata(
  metadata: Record<string, unknown>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(sanitizeHighlightMetadata(metadata)).map(([key, value]) => [
      key,
      String(value),
    ]),
  );
}

export function getSafeObservabilityEntries(
  metadata: Record<string, unknown> | null | undefined,
): Array<{ key: string; value: string }> {
  if (!metadata) return [];

  const sanitized = sanitizeObservabilityValue(metadata);
  if (!isSanitizedObject(sanitized)) return [];

  return Object.entries(sanitized).map(([key, value]) => ({
    key,
    value:
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
        ? String(value)
        : serializeObservabilityValue(value, MAX_STRING_LENGTH),
  }));
}

function isSensitiveObservabilityKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERN.test(key);
}

function isSanitizedObject(
  value: SanitizedObservabilityValue,
): value is { [key: string]: SanitizedObservabilityValue } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
