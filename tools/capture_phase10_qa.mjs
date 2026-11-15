import {chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';

const out=new URL('../docs/phase10/screenshots/',import.meta.url);
await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true});
for(const [label,url] of [['before','https://spcapps.openstacktool.com/'],['after','http://127.0.0.1:4173/']]){
  const context=await browser.newContext({viewport:{width:1440,height:900},locale:'en-US',deviceScaleFactor:1});
  const page=await context.newPage();
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.locator('#missionStatus').getByText(/30/).waitFor();
  await page.screenshot({path:new URL(`${label}-desktop-first-screen.png`,out).pathname});
  await page.setViewportSize({width:768,height:1024});
  await page.locator(label==='after'?'#juryExample':'#recommendedDemo').click();
  await page.locator('#routeContext').getByText(/SC-01/).waitFor();
  if(label==='after')await page.locator('#routeDecision').scrollIntoViewIfNeeded();
  else await page.locator('#routeContext').scrollIntoViewIfNeeded();
  await page.screenshot({path:new URL(`${label}-tablet-sc01.png`,out).pathname,fullPage:true});
  console.log(`${label}: ${await page.title()} · ${await page.locator('#routeContext').textContent()}`);
  await context.close();
}
await browser.close();
