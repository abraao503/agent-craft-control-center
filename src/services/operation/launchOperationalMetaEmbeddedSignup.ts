import { StartOperationalMetaOnboardingData } from "@/types/operation-channels";

type MetaLoginResponse = {
  status?: string;
  authResponse?: {
    code?: string;
  };
};

type MetaFacebookSdk = {
  init: (options: {
    appId: string;
    cookie: boolean;
    xfbml: boolean;
    version: string;
  }) => void;
  login: (
    callback: (response: MetaLoginResponse) => void,
    options: {
      config_id: string;
      response_type: "code";
      override_default_response_type: boolean;
      state: string;
      extras: {
        feature: "whatsapp_embedded_signup";
        sessionInfoVersion: "3";
      };
    },
  ) => void;
};

type EmbeddedSignupMessage = {
  type?: string;
  event?: string;
  data?: {
    waba_id?: unknown;
    phone_number_id?: unknown;
  };
};

export type OperationalMetaEmbeddedSignupResult = {
  code: string;
  wabaId: string;
  phoneNumberId: string;
};

export class OperationalMetaEmbeddedSignupError extends Error {
  constructor(
    readonly code:
      | "CANCELLED"
      | "SDK_UNAVAILABLE"
      | "INVALID_RESULT"
      | "SDK_FAILED",
  ) {
    super(code);
    this.name = "OperationalMetaEmbeddedSignupError";
  }
}

declare global {
  interface Window {
    FB?: MetaFacebookSdk;
    fbAsyncInit?: () => void;
  }
}

const SDK_SCRIPT_ID = "facebook-jssdk";
const SDK_TIMEOUT_MS = 15_000;
const SIGNUP_TIMEOUT_MS = 5 * 60_000;
let sdkPromise: Promise<MetaFacebookSdk> | null = null;
let initializedSdkKey: string | null = null;

export async function launchOperationalMetaEmbeddedSignup(
  onboarding: StartOperationalMetaOnboardingData,
  signal?: AbortSignal,
): Promise<OperationalMetaEmbeddedSignupResult> {
  const sdk = await loadMetaFacebookSdk(onboarding);

  return new Promise((resolve, reject) => {
    let code: string | null = null;
    let selection: Pick<OperationalMetaEmbeddedSignupResult, "wabaId" | "phoneNumberId"> | null = null;
    let settled = false;

    const cleanup = () => {
      window.removeEventListener("message", handleMessage);
      signal?.removeEventListener("abort", handleAbort);
      window.clearTimeout(timeoutId);
    };

    const fail = (error: OperationalMetaEmbeddedSignupError) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(error);
    };

    const finish = () => {
      if (settled || !code || !selection) return;
      settled = true;
      cleanup();
      resolve({ code, ...selection });
    };

    const handleAbort = () => {
      fail(new OperationalMetaEmbeddedSignupError("CANCELLED"));
    };

    const handleMessage = (event: MessageEvent<unknown>) => {
      if (!isMetaMessageOrigin(event.origin)) return;

      const message = parseSignupMessage(event.data);
      if (!message || message.type !== "WA_EMBEDDED_SIGNUP") return;

      if (message.event === "CANCEL") {
        fail(new OperationalMetaEmbeddedSignupError("CANCELLED"));
        return;
      }

      if (message.event === "ERROR") {
        fail(new OperationalMetaEmbeddedSignupError("SDK_FAILED"));
        return;
      }

      if (message.event !== "FINISH") return;

      const wabaId = readMessageId(message.data?.waba_id);
      const phoneNumberId = readMessageId(message.data?.phone_number_id);
      if (!wabaId || !phoneNumberId) {
        fail(new OperationalMetaEmbeddedSignupError("INVALID_RESULT"));
        return;
      }

      selection = { wabaId, phoneNumberId };
      finish();
    };

    const timeoutId = window.setTimeout(() => {
      fail(new OperationalMetaEmbeddedSignupError("SDK_FAILED"));
    }, SIGNUP_TIMEOUT_MS);

    window.addEventListener("message", handleMessage);
    signal?.addEventListener("abort", handleAbort, { once: true });

    if (signal?.aborted) {
      handleAbort();
      return;
    }

    try {
      sdk.login(
        (response) => {
          const responseCode = response.authResponse?.code?.trim();
          if (responseCode) {
            code = responseCode;
            finish();
            return;
          }

          fail(new OperationalMetaEmbeddedSignupError("CANCELLED"));
        },
        {
          config_id: onboarding.configId,
          response_type: "code",
          override_default_response_type: true,
          state: onboarding.state,
          extras: {
            feature: "whatsapp_embedded_signup",
            sessionInfoVersion: "3",
          },
        },
      );
    } catch {
      fail(new OperationalMetaEmbeddedSignupError("SDK_FAILED"));
    }
  });
}

function loadMetaFacebookSdk(
  onboarding: StartOperationalMetaOnboardingData,
): Promise<MetaFacebookSdk> {
  if (window.FB) {
    initializeMetaFacebookSdk(window.FB, onboarding);
    return Promise.resolve(window.FB);
  }

  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<MetaFacebookSdk>((resolve, reject) => {
    let settled = false;
    const previousAsyncInit = window.fbAsyncInit;
    const timeoutId = window.setTimeout(() => {
      settleFailure();
    }, SDK_TIMEOUT_MS);

    const settleSuccess = () => {
      if (settled) return;
      if (!window.FB) {
        settleFailure();
        return;
      }

      settled = true;
      window.clearTimeout(timeoutId);
      initializeMetaFacebookSdk(window.FB, onboarding);
      if (window.fbAsyncInit === handleAsyncInit) {
        window.fbAsyncInit = previousAsyncInit;
      }
      resolve(window.FB);
    };

    const settleFailure = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      if (window.fbAsyncInit === handleAsyncInit) {
        window.fbAsyncInit = previousAsyncInit;
      }
      sdkPromise = null;
      reject(new OperationalMetaEmbeddedSignupError("SDK_UNAVAILABLE"));
    };

    function handleAsyncInit() {
      try {
        previousAsyncInit?.();
      } catch {
        // A previous consumer must not prevent the operational flow from
        // initializing its own SDK instance.
      }
      settleSuccess();
    }

    window.fbAsyncInit = handleAsyncInit;
    const existingScript = document.getElementById(SDK_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener("error", settleFailure, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = SDK_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.onerror = settleFailure;
    document.head.appendChild(script);
  });

  return sdkPromise;
}

function initializeMetaFacebookSdk(
  sdk: MetaFacebookSdk,
  onboarding: StartOperationalMetaOnboardingData,
) {
  const sdkKey = `${onboarding.appId}:${onboarding.graphVersion}`;
  if (initializedSdkKey === sdkKey) return;

  sdk.init({
    appId: onboarding.appId,
    cookie: true,
    xfbml: false,
    version: onboarding.graphVersion,
  });
  initializedSdkKey = sdkKey;
}

function parseSignupMessage(data: unknown): EmbeddedSignupMessage | null {
  if (typeof data === "string") {
    try {
      return parseSignupMessage(JSON.parse(data));
    } catch {
      return null;
    }
  }

  if (!data || typeof data !== "object") return null;
  return data as EmbeddedSignupMessage;
}

function readMessageId(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isMetaMessageOrigin(origin: string): boolean {
  return origin === "https://www.facebook.com" || origin === "https://web.facebook.com";
}
