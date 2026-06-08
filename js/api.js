
const CFG = window.WALKGOO_CONFIG || {};
const API_CACHE_KEY = 'walkgoo_api_places_v4';
const API_CACHE_TIME_KEY = 'walkgoo_api_places_v4_time';
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
function apiUrl(path, params){
  const url = new URL((CFG.TOUR_API_BASE || 'https://apis.data.go.kr/B551011/KorService2') + path);
  Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v));
  url.searchParams.set('serviceKey', CFG.TOUR_API_KEY || '');
  url.searchParams.set('MobileOS','ETC');
  url.searchParams.set('MobileApp','WalkGoo');
  url.searchParams.set('_type','json');
  return url;
}
function inferThemeByKeyword(keyword){
  const k = keyword || '';
  if((window.ISLAND_REGIONS||[]).some(r => r.keywords.some(x => k.includes(x))) || k.includes('섬')) return 'island';
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
async function searchKeyword(keyword, themeId){
  if(!CFG.TOUR_API_KEY) return [];
  const url = apiUrl('/searchKeyword2', {
    numOfRows:'12', pageNo:'1', arrange:'O', keyword
  });
  const r = await fetch(url);
  if(!r.ok) throw new Error(`TourAPI 호출 실패: ${r.status}`);
  const j = await r.json();
  const body = j?.response?.body;
  let items = body?.items?.item || [];
  if(!Array.isArray(items)) items = [items];
  return items.map(x => normalizeTourItem(x, themeId || inferThemeByKeyword(keyword), keyword));
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
  if(!CFG.TOUR_API_KEY) throw new Error('TourAPI 서비스키가 설정되지 않았습니다. js/config.sample.js의 TOUR_API_KEY에 키를 입력하세요.');
  const jobs = [];
  WALKGOO_THEME_QUERIES.forEach(theme => theme.keywords.forEach(keyword => jobs.push(searchKeyword(keyword, theme.id))));
  const settled = await Promise.allSettled(jobs);
  const places = dedupePlaces(settled.flatMap(x => x.status === 'fulfilled' ? x.value : []))
    .map(p => {
      p.islandRegionId = inferIslandRegion(p);
      p.islandRegionName = p.islandRegionId ? islandRegionName(p.islandRegionId) : '';
      if(p.islandRegionName) p.tags = [...new Set([...(p.tags||[]), p.islandRegionName])];
      return p;
    });
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
  const r = await fetch(url);
  const j = await r.json();
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
