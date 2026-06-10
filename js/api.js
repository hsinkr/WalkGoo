const CFG = window.WALKGOO_CONFIG || {};
const API_CACHE_KEY = 'walkgoo_api_places_v6';
const API_CACHE_TIME_KEY = 'walkgoo_api_places_v6_time';
const CACHE_TTL_MS = 1000 * 60 * 60 * 6;

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
function debugLog(...args){ if(CFG.DEBUG_API) console.log('[WalkGoo API]', ...args); }
function debugWarn(...args){ if(CFG.DEBUG_API) console.warn('[WalkGoo API]', ...args); }

function normalizeServiceKey(key){
  const v = String(key || '').trim();
  if(!v) return '';
  // data.go.kr Encoding 키는 이미 %2F, %3D 형태입니다. 다시 encodeURIComponent 하면 인증 실패합니다.
  if(v.includes('%')) return v;
  // Decoding 키는 URL에 넣기 위해 한 번만 인코딩합니다.
  return encodeURIComponent(v);
}

function apiUrl(path, params){
  const base = (CFG.TOUR_API_BASE || 'https://apis.data.go.kr/B551011/KorService2') + path;
  const sp = new URLSearchParams();
  Object.entries(params || {}).forEach(([k,v]) => {
    if(v !== undefined && v !== null && v !== '') sp.set(k, v);
  });
  sp.set('MobileOS','ETC');
  sp.set('MobileApp','WalkGoo');
  sp.set('_type','json');
  // serviceKey는 URLSearchParams에 넣지 않고 수동으로 붙입니다. Encoding 키 이중 인코딩 방지 목적입니다.
  return `${base}?${sp.toString()}&serviceKey=${normalizeServiceKey(CFG.TOUR_API_KEY)}`;
}

async function fetchJson(url, label){
  debugLog(label, url.replace(/serviceKey=.*/, 'serviceKey=***'));
  const r = await fetch(url);
  const text = await r.text();
  if(!r.ok) throw new Error(`${label} HTTP 오류: ${r.status}`);
  let j;
  try { j = JSON.parse(text); }
  catch(e){
    const msg = stripHtml(text).slice(0, 220) || text.slice(0, 220);
    throw new Error(`${label} JSON 응답이 아닙니다. 서비스키/권한/URL을 확인하세요. 응답: ${msg}`);
  }
  const header = j?.response?.header;
  if(header && header.resultCode && header.resultCode !== '0000'){
    throw new Error(`${label} API 오류: ${header.resultCode} / ${header.resultMsg || '메시지 없음'}`);
  }
  return j;
}

function inferThemeByKeyword(keyword){
  const k = keyword || '';
  if((window.ISLAND_REGIONS||[]).some(r => r.keywords.some(x => k.includes(x))) || k.includes('섬') || k.includes('도')) return 'island';
  if(k.includes('오름') || k.includes('올레') || (window.OREUM_KEYWORDS||[]).some(x => k.includes(x))) return 'olle';
  return 'trail';
}
function inferIslandRegion(place){
  if(place.themeId !== 'island') return '';
  const txt = [place.title, place.region, place.keyword].join(' ');
  const found = (window.ISLAND_REGIONS||[]).find(r =>
    r.areas.some(a => txt.includes(a)) || r.keywords.some(k => txt.includes(k))
  );
  return found ? found.id : 'etc';
}
function islandRegionName(id){
  const r = (window.ISLAND_REGIONS||[]).find(x => x.id === id);
  return r ? r.name : '기타';
}
function themeName(id){ return (WALKGOO_THEME_QUERIES.find(t=>t.id===id)||{}).name || id; }

function normalizeTourItem(item, themeId, keyword){
  const id = 'api-' + (item.contentid || `${themeId}-${item.title}`);
  const region = compact([item.addr1, item.addr2]) || item.areacode || '지역 정보 확인 필요';
  return {
    id, source:'TourAPI', themeId, themeName: themeName(themeId), keyword,
    contentid: item.contentid || '', contenttypeid: item.contenttypeid || '',
    title: item.title || '이름 없음', region,
    summary: region,
    image: item.firstimage || item.firstimage2 || '',
    difficulty:'정보 확인 필요', duration:'정보 확인 필요', distance:'정보 확인 필요', parking:'정보 확인 필요', toilet:'정보 확인 필요',
    lat: Number(item.mapy) || 0, lng: Number(item.mapx) || 0,
    tel: item.tel || '', zipcode: item.zipcode || '',
    islandRegionId:'', islandRegionName:'',
    tags: ['TourAPI', themeName(themeId), keyword].filter(Boolean),
    description: region,
    points: ['한국관광공사 TourAPI에서 가져온 동적 데이터입니다.'],
    cautions: ['방문 전 운영 시간, 교통편, 기상 상황을 다시 확인하세요.']
  };
}

const EXTRA_TRAIL_KEYWORDS = [
  // 장거리 걷기길
  '해파랑길','해파랑길 코스','남파랑길','남파랑길 코스','서해랑길','서해랑길 코스','코리아둘레길',
  '지리산둘레길','지리산 둘레길','북한산둘레길','북한산 둘레길','한양도성길','DMZ 평화의 길',
  '제주올레길','제주 올레길','갈맷길','대청호오백리길','대청호 오백리길',

  // 사용자가 요청한 저수지/호수/수변 걷기길 계열
  '구이저수지 둘레길','구이저수지','저수지 둘레길','호수 둘레길','호반길','수변길','수변 산책로',
  '생태탐방로','생태길','숲길','마실길','누리길','트레킹길','탐방로','산책로',
  '의암호 둘레길','옥정호 둘레길','세량지 산책로','주산지 산책로','청풍호 자드락길'
];

const TRAIL_TITLE_PATTERNS = [
  '둘레길','해파랑','남파랑','서해랑','코리아둘레','지리산둘레','북한산둘레','한양도성','DMZ 평화',
  '올레길','갈맷길','오백리길','자드락길','마실길','누리길','숲길','바람길','탐방로','트레킹','산책로',
  '저수지','호수','호반','수변','생태길','생태탐방','수목원','휴양림'
];

function unique(arr){ return [...new Set((arr || []).filter(Boolean))]; }

async function allSettledLimited(tasks, limit=8){
  const results = new Array(tasks.length);
  let next = 0;
  async function worker(){
    while(next < tasks.length){
      const idx = next++;
      try { results[idx] = { status:'fulfilled', value: await tasks[idx]() }; }
      catch(e){ results[idx] = { status:'rejected', reason:e }; }
    }
  }
  await Promise.all(Array.from({length: Math.min(limit, tasks.length)}, worker));
  return results;
}
function isTrailLike(place){
  if(place.themeId !== 'trail') return true;
  const txt = [place.title, place.region, place.summary, place.keyword, (place.tags||[]).join(' ')].join(' ');
  return TRAIL_TITLE_PATTERNS.some(k => txt.includes(k));
}
function trailKeywords(){
  const base = (window.WALKGOO_THEME_QUERIES || []).find(t => t.id === 'trail')?.keywords || [];
  return unique([...base, ...EXTRA_TRAIL_KEYWORDS]);
}
function contentTypesForTheme(themeId){
  // 12 관광지, 25 여행코스, 28 레포츠. 둘레길은 세 분류에 흩어져 있어 모두 조회합니다.
  if(themeId === 'trail') return ['12','25','28',''];
  // 오름/올레도 관광지·코스에 섞여 있어 12/25를 함께 조회합니다.
  if(themeId === 'olle') return ['12','25',''];
  // 섬은 관광지 중심이지만 누락 방지를 위해 전체 검색도 같이 수행합니다.
  if(themeId === 'island') return ['12',''];
  return ['12'];
}

async function searchKeywordOnce(keyword, themeId, contentTypeId, rows='100'){
  if(!CFG.TOUR_API_KEY) return [];
  const params = { numOfRows: rows, pageNo:'1', arrange:'O', keyword };
  if(contentTypeId) params.contentTypeId = contentTypeId;
  const url = apiUrl('/searchKeyword2', params);
  const label = `키워드검색(${keyword}${contentTypeId ? '/' + contentTypeId : '/전체'})`;
  const j = await fetchJson(url, label);
  const body = j?.response?.body;
  let items = body?.items?.item || [];
  const totalCount = Number(body?.totalCount || 0);
  if(!Array.isArray(items)) items = items ? [items] : [];
  debugLog(keyword, contentTypeId || '전체', 'totalCount=', totalCount, 'items=', items.length);
  return items.map(x => normalizeTourItem(x, themeId || inferThemeByKeyword(keyword), keyword));
}

async function searchKeyword(keyword, themeId){
  const types = contentTypesForTheme(themeId);
  const jobs = types.map(ct => searchKeywordOnce(keyword, themeId, ct));
  const settled = await Promise.allSettled(jobs);
  const failed = settled.filter(x => x.status === 'rejected');
  if(failed.length) debugWarn(`키워드 ${keyword} 일부 실패`, failed.map(x => x.reason?.message || x.reason));
  let result = dedupePlaces(settled.flatMap(x => x.status === 'fulfilled' ? x.value : []));
  if(themeId === 'trail') result = result.filter(isTrailLike);
  return result;
}

function dedupePlaces(list){
  const m = new Map();
  list.forEach(p => {
    const key = p.contentid || `${p.title}-${p.region}`;
    if(!m.has(key)) m.set(key, p);
  });
  return [...m.values()];
}

async function fetchWalkgooPlaces(force=false){
  if(!force){
    const t = Number(localStorage.getItem(API_CACHE_TIME_KEY) || 0);
    const cached = localStorage.getItem(API_CACHE_KEY);
    if(cached && Date.now() - t < CACHE_TTL_MS) return JSON.parse(cached);
  }
  if(!CFG.TOUR_API_KEY) throw new Error('TourAPI 서비스키가 설정되지 않았습니다. js/config.js의 TOUR_API_KEY에 키를 입력하세요.');
  const jobs = [];
  WALKGOO_THEME_QUERIES.forEach(theme => {
    const keywords = theme.id === 'trail' ? trailKeywords() : theme.keywords;
    unique(keywords).forEach(keyword => jobs.push(() => searchKeyword(keyword, theme.id)));
  });
  // data.go.kr/TourAPI 호출이 너무 한꺼번에 몰리면 실패/누락이 생길 수 있어 동시 호출 수를 제한합니다.
  const settled = await allSettledLimited(jobs, Number(CFG.API_CONCURRENCY || 8));
  const failed = settled.filter(x => x.status === 'rejected');
  if(failed.length) debugWarn('실패한 API 호출', failed.map(x => x.reason?.message || x.reason));
  const places = dedupePlaces(settled.flatMap(x => x.status === 'fulfilled' ? x.value : []))
    .map(p => {
      p.islandRegionId = inferIslandRegion(p);
      p.islandRegionName = p.islandRegionId ? islandRegionName(p.islandRegionId) : '';
      if(p.islandRegionName) p.tags = [...new Set([...(p.tags||[]), p.islandRegionName])];
      return p;
    });

  if(!places.length){
    const firstError = failed[0]?.reason?.message || '';
    throw new Error(`API 조회 결과가 0건입니다. ${firstError ? '첫 번째 오류: ' + firstError : '서비스키 권한, Encoding/Decoding 키, API 활용신청 상태를 확인하세요.'}`);
  }

  localStorage.setItem(API_CACHE_KEY, JSON.stringify(places));
  localStorage.setItem(API_CACHE_TIME_KEY, String(Date.now()));
  return places;
}

async function fetchTourDetail(contentid, contenttypeid){
  if(!CFG.TOUR_API_KEY || !contentid) return null;
  const url = apiUrl('/detailCommon2', {
    contentId: contentid,
    contentTypeId: contenttypeid || '',
    defaultYN:'Y', firstImageYN:'Y', areacodeYN:'Y', catcodeYN:'Y', addrinfoYN:'Y', mapinfoYN:'Y', overviewYN:'Y'
  });
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
  return `<article class="place-card" data-theme="${p.themeId}">
    <a href="detail.html?id=${encodeURIComponent(p.id)}" data-place-id="${p.id}" class="detail-link">
      <div class="thumb">${p.image ? `<img src="${p.image}" alt="${p.title}">` : ''}<span>${p.tags?.[1] || 'WalkGoo'}</span></div>
    </a>
    <div class="place-body">
      <span class="api-badge">API 동적 데이터</span>
      <h3>${p.title}</h3>
      <p>${p.summary || p.region}</p>
      <div class="meta"><b>${p.region}</b><b>${p.themeName || themeName(p.themeId)}</b>${p.islandRegionName ? `<b>${p.islandRegionName}</b>` : ''}<b>${p.keyword || ''}</b></div>
      <div class="card-actions"><a class="btn primary detail-link" data-place-id="${p.id}" href="detail.html?id=${encodeURIComponent(p.id)}">상세보기</a><button class="btn fav-btn" data-id="${p.id}">${isFav(p.id) ? '★ 저장됨' : '☆ 즐겨찾기'}</button></div>
    </div>
  </article>`;
}
async function aiRecommend(prompt, places){
  if(CFG.AI_PROXY_URL){
    try{
      const r = await fetch(CFG.AI_PROXY_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt,places})});
      const j = await r.json();
      return j.answer || j.message || 'AI 응답을 해석하지 못했습니다.';
    }catch(e){ return 'AI 프록시 호출 중 오류가 발생했습니다. ' + e.message; }
  }
  const q = (prompt || '').toLowerCase();
  let list = places.filter(p => [p.title,p.region,p.summary,(p.tags||[]).join(' ')].join(' ').toLowerCase().includes(q));
  if(!list.length){
    if(q.includes('오름') || q.includes('제주') || q.includes('올레')) list = places.filter(p=>p.themeId==='olle');
    else if(q.includes('섬') || q.includes('바다')) list = places.filter(p=>p.themeId==='island');
    else list = places.filter(p=>p.themeId==='trail');
  }
  return list.slice(0,3).map((p,i)=>`${i+1}. ${p.title}\n- 지역: ${p.region}\n- 테마: ${p.themeName}\n- 추천 이유: ${p.summary}`).join('\n\n') || '조건에 맞는 추천지가 없습니다.';
}
