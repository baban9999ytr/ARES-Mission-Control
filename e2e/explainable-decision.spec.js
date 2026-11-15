import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';

test('profile segment inspection and coefficient sensitivity work at mobile width in EN/TR',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await expect(page.locator('#missionStatus')).toContainText('30');
  await page.locator('#juryExample').click();
  const shortest=await page.locator('#distanceDistance').textContent();
  const original=await page.locator('#terrainDistance').textContent();
  await expect(page.locator('#elevationProfile .elevation-profile-line')).toHaveCount(2);
  await expect(page.locator('#elevationProfile .elevation-profile-datum')).toContainText('IAU sphere');
  const hit=page.locator('#elevationProfile [data-profile-mode="terrain"][data-profile-index="0"]').first();
  await hit.focus();
  await expect(page.locator('#segmentInspection')).toBeVisible();
  await expect(page.locator('#segmentSelect')).toHaveValue('terrain:0');
  await page.locator('#slopeWeight').selectOption('0');
  await expect(page.locator('#terrainDistance')).toHaveText(shortest);
  await expect(page.locator('#sensitivityNote')).toContainText('Versus w = 4: distance');
  await expect(page.locator('#sensitivityNote')).toContainText('model assumption, not measured terrain');
  await page.locator('#slopeWeight').selectOption('4');
  await expect(page.locator('#terrainDistance')).toHaveText(original);
  await page.locator('[data-language="tr"]').click();
  await expect(page.locator('#elevationProfile .elevation-profile-title')).toContainText('Yükseklik profili');
  await expect(page.locator('#elevationProfile .elevation-profile-datum')).toContainText('IAU sphere');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});

test('print briefing includes route evidence and retains JSON download',async({page})=>{
  await page.goto('/');
  await expect(page.locator('#missionStatus')).toContainText('30');
  await page.locator('#juryExample').click();
  await page.locator('#advancedDrawer > summary').click();
  const popupPromise=page.waitForEvent('popup');
  await page.locator('#briefingPrint').click();
  const report=await popupPromise;
  await expect(report.locator('h1')).toContainText('mission decision briefing');
  await expect(report.locator('body')).toContainText('SC-01');
  await expect(report.locator('body')).toContainText('Mars 2020 IAU sphere');
  await expect(report.locator('body')).toContainText('Non-operational research prototype');
  await expect(report.locator('.elevation-profile .profile-line')).toHaveCount(2);
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#briefingExport').click();
  const download=await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.json$/);
  const json=JSON.parse(await readFile(await download.path(),'utf8'));
  expect(json.modelAssumptions.terrainSlopeCoefficient).toBe(4);
  expect(json.totals.terrainPreferred.plannedCells.length).toBeGreaterThan(1);
});

test('custom mission blueprint still imports after JSON export',async({page})=>{
  await page.goto('/');
  await expect(page.locator('#missionStatus')).toContainText('30');
  await page.locator('#juryCreate').click();
  await page.locator('#missionTitle').fill('Round-trip mission');
  await page.locator('#missionTitle').press('Tab');
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#missionSave').click();
  const download=await downloadPromise;
  const contents=await readFile(await download.path());
  await page.locator('#missionImport').setInputFiles({name:'mission.json',mimeType:'application/json',buffer:contents});
  await expect(page.locator('#missionEditorStatus')).toContainText('Imported editable mission');
  await expect(page.locator('#missionTitle')).toHaveValue('Round-trip mission');
});
