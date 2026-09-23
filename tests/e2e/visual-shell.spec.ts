import { test, expect, type Page } from "@playwright/test";

const uuidPattern =
  /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;

const targetPath = process.env.PLAYWRIGHT_PATH?.trim() || "/dashboard";

if (!targetPath.startsWith("/")) {
  throw new Error("PLAYWRIGHT_PATH must be an application path starting with '/'");
}

async function authenticate(page: Page) {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.locator("#email").fill(process.env.test_admin_email ?? "");
  await page.locator("#password").fill(process.env.test_admin_password ?? "");

  await page
    .locator("form")
    .getByRole("button", { name: /sign in|entrar|login|iniciar/i })
    .click();
  await expect(page).not.toHaveURL(/\/login(?:\?.*)?$/, {
    timeout: 20_000,
  });
}

test.describe("authenticated visual shell", () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);
    await page.goto(targetPath, { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();
  });

  test("keeps the initial viewport usable and user-facing", async ({ page }, testInfo) => {
    await expect(page).not.toHaveURL(/\/login(?:\?.*)?$/);

    if (testInfo.project.name === "chromium-mobile") {
      await expect(page.locator('[data-sidebar="mobile-overlay"]')).toHaveCount(0);
    }

    const viewportMetrics = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));

    expect(viewportMetrics.scrollWidth).toBeLessThanOrEqual(
      viewportMetrics.clientWidth + 1,
    );

    const visibleText = await page.locator("body").innerText();
    expect(visibleText).not.toMatch(uuidPattern);

    const screenshotPath = testInfo.outputPath("viewport.png");
    await page.screenshot({ path: screenshotPath, fullPage: false });
    await testInfo.attach("viewport", {
      path: screenshotPath,
      contentType: "image/png",
    });
  });
});

test.describe("operator checklist default", () => {
  test("persists selection and deactivation across reloads, then restores the initial preference", async ({ page }, testInfo) => {
    await authenticate(page);
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    const workspaceSelect = page
      .getByRole("combobox")
      .filter({ hasText: /· (Operação|Comercial)$/ })
      .first();
    const openWorkspacePicker = async () => {
      if (
        testInfo.project.name === "chromium-mobile" &&
        !(await workspaceSelect.isVisible().catch(() => false))
      ) {
        await page
          .getByRole("banner")
          .getByRole("button", { name: "Toggle sidebar" })
          .click();
      }
      await expect(workspaceSelect).toBeVisible();
    };
    const closeMobileSidebar = async () => {
      if (testInfo.project.name !== "chromium-mobile") return;

      const overlay = page.locator('[data-sidebar="mobile-overlay"]');
      if (await overlay.isVisible().catch(() => false)) {
        const bounds = await overlay.boundingBox();
        if (bounds) {
          await overlay.click({
            position: { x: bounds.width - 8, y: bounds.height / 2 },
          });
        }
        await expect(overlay).toBeHidden();
      }
    };
    await openWorkspacePicker();
    const initialWorkspace = (await workspaceSelect.innerText()).trim();
    const defaultSelect = page.getByRole("combobox", {
      name: "Checklist padrão para novas atribuições",
    });
    let initialPreference: string | null = null;
    let availableModelNames: string[] = [];
    let initialPreferenceCaptured = false;
    const chooseModel = async (name: string) => {
      await defaultSelect.click();
      await page.getByRole("option", { name, exact: true }).first().click();
      await expect(defaultSelect).toContainText(name);
    };

    const disableDefault = async () => {
      const disableButton = page.getByRole("button", {
        name: "Desativar padrão",
      });
      if (await disableButton.isVisible().catch(() => false)) {
        await disableButton.click();
      }
      await expect(defaultSelect).toContainText("Selecione um checklist");
    };

    try {
      if (!initialWorkspace.endsWith("· Operação")) {
        await workspaceSelect.click();
        const operationalWorkspace = page
          .getByRole("option")
          .filter({ hasText: /· Operação$/ })
          .first();

        if ((await operationalWorkspace.count()) === 0) {
          await page.keyboard.press("Escape");
          test.skip(
            true,
            "A conta de teste não tem acesso a um workspace operacional.",
          );
          return;
        }

        await operationalWorkspace.click();
        await expect(workspaceSelect).toContainText("· Operação");
      }

      await closeMobileSidebar();
      await page.goto("/operation/checklists", {
        waitUntil: "domcontentloaded",
      });
      await expect(defaultSelect).toBeVisible();

      const unavailableDefault = page
        .getByRole("alert")
        .filter({ hasText: "O modelo padrão não está mais disponível" });
      if ((await unavailableDefault.count()) > 0) {
        test.skip(
          true,
          "A preferência inicial aponta para um modelo arquivado e não pode ser restaurada sem alterá-la.",
        );
        return;
      }

      const initialLabel = (await defaultSelect.innerText()).trim();
      await defaultSelect.click();
      const options = page.getByRole("option");
      if ((await options.count()) === 0) {
        await page.keyboard.press("Escape");
        test.skip(true, "Não há modelos ativos disponíveis para testar a seleção.");
        return;
      }

      availableModelNames = (await options.allTextContents())
        .map((name) => name.trim())
        .filter(Boolean);
      await page.keyboard.press("Escape");

      initialPreference = availableModelNames.includes(initialLabel)
        ? initialLabel
        : null;
      const selectedModel =
        availableModelNames.find((name) => name !== initialPreference) ??
        availableModelNames[0];
      initialPreferenceCaptured = true;

      await chooseModel(selectedModel);
      await expect(
        page.getByText("Checklist padrão atualizado", { exact: true }),
      ).toBeVisible();

      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(defaultSelect).toContainText(selectedModel);

      await page.getByRole("button", { name: "Desativar padrão" }).click();
      await expect(
        page.getByText("Aplicação automática desativada", { exact: true }),
      ).toBeVisible();

      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(defaultSelect).toContainText("Selecione um checklist");
    } finally {
      if (initialPreferenceCaptured) {
        await page.goto("/operation/checklists", {
          waitUntil: "domcontentloaded",
        });
        await expect(defaultSelect).toBeVisible();

        if (initialPreference) {
          await chooseModel(initialPreference);
          await page.reload({ waitUntil: "domcontentloaded" });
          await expect(defaultSelect).toContainText(initialPreference);
        } else {
          const currentLabel = (await defaultSelect.innerText()).trim();
          if (availableModelNames.includes(currentLabel)) {
            await disableDefault();
          }
          await page.reload({ waitUntil: "domcontentloaded" });
          await expect(defaultSelect).toContainText("Selecione um checklist");
        }
      }
    }
  });
});
