# WalkGoo v9 - 캐시 + API + 보강 데이터 구조

WalkGoo v9는 브라우저에서 TourAPI를 매번 직접 호출하지 않고, `data/merged/walkgoo_places.json`을 우선 표시합니다.  
GitHub Actions가 두루누비 API와 TourAPI를 주기적으로 호출해 캐시 JSON을 갱신하고, API에 없는 구이저수지 둘레길·오름·섬 정보는 `data/custom/*.json`으로 보강합니다.

## 핵심 구조

```text
data/
├─ custom/
│  ├─ reservoir_trails.json   # 저수지·호수·수변길 보강 데이터
│  ├─ islands.json            # 섬 여행 보강 데이터
│  └─ jeju_oreums.json        # 제주 오름 보강 데이터
├─ cache/
│  ├─ tourapi_cache.json      # TourAPI 수집 결과
│  └─ durunubi_cache.json     # 두루누비 API 수집 결과
└─ merged/
   └─ walkgoo_places.json     # 화면에서 실제 사용하는 통합 데이터
```

## GitHub Secrets 설정

GitHub 저장소에서 아래로 이동합니다.

```text
Settings → Secrets and variables → Actions → New repository secret
```

등록할 값:

```text
TOUR_API_KEY       = 한국관광공사 TourAPI 서비스키
DURUNUBI_API_KEY   = 한국관광공사 두루누비 정보 서비스_GW 서비스키
```

## 자동 갱신

`.github/workflows/update-walkgoo-cache.yml`가 매일 새벽 3시(KST)에 실행됩니다. 수동 실행도 가능합니다.

```text
Actions → Update WalkGoo Cache → Run workflow
```

## 로컬에서 캐시 갱신

```cmd
set TOUR_API_KEY=본인_TourAPI_키
set DURUNUBI_API_KEY=본인_두루누비_키
node scripts/update-cache.mjs
```

## 브라우저 직접 API 호출

기본값은 꺼져 있습니다.

```javascript
ALLOW_BROWSER_API: false
```

GitHub Pages에서 API 한도 초과가 잦기 때문에 권장하지 않습니다.
