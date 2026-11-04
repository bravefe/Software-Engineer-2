import { expect, test } from "@playwright/test";

test("health page displays API and database status", async ({ page }) => {
  await page.route("**/api/health", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status: "ok", database: "connected" }),
    });
  });

  await page.goto("/health");

  await expect(
    page.getByRole("heading", { name: "System health" }),
  ).toBeVisible();
  await expect(
    page.getByText("API: ok; database: connected."),
  ).toBeVisible();
});
