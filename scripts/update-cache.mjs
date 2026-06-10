import fs from 'fs/promises';
import path from 'path';

const ROOT = process.cwd();
const TOUR_API_KEY = process.env.TOUR_API_KEY || '';
const DURUNUBI_API_KEY = process.env.DURUNUBI_API_KEY || '';
const TOUR_API_BASE = process.env.TOUR_API_BASE || 'https://apis.data.go.kr/B551011/KorService2';
const DURUNUBI_API_BASE = process.env.DURUNUBI_API_BASE || 'https://apis.data.go.kr/B551011/DurunubiService';
const DELAY_MS = Number(process.env.API_DELAY_MS || 700);

const themes = {
  trail: ['둘레길','해파랑길','남파랑길','서해랑길','코리아둘레길','지리산 둘레길','북한산 둘레길','한양도성길','DMZ 평화의 길'],
  water: ['저수지 둘레길','호수 둘레길','수변길','호반길','생태탐방로','산책로','구이저수지'],
  island: ['덕적도','백령도','선유도','청산도','비진도','울릉도','우도','가파도','마라도','홍도','흑산도','거문도','금오도','사량도','욕지도','매물도'],
  oreum: ['제주 오름','오름','제주 올레길','올레길','용눈이오름','다랑쉬오름','새별오름','금오름'],
  urban: ['도시 산책길','하천 산책로','공원 산책로']
};
const themeNames = {trail:'코리아둘레길', water:'저수지·호수길', island:'섬 여행', oreum:'제주 오름', urban:'도시 산책길'};

function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }
function key(k){ return String(k||'').includes('%') ? k : encodeURIComponent(k); }
function stripHtml(v=''){ return String(v).replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').trim(); }
function compact(arr){ return arr.filter(Boolean).join(' '); }
async function readJson(file, fallback=[]){
  try { return JSON.parse(await fs.readFile(path.join(ROOT,file),'utf-8')); }
  catch { return fallback; }
}
async function writeJson(file, data){
  const full=path.join(ROOT,file); await fs.mkdir(path.dirname(full), {recursive:true});
  await fs.writeFile(full, JSON.stringify(data,null,2), 'utf-8');
}
async function fetchJson(url, label){
  const res = await fetch(url);
  const text = await res.text();
  if(!res.ok) throw new Error(`${label} HTTP ${res.status}: ${text.slice(0,120)}`);
  try { return JSON.parse(text); }
  catch { throw new Error(`${label} JSON 아님: ${stripHtml(text).slice(0,120)}`); }
}
function normalizeTourItem(item, themeId, keyword){
  return {
    id:'tour-' + (item.contentid || `${themeId}-${item.title}`), source:'TourAPI', themeId, themeName:themeNames[themeId],
    contentid:item.contentid || '', contenttypeid:item.contenttypeid || '', title:item.title || '이름 없음',
    region:compact([item.addr1,item.addr2]) || '지역 정보 확인 필요', summary:compact([item.addr1,item.addr2]) || keyword,
    image:item.firstimage || item.firstimage2 || '', lat:Number(item.mapy)||0, lng:Number(item.mapx)||0,
    tel:item.tel || '', distance:'정보 확인 필요', duration:'정보 확인 필요', difficulty:'정보 확인 필요',
    tags:['TourAPI', themeNames[themeId], keyword].filter(Boolean)
  };
}
async function searchTour(keyword, themeId){
  if(!TOUR_API_KEY) return [];
  const sp = new URLSearchParams({numOfRows:'30',pageNo:'1',arrange:'O',keyword,MobileOS:'ETC',MobileApp:'WalkGoo',_type:'json'});
  const url = `${TOUR_API_BASE}/searchKeyword2?${sp.toString()}&serviceKey=${key(TOUR_API_KEY)}`;
  await sleep(DELAY_MS);
  const j = await fetchJson(url, `TourAPI ${keyword}`);
  const h=j?.response?.header;
  if(h?.resultCode && h.resultCode !== '0000') throw new Error(`TourAPI ${keyword}: ${h.resultCode} ${h.resultMsg}`);
  let items=j?.response?.body?.items?.item || [];
  if(!Array.isArray(items)) items=items?[items]:[];
  return items.map(x=>normalizeTourItem(x, themeId, keyword));
}
function normalizeDurunubi(item){
  const title = item.routeNm || item.crsKorNm || item.courseNm || item.name || '두루누비 코스';
  return {
    id:'duru-' + (item.routeIdx || item.crsIdx || item.courseIdx || title), source:'Durunubi', themeId:'trail', themeName:'코리아둘레길',
    title, region:item.sigun || item.signguNm || item.areaNm || '지역 정보 확인 필요',
    summary:item.routeIntrcn || item.crsSummary || item.summary || '두루누비 정보 서비스에서 가져온 걷기길 데이터입니다.',
    image:item.routeImg || item.imgPath || item.firstimage || '',
    distance:item.routeDstnc ? `${item.routeDstnc}km` : (item.crsDstnc || '정보 확인 필요'), duration:item.routeTime || item.crsTotlRqrmHour || '정보 확인 필요',
    difficulty:item.level || item.crsLevel || '정보 확인 필요', lat:Number(item.latitude || item.mapY || 0), lng:Number(item.longitude || item.mapX || 0),
    tags:['두루누비','코리아둘레길']
  };
}
async function fetchDurunubi(pathName){
  if(!DURUNUBI_API_KEY) return [];
  const sp = new URLSearchParams({numOfRows:'200',pageNo:'1',MobileOS:'ETC',MobileApp:'WalkGoo',_type:'json'});
  const url = `${DURUNUBI_API_BASE}/${pathName}?${sp.toString()}&serviceKey=${key(DURUNUBI_API_KEY)}`;
  await sleep(DELAY_MS);
  const j = await fetchJson(url, `Durunubi ${pathName}`);
  let items=j?.response?.body?.items?.item || [];
  if(!Array.isArray(items)) items=items?[items]:[];
  return items.map(normalizeDurunubi);
}
function dedupe(list){
  const m=new Map();
  for(const p of list){
    const k=p.contentid || `${p.title}-${p.region}`;
    if(!m.has(k)) m.set(k,p);
  }
  return [...m.values()];
}

const errors=[];
const customFiles=['data/custom/reservoir_trails.json','data/custom/islands.json','data/custom/jeju_oreums.json'];
const custom=(await Promise.all(customFiles.map(f=>readJson(f,[])))).flat();

const tour=[];
for(const [themeId, keywords] of Object.entries(themes)){
  for(const kw of keywords){
    try{ tour.push(...await searchTour(kw, themeId)); }
    catch(e){ errors.push(e.message); console.warn(e.message); }
  }
}
const duru=[];
for(const ep of ['routeList','courseList']){
  try{ duru.push(...await fetchDurunubi(ep)); }
  catch(e){ errors.push(e.message); console.warn(e.message); }
}
const generatedAt=new Date().toISOString();
await writeJson('data/cache/tourapi_cache.json', {generatedAt, count:tour.length, places:dedupe(tour), errors:errors.filter(x=>x.includes('TourAPI'))});
await writeJson('data/cache/durunubi_cache.json', {generatedAt, count:duru.length, places:dedupe(duru), errors:errors.filter(x=>x.includes('Durunubi'))});
const merged=dedupe([...custom, ...duru, ...tour]);
await writeJson('data/merged/walkgoo_places.json', {generatedAt, count:merged.length, places:merged, errors});
console.log(`WalkGoo cache updated: custom=${custom.length}, durunubi=${duru.length}, tourapi=${tour.length}, merged=${merged.length}`);
if(errors.length) console.log('errors:', errors.slice(0,10));
