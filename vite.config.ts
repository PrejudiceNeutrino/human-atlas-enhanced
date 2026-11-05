import type {IncomingMessage,ServerResponse} from 'node:http';
import {fileURLToPath} from 'node:url';
import {defineConfig,loadEnv,type Plugin} from 'vite';
import {localGalleryPlugin} from './scripts/local-gallery-plugin';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
const path=(relative:string)=>fileURLToPath(new URL(relative,import.meta.url));
// Mirror the deployment redirect before Vite's HTML fallback, in dev and preview.
function redirectRoot(req:IncomingMessage,res:ServerResponse,next:()=>void){
 const url=new URL(req.url??'/', 'http://localhost');
 if(url.pathname!=='/'){next();return;}
 res.writeHead(307,{Location:'/male'+url.search,'Cache-Control':'no-store'});
 res.end();
}
const modelRedirect:Plugin={
 name:'model-root-redirect',
 configureServer(server){server.middlewares.use(redirectRoot);},
 configurePreviewServer(server){server.middlewares.use(redirectRoot);},
};
export default defineConfig(({command,mode,isPreview})=>{
 const localGallery=command==='serve'&&!isPreview&&mode!=='production'&&loadEnv(mode,path('./'),'HUMAN_ATLAS_').HUMAN_ATLAS_LOCAL_GALLERY==='1';
 return {root:path('./web'),publicDir:path('./public'),plugins:[modelRedirect,localGalleryPlugin(path('./'),localGallery),react()],define:{__LOCAL_GALLERY_ENABLED__:JSON.stringify(localGallery)},resolve:{alias:{'@':path('./')}},css:{postcss:{plugins:[tailwindcss()]}},server:{watch:{usePolling:true},fs:{deny:['.env','.env.*','*.{crt,pem}','**/.git/**','**/.local-gallery/**']}},build:{outDir:path('./dist'),emptyOutDir:true}};
});
