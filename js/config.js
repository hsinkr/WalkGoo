window.WALKGOO_CONFIG = {
  // 한국관광공사 TourAPI 서비스키
  // data.go.kr에서 받은 Decoding 키 권장. Encoding 키도 자동 처리합니다.
  TOUR_API_KEY: 'EHUKk9PAVNzpXikgwOdKVxbYhgfzW8SLrkVLV8KhaKOk29bX9hDaGMwXjQWEnarNUejsgLD9T2yrBLdsCH2KTA==',
  TOUR_API_BASE: 'https://apis.data.go.kr/B551011/KorService2',

  // 한국관광공사_두루누비 정보 서비스_GW
  // 비워두면 TOUR_API_KEY를 같이 사용합니다. 별도 키를 쓰려면 여기에 입력하세요.
  DURUNUBI_API_KEY: 'EHUKk9PAVNzpXikgwOdKVxbYhgfzW8SLrkVLV8KhaKOk29bX9hDaGMwXjQWEnarNUejsgLD9T2yrBLdsCH2KTA==',
  DURUNUBI_API_BASE: 'https://apis.data.go.kr/B551011/Durunubi',
  USE_DURUNUBI_API: true,
  DURUNUBI_ROWS: 300,

  // TourAPI는 섬/오름/저수지·호수 산책로 보강용으로 사용합니다.
  // TourAPI 쿼터 초과가 계속되면 false로 바꾸면 두루누비만 조회합니다.
  USE_TOUR_API: true,

  KAKAO_JS_KEY: '',
  AI_PROXY_URL: '',

  DEBUG_API: true,

  // 429 방지 설정
  API_CONCURRENCY: 1,
  API_DELAY_MS: 900,
  API_RETRY_COUNT: 1,
  API_RETRY_DELAY_MS: 5000,
  API_ROWS: 30,

  // true로 바꾸면 결과 0건 키워드에 한해 contentTypeId 보조 조회를 합니다.
  API_TYPE_FALLBACK: false,
  API_MAX_TYPE_FALLBACK: 1,

  // true면 TourAPI에서도 해파랑/남파랑/서해랑 전체 키워드를 다시 조회합니다.
  // 두루누비를 쓰는 경우 호출량 절약을 위해 false 권장
  TOUR_TRAIL_KEYWORDS_FULL: false
};
