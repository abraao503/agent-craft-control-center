import {
  getSafeObservabilityCode,
  sanitizeObservabilityText,
  sanitizeObservabilityUrl,
  serializeObservabilityValue,
} from "@/services/observability/sanitizeObservability";

const unsafeDiagnostic = {
  providerCredential: "credential-for-test",
  nested: {
    authorization: "Bearer secret-token",
    safeStatus: "READY",
  },
  requestHash: "internal-hash",
};

function observabilitySanitizationContract(): void {
  const serialized = serializeObservabilityValue(unsafeDiagnostic);

  if (serialized.includes("credential-for-test")) {
    throw new Error("Credenciais não podem aparecer na telemetria");
  }
  if (serialized.includes("secret-token") || serialized.includes("internal-hash")) {
    throw new Error("Segredos internos não podem aparecer na telemetria");
  }
  if (!serialized.includes("safeStatus")) {
    throw new Error("Metadados operacionais seguros devem ser preservados");
  }
  if (sanitizeObservabilityUrl("/operation?token=secret&status=READY") !== "/operation") {
    throw new Error("URLs observadas não podem transportar query params");
  }
  if (getSafeObservabilityCode({ message: "texto livre" }) !== undefined) {
    throw new Error("Somente códigos explícitos devem ser observados");
  }
  if (sanitizeObservabilityText("x".repeat(300)).length > 240) {
    throw new Error("Textos observados devem ser limitados");
  }
}

void observabilitySanitizationContract;
