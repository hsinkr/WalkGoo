# WalkGoo v2

## 주요 변경
- 상단 배너 높이 축소
- 테마 카드/장소 카드 디자인 개선
- TourAPI 동적 데이터 연동 구조 추가
- 카카오맵 연동 구조 추가
- LocalStorage 즐겨찾기 기능 추가
- GPT 기반 추천 AI 프록시 연결 구조 추가

## 설정
`js/config.sample.js` 파일에 키를 입력합니다.

```js
TOUR_API_KEY: '한국관광공사 TourAPI 서비스키',
KAKAO_JS_KEY: '카카오 JavaScript 키',
AI_PROXY_URL: '서버 프록시 주소'
```

> OpenAI API Key는 브라우저 JS에 직접 넣으면 노출됩니다. 반드시 서버 프록시를 통해 호출하세요.
