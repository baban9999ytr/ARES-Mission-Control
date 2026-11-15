import {test,expect} from '@playwright/test';

async function ready(page){
  await page.goto('/');
  await expect(page.locator('#missionStatus')).toContainText('30');
}

test('SC-01 launcher restores crop, both visible routes, and measured comparison',async({page})=>{
  await ready(page);
  await page.locator('#regionSelect').selectOption('expanded');
  await expect(page.locator('#regionSelect')).toHaveValue('expanded');
  await page.locator('#juryExample').click();
  await expect(page.locator('#regionSelect')).toHaveValue('crop');
  await expect(page.locator('#routeContext')).toContainText('SC-01');
  await expect(page.locator('#routeDecision')).toContainText('166 m (7.5%)');
  await expect(page.locator('#routeDecision')).toContainText('15.1°');
  await expect(page.locator('#routeDecision')).toContainText('45.6 m');
  await expect(page.locator('#zoomPct')).toHaveText('100%');
  await expect(page.locator('#mapSvg .map-route.shortest')).toHaveCount(1);
  await expect(page.locator('#mapSvg .map-route.terrain')).toHaveCount(1);
  await expect(page.locator('#permanentLandmarkLayer [data-landmark-id]')).toHaveCount(5);
  await page.locator('#advancedDrawer > summary').click();
  await page.locator('#distanceRouteToggle').uncheck();
  await expect(page.locator('#mapSvg .map-route.shortest')).toHaveCount(0);
  await page.locator('#juryExample').click();
  await expect(page.locator('#distanceRouteToggle')).toBeChecked();
  await expect(page.locator('#terrainRouteToggle')).toBeChecked();
  await expect(page.locator('#mapSvg .map-route.shortest')).toHaveCount(1);
});

test('custom mission replacement requires confirmation and cancellation preserves work',async({page})=>{
  await ready(page);
  await page.locator('#juryCreate').click();
  await expect(page.locator('#routeContext')).toContainText('CUSTOM');
  await page.locator('#missionTitle').fill('Keep my mission');
  await page.locator('#missionTitle').press('Tab');
  page.once('dialog',dialog=>dialog.dismiss());
  await page.locator('#juryExample').click();
  await expect(page.locator('#routeContext')).toContainText('CUSTOM');
  await expect(page.locator('#missionTitle')).toHaveValue('Keep my mission');
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#juryExample').click();
  await expect(page.locator('#routeContext')).toContainText('SC-01');
});

test('English and Turkish controls and decision text respond to language changes',async({page})=>{
  await ready(page);
  await page.locator('[data-language="tr"]').click();
  await expect(page.locator('#juryExample')).toHaveText('Örnek Görevi İncele');
  await page.locator('#juryExample').click();
  await expect(page.locator('#routeDecision')).toContainText('166 m (7,5%)');
  await page.locator('[data-language="en"]').click();
  await expect(page.locator('#juryExample')).toHaveText('Explore Example Mission');
  await expect(page.locator('#routeDecision')).toContainText('166 m (7.5%)');
});

test('SC-05 catalog selection describes equal distance without saying farther',async({page})=>{
  await ready(page);
  await page.locator('#missionLibraryOpen').click();
  await page.locator('#missionSearch').fill('SC-05');
  await page.locator('#missionList [data-mission="SC-05"]').click();
  await expect(page.locator('#routeContext')).toContainText('SC-05');
  await expect(page.locator('#routeDecision')).toContainText('same measured distance');
  await expect(page.locator('#routeDecision')).not.toContainText('0 m');
  await page.locator('[data-language="tr"]').click();
  await expect(page.locator('#routeDecision')).toContainText('mesafesi aynı');
  await expect(page.locator('#routeDecision')).not.toContainText('daha uzun');
});

test('tablet comparison, keyboard map point and segment, mobile actions remain accessible',async({page})=>{
  await page.setViewportSize({width:768,height:1024});
  await ready(page);
  await page.locator('#juryExample').click();
  const geometry=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,map:document.querySelector('.map-panel').getBoundingClientRect().toJSON(),compare:document.querySelector('.analysis-panel').getBoundingClientRect().toJSON()}));
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.width);
  expect(geometry.compare.y).toBeGreaterThan(geometry.map.y);
  expect(geometry.compare.y-geometry.map.bottom).toBeLessThan(24);
  await expect(page.locator('#routeDecision')).toBeInViewport();
  await page.locator('#advancedDrawer > summary').click();
  await page.locator('#pickStart').click();
  await expect(page.locator('#mapStage')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expect(page.locator('#pointFeedback')).toContainText('Start set to');
  await page.locator('#segmentSelect').selectOption('terrain:0');
  await expect(page.locator('#segmentInspection')).toBeVisible();
  for(const width of [390,320]){
    await page.setViewportSize({width,height:844});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.locator('#juryExample').click();
    await expect(page.locator('#routeContext')).toContainText('SC-01');
    await page.locator('#juryScience').click();
    await expect(page.locator('#scienceDrawer')).toHaveAttribute('open','');
  }
});

for(const language of ['en','tr'])test(`${language} responsive interaction sweep at desktop, tablet, and mobile widths`,async({page})=>{
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(`${message.text()} @ ${message.location().url}`);});
  for(const [width,height] of [[1440,900],[1280,720],[768,1024],[390,844],[320,720]]){
    await page.setViewportSize({width,height});
    await ready(page);
    await page.locator(`[data-language="${language}"]`).click();
    await expect(page.locator('#juryExample')).toHaveText(language==='tr'?'Örnek Görevi İncele':'Explore Example Mission');
    await page.locator('#juryExample').click();
    await expect(page.locator('#routeContext')).toContainText('SC-01');
    await expect(page.locator('#routeDecision')).toContainText(language==='tr'?'166 m (7,5%)':'166 m (7.5%)');
    await expect(page.locator('#routeDecision')).toBeInViewport();
    const bounds=await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,comparison:document.querySelector('.comparison').getBoundingClientRect().toJSON(),decision:document.querySelector('#routeDecision').getBoundingClientRect().toJSON()}));
    expect(bounds.scrollWidth).toBeLessThanOrEqual(width);
    expect(bounds.comparison.right).toBeLessThanOrEqual(width+1);
    expect(bounds.decision.right).toBeLessThanOrEqual(width+1);
    await page.locator('#juryScience').click();
    await expect(page.locator('#scienceDrawer')).toHaveAttribute('open','');
    await page.locator('#scienceList [data-science]').first().click();
    await expect(page.locator('#scienceDetail')).not.toBeEmpty();
  }
  const expectedDev404=['/build-info.json','/favicon.ico'];
  expect(errors.filter(error=>!expectedDev404.some(path=>error.endsWith(path)))).toEqual([]);
});

test('keyboard landmark and custom mission stop flows work in both languages',async({page})=>{
  for(const language of ['en','tr']){
    await ready(page);
    await page.locator(`[data-language="${language}"]`).click();
    const landmark=page.locator('#mapSvg [data-landmark-id]').first();
    await landmark.focus();
    await landmark.press('Enter');
    await expect(page.locator('#landmarkPopup')).toBeVisible();
    await page.locator('#landmarkClose').click();
    await page.locator('#juryCreate').click();
    await expect(page.locator('#routeContext')).toContainText('CUSTOM');
    const before=await page.locator('#missionEditorStops [data-stop-row]').count();
    await page.locator('#missionAdd').click();
    await expect(page.locator('#mapStage')).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.locator('#missionEditorStops [data-stop-row]')).toHaveCount(before+1);
    await page.locator('#segmentSelect').selectOption('terrain:0');
    await expect(page.locator('#segmentInspection')).toBeVisible();
  }
});

test('emulated touch can launch and inspect the mission at 390 and 320 pixels',async({browser})=>{
  for(const [width,language] of [[390,'en'],[320,'tr']]){
    const context=await browser.newContext({viewport:{width,height:844},isMobile:true,hasTouch:true,locale:language==='tr'?'tr-TR':'en-US'});
    const page=await context.newPage();
    await ready(page);
    await page.locator(`[data-language="${language}"]`).tap();
    await page.locator('#juryExample').tap();
    await expect(page.locator('#routeContext')).toContainText('SC-01');
    await page.locator('#juryScience').tap();
    await expect(page.locator('#scienceDrawer')).toHaveAttribute('open','');
    await page.locator('#scienceList [data-science]').first().tap();
    await expect(page.locator('#scienceDetail')).not.toBeEmpty();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await context.close();
  }
});

test('EN/TR route inspection keeps map styles and sources navigation works',async({page})=>{
  for(const language of ['en','tr']){
    await ready(page);
    await page.locator(`[data-language="${language}"]`).click();
    await page.locator('#juryExample').click();
    await page.locator('[data-mode="distance"]').click();
    await expect(page.locator('[data-mode="distance"]')).toHaveAttribute('aria-pressed','true');
    const style=await page.evaluate(()=>({shortest:getComputedStyle(document.querySelector('#mapSvg .map-route.shortest')).opacity,terrain:getComputedStyle(document.querySelector('#mapSvg .map-route.terrain')).opacity}));
    expect(style).toEqual({shortest:'0.48',terrain:'1'});
    await page.locator('#advancedDrawer > summary').click();
    await page.locator('#pickDestination').click();
    await expect(page.locator('#mapStage')).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('Enter');
    await expect(page.locator('#pointFeedback')).toContainText(language==='tr'?'Hedef':'Destination');
    await page.locator('.header-sources').click();
    await expect(page).toHaveURL(/sources\.html/);
    await expect(page).toHaveTitle(language==='tr'?/Bilimsel Kaynaklar/:/Scientific Sources/);
  }
});
