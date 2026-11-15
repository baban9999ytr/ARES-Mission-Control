import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../planner.css',import.meta.url),'utf8');
const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');

test('primary workflow is mission, map, then comparison with compact library',()=>{
  const mission=html.indexOf('aria-label="Mission planning"');
  const map=html.indexOf('aria-label="Interactive Mars surface map"');
  const compare=html.indexOf('aria-label="Route comparison"');
  assert.ok(mission>=0&&mission<map&&map<compare);
  assert.match(html,/<button id="missionNew"[^>]*>\+ New Mission<\/button>/);
  assert.match(html,/<button id="missionLibraryOpen"[^>]*>Choose Existing Mission<\/button>/);
  assert.match(html,/<details id="missionDrawer" class="library-drawer">/);
  assert.match(html,/id="missionSearch" type="search"/);
  assert.doesNotMatch(html,/<details id="missionDrawer"[^>]*open/);
});

test('editing controls appear only with an active custom mission and add mode is temporary',()=>{
  assert.match(html,/<div id="missionEditor" hidden>/);
  assert.match(html,/id="missionAdd"[^>]*>\+ Add Stop/);
  assert.match(main,/\$\('#missionEditor'\)\.hidden=!active/);
  assert.match(main,/editor\.mode='edit';calculateRoutes\(\);renderMissionLibrary\(\)/);
  assert.match(main,/nearestCustomStop\(e,stage\.getBoundingClientRect\(\)\)/);
  assert.match(main,/else if\(drag\.kind==='pan'&&drag\.moved\)/);
  assert.match(main,/stage\.addEventListener\('wheel'/);
  assert.match(main,/if\(adding\)applyCustomEdit\(\{type:'add',point:state\.keyboardCell\}\)/);
});

test('secondary tools are disclosed and comparison states both route limits',()=>{
  assert.match(html,/<details class="sidebar-disclosure" id="researchDrawer">/);
  assert.match(html,/<details class="sidebar-disclosure" id="advancedDrawer">/);
  assert.match(html,/Shortest Route/);
  assert.match(html,/Terrain-Preferred Route/);
  assert.match(html,/Terrain preference uses illustrative slope weighting and does not certify EVA safety/);
  assert.match(css,/@media\(max-width:720px\)\{\.tool-panel\{display:contents\}/);
});
