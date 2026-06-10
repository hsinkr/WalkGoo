const CFG = window.WALKGOO_CONFIG || {};
const API_CACHE_KEY = 'walkgoo_places_v9';
const API_CACHE_TIME_KEY = 'walkgoo_places_v9_time';
const MEMORY_TTL_MS = 1000 * 60 * 60 * 24;

function favs(){ return JSON.parse(localStorage.getItem('walkgoo_favs') || '[]'); }
function isFav(id){ return favs().includes(String(id)); }
function toggleFav(id){
  const sid = String(id);
  const a = favs();
  const i = a.indexOf(sid);
  i >= 0 ? a.splice(i,1) : a.push(sid);
  localStorage.setItem('walkgoo_favs', JSON.stringify(a));
  return a.includes(sid);
}
function stripHtml(v=''){ return String(v).replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').trim(); }
function compact(arr){ return arr.filter(Boolean).join(' '); }
function debugLog(...args){ if(CFG.DEBUG_API) console.log('[WalkGoo]', ...args); }
function debugWarn(...args){ if(CFG.DEBUG_API) console.warn('[WalkGoo]', ...args); }

async function loadJson(path, fallback=null){
  try{
    const r = await fetch(path + '?v=' + Date.now(), {cache:'no-store'});
    if(!r.ok) throw new Error(`${path} HTTP ${r.status}`);
    return await r.json();
  }catch(e){
    debugWarn('JSON 로드 실패:', e.message);
    return fallback;
  }
}

function normalizeServiceKey(key){
  const v = String(key || '').trim();
  if(!v) return '';
  return v.includes('%') ? v : encodeURIComponent(v);
}
function apiUrl(base, path, params, serviceKey){
  const sp = new URLSearchParams();
  Object.entries(params || {}).forEach(([k,v]) => { if(v !== undefined && v !== null && v !== '') sp.set(k, v); });
  sp.set('MobileOS','ETC'); sp.set('MobileApp','WalkGoo'); sp.set('_type','json');
  return `${base}${path}?${sp.toString()}&serviceKey=${normalizeServiceKey(serviceKey)}`;
}
async function fetchJson(url, label){
  debugLog(label, url.replace(/serviceKey=.*/, 'serviceKey=***'));
  const r = await fetch(url);
  const text = await r.text();
  if(!r.ok) throw new Error(`${label} HTTP 오류: ${r.status}`);
  let j;
  try { j = JSON.parse(text); }
  catch(e){ throw new Error(`${label} JSON 응답 아님: ${stripHtml(text).slice(0,180)}`); }
  const h = j?.response?.header;
  if(h && h.resultCode && h.resultCode !== '0000') throw new Error(`${label} API 오류: ${h.resultCode} / ${h.resultMsg || ''}`);
  return j;
}
function getTheme(id){ return (window.WALKGOO_THEMES || []).find(t=>t.id===id) || {id, name:id, icon:'📍'}; }
function inferTheme(text=''){
  if(/오름|올레/.test(text)) return 'oreum';
  if(/섬|도$|울릉|우도|가파|덕적|청산|비진/.test(text)) return 'island';
  if(/저수지|호수|수변|호반|생태|하천/.test(text)) return 'water';
  if(/공원|도시|산책/.test(text)) return 'urban';
  return 'trail';
}
function inferIslandRegion(place){
  if(place.themeId !== 'island') return '';
  const txt = [place.title, place.region, place.zone, (place.tags||[]).join(' ')].join(' ');
  const found = (window.ISLAND_REGIONS||[]).find(r => r.areas.some(a=>txt.includes(a)) || r.keywords.some(k=>txt.includes(k)) || txt.includes(r.name));
  return found ? found.id : 'etc';
}
function islandRegionName(id){ return ((window.ISLAND_REGIONS||[]).find(x=>x.id===id)||{}).name || (id==='etc'?'기타':''); }

function normalizePlace(p){
  const themeId = p.themeId || p.category || inferTheme([p.title,p.region,p.summary].join(' '));
  const theme = getTheme(themeId);
  const id = String(p.id || p.contentid || `${themeId}-${p.title}-${p.region}`).replace(/\s+/g,'-');
  const out = {
    id,
    source: p.source || 'cache',
    themeId,
    themeName: p.themeName || theme.name,
    title: p.title || p.routeNm || p.crsKorNm || '이름 없음',
    region: p.region || p.sigun || p.addr1 || '지역 정보 확인 필요',
    summary: p.summary || p.description || p.overview || p.region || '',
    image: p.image || p.firstimage || p.firstimage2 || '',
    difficulty: p.difficulty || '정보 확인 필요',
    duration: p.duration || p.routeTime || '정보 확인 필요',
    distance: p.distance || p.routeDstnc || '정보 확인 필요',
    parking: p.parking || '정보 확인 필요',
    toilet: p.toilet || '정보 확인 필요',
    lat: Number(p.lat || p.mapy || p.latitude || 0),
    lng: Number(p.lng || p.mapx || p.longitude || 0),
    contentid: p.contentid || '',
    contenttypeid: p.contenttypeid || '',
    tel: p.tel || '',
    tags: [...new Set([...(p.tags||[]), p.source || 'WalkGoo', theme.name].filter(Boolean))],
    description: p.description || p.summary || '',
    points: p.points || ['방문 전 최신 교통편, 운영 정보, 기상 상황을 확인하세요.'],
    cautions: p.cautions || ['API/캐시/보강 데이터를 병합한 정보이므로 현장 정보와 다를 수 있습니다.']
  };
  out.islandRegionId = p.islandRegionId || inferIslandRegion(out);
  out.islandRegionName = p.islandRegionName || islandRegionName(out.islandRegionId);
  if(out.islandRegionName) out.tags = [...new Set([...out.tags, out.islandRegionName])];
  return out;
}
function dedupePlaces(list){
  const m = new Map();
  list.map(normalizePlace).forEach(p => {
    const key = p.contentid || `${p.title}-${p.region}`;
    if(!m.has(key)) m.set(key,p);
    else m.set(key, {...m.get(key), ...p, tags:[...new Set([...(m.get(key).tags||[]), ...(p.tags||[])])]});
  });
  return [...m.values()];
}

async function loadCachePlaces(){
  const merged = await loadJson('data/merged/walkgoo_places.json');
  if(merged?.places?.length) return merged.places;
  const files = ['reservoir_trails.json','islands.json','jeju_oreums.json'];
  const parts = await Promise.all(files.map(f => loadJson(`data/custom/${f}`, [])));
  return parts.flat();
}

async function searchTourApiKeyword(keyword, themeId){
  if(!CFG.TOUR_API_KEY) return [];
  const url = apiUrl(CFG.TOUR_API_BASE || 'https://apis.data.go.kr/B551011/KorService2', '/searchKeyword2', {
    numOfRows: 30, pageNo: 1, arrange: 'O', keyword
  }, CFG.TOUR_API_KEY);
  const j = await fetchJson(url, `TourAPI ${keyword}`);
  let items = j?.response?.body?.items?.item || [];
  if(!Array.isArray(items)) items = items ? [items] : [];
  return items.map(item => normalizePlace({
    id:'tour-' + (item.contentid || `${themeId}-${item.title}`), source:'TourAPI', themeId,
    contentid:item.contentid, contenttypeid:item.contenttypeid, title:item.title,
    region:compact([item.addr1,item.addr2]) || '지역 정보 확인 필요', summary:compact([item.addr1,item.addr2]) || keyword,
    image:item.firstimage || item.firstimage2 || '', lat:item.mapy, lng:item.mapx, tel:item.tel, tags:[keyword]
  }));
}

async function fetchBrowserApiPlaces(){
  if(!CFG.ALLOW_BROWSER_API) return [];
  const jobs = [];
  Object.entries(window.TOURAPI_KEYWORDS || {}).forEach(([themeId, keywords]) => keywords.slice(0,5).forEach(k => jobs.push(searchTourApiKeyword(k, themeId))));
  const settled = await Promise.allSettled(jobs);
  const failed = settled.filter(x=>x.status==='rejected');
  if(failed.length) debugWarn('브라우저 API 실패', failed.map(x=>x.reason.message));
  return settled.flatMap(x=>x.status==='fulfilled'?x.value:[]);
}

async function fetchWalkgooPlaces(force=false){
  if(!force){
    const t = Number(localStorage.getItem(API_CACHE_TIME_KEY) || 0);
    const cached = localStorage.getItem(API_CACHE_KEY);
    if(cached && Date.now() - t < MEMORY_TTL_MS) return JSON.parse(cached);
  }
  const cache = CFG.USE_CACHE_JSON !== false ? await loadCachePlaces() : [];
  const live = await fetchBrowserApiPlaces();
  const places = dedupePlaces([...cache, ...live]);
  localStorage.setItem(API_CACHE_KEY, JSON.stringify(places));
  localStorage.setItem(API_CACHE_TIME_KEY, String(Date.now()));
  if(!places.length) throw new Error('표시할 데이터가 없습니다. data/merged/walkgoo_places.json 또는 data/custom/*.json을 확인하세요.');
  return places;
}

async function fetchTourDetail(contentid, contenttypeid){
  if(!CFG.TOUR_API_KEY || !contentid) return null;
  const url = apiUrl(CFG.TOUR_API_BASE || 'https://apis.data.go.kr/B551011/KorService2', '/detailCommon2', {
    contentId: contentid, contentTypeId: contenttypeid || '', defaultYN:'Y', firstImageYN:'Y', areacodeYN:'Y', catcodeYN:'Y', addrinfoYN:'Y', mapinfoYN:'Y', overviewYN:'Y'
  }, CFG.TOUR_API_KEY);
  const j = await fetchJson(url, '상세정보');
  let item = j?.response?.body?.items?.item || null;
  if(Array.isArray(item)) item = item[0];
  return item;
}
function saveLastPlace(p){ sessionStorage.setItem('walkgoo_last_detail', JSON.stringify(p)); }
function findCachedPlace(id){
  const cached = JSON.parse(localStorage.getItem(API_CACHE_KEY) || '[]');
  return cached.find(p => p.id === id) || JSON.parse(sessionStorage.getItem('walkgoo_last_detail') || 'null');
}
function cardHtml(p){
  const sourceLabel = p.source === 'custom' ? '보강 데이터' : p.source === 'TourAPI' ? 'TourAPI' : p.source === 'Durunubi' ? '두루누비' : '캐시 데이터';
  return `<article class="place-card" data-theme="${p.themeId}">
    <a href="detail.html?id=${encodeURIComponent(p.id)}" data-place-id="${p.id}" class="detail-link">
      <div class="thumb">${p.image ? `<img src="${p.image}" alt="${p.title}">` : ''}<span>${p.themeName || 'WalkGoo'}</span></div>
    </a>
    <div class="place-body">
      <span class="api-badge">${sourceLabel}</span>
      <h3>${p.title}</h3>
      <p>${p.summary || p.region}</p>
      <div class="meta"><b>${p.region}</b><b>${p.distance}</b><b>${p.duration}</b>${p.islandRegionName ? `<b>${p.islandRegionName}</b>` : ''}</div>
      <div class="card-actions"><a class="btn primary detail-link" data-place-id="${p.id}" href="detail.html?id=${encodeURIComponent(p.id)}">상세보기</a><button class="btn fav-btn" data-id="${p.id}">${isFav(p.id) ? '★ 저장됨' : '☆ 즐겨찾기'}</button></div>
    </div>
  </article>`;
}
async function aiRecommend(prompt, places){
  if(CFG.AI_PROXY_URL){
    try{
      const r = await fetch(CFG.AI_PROXY_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt,places})});
      const j = await r.json(); return j.answer || j.message || 'AI 응답을 해석하지 못했습니다.';
    }catch(e){ return 'AI 프록시 호출 중 오류가 발생했습니다. ' + e.message; }
  }
  const q = (prompt || '').toLowerCase();
  let list = places.filter(p => [p.title,p.region,p.summary,(p.tags||[]).join(' ')].join(' ').toLowerCase().includes(q));
  if(!list.length){
    if(q.includes('오름') || q.includes('제주')) list = places.filter(p=>p.themeId==='oreum');
    else if(q.includes('섬') || q.includes('바다')) list = places.filter(p=>p.themeId==='island');
    else if(q.includes('호수') || q.includes('저수지') || q.includes('수변')) list = places.filter(p=>p.themeId==='water');
    else list = places.filter(p=>p.themeId==='trail');
  }
  return list.slice(0,5).map((p,i)=>`${i+1}. ${p.title}\n- 지역: ${p.region}\n- 거리/시간: ${p.distance} / ${p.duration}\n- 추천 이유: ${p.summary}`).join('\n\n') || '조건에 맞는 추천지가 없습니다.';
}
