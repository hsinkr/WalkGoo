
let p = findCachedPlace(new URLSearchParams(location.search).get('id'));
async function enrich(){
  if(!p) return;
  try{
    const d = await fetchTourDetail(p.contentid, p.contenttypeid);
    if(d){
      p = {...p,
        title: d.title || p.title,
        region: [d.addr1,d.addr2].filter(Boolean).join(' ') || p.region,
        image: d.firstimage || d.firstimage2 || p.image,
        lat: Number(d.mapy) || p.lat,
        lng: Number(d.mapx) || p.lng,
        tel: d.tel || p.tel,
        description: stripHtml(d.overview) || p.description,
        summary: stripHtml(d.overview)?.slice(0,120) || p.summary
      };
      saveLastPlace(p);
    }
  }catch(e){ console.warn(e); }
}

function render() {
  const el = document.getElementById('detail');

  if (!p) {
    el.innerHTML = `
      <h1>상세 정보를 찾을 수 없습니다.</h1>
      <p>목록에서 다시 선택해 주세요.</p>
    `;
    return;
  }

  const categoryName = getCategoryName(p);
  const tags = Array.isArray(p.tags) ? p.tags : [];
  const points = Array.isArray(p.points) ? p.points : [];
  const cautions = Array.isArray(p.cautions) ? p.cautions : [];

  el.innerHTML = `
    <div class="detail-hero">
      ${
        p.image
          ? `<img src="${p.image}" alt="${p.title}">`
          : `<div class="detail-placeholder">${getCategoryIcon(p)}</div>`
      }
    </div>

    <h1>${p.title || '이름 없음'}</h1>

    <p class="muted">
      ${[p.region, p.zone].filter(Boolean).join(' · ')}
    </p>

    <p>
      ${p.description || p.summary || '상세 설명 정보가 없습니다.'}
    </p>

    <div class="meta">
      <b>${categoryName}</b>
      ${p.distance ? `<b>${p.distance}</b>` : ''}
      ${p.duration ? `<b>${p.duration}</b>` : ''}
      ${p.difficulty ? `<b>${p.difficulty}</b>` : ''}
      ${p.source ? `<b>${p.source}</b>` : ''}
    </div>

    ${
      tags.length
        ? `<div class="tags detail-tags">
            ${tags.map(tag => `<span>${tag}</span>`).join('')}
          </div>`
        : ''
    }

    <h2>추천 포인트</h2>
    ${
      points.length
        ? `<ul class="list">${points.map(x => `<li>${x}</li>`).join('')}</ul>`
        : `<p class="muted">등록된 추천 포인트가 없습니다.</p>`
    }

    <h2>주의사항</h2>
    ${
      cautions.length
        ? `<ul class="list">${cautions.map(x => `<li>${x}</li>`).join('')}</ul>`
        : `<p class="muted">방문 전 배편, 기상, 출입 가능 여부를 확인하세요.</p>`
    }

    <button class="btn fav-btn" data-id="${p.id}">
      ${isFav(p.id) ? '★ 저장됨' : '☆ 즐겨찾기'}
    </button>
  `;

  document.querySelector('.fav-btn').onclick = () => {
    toggleFav(p.id);
    render();
  };

  renderMap();
}

function getCategoryName(p) {
  const key = p.themeId || p.category;

  const map = {
    trail: '코리아둘레길',
    water: '저수지·호수길',
    reservoir: '저수지·호수길',
    lake: '저수지·호수길',
    river: '저수지·호수길',
    island: '섬 여행',
    oreum: '제주 오름',
    urban: '도시 산책길'
  };

  return p.themeName || map[key] || '걷기 여행';
}

function getCategoryIcon(p) {
  const key = p.themeId || p.category;

  const map = {
    trail: '🥾',
    water: '🏞️',
    reservoir: '🏞️',
    lake: '🏞️',
    river: '🏞️',
    island: '🏝️',
    oreum: '⛰️',
    urban: '🚶'
  };

  return map[key] || '🥾';
}

function renderMap(){
  const help = document.getElementById('mapHelp'), box = document.getElementById('map');
  
  if(!p?.lat || !p?.lng){ box.textContent='좌표 정보가 없습니다.'; return; }
  if(!CFG.KAKAO_JS_KEY){
    box.innerHTML = `<a class="btn primary" target="_blank" href="https://map.kakao.com/link/map/${encodeURIComponent(p.title)},${p.lat},${p.lng}">카카오맵에서 보기</a>`;
    help.textContent = 'KAKAO_JS_KEY를 입력하면 페이지 안에 지도가 표시됩니다.'; return;
  }
  
  const s = document.createElement('script');
  s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${CFG.KAKAO_JS_KEY}&autoload=false`;
  s.onload = () => kakao.maps.load(() => {
    const pos = new kakao.maps.LatLng(p.lat,p.lng);
    const map = new kakao.maps.Map(box,{center:pos,level:4});
    new kakao.maps.Marker({map,position:pos,title:p.title});
  });
  
  document.head.appendChild(s);
}

(async()=>{ render(); await enrich(); render(); })();
