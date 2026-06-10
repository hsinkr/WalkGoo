# WalkGoo v7

## v7 변경사항

- TourAPI HTTP 429 방지를 위해 `api.js` 호출 방식을 수정했습니다.
- 기존 v6의 `키워드 × contentTypeId(12/25/28/전체)` 동시 호출을 제거했습니다.
- 기본은 키워드당 `전체 검색 1회`만 수행합니다.
- 요청 간 지연(`API_DELAY_MS`)과 429 재시도 로직을 추가했습니다.
- 저수지/호수/수변길 키워드는 유지했습니다.

## 적용 시 주의

ZIP을 덮어쓸 때 기존 `js/config.js`에 입력한 TourAPI 키가 사라질 수 있습니다.
배포 전 `js/config.js`의 `TOUR_API_KEY`를 다시 확인하세요.

```javascript
TOUR_API_KEY: '본인 TourAPI 서비스키'
```

## 429가 계속 날 때

1. 10~30분 정도 기다립니다.
2. 브라우저에서 `Ctrl + F5`를 누릅니다.
3. 사이트의 API 새로고침 버튼을 반복해서 누르지 않습니다.
4. 필요하면 `js/config.js`에서 아래처럼 더 느리게 조정합니다.

```javascript
API_CONCURRENCY: 1,
API_DELAY_MS: 1200,
API_RETRY_COUNT: 2,
API_RETRY_DELAY_MS: 5000
```

## 더 많은 결과가 필요할 때

429가 안정된 뒤에만 아래 옵션을 `true`로 변경하세요.

```javascript
API_TYPE_FALLBACK: true
```

이 옵션은 0건 키워드에 한해 `contentTypeId` 보조 검색을 추가합니다.
