// WalkGoo 공통 저장소/즐겨찾기 헬퍼
// index.html, detail.html, favorites.html 모두에서 사용합니다.

const API_CACHE_KEY = 'WALKGOO_PLACES_CACHE';
const FAV_KEY = 'WALKGOO_FAVORITES';
const LAST_PLACE_KEY = 'WALKGOO_LAST_PLACE';

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (e) {
    console.warn('[WalkGoo] localStorage read error:', key, e);
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('[WalkGoo] localStorage write error:', key, e);
  }
}

function favs() {
  return readJson(FAV_KEY, []).map(String);
}

function isFav(id) {
  return favs().includes(String(id));
}

function toggleFav(id) {
  const key = String(id);
  const list = favs();
  const next = list.includes(key)
    ? list.filter(x => x !== key)
    : [...list, key];

  writeJson(FAV_KEY, next);
  return next.includes(key);
}

function savePlacesCache(places) {
  if (Array.isArray(places)) {
    writeJson(API_CACHE_KEY, places);
  }
}

function loadPlacesCache() {
  return readJson(API_CACHE_KEY, []);
}

function saveLastPlace(place) {
  if (place) {
    writeJson(LAST_PLACE_KEY, place);
  }
}

function loadLastPlace() {
  return readJson(LAST_PLACE_KEY, null);
}

function findCachedPlace(id) {
  const key = String(id || '');
  const places = loadPlacesCache();

  return places.find(p => String(p.id) === key)
      || loadLastPlace();
}

function stripHtml(value) {
  return String(value || '').replace(/<[^>]*>/g, '').trim();
}
