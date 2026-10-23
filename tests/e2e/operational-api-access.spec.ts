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

async function openOperationalApiAccess(page: Page) {
  await authenticate(page);
  await page.goto("/operation/api-access", { waitUntil: "domcontentloaded" });

  const workspaceSelect = page
    .getByRole("combobox")
    .filter({ hasText: /· (Operação|Comercial)$/ })
    .first();

  if (!(await workspaceSelect.isVisible().catch(() => false))) {
    const toggle = page.getByRole("button", { name: /toggle sidebar/i });
    if (await toggle.isVisible().catch(() => false)) {
      await toggle.click();
    }
  }

  if (!(await workspaceSelect.isVisible().catch(() => false))) {
    return false;
  }

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

  await page.goto("/operation/api-access", { waitUntil: "domcontentloaded" });
  return (await page.getByRole("heading", { name: "Acesso à API operacional" }).count()) > 0;
}

test.describe("operational API access", () => {
  test("manages a workspace key and keeps the documentation available", async ({ page }) => {
    if (!(await openOperationalApiAccess(page))) {
      test.skip(true, "A conta de teste não tem workspace operacional ou permissão de acesso à API.");
      return;
    }

    await page.getByRole("tab", { name: "Documentação" }).click();
    await expect(page.getByText("Sincronização incremental", { exact: true })).toBeVisible();
    await expect(page.getByText("60 chamadas", { exact: false })).toBeVisible();
    await expect(page.getByText("X-API-Key", { exact: false }).first()).toBeVisible();
    await page.getByRole("tab", { name: "Chaves" }).click();

    await expect(page.getByRole("heading", { name: "Nova chave de leitura" })).toBeVisible();
    const integrationName = `E2E API ${Date.now()}`;
    await page.getByLabel("Nome da integração").fill(integrationName);
    await page.getByRole("button", { name: "Criar chave", exact: true }).click();

    const secretAlert = page.getByRole("alert").filter({ hasText: "Chave criada" });
    await expect(secretAlert).toBeVisible({ timeout: 20_000 });
    await expect(secretAlert.locator("code")).toHaveText(/^opk_[a-f0-9]{64}$/);
    await expect(secretAlert.getByRole("button", { name: "Copiar segredo" })).toBeVisible();
    await secretAlert.getByRole("button", { name: "Fechar" }).click();
    await expect(secretAlert).toHaveCount(0);

    const row = page.locator("div").filter({ hasText: integrationName }).filter({ has: page.getByText("Ativa", { exact: true }) }).first();
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: "Revogar" }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.getByRole("alertdialog").getByRole("button", { name: "Revogar chave" }).click();
    await expect(page.getByText(integrationName, { exact: true })).toBeVisible();
    await expect(row.getByText("Revogada", { exact: true })).toBeVisible({ timeout: 20_000 });
  });
});
