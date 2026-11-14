import{cp,mkdir,readFile,writeFile,rm}from'node:fs/promises';
import{execFileSync}from'node:child_process';
const out=new URL('../dist/',import.meta.url);await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
for(const x of ['index.html','sources.html','styles.css','planner.css','DATA_SOURCES.md','science-points.json','jezero-science-points.json','_headers'])await cp(new URL('../'+x,import.meta.url),new URL(x,out));
for(const folder of ['src','public'])await cp(new URL('../'+folder,import.meta.url),new URL(folder+'/',out),{recursive:true});
const git=(args)=>execFileSync('git',args,{cwd:new URL('../',import.meta.url),encoding:'utf8'}).trim();
const commit=process.env.CF_PAGES_COMMIT_SHA||git(['rev-parse','HEAD']);
const dirty=!process.env.CF_PAGES_COMMIT_SHA&&git(['status','--porcelain','--untracked-files=no']).length>0;
const id=`${commit.slice(0,12)}${dirty?'-local':''}`;
await writeFile(new URL('build-info.json',out),JSON.stringify({id,commit,localWorkingTree:dirty,builtAt:new Date().toISOString()},null,2)+'\n');
// Validate required entry points; this no-dependency build is directly statically hostable.
for(const x of ['index.html','sources.html','planner.css','_headers','build-info.json','src/main.js','src/engine/routing.js','src/data/science-catalog.js','src/data/donki.js','src/data/briefing.js','science-points.json','jezero-science-points.json','public/mars-demo-terrain.webp','public/mars-demo-elevation.webp','public/mars-demo-thermal.webp','public/data/mission-pack.json','public/data/mars-optical.webp','public/data/mars-elevation.webp'])await readFile(new URL(x,out));
console.log(`ARES static build written to dist/ (${id})`);
