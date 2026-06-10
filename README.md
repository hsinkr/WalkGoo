# WalkGoo v10 custom JSON loader

## 적용 방법

1. `js/data.js` 교체
2. `js/api.js` 교체
3. 기존 `main.js`가 `fetchWalkgooPlaces()`를 호출한다면 그대로 사용
4. 아니라면 `js/main_patch_example.js`를 참고해서 `loadData()` 부분 수정
5. 이전에 만든 데이터셋 ZIP의 파일을 아래 위치에 복사

```text
data/custom/walk_trails_draft_90.json
data/custom/islands_draft_90.json
data/custom/jeju_oreums_draft_100.json
```

## 중요

브라우저에서 TourAPI를 직접 호출하면 429가 다시 발생할 수 있으므로 기본값은 비활성화했습니다.

```javascript
USE_TOUR_API_IN_BROWSER: false
```

데이터 보강은 GitHub Actions 또는 별도 수집 스크립트에서 수행하는 방식을 권장합니다.
