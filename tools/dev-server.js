import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const types={'.html':'text/html; charset=utf-8','.md':'text/markdown; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon'};
const port=Number(process.env.PORT||4173);
const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url||'/',`http://${req.headers.host||'localhost'}`);
  const p=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(!p.startsWith(root+path.sep)&&p!==root){res.writeHead(403);res.end('Forbidden');return;}
  if(path.basename(p).startsWith('.')||p.includes(`${path.sep}tools${path.sep}`)||p.includes(`${path.sep}tests${path.sep}`)){res.writeHead(404);res.end('Not found');return;}
  try{const s=await stat(p);if(!s.isFile())throw new Error('not file');const content=await readFile(p);res.writeHead(200,{'Content-Type':types[path.extname(p)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(content);}
  catch{res.writeHead(404);res.end('Not found');}
});
server.listen(port,'0.0.0.0',()=>console.log(`ARES Mission Control → http://localhost:${port}`));
