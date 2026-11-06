import { expect, test, type Page } from "@playwright/test";

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

async function selectOperationalWorkspace(page: Page) {
  const workspaceSelect = page
    .getByRole("combobox")
    .filter({ hasText: /· (Operação|Comercial)$/ })
    .first();

  if (!(await workspaceSelect.isVisible().catch(() => false))) {
    const toggle = page.getByRole("button", { name: /toggle sidebar/i });
    if (await toggle.isVisible().catch(() => false)) await toggle.click();
  }

  if (!(await workspaceSelect.isVisible().catch(() => false))) return false;

  if (!/· Operação$/.test((await workspaceSelect.innerText()).trim())) {
    await workspaceSelect.click();
    const operationalWorkspace = page
      .getByRole("option")
      .filter({ hasText: /· Operação$/ })
      .first();

    if ((await operationalWorkspace.count()) === 0) {
      await page.keyboard.press("Escape");
      return false;
    }

    await operationalWorkspace.click();
    await expect(workspaceSelect).toContainText("· Operação");
  }

  return true;
}

test("shows transfer destinations in operational queue setup", async ({ page }) => {
  await authenticate(page);

  if (!(await selectOperationalWorkspace(page))) {
    test.skip(true, "A conta de teste não tem workspace operacional.");
    return;
  }

  await page.goto("/operation/structure", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Estrutura de atendimento" }),
  ).toBeVisible();

  const firstArea = page.getByRole("link", { name: /^Abrir / }).first();
  if ((await firstArea.count()) === 0) {
    test.skip(true, "O workspace de teste não tem áreas ativas.");
    return;
  }
  await firstArea.click();
  await page.getByRole("tab", { name: "Filas" }).click();

  const openQueue = page.getByRole("link", { name: "Abrir", exact: true }).first();
  if ((await openQueue.count()) === 0) {
    test.skip(true, "A área de teste não tem filas ativas.");
    return;
  }
  await openQueue.click();

  await expect(
    page.getByRole("heading", {
      name: "Destinos adicionais para transferência",
    }),
  ).toBeVisible();
  await expect(
    page.getByLabel("Filas disponíveis", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByPlaceholder("Buscar por fila ou área"),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Salvar destinos" })).toBeDisabled();
});
