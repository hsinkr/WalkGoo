// main.js에서 기존 loadData 부분을 아래 형태로 바꾸면 됩니다.
// 이미 fetchWalkgooPlaces()를 호출하고 있다면 이 파일은 참고만 하세요.

let WALKGOO_PLACES = [];

async function loadData() {
  const listEl = document.querySelector('#placeList, .place-list, #cards');
  const countEl = document.querySelector('#totalCount, .total-count');

  try {
    WALKGOO_PLACES = await fetchWalkgooPlaces();

    if (countEl) {
      countEl.textContent = `${WALKGOO_PLACES.length}건`;
    }

    renderThemeCounts(WALKGOO_PLACES);
    renderPlaces(WALKGOO_PLACES);

  } catch (e) {
    console.error(e);
    if (listEl) {
      listEl.innerHTML = `
        <div class="empty">
          데이터를 불러오지 못했습니다.<br>
          data/custom/*.json 파일 위치를 확인해 주세요.
        </div>
      `;
    }
  }
}

function renderThemeCounts(places) {
  const counts = getWalkgooThemeCounts(places);

  document.querySelectorAll('[data-theme-count]').forEach(el => {
    const id = el.getAttribute('data-theme-count');
    el.textContent = counts[id] || 0;
  });
}

function renderPlaces(places) {
  const listEl = document.querySelector('#placeList, .place-list, #cards');
  if (!listEl) return;

  if (!places.length) {
    listEl.innerHTML = '<div class="empty">표시할 데이터가 없습니다.</div>';
    return;
  }

  listEl.innerHTML = places.map(p => `
    <article class="place-card">
      <div class="place-thumb">
        ${p.image ? `<img src="${p.image}" alt="${p.title}">` : `<div class="thumb-placeholder">${iconFor(p.category)}</div>`}
      </div>
      <div class="place-body">
        <div class="place-meta">${labelFor(p.category)} · ${p.region || ''} ${p.zone ? '· ' + p.zone : ''}</div>
        <h3>${p.title}</h3>
        <p>${p.summary || '걷기 여행 후보지입니다. 상세 정보는 공식 안내를 확인하세요.'}</p>
        <div class="tags">
          ${(p.tags || []).slice(0, 4).map(t => `<span>${t}</span>`).join('')}
        </div>
      </div>
    </article>
  `).join('');
}

function iconFor(category) {
  return {
    trail: '🥾',
    water: '🏞️',
    reservoir: '🏞️',
    island: '🏝️',
    oreum: '⛰️',
    urban: '🚶'
  }[category] || '🥾';
}

function labelFor(category) {
  return {
    trail: '코리아둘레길',
    water: '저수지·호수길',
    reservoir: '저수지·호수길',
    island: '섬 여행',
    oreum: '제주 오름',
    urban: '도시 산책길'
  }[category] || '걷기길';
}

document.addEventListener('DOMContentLoaded', loadData);
