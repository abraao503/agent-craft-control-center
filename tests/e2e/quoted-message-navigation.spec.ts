import { expect, test, type Page } from "@playwright/test";

type ConversationKind = "commercial" | "operational";

async function authenticate(page: Page) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.locator("#email").fill(process.env.test_admin_email ?? "");
  await page.locator("#password").fill(process.env.test_admin_password ?? "");
  await page
    .locator("form")
    .getByRole("button", { name: /sign in|entrar|login|iniciar/i })
    .click();
  await expect(page).not.toHaveURL(/\/login(?:\?.*)?$/, { timeout: 20_000 });
}

async function openConversation(page: Page, kind: ConversationKind) {
  await authenticate(page);

  if (kind === "commercial") {
    await page.goto("/chats", { waitUntil: "domcontentloaded" });
    const conversations = page.locator(".divide-y > div");
    await conversations.first().waitFor({ state: "visible", timeout: 15_000 }).catch(() => undefined);
    if (!(await conversations.count())) return false;
    await conversations.first().click();
  } else {
    await page.goto("/operation/attendances", { waitUntil: "domcontentloaded" });
    const attendances = page.locator('a[href^="/operation/attendances/"]');
    await attendances.first().waitFor({ state: "visible", timeout: 15_000 }).catch(() => undefined);
    if (!(await attendances.count())) return false;
    await attendances.first().click();
  }

  await page.locator("[data-message-id]").first().waitFor({ state: "visible", timeout: 15_000 }).catch(() => undefined);
  return true;
}

function timelineRequests(page: Page) {
  const requests: string[] = [];
  const listener = (request: { url: () => string }) => {
    if (request.url().includes("/timeline")) requests.push(request.url());
  };
  page.on("request", listener);
  return {
    requests,
    stop: () => page.off("request", listener),
  };
}

async function findReplyPreview(page: Page) {
  const preview = page.getByRole("button", {
    name: "Ir para a mensagem respondida",
  }).first();
  await preview.waitFor({ state: "visible", timeout: 3_000 }).catch(() => undefined);
  return (await preview.count()) > 0 ? preview : null;
}

async function exercisePreview(page: Page) {
  const preview = await findReplyPreview(page);
  if (!preview) {
    return {
      available: false,
      busyObserved: false,
      directed: false,
      error: false,
      focused: false,
    };
  }

  const observed = timelineRequests(page);
  let busyObserved = false;
  await expect(preview).toHaveAttribute("type", "button");
  await expect(preview).toHaveAttribute("aria-busy", "false");
  await preview.focus();
  await page.keyboard.press("Enter");

  await expect
    .poll(
      async () => {
        const current = page.getByRole("button", {
          name: "Ir para a mensagem respondida",
        }).first();
        if (!(await current.count())) return "detached";
        const busy = await current.getAttribute("aria-busy");
        if (busy === "true") busyObserved = true;
        return busy;
      },
      { timeout: 15_000 },
    )
    .toMatch(/false|detached/);

  const error = await page
    .getByRole("status")
    .filter({ hasText: "Não foi possível localizar a mensagem original." })
    .count();
  const focusedMessage = await page.locator("[data-message-id]:focus").count();
  const directed = observed.requests.some((url) => {
    try {
      return new URL(url).searchParams.has("aroundMessageId");
    } catch {
      return false;
    }
  });
  observed.stop();

  expect(focusedMessage + error).toBeGreaterThan(0);
  return {
    available: true,
    busyObserved,
    directed,
    error: error > 0,
    focused: focusedMessage > 0,
  };
}

async function assertNavigationScenario(page: Page, kind: ConversationKind) {
  if (!(await openConversation(page, kind))) {
    test.skip(true, `Ambiente sem ${kind === "commercial" ? "conversas" : "atendimentos"} para validar a jornada real.`);
    return null;
  }

  const result = await exercisePreview(page);
  if (!result.available) {
    test.skip(true, "Ambiente sem mensagens respondidas disponíveis.");
    return null;
  }
  return result;
}

for (const kind of ["commercial", "operational"] as const) {
  const label = kind === "commercial" ? "comercial" : "operacional";

  test(`${label} navega pelo preview com teclado, local ou remoto`, async ({ page }) => {
    const result = await assertNavigationScenario(page, kind);
    if (!result) return;

    if (result.directed) {
      expect(result.busyObserved || result.error).toBe(true);
    }
  });

  test(`${label} encerra loading e fornece feedback em erro ou remoção`, async ({ page }) => {
    const result = await assertNavigationScenario(page, kind);
    if (!result) return;

    // O ambiente real pode resolver a mensagem imediatamente. Quando houver
    // uma referência removida, exercisePreview valida o status amigável; nos
    // demais casos a ausência de loading infinito é a garantia observável.
    expect(result.error || result.focused).toBe(true);
    if (result.busyObserved) {
      expect(result.directed || result.error).toBe(true);
    }
  });

  test(`${label} não perde o escopo ao trocar de conversa durante a navegação`, async ({ page }) => {
    await authenticate(page);
    const listPath = kind === "commercial" ? "/chats" : "/operation/attendances";
    await page.goto(listPath, { waitUntil: "domcontentloaded" });
    const entries = kind === "commercial"
      ? page.locator(".divide-y > div")
      : page.locator('a[href^="/operation/attendances/"]');
    await entries.first().waitFor({ state: "visible", timeout: 15_000 }).catch(() => undefined);
    if ((await entries.count()) < 2) {
      test.skip(true, "Ambiente sem duas conversas para validar a troca de escopo.");
      return;
    }

    await entries.nth(0).click();
    const firstPreview = await findReplyPreview(page);
    if (firstPreview) {
      await firstPreview.click();
    }
    await page.goto(listPath, { waitUntil: "domcontentloaded" });
    await entries.nth(1).click();
    await expect(page.locator("[data-message-id]").first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Não foi possível localizar a mensagem original.")).toHaveCount(0);
  });
}
