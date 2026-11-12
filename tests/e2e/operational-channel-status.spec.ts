import { expect, test } from "@playwright/test";

test("refreshes the Evolux channel against the real API", async ({ page }, testInfo) => {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.locator("#email").fill(process.env.test_admin_email ?? "");
  await page.locator("#password").fill(process.env.test_admin_password ?? "");
  await page.locator("form").getByRole("button", { name: /sign in|entrar|login|iniciar/i }).click();
  await expect(page).not.toHaveURL(/\/login(?:\?.*)?$/, { timeout: 20_000 });
  await page.goto("/operation/channels", { waitUntil: "domcontentloaded" });

  const workspaceSelect = page.getByRole("combobox").filter({ hasText: /· (Operação|Comercial)$/ }).first();
  if (testInfo.project.name === "chromium-mobile") {
    const toggle = page.getByRole("button", { name: /toggle sidebar/i });
    if (await toggle.isVisible()) await toggle.click();
  }
  await expect(workspaceSelect).toBeVisible();
  if (!/· Operação$/.test((await workspaceSelect.innerText()).trim())) {
    await workspaceSelect.click();
    await page.getByRole("option").filter({ hasText: /· Operação$/ }).first().click();
  }
  // Navigate after workspace selection to close the mobile sidebar as well.
  await page.goto("/operation/channels", { waitUntil: "domcontentloaded" });
  const channelName = process.env.PLAYWRIGHT_EVOLUX_CHANNEL_NAME || "0800";
  await page.getByText(channelName, { exact: true }).first().click();
  await page.getByRole("button", { name: `Ações do canal ${channelName}`, exact: true }).click();
  const responsePromise = page.waitForResponse((response) =>
    response.request().method() === "POST" && /\/channels\/[^/]+\/refresh-status$/.test(new URL(response.url()).pathname),
  );
  await page.getByRole("menuitem", { name: "Atualizar status", exact: true }).click();
  const response = await responsePromise;
  expect(response.status(), "The real API must support refreshing Evolux status").toBe(200);
  const result = await response.json();
  console.log("Evolux status result:", { connectionStatus: result.connectionStatus, confirmed: result.confirmed });
  expect(["CONNECTED", "DISCONNECTED", "CONNECTING", "UNKNOWN"]).toContain(result.connectionStatus);
  const scope = page.locator("article").filter({ has: page.getByRole("button", { name: `Ações do canal ${channelName}`, exact: true }) });
  if (!result.confirmed) {
    await expect(scope.getByText("Conexão não confirmada", { exact: true }).first()).toBeVisible();
  } else if (result.connectionStatus !== "CONNECTED") {
    await expect(scope.getByText("Aguardando conexão", { exact: true }).first()).toBeVisible();
  } else {
    await expect(scope.getByText("Pronto", { exact: true }).first()).toBeVisible();
  }
  await page.screenshot({ path: testInfo.outputPath("channel-status.png") });
});
