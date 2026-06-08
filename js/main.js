let selectedTheme = 'all';
let searchKeyword = '';

const themeGrid = document.getElementById('themeGrid');
const placeGrid = document.getElementById('placeGrid');
const placeTitle = document.getElementById('placeTitle');
const placeSubTitle = document.getElementById('placeSubTitle');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const sortSelect = document.getElementById('sortSelect');
const filterChips = document.getElementById('filterChips');

function renderThemes() {
  themeGrid.innerHTML = THEMES.map(theme => `
    <article class="theme-card" onclick="selectTheme('${theme.id}')">
      <img src="${theme.image}" alt="${theme.name}" />
      <div class="theme-overlay">
        <span>${theme.icon}</span>
        <h3>${theme.name}</h3>
        <p>${theme.description}</p>
      </div>
    </article>
  `).join('');
}

function renderChips() {
  const chips = [{ id: 'all', name: '전체' }, ...THEMES.map(t => ({ id: t.id, name: `${t.icon} ${t.name}` }))];
  filterChips.innerHTML = chips.map(chip => `
    <button class="chip ${selectedTheme === chip.id ? 'active' : ''}" onclick="selectTheme('${chip.id}')">${chip.name}</button>
  `).join('');
}

function selectTheme(themeId) {
  selectedTheme = themeId;
  const theme = THEMES.find(t => t.id === themeId);
  placeTitle.textContent = theme ? `${theme.icon} ${theme.name}` : '추천 걷기 여행';
  placeSubTitle.textContent = theme ? theme.description : '처음 가도 부담 없는 대표 코스입니다.';
  renderChips();
  renderPlaces();
  document.querySelector('.place-section').scrollIntoView({ behavior: 'smooth' });
}

function getFilteredPlaces() {
  let result = [...PLACES];

  if (selectedTheme !== 'all') {
    result = result.filter(place => place.themeId === selectedTheme);
  }

  if (searchKeyword) {
    const keyword = searchKeyword.toLowerCase();
    result = result.filter(place =>
      place.title.toLowerCase().includes(keyword) ||
      place.region.toLowerCase().includes(keyword) ||
      place.summary.toLowerCase().includes(keyword) ||
      place.tags.join(' ').toLowerCase().includes(keyword)
    );
  }

  if (sortSelect.value === 'easy') {
    result.sort((a, b) => (a.difficulty === '쉬움' ? -1 : 1));
  } else if (sortSelect.value === 'time') {
    result.sort((a, b) => a.durationMin - b.durationMin);
  }

  return result;
}

function renderPlaces() {
  const places = getFilteredPlaces();

  if (places.length === 0) {
    placeGrid.innerHTML = '<div class="empty">검색 결과가 없습니다.</div>';
    return;
  }

  placeGrid.innerHTML = places.map(place => `
    <article class="place-card" onclick="location.href='detail.html?id=${place.id}'">
      <img src="${place.image}" alt="${place.title}" />
      <div class="place-body">
        <div class="place-meta">${place.region}</div>
        <h3>${place.title}</h3>
        <p>${place.summary}</p>
        <div class="info-row">
          <span>난이도 ${place.difficulty}</span>
          <span>${place.duration}</span>
        </div>
        <div class="tag-row">
          ${place.tags.slice(0, 3).map(tag => `<span>#${tag}</span>`).join('')}
        </div>
      </div>
    </article>
  `).join('');
}

function runSearch() {
  searchKeyword = searchInput.value.trim();
  selectedTheme = 'all';
  placeTitle.textContent = searchKeyword ? `'${searchKeyword}' 검색 결과` : '추천 걷기 여행';
  placeSubTitle.textContent = '입력한 키워드와 관련 있는 걷기 여행지입니다.';
  renderChips();
  renderPlaces();
  document.querySelector('.place-section').scrollIntoView({ behavior: 'smooth' });
}

searchBtn.addEventListener('click', runSearch);
searchInput.addEventListener('keydown', event => {
  if (event.key === 'Enter') runSearch();
});
sortSelect.addEventListener('change', renderPlaces);

renderThemes();
renderChips();
renderPlaces();
