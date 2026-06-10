window.WALKGOO_CONFIG = {
  // 브라우저에서 직접 API를 호출하지 않고 data/merged/walkgoo_places.json을 우선 사용합니다.
  // GitHub Actions 또는 scripts/update-cache.mjs에서 최신 데이터를 생성하는 구조입니다.
  TOUR_API_KEY: '',
  DURUNUBI_API_KEY: '',
  TOUR_API_BASE: 'https://apis.data.go.kr/B551011/KorService2',
  DURUNUBI_API_BASE: 'https://apis.data.go.kr/B551011/DurunubiService',

  USE_CACHE_JSON: true,
  ALLOW_BROWSER_API: false,
  USE_TOUR_API: true,
  USE_DURUNUBI_API: true,

  KAKAO_JS_KEY: '',
  AI_PROXY_URL: '',
  DEBUG_API: true
};
