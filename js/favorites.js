
const ids = favs();
const places = JSON.parse(localStorage.getItem(API_CACHE_KEY) || '[]');
const list = places.filter(p => ids.includes(String(p.id)));
document.getElementById('placeGrid').innerHTML = list.map(cardHtml).join('') || '<p>아직 즐겨찾기한 여행지가 없습니다.</p>';
document.querySelectorAll('.fav-btn').forEach(b => b.onclick = () => { toggleFav(b.dataset.id); location.reload(); });
document.querySelectorAll('.detail-link').forEach(a => a.onclick = () => { const p = list.find(x=>x.id===a.dataset.placeId); if(p) saveLastPlace(p); });
