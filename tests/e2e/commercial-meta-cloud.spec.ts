import { test, expect, type Page } from "@playwright/test";

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

async function openCommercialPipelineConfiguration(
  page: Page,
  shouldAuthenticate = true,
  selectMeta = true,
) {
  if (shouldAuthenticate) {
    await authenticate(page);
  }
  await page.goto("/deals", { waitUntil: "domcontentloaded" });

  const workspaceSelect = page
    .getByRole("combobox")
    .filter({ hasText: /· (Operação|Comercial)$/ })
    .first();
  await expect(workspaceSelect).toBeVisible();

  if (!/· Comercial$/.test((await workspaceSelect.innerText()).trim())) {
    await workspaceSelect.click();
    await page
      .getByRole("option")
      .filter({ hasText: /· Comercial$/ })
      .first()
      .click();
    await expect(workspaceSelect).toContainText("· Comercial");
    await page.goto("/deals", { waitUntil: "domcontentloaded" });
  }

  const editButton = page.getByRole("button", { name: /editar|edit/i }).last();
  await expect(editButton).toBeVisible();
  await editButton.click();
  await expect(page).toHaveURL(/\/deals\/pipeline\/[^/]+\/edit/);

  await page.getByRole("tab", { name: /configurações|settings/i }).click();
  const whatsappSwitch = page.getByRole("switch", { name: /enable|ativar/i });
  if (!(await whatsappSwitch.isChecked())) {
    await whatsappSwitch.click();
  }
  const integrationTypeLabel = page
    .getByText(/tipo de integração|integration type/i)
    .first();
  await expect(integrationTypeLabel).toBeVisible();

  const providerField = integrationTypeLabel.locator("..").getByRole("combobox");
  await providerField.click();
  if (selectMeta) {
    await page
      .getByRole("option", { name: "WhatsApp Cloud API oficial", exact: true })
      .click();

    await expect(
      page.getByText("Configuração da conta Meta", { exact: true }),
    ).toBeVisible();
  }
}

test("preserva Evolux e Z-API no seletor comercial", async ({ page }) => {
  await openCommercialPipelineConfiguration(page);

  const providerField = page
    .getByText(/tipo de integração|integration type/i)
    .first()
    .locator("..")
    .getByRole("combobox");
  await providerField.click();

  await expect(
    page.getByRole("option", { name: "Evolux", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("option", { name: "Z-API", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("option", {
      name: "WhatsApp Cloud API oficial",
      exact: true,
    }),
  ).toBeVisible();
  await page.keyboard.press("Escape");

  await expect(page.getByText("Credenciais", { exact: true })).toBeVisible();
  await expect(page.getByText("Validação", { exact: true })).toBeVisible();
  await expect(page.getByText("Webhook", { exact: true })).toBeVisible();
  await expect(page.getByText("Números", { exact: true })).toBeVisible();
});

test("isola a conexão Meta por workspace após recarregar", async ({ page }) => {
  const accountRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/manual-accounts")) {
      accountRequests.push(request.url());
    }
  });

  await openCommercialPipelineConfiguration(page);
  await expect(page.getByLabel("WABA ID")).toBeVisible();

  const appSecret = page.getByLabel("App Secret");
  const accessToken = page.getByLabel("Token de acesso");
  await expect(appSecret).toHaveValue("");
  await expect(accessToken).toHaveValue("");
  await expect(appSecret).toHaveAttribute("type", "password");
  await expect(accessToken).toHaveAttribute("type", "password");

  await expect.poll(() => accountRequests.length).toBeGreaterThan(0);
  const firstWorkspaceRequest = accountRequests.at(-1);
  expect(firstWorkspaceRequest).toMatch(
    /\/meta-cloud\/workspaces\/[^/]+\/manual-accounts/,
  );

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.goto("/deals", { waitUntil: "domcontentloaded" });
  await openCommercialPipelineConfiguration(page, false);
  await expect(page.getByLabel("WABA ID")).toBeVisible();
  await expect.poll(() => accountRequests.length).toBeGreaterThan(1);
  expect(accountRequests.at(-1)).toBe(firstWorkspaceRequest);
});

test("avisa quando a WABA já está configurada em outro workspace", async ({
  page,
}) => {
  await page.route("**/meta-cloud/workspaces/*/manual-accounts", async (route) => {
    const response = await route.fetch();
    const payload = await response.json();
    const accounts = Array.isArray(payload) && payload.length
      ? payload
      : [
          {
            id: "test-meta-account",
            companyId: "test-company",
            wabaId: "test-waba",
            businessId: null,
            status: "CONNECTED",
            connectionMode: "MANUAL",
            appId: "test-app",
            webhookVerifiedAt: null,
            lastValidatedAt: "2026-01-01T00:00:00.000Z",
            tokenExpiresAt: null,
            grantedScopes: [],
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            webhookConfigured: false,
            wabaAlreadyConfiguredInAnotherWorkspace: true,
            phoneNumbers: [],
          },
        ];

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        accounts.map((account) => ({
          ...account,
          wabaAlreadyConfiguredInAnotherWorkspace: true,
        })),
      ),
    });
  });

  await openCommercialPipelineConfiguration(page);
  await expect(
    page.getByText("WABA reutilizada em outro workspace", { exact: true }),
  ).toBeVisible();
});

test("impede alterar a conta Meta sem permissão de integração", async ({
  page,
}) => {
  await page.route("**/user/me", async (route) => {
    const response = await route.fetch();
    const profile = await response.json();
    profile.permissions = profile.permissions.filter(
      (permission: string) => permission !== "manage:integrations",
    );
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(profile),
    });
  });

  await openCommercialPipelineConfiguration(page, true, false);
  const editorUrl = page.url();
  await page.goto(`${editorUrl}?tab=config&provider=meta-cloud`, {
    waitUntil: "domcontentloaded",
  });

  await expect(
    page.getByText("Configuração da conta Meta", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Configuração restrita", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("WABA ID")).toBeDisabled();
  await expect(page.getByLabel("App Secret")).toBeDisabled();
  await expect(page.getByLabel("Token de acesso")).toBeDisabled();
  await expect(
    page.getByRole("button", { name: /validar e salvar/i }),
  ).toBeDisabled();
});
