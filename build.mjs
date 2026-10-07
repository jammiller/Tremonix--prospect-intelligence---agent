import {mkdir,copyFile} from 'node:fs/promises';
import {build} from 'esbuild';
await mkdir('dist',{recursive:true});
for (const file of ['index.html','style.css']) await copyFile(file,`dist/${file}`);
const url=process.env.NEXT_PUBLIC_SUPABASE_URL||'';
const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY||'';
if(key && !key.startsWith('sb_publishable_')) {
 let payload;try{payload=JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString());}catch{}
 if(payload?.role!=='anon')throw new Error('Only a Supabase publishable or legacy anon key may be exposed.');
}
await build({entryPoints:['app.js'],bundle:true,format:'esm',outfile:'dist/app.js',define:{'__SUPABASE_URL__':JSON.stringify(url),'__SUPABASE_KEY__':JSON.stringify(key)}});
