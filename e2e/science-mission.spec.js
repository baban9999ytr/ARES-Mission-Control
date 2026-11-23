import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("science demo plans a measured return loop and restores prior custom work", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("#missionStatus")).toContainText("30");
  await page.locator("#juryCreate").click();
  await page.locator("#missionTitle").fill("Preserved custom work");
  await page.locator("#missionTitle").press("Tab");
  await page.locator("#scienceDemo").click();
  await expect(page.locator("#missionTitle")).toHaveValue(
    "Northern CTX science loop",
  );
  await expect(page.locator("#missionLegs .mission-leg")).toHaveCount(2);
  await expect(page.locator("#missionLegs")).toContainText("RETURN");
  await page.locator('#missionLegs [data-inspect-leg="2"]').click();
  await expect(page.locator("#mapSvg .mission-leg-highlight")).toHaveCount(1);
  await expect(
    page.locator('#missionLegs [data-inspect-leg="2"]'),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#missionEvidence")).toContainText(
    "USGS Astrogeology",
  );
  await expect(
    page.locator("#elevationProfile .elevation-profile-line"),
  ).toHaveCount(2);
  await expect(page.locator("#routeTradeoffs")).toContainText(
    "Terrain preference improves",
  );
  const shortest = await page.locator("#distanceDistance").textContent();
  await page.locator("#slopeWeight").selectOption("0");
  await expect(page.locator("#terrainDistance")).toHaveText(shortest);
  await page.locator("#slopeWeight").selectOption("4");
  await page.locator("#advancedDrawer > summary").click();
  const popupPromise = page.waitForEvent("popup");
  await page.locator("#briefingPrint").click();
  const report = await popupPromise;
  await expect(report.locator("body")).toContainText("Fixed order stops");
  await expect(report.locator("body")).toContainText(
    "USGS Mars 2020 CTX archive",
  );
  await report.emulateMedia({ media: "print" });
  await expect(report.locator(".elevation-profile")).toBeVisible();
  await page.locator("#scienceDemoExit").click();
  await expect(page.locator("#missionTitle")).toHaveValue(
    "Preserved custom work",
  );
  await expect(page.locator("#scienceDemoExit")).toBeHidden();
});

test("science stop objective, return and JSON round trip work in Turkish at mobile width", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("#missionStatus")).toContainText("30");
  await page.locator('[data-language="tr"]').click();
  await page.locator("#scienceMissionNew").click();
  await expect(page.locator("#missionEditorStops [data-stop-row]")).toHaveCount(
    3,
  );
  await expect(page.locator("#missionEditorStops")).toContainText("Üsse dönüş");
  await page
    .locator('#missionEditorStops [data-activity="1"]')
    .selectOption("imaging");
  await page
    .locator('#missionEditorStops [data-activity-description="1"]')
    .fill("Örnek yüzey panoraması");
  await page
    .locator('#missionEditorStops [data-activity-description="1"]')
    .press("Tab");
  await expect(
    page.locator('#missionEditorStops [data-activity-description="1"]'),
  ).toHaveValue("Örnek yüzey panoraması");
  await expect(page.locator("#missionLegs .mission-leg")).toHaveCount(2);
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#missionSave").click();
  const download = await downloadPromise;
  const saved = await readFile(await download.path());
  const json = JSON.parse(saved.toString());
  expect(json.scienceMission).toBe(true);
  expect(json.stops[1].activityType).toBe("imaging");
  await page.locator("#missionImport").setInputFiles({
    name: "science.json",
    mimeType: "application/json",
    buffer: saved,
  });
  await expect(page.locator("#missionEditorStatus")).toContainText(
    "içe aktarıldı",
  );
  await expect(
    page.locator('#missionEditorStops [data-activity="1"]'),
  ).toHaveValue("imaging");
  await page.locator("#advancedDrawer > summary").click();
  await page.locator("#pickStart").click();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  const base = await page
    .locator('#missionEditorStops [data-stop-row="0"] small')
    .textContent();
  const returned = await page
    .locator('#missionEditorStops [data-stop-row="2"] small')
    .textContent();
  expect(returned).toBe(base);
  await expect(page.locator("#missionLegs .mission-leg")).toHaveCount(2);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
});
