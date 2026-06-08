# WalkGoo v3

## 변경 내용
- 정적 PLACES 데이터 제거
- 둘레길/섬 여행/올레길·오름 목록을 TourAPI `searchKeyword2`로 동적 조회
- 테마 카드와 필터 버튼도 API 결과 개수 기준으로 표시
- 상세 화면에서 `detailCommon2`로 추가 상세 정보 보강
- API 결과를 LocalStorage에 6시간 캐시
- 즐겨찾기는 API 캐시 데이터 기준으로 동작

## 설정
`js/config.sample.js`에 TourAPI 서비스키를 입력하세요.

```js
TOUR_API_KEY: '발급받은 TourAPI Decoding 서비스키'
```

GitHub Pages에 올리면 브라우저에서 직접 API를 호출합니다. 서비스키 노출이 걱정되면 백엔드 프록시를 두는 구조로 바꾸는 것이 좋습니다.
