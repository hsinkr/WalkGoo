# WalkGoo v8 - Durunubi + TourAPI

## 변경 내용

- 한국관광공사_두루누비 정보 서비스_GW 연동 추가
- 두루누비 `/routeList`, `/courseList`를 이용해 코리아둘레길 코스 데이터를 우선 조회
- TourAPI는 섬 여행, 오름, 저수지/호수/수변 산책로 보강용으로 사용
- TourAPI 쿼터 초과가 발생해도 두루누비 데이터는 계속 표시되도록 실패 분리
- API 캐시 키 v8로 변경

## config.js 설정

`js/config.js`에 아래 값을 입력하세요.

```javascript
TOUR_API_KEY: '한국관광공사 국문 관광정보 서비스 키',
DURUNUBI_API_KEY: '' // 비워두면 TOUR_API_KEY를 같이 사용
```

TourAPI 쿼터가 초과된 상태라면 일단 아래처럼 두루누비만 사용해도 됩니다.

```javascript
USE_TOUR_API: false
```

## 배포

```cmd
git add .
git commit -m "Add Durunubi API integration"
git push
```

브라우저에서 `Ctrl + F5`로 강력 새로고침하세요.

## v8 - 두루누비 API 추가

- 한국관광공사_두루누비 정보 서비스_GW 연동 추가
- `js/config.js`에 `DURUNUBI_API_KEY`, `DURUNUBI_API_BASE`, `USE_DURUNUBI_API` 옵션 추가
- 둘레길 데이터는 두루누비 `/routeList`, `/courseList`를 우선 사용
- TourAPI는 섬/오름/저수지·호수길 보강용으로 유지
- TourAPI 쿼터 초과 시 `USE_TOUR_API: false`로 설정하면 두루누비 데이터만 표시 가능

### config.js 예시

```javascript
window.WALKGOO_CONFIG = {
  TOUR_API_KEY: 'TourAPI_서비스키',
  TOUR_API_BASE: 'https://apis.data.go.kr/B551011/KorService2',

  DURUNUBI_API_KEY: '두루누비_서비스키',
  DURUNUBI_API_BASE: 'https://apis.data.go.kr/B551011/Durunubi',
  USE_DURUNUBI_API: true,
  USE_TOUR_API: true,

  DEBUG_API: true,
  API_CONCURRENCY: 1,
  API_DELAY_MS: 900
};
```
