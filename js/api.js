const CFG = window.WALKGOO_CONFIG || {};
const API_CACHE_KEY = 'walkgoo_api_places_v8_durunubi';
const API_CACHE_TIME_KEY = 'walkgoo_api_places_v8_durunubi_time';
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

function sleep(ms){ return new Promise(resolve => setTimeout(resolve, ms)); }

async function fetchJson(url, label){
  const retryCount = Number(CFG.API_RETRY_COUNT ?? 2);
  const retryDelay = Number(CFG.API_RETRY_DELAY_MS ?? 3500);

  for(let attempt=0; attempt<=retryCount; attempt++){
    debugLog(`${label} attempt ${attempt+1}/${retryCount+1}`, url.replace(/serviceKey=.*/, 'serviceKey=***'));
    const r = await fetch(url);
    const text = await r.text();

    if(r.status === 429){
      const wait = retryDelay * (attempt + 1);
      debugWarn(`${label} HTTP 429: 호출 제한으로 ${wait}ms 대기 후 재시도`);
      if(attempt < retryCount){
        await sleep(wait);
        continue;
      }
      throw new Error(`${label} HTTP 오류: 429`);
    }

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

async function allSettledLimited(tasks, limit=1){
  const results = new Array(tasks.length);
  let next = 0;
  const delay = Number(CFG.API_DELAY_MS ?? 700);

  async function worker(){
    while(next < tasks.length){
      const idx = next++;
      if(delay > 0) await sleep(delay);
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
  // 429 방지를 위해 기본 검색은 contentTypeId를 넣지 않는 '전체' 1회 호출만 수행합니다.
  // 필요 시 부족한 키워드에 한해 보조 조회할 때만 아래 분류를 사용합니다.
  if(themeId === 'trail') return ['25','12','28'];
  if(themeId === 'olle') return ['12','25'];
  if(themeId === 'island') return ['12'];
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
  // 중요: v6의 keyword × contentTypeId 동시 다중 호출 방식은 HTTP 429를 유발했습니다.
  // v7은 먼저 '전체' 1회만 조회하고, 결과가 없을 때만 선택적으로 1~2회 보조 조회합니다.
  let result = [];

  try{
    result = await searchKeywordOnce(keyword, themeId, '', CFG.API_ROWS || '50');
  }catch(e){
    debugWarn(`키워드 ${keyword} 전체 검색 실패`, e?.message || e);
  }

  if(themeId === 'trail') result = result.filter(isTrailLike);
  result = dedupePlaces(result);

  const allowFallback = String(CFG.API_TYPE_FALLBACK || 'false').toLowerCase() === 'true';
  if(result.length > 0 || !allowFallback) return result;

  const maxFallback = Number(CFG.API_MAX_TYPE_FALLBACK || 1);
  const fallbackTypes = contentTypesForTheme(themeId).slice(0, maxFallback);
  const more = [];
  for(const ct of fallbackTypes){
    await sleep(Number(CFG.API_DELAY_MS ?? 700));
    try{
      more.push(...await searchKeywordOnce(keyword, themeId, ct, CFG.API_ROWS || '50'));
    }catch(e){
      debugWarn(`키워드 ${keyword}/${ct} 보조 검색 실패`, e?.message || e);
    }
  }

  result = dedupePlaces([...result, ...more]);
  if(themeId === 'trail') result = result.filter(isTrailLike);
  return result;
}



// -----------------------------------------------------------------------------
// 두루누비 API 연동
// 한국관광공사_두루누비 정보 서비스_GW
// Base URL: https://apis.data.go.kr/B551011/Durunubi
// 주요 오퍼레이션: /courseList, /routeList
// -----------------------------------------------------------------------------
function durunubiApiUrl(path, params){
  const base = (CFG.DURUNUBI_API_BASE || 'https://apis.data.go.kr/B551011/Durunubi') + path;
  const sp = new URLSearchParams();
  Object.entries(params || {}).forEach(([k,v]) => {
    if(v !== undefined && v !== null && v !== '') sp.set(k, v);
  });
  // 두루누비 GW도 MobileOS/MobileApp/_type/json 형식을 받도록 구성합니다.
  // 일부 명세에서는 필수값이 아니어도 넣어도 무해한 공통 파라미터입니다.
  sp.set('MobileOS','ETC');
  sp.set('MobileApp','WalkGoo');
  sp.set('_type','json');
  const key = CFG.DURUNUBI_API_KEY || CFG.TOUR_API_KEY;
  return `${base}?${sp.toString()}&serviceKey=${normalizeServiceKey(key)}`;
}

function pick(obj, names, fallback=''){
  for(const name of names){
    const v = obj?.[name];
    if(v !== undefined && v !== null && String(v).trim() !== '') return v;
  }
  return fallback;
}
function toNum(v){
  const n = Number(String(v ?? '').replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}
function extractItemsFromAnyResponse(j){
  let items = j?.response?.body?.items?.item;
  if(items === undefined) items = j?.response?.body?.items;
  if(items === undefined) items = j?.items?.item || j?.items || j?.data || j?.result || j?.list;
  if(Array.isArray(items)) return items;
  if(items && typeof items === 'object') return [items];
  return [];
}
function routeNameFromText(txt){
  const t = String(txt || '');
  if(t.includes('해파랑')) return '해파랑길';
  if(t.includes('남파랑')) return '남파랑길';
  if(t.includes('서해랑')) return '서해랑길';
  if(t.includes('DMZ') || t.includes('평화')) return 'DMZ 평화의 길';
  return '코리아둘레길';
}
function normalizeDurunubiCourse(item, routeHint=''){
  const title = String(pick(item, [
    'crsKorNm','courseNm','courseName','crsNm','cosNm','name','title','routeNm','routeName','pathNm','pathName'
  ], '코리아둘레길 코스')).trim();
  const routeName = String(pick(item, ['routeNm','routeName','brdDiv','lineNm','trailNm'], routeHint || routeNameFromText(title))).trim();
  const idRaw = pick(item, ['crsIdx','courseId','courseID','courseNo','cosIdx','routeIdx','id'], `${routeName}-${title}`);
  const region = compact([
    pick(item, ['sigun','signguNm','sigunguNm','areaNm','areaName','region','addr1','addr']),
    pick(item, ['emdNm','addr2'])
  ]) || routeName;
  const distanceRaw = pick(item, ['crsDstnc','distance','dist','courseDistance','totDistance','crsDstncText']);
  const timeRaw = pick(item, ['crsTotlRqrmHour','reqTime','duration','courseTime','time','crsRqrmHour']);
  const levelRaw = pick(item, ['crsLevel','difficulty','level','courseLevel']);
  const lat = toNum(pick(item, ['mapY','lat','latitude','startLat','bgngLat','y']));
  const lng = toNum(pick(item, ['mapX','lng','lon','longitude','startLon','bgngLot','x']));
  const image = pick(item, ['firstimage','firstImage','image','imageUrl','imgUrl','courseImg','thumbnail','thumbUrl']);
  const gpx = pick(item, ['gpxpath','gpxPath','gpxUrl','gpx','gpxFile']);
  const summary = stripHtml(pick(item, ['summary','overview','content','crsSummary','courseInfo','intro','description'], '')) || `${routeName} ${title}`;

  const distance = distanceRaw ? String(distanceRaw).replace(/km$/i,'') + (String(distanceRaw).match(/[a-z가-힣]/i) ? '' : 'km') : '정보 확인 필요';
  const duration = timeRaw ? String(timeRaw).replace(/시간$/,'') + (String(timeRaw).match(/[가-힣]/) ? '' : '시간') : '정보 확인 필요';
  const difficulty = levelRaw ? String(levelRaw) : '정보 확인 필요';

  return {
    id: 'durunubi-' + String(idRaw).replace(/\s+/g,'-'),
    source:'Durunubi', themeId:'trail', themeName:'둘레길', keyword: routeName,
    contentid:'', contenttypeid:'',
    title, region, summary, image,
    difficulty, duration, distance,
    parking:'정보 확인 필요', toilet:'정보 확인 필요',
    lat, lng,
    tel: pick(item, ['tel','phone']), zipcode: pick(item, ['zipcode','zip']),
    gpxUrl: gpx,
    islandRegionId:'', islandRegionName:'',
    tags: ['두루누비', routeName, '코리아둘레길'].filter(Boolean),
    description: summary,
    raw: item,
    points: [
      '한국관광공사 두루누비 API에서 가져온 코리아둘레길 코스 데이터입니다.',
      gpx ? 'GPX 경로 정보가 제공되는 코스입니다.' : '상세 경로는 두루누비 또는 현장 안내를 함께 확인하세요.'
    ],
    cautions: ['방문 전 코스 폐쇄, 기상 상황, 교통편을 다시 확인하세요.']
  };
}
async function fetchDurunubiList(path, label, params={}){
  const key = CFG.DURUNUBI_API_KEY || CFG.TOUR_API_KEY;
  if(!key) return [];
  const url = durunubiApiUrl(path, {
    numOfRows: CFG.DURUNUBI_ROWS || 300,
    pageNo: 1,
    ...params
  });
  const j = await fetchJson(url, label);
  const items = extractItemsFromAnyResponse(j);
  debugLog(label, 'items=', items.length);
  return items;
}
async function fetchDurunubiPlaces(){
  const enabled = String(CFG.USE_DURUNUBI_API ?? 'true').toLowerCase() !== 'false';
  if(!enabled) return [];
  const list = [];
  const errors = [];
  const routeMap = new Map();

  try{
    const routes = await fetchDurunubiList('/routeList', '두루누비 길 목록');
    routes.forEach(r => {
      const id = String(pick(r, ['routeIdx','routeId','id','routeNo'], '')).trim();
      const nm = String(pick(r, ['routeNm','routeName','name','title'], '')).trim();
      if(id || nm) routeMap.set(id || nm, nm || id);
    });
  }catch(e){
    errors.push(e?.message || String(e));
    debugWarn('두루누비 routeList 실패', e?.message || e);
  }

  try{
    const courses = await fetchDurunubiList('/courseList', '두루누비 코스 목록');
    courses.forEach(c => {
      const rid = String(pick(c, ['routeIdx','routeId','routeNo'], '')).trim();
      const routeHint = routeMap.get(rid) || '';
      list.push(normalizeDurunubiCourse(c, routeHint));
    });
  }catch(e){
    errors.push(e?.message || String(e));
    debugWarn('두루누비 courseList 실패', e?.message || e);
  }

  if(!list.length && errors.length){
    debugWarn('두루누비 API 결과 0건', errors);
  }
  return dedupePlaces(list).filter(isTrailLike);
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

  const hasTourKey = !!CFG.TOUR_API_KEY;
  const hasDurunubiKey = !!(CFG.DURUNUBI_API_KEY || CFG.TOUR_API_KEY);
  if(!hasTourKey && !hasDurunubiKey){
    throw new Error('API 서비스키가 설정되지 않았습니다. js/config.js의 TOUR_API_KEY 또는 DURUNUBI_API_KEY에 키를 입력하세요.');
  }

  let durunubiPlaces = [];
  let tourPlaces = [];
  const errors = [];

  // 1) 둘레길은 두루누비가 1차 데이터 소스입니다.
  //    코리아둘레길 284개 코스/GPX 정보 제공 API라 TourAPI 키워드 검색보다 누락이 적습니다.
  try{
    durunubiPlaces = await fetchDurunubiPlaces();
  }catch(e){
    errors.push('두루누비: ' + (e?.message || e));
  }

  // 2) TourAPI는 섬/오름/저수지 산책로 보강용으로 사용합니다.
  //    TourAPI 토큰 쿼터가 초과되어도 두루누비 데이터는 계속 표시되게 실패를 분리합니다.
  const useTourApi = String(CFG.USE_TOUR_API ?? 'true').toLowerCase() !== 'false';
  if(hasTourKey && useTourApi){
    const jobs = [];
    WALKGOO_THEME_QUERIES.forEach(theme => {
      // 두루누비에서 코리아둘레길을 가져오므로 TourAPI의 둘레길 키워드 호출은 기본적으로 줄입니다.
      // 저수지/호수/수변길 계열은 TourAPI에서 보강합니다.
      let keywords = theme.id === 'trail'
        ? unique(['구이저수지 둘레길','구이저수지','저수지 둘레길','호수 둘레길','호반길','수변길','수변 산책로','생태탐방로','산책로','청풍호 자드락길'])
        : theme.keywords;
      if(theme.id === 'trail' && String(CFG.TOUR_TRAIL_KEYWORDS_FULL || 'false').toLowerCase() === 'true'){
        keywords = trailKeywords();
      }
      unique(keywords).forEach(keyword => jobs.push(() => searchKeyword(keyword, theme.id)));
    });
    const settled = await allSettledLimited(jobs, Number(CFG.API_CONCURRENCY || 1));
    const failed = settled.filter(x => x.status === 'rejected');
    if(failed.length){
      const msgs = failed.map(x => x.reason?.message || x.reason);
      debugWarn('실패한 TourAPI 호출', msgs);
      errors.push(...msgs.slice(0, 3));
    }
    tourPlaces = settled.flatMap(x => x.status === 'fulfilled' ? x.value : []);
  }

  const places = dedupePlaces([...durunubiPlaces, ...tourPlaces])
    .map(p => {
      p.islandRegionId = inferIslandRegion(p);
      p.islandRegionName = p.islandRegionId ? islandRegionName(p.islandRegionId) : '';
      if(p.islandRegionName) p.tags = [...new Set([...(p.tags||[]), p.islandRegionName])];
      return p;
    });

  if(!places.length){
    throw new Error(`API 조회 결과가 0건입니다. ${errors.length ? '오류: ' + errors.join(' / ') : '두루누비/TourAPI 활용신청 상태와 서비스키를 확인하세요.'}`);
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
