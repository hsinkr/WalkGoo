const detailRoot = document.getElementById('detailRoot');
const params = new URLSearchParams(location.search);
const id = params.get('id');
const place = PLACES.find(item => item.id === id);

function renderNotFound() {
  detailRoot.innerHTML = `
    <section class="not-found">
      <h1>상세 정보를 찾을 수 없습니다.</h1>
      <p>선택한 여행지 정보가 없거나 주소가 잘못되었습니다.</p>
      <button onclick="location.href='index.html'">처음으로</button>
    </section>
  `;
}

function renderDetail() {
  const theme = THEMES.find(t => t.id === place.themeId);

  detailRoot.innerHTML = `
    <section class="detail-hero">
      <img src="${place.image}" alt="${place.title}" />
      <div class="detail-hero-text">
        <div class="breadcrumb">${theme ? theme.icon + ' ' + theme.name : '걷기 여행'}</div>
        <h1>${place.title}</h1>
        <p>${place.summary}</p>
      </div>
    </section>

    <section class="detail-grid">
      <article class="detail-main">
        <h2>소개</h2>
        <p>${place.description}</p>

        <h2>추천 포인트</h2>
        <ul>${place.points.map(point => `<li>${point}</li>`).join('')}</ul>

        <h2>주의사항</h2>
        <ul>${place.cautions.map(caution => `<li>${caution}</li>`).join('')}</ul>

        <h2>태그</h2>
        <div class="tag-row detail-tags">
          ${place.tags.map(tag => `<span>#${tag}</span>`).join('')}
        </div>
      </article>

      <aside class="detail-side">
        <h2>기본 정보</h2>
        <dl>
          <dt>지역</dt><dd>${place.region}</dd>
          <dt>난이도</dt><dd>${place.difficulty}</dd>
          <dt>소요시간</dt><dd>${place.duration}</dd>
          <dt>거리</dt><dd>${place.distance}</dd>
          <dt>주차</dt><dd>${place.parking}</dd>
          <dt>화장실</dt><dd>${place.toilet}</dd>
          <dt>추천 계절</dt><dd>${place.bestSeason}</dd>
          <dt>주소</dt><dd>${place.address}</dd>
        </dl>
        <a class="map-btn" href="${place.mapUrl}" target="_blank" rel="noopener">지도에서 보기</a>
      </aside>
    </section>
  `;
}

if (!place) renderNotFound();
else renderDetail();
