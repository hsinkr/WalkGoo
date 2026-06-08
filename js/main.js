
let allPlaces = [];
let currentFilter = 'all';
const themeGrid = document.getElementById('themeGrid');
const placeGrid = document.getElementById('placeGrid');
const filterActions = document.getElementById('filterActions');

function countByTheme(id){ return allPlaces.filter(p=>p.themeId===id).length; }
function renderThemes(){
  themeGrid.innerHTML = WALKGOO_THEME_QUERIES.map(t => `
    <button class="theme-card" data-theme="${t.id}">
      <div class="icon">${t.icon}</div>
      <h3>${t.name}</h3>
      <p>${t.keywords.join(' · ')}</p>
      <small>${countByTheme(t.id)}개 API 결과</small>
    </button>`).join('');
  document.querySelectorAll('.theme-card').forEach(b => b.onclick = () => filterPlaces(b.dataset.theme));
}
function renderChips(){
  filterActions.innerHTML = `<button class="chip ${currentFilter==='all'?'active':''}" data-filter="all">전체 ${allPlaces.length}</button>` +
    WALKGOO_THEME_QUERIES.map(t => `<button class="chip ${currentFilter===t.id?'active':''}" data-filter="${t.id}">${t.name} ${countByTheme(t.id)}</button>`).join('');
  document.querySelectorAll('.chip').forEach(c => c.onclick = () => filterPlaces(c.dataset.filter));
}
function attachCardEvents(list){
  document.querySelectorAll('.fav-btn').forEach(b => b.onclick = () => { toggleFav(b.dataset.id); renderPlaces(list); });
  document.querySelectorAll('.detail-link').forEach(a => a.onclick = () => {
    const p = allPlaces.find(x => x.id === a.dataset.placeId);
    if(p) saveLastPlace(p);
  });
}
function renderPlaces(list = allPlaces){
  placeGrid.innerHTML = list.map(cardHtml).join('') || '<div class="loading">표시할 API 데이터가 없습니다.</div>';
  attachCardEvents(list);
}
function filterPlaces(theme){
  currentFilter = theme;
  renderChips();
  const list = theme === 'all' ? allPlaces : allPlaces.filter(p => p.themeId === theme);
  renderPlaces(list);
  document.getElementById('places').scrollIntoView({behavior:'smooth'});
}
document.getElementById('searchForm').onsubmit = e => {
  e.preventDefault();
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  const list = allPlaces.filter(p => [p.title,p.region,p.summary,p.keyword,(p.tags||[]).join(' ')].join(' ').toLowerCase().includes(q));
  currentFilter = 'all'; renderChips(); renderPlaces(list);
  document.getElementById('places').scrollIntoView({behavior:'smooth'});
};
document.getElementById('reloadButton').onclick = async () => loadData(true);
document.getElementById('aiButton').onclick = async () => {
  const v = document.getElementById('aiPrompt').value.trim();
  document.getElementById('aiResult').textContent = '추천을 만드는 중입니다...';
  document.getElementById('aiResult').textContent = await aiRecommend(v, allPlaces);
};
async function loadData(force=false){
  placeGrid.innerHTML = '<div class="loading">TourAPI에서 둘레길·섬·올레길·오름 데이터를 가져오는 중입니다...</div>';
  try{
    allPlaces = await fetchWalkgooPlaces(force);
    renderThemes(); renderChips(); renderPlaces(allPlaces);
    document.getElementById('placeSubTitle').textContent = `한국관광공사 TourAPI에서 가져온 ${allPlaces.length}개 데이터입니다.`;
  }catch(e){
    renderThemes(); renderChips();
    placeGrid.innerHTML = `<div class="error-box"><b>API 데이터를 가져오지 못했습니다.</b><br>${e.message}<br><br>js/config.sample.js 파일에 TOUR_API_KEY를 입력한 뒤 다시 배포해 주세요.</div>`;
    document.getElementById('placeSubTitle').textContent = 'TourAPI 서비스키 설정이 필요합니다.';
  }
}
loadData();
