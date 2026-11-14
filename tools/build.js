import{cp,mkdir,readFile,writeFile,rm}from'node:fs/promises';
const out=new URL('../dist/',import.meta.url);await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
for(const x of ['index.html','sources.html','styles.css','planner.css','DATA_SOURCES.md','science-points.json','jezero-science-points.json'])await cp(new URL('../'+x,import.meta.url),new URL(x,out));
for(const folder of ['src','public'])await cp(new URL('../'+folder,import.meta.url),new URL(folder+'/',out),{recursive:true});
// Validate required entry points; this no-dependency build is directly statically hostable.
for(const x of ['index.html','planner.css','src/main.js','src/engine/routing.js','src/data/science-catalog.js','src/data/donki.js','src/data/briefing.js','science-points.json','jezero-science-points.json','public/mars-demo-terrain.webp','public/data/mission-pack.json'])await readFile(new URL(x,out));
console.log('ARES static build written to dist/');
