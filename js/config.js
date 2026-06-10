window.WALKGOO_CONFIG = {
  // 한국관광공사 TourAPI 서비스키
  // 중요: data.go.kr에서 받은 Decoding 키를 권장합니다.
  // 이미 %2F, %3D 같은 문자가 들어있는 Encoding 키도 자동 처리합니다.
  TOUR_API_KEY: 'EHUKk9PAVNzpXikgwOdKVxbYhgfzW8SLrkVLV8KhaKOk29bX9hDaGMwXjQWEnarNUejsgLD9T2yrBLdsCH2KTA==',
  TOUR_API_BASE: 'https://apis.data.go.kr/B551011/KorService2',

  KAKAO_JS_KEY: '',
  AI_PROXY_URL: '',

  // API 호출 문제 확인용. true면 브라우저 개발자도구 Console에 상세 로그 표시
  DEBUG_API: true,

  // TourAPI 429 방지 설정
  // 기본은 순차 호출입니다. 너무 느리면 2까지만 올려보세요.
  API_CONCURRENCY: 1,
  API_DELAY_MS: 700,
  API_RETRY_COUNT: 2,
  API_RETRY_DELAY_MS: 3500,
  API_ROWS: 50,

  // true로 바꾸면 결과 0건 키워드에 한해 contentTypeId 보조 조회를 합니다.
  // 호출 수가 늘어나므로 429가 잦으면 false 유지 권장
  API_TYPE_FALLBACK: false,
  API_MAX_TYPE_FALLBACK: 1
};
