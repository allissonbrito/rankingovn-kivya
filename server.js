import express from 'express';
import * as cheerio from 'cheerio';
const app=express(); const PORT=process.env.PORT||3000;
const sourceUrl='https://olhonavaga.com.br/rankings/ranking?id=94548';
const candidate='kivya larissy';
let latest={checkedAt:null,source:sourceUrl,candidate,position:null,participants:null,inscritos:null,vagas2:null,vagasFinal:null,onvScoreVisible:false,note:'Aguardando primeira consulta.'};
const num=s=>s?Number(s.replace(/\./g,'')):null;
async function refresh(){try{
 const r=await fetch(sourceUrl,{headers:{'User-Agent':'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1','Accept':'text/html,application/xhtml+xml','Accept-Language':'pt-BR,pt;q=0.9,en;q=0.8'}});
 if(!r.ok) throw new Error(`HTTP ${r.status}`);
 const html=await r.text(); const $=cheerio.load(html); const text=$('body').text().replace(/\s+/g,' ').trim(); const lower=text.toLowerCase();
 let position=null; const idx=lower.indexOf(candidate);
 if(idx>=0){ const before=text.slice(Math.max(0,idx-180),idx); const matches=[...before.matchAll(/(\d+)\s*º/g)]; if(matches.length) position=Number(matches.at(-1)[1]); }
 const participants=num((text.match(/participantes\s+([\d.]+)/i)||[])[1]);
 const inscritos=num((text.match(/inscritos\s+([\d.]+)\s+oficiais/i)||[])[1]);
 const vagas2=num((text.match(/vagas\s+2ª\s+etapa\s+([\d.]+)/i)||[])[1]);
 const vagasFinal=num((text.match(/vagas\s+finais\s+([\d.]+)/i)||[])[1]);
 latest={checkedAt:new Date().toISOString(),source:sourceUrl,candidate,position,participants,inscritos,vagas2,vagasFinal,onvScoreVisible:false,note:position?`Kivya localizada em ${position}º no ranking público do ONV.`:`Página recebida (${html.length} bytes), mas Kivya não foi localizada.`};
 }catch(e){latest={...latest,checkedAt:new Date().toISOString(),note:`Falha ao consultar ONV: ${e.message}`};}
}
app.use(express.static('public'));
app.get('/api/status',(q,s)=>s.json({latest,localEstimate:{exam1:{score:54,correct:87,wrong:33,blank:0},exam2:{score:70,correct:95,wrong:25,blank:0}}}));
app.post('/api/refresh',async(q,s)=>{await refresh();s.json({latest});});
app.get('/health',(q,s)=>s.json({ok:true,latest}));
refresh(); setInterval(refresh,(Number(process.env.REFRESH_MINUTES)||15)*60000);
app.listen(PORT,'0.0.0.0',()=>console.log(`Kivya dashboard on ${PORT}`));