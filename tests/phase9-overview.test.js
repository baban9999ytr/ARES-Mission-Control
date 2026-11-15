import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';

test('CTX overview is a measured context product that encloses the route-tested crop',async()=>{
  const overview=JSON.parse(await readFile('public/data/ctx-overview.json','utf8'));
  const pack=JSON.parse(await readFile('public/data/mission-pack.json','utf8'));
  assert.equal(overview.kind,'measured-context-only');
  assert.match(overview.routing,/unavailable/i);
  assert.equal(overview.crsWkt,pack.crsWkt);
  const a=overview.boundsMeters,b=pack.boundsMeters;
  assert.ok(a.west<b.west&&a.south<b.south&&a.east>b.east&&a.north>b.north);
  assert.equal((a.east-a.west)*(a.north-a.south),30000*22500);
  assert.equal(overview.demValidPixels,overview.widthPixels*overview.heightPixels);
  for(const name of ['optical','elevation']){
    const file=`public/data/ctx-overview-${name}.webp`;
    assert.ok((await stat(file)).size<1_000_000,`${file} must stay deployable`);
    assert.equal((await readFile(file)).toString('ascii',0,4),'RIFF');
  }
});

test('all 30 authored missions include nonempty Turkish research copy',async()=>{
  const catalog=JSON.parse(await readFile('data/scenarios/measured-missions.json','utf8'));
  assert.equal(catalog.missions.length,30);
  for(const mission of catalog.missions)for(const key of ['title_tr','objective_tr','researchQuestion_tr'])
    assert.ok(typeof mission[key]==='string'&&mission[key].trim(),`${mission.id} lacks ${key}`);
});
