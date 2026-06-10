let allPlaces = [];
let currentFilter = 'all';
let currentIslandRegion = 'all';
const themeGrid = document.getElementById('themeGrid');
const placeGrid = document.getElementById('placeGrid');
const filterActions = document.getElementById('filterActions');
const islandRegionActions = document.getElementById('islandRegionActions');

function countByTheme(id){ return allPlaces.filter(p => (p.themeId || p.category) === id).length; }
function countByIslandRegion(id){ return allPlaces.filter(p => (p.themeId || p.category)==='island' && (id==='all' || p.islandRegionId===id)).length; }

function renderThemes(){
  themeGrid.innerHTML = WALKGOO_THEMES.map(t => `
    <button class="theme-card" data-theme="${t.id}">
      <div class="icon">${t.icon}</div>
      <h3>${t.name}</h3>
      <p>${t.desc || ''}</p>
      <small>${countByTheme(t.id)}개 데이터</small>
    </button>`).join('');
  document.querySelectorAll('.theme-card').forEach(b => b.onclick = () => filterPlaces(b.dataset.theme));
}

function renderChips(){
  filterActions.innerHTML = `<button class="chip ${currentFilter==='all'?'active':''}" data-filter="all">전체 ${allPlaces.length}</button>` +
    WALKGOO_THEMES.map(t => `<button class="chip ${currentFilter===t.id?'active':''}" data-filter="${t.id}">${t.name} ${countByTheme(t.id)}</button>`).join('');
  document.querySelectorAll('.chip').forEach(c => c.onclick = () => filterPlaces(c.dataset.filter));
  renderIslandRegions();
}

function renderIslandRegions(){
  if(!islandRegionActions) return;
  if(currentFilter !== 'island'){
    islandRegionActions.innerHTML = '';
    islandRegionActions.style.display = 'none';
    return;
  }
  islandRegionActions.style.display = 'flex';
  islandRegionActions.innerHTML = `<button class="chip region-chip ${currentIslandRegion==='all'?'active':''}" data-region="all">섬 전체 ${countByIslandRegion('all')}</button>` +
    ISLAND_REGIONS.map(r => `<button class="chip region-chip ${currentIslandRegion===r.id?'active':''}" data-region="${r.id}">${r.name} ${countByIslandRegion(r.id)}</button>`).join('');
  document.querySelectorAll('.region-chip').forEach(c => c.onclick = () => {
    currentIslandRegion = c.dataset.region;
    renderChips();
    renderPlaces(getFilteredPlaces());
  });
}

function getFilteredPlaces(){
  let list = currentFilter === 'all' ? allPlaces : allPlaces.filter(p => (p.themeId || p.category) === currentFilter);
  if(currentFilter === 'island' && currentIslandRegion !== 'all') list = list.filter(p => p.islandRegionId === currentIslandRegion);
  return list;
}

function attachCardEvents(list){
  document.querySelectorAll('.fav-btn').forEach(b => b.onclick = () => { toggleFav(b.dataset.id); renderPlaces(list); });
  document.querySelectorAll('.detail-link').forEach(a => a.onclick = () => {
    const p = allPlaces.find(x => x.id === a.dataset.placeId);
    if(p) saveLastPlace(p);
  });
}

function cardHtml(item) {
  const category = item.themeId || item.category || 'trail';

  const labelMap = {
    trail: '코리아둘레길',
    water: '저수지·호수길',
    reservoir: '저수지·호수길',
    lake: '저수지·호수길',
    island: '섬 여행',
    oreum: '제주 오름',
    urban: '도시 산책길'
  };

  const iconMap = {
    trail: '🥾',
    water: '🏞️',
    reservoir: '🏞️',
    lake: '🏞️',
    island: '🏝️',
    oreum: '⛰️',
    urban: '🚶'
  };

  const label = labelMap[category] || '걷기길';
  const icon = iconMap[category] || '🥾';

  const hasImage =
    item.image &&
    String(item.image).trim() !== '' &&
    !String(item.image).includes('undefined');

  return `
    <article class="place-card" data-id="${item.id}">
      <a class="detail-link" href="detail.html?id=${encodeURIComponent(item.id)}" data-place-id="${item.id}">
        <div class="place-thumb">
          ${
            hasImage
              ? `<img src="${item.image}" alt="${item.title}" onerror="this.parentElement.innerHTML='<div class=&quot;thumb-placeholder&quot;>${icon}</div>';">`
              : `<div class="thumb-placeholder">${icon}</div>`
          }
        </div>

        <div class="place-body">
          <div class="place-meta">
            ${label}${item.region ? ' · ' + item.region : ''}${item.zone ? ' · ' + item.zone : ''}
          </div>

          <h3>${item.title || '이름 없음'}</h3>

          <p>
            ${item.summary || item.description || '걷기 여행 후보지입니다. 상세 정보는 공식 안내를 확인하세요.'}
          </p>
        </div>
      </a>

      <div class="place-actions">
        <button class="fav-btn" data-id="${item.id}">
          ${isFav(item.id) ? '★ 저장됨' : '☆ 즐겨찾기'}
        </button>
      </div>
    </article>
  `;
}

function renderPlaces(list = allPlaces){
  placeGrid.innerHTML = list.map(cardHtml).join('') || '<div class="loading">표시할 API 데이터가 없습니다.</div>';
  attachCardEvents(list);
}

function filterPlaces(theme){
  currentFilter = theme;
  currentIslandRegion = 'all';
  renderChips();
  renderPlaces(getFilteredPlaces());
  document.getElementById('places').scrollIntoView({behavior:'smooth'});
}

document.getElementById('searchForm').onsubmit = e => {
  e.preventDefault();
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  const list = allPlaces.filter(p => [p.title,p.region,p.summary,p.keyword,p.islandRegionName,(p.tags||[]).join(' ')].join(' ').toLowerCase().includes(q));
  currentFilter = 'all'; currentIslandRegion = 'all'; renderChips(); renderPlaces(list);
  document.getElementById('places').scrollIntoView({behavior:'smooth'});
};

document.getElementById('reloadButton').onclick = async () => loadData(true);
document.getElementById('aiButton').onclick = async () => {
  const v = document.getElementById('aiPrompt').value.trim();
  document.getElementById('aiResult').textContent = '추천을 만드는 중입니다...';
  document.getElementById('aiResult').textContent = await aiRecommend(v, allPlaces);
};

async function loadData(force=false){
  placeGrid.innerHTML = '<div class="loading">WalkGoo 캐시/보강 데이터와 선택적 API 데이터를 불러오는 중입니다...</div>';
  try{
    allPlaces = await fetchWalkgooPlaces(force);
    renderThemes(); renderChips(); renderPlaces(allPlaces);
    document.getElementById('placeSubTitle').textContent = `캐시/보강/API를 병합한 ${allPlaces.length}개 데이터입니다. API 한도 초과 시에도 캐시 데이터로 표시됩니다.`;
  }catch(e){
    renderThemes(); renderChips();
    placeGrid.innerHTML = `<div class="error-box"><b>데이터를 가져오지 못했습니다.</b><br>${e.message}<br><br>data/merged/walkgoo_places.json 또는 data/custom/*.json을 확인해 주세요.</div>`;
    document.getElementById('placeSubTitle').textContent = '캐시 또는 보강 데이터 확인이 필요합니다.';
  }
}

loadData();