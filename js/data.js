// WalkGoo 테마/검색/분류 설정
// 실제 화면 데이터는 data/custom/*.json + data/cache/*.json + 선택적 API에서 로드합니다.
// 중요: api.js에서 window.WALKGOO_DATA_FILES를 참조하므로 반드시 window에 등록합니다.

window.WALKGOO_THEMES = [
  { id:'trail', name:'코리아둘레길', icon:'🥾', desc:'해파랑길·남파랑길·서해랑길·DMZ 평화의 길' },
  { id:'water', name:'저수지·호수길', icon:'🏞️', desc:'저수지·호수·수변길·생태탐방로' },
  { id:'island', name:'섬 여행', icon:'🏝️', desc:'인천권·서해권·남해권·동해권·제주권' },
  { id:'oreum', name:'제주 오름', icon:'⛰️', desc:'제주 오름과 올레길 보강 데이터' },
  { id:'urban', name:'도시 산책길', icon:'🚶', desc:'하천길·공원길·도심 산책길' }
];

window.ISLAND_REGIONS = [
  { id:'incheon', name:'인천권', areas:['인천'], keywords:['백령도','대청도','소청도','덕적도','자월도','승봉도','대이작도','소이작도','영흥도','무의도','장봉도','강화도','석모도'] },
  { id:'west', name:'서해권', areas:['경기','충남','전북'], keywords:['선유도','원산도','삽시도','외연도','고대도','장고도','위도','고군산군도','제부도','대부도','국화도'] },
  { id:'south', name:'남해권', areas:['전남','경남','부산'], keywords:['청산도','보길도','노화도','소안도','홍도','흑산도','가거도','증도','비금도','도초도','거문도','금오도','사량도','욕지도','비진도','한산도','매물도','소매물도','거제도','남해도'] },
  { id:'east', name:'동해권', areas:['강원','경북','울산'], keywords:['울릉도','독도','죽도'] },
  { id:'jeju', name:'제주권', areas:['제주'], keywords:['우도','가파도','마라도','비양도','추자도','차귀도'] }
];

// custom/cache JSON 로드 설정
// 현재 사용자가 올린 파일명(walk_trails.json, islands.json, jeju_oreums.json)을 우선 로드합니다.
// 이전 draft 파일명도 함께 지원합니다.
window.WALKGOO_DATA_FILES = {
  custom: [
    'data/custom/walk_trails.json',
    'data/custom/islands.json',
    'data/custom/jeju_oreums.json',
    'data/custom/reservoir_trails.json',

    'data/custom/walk_trails_draft_90.json',
    'data/custom/islands_draft_90.json',
    'data/custom/jeju_oreums_draft_100.json'
  ],
  cache: [
    'data/cache/durunubi_cache.json',
    'data/cache/tourapi_cache.json'
  ],
  merged: [
    'data/merged/walkgoo_places.json',
    'data/walkgoo_places_draft_all.json'
  ]
};

window.WALKGOO_OPTIONS = {
  USE_CUSTOM_JSON: true,
  USE_CACHE_JSON: true,
  USE_MERGED_JSON: true,
  USE_TOUR_API_IN_BROWSER: false,
  DEDUPE_BY_TITLE_REGION: true
};

window.TOURAPI_KEYWORDS = {
  trail:['둘레길','해파랑길','남파랑길','서해랑길','코리아둘레길','지리산 둘레길','북한산 둘레길','한양도성길','DMZ 평화의 길'],
  water:['저수지 둘레길','호수 둘레길','수변길','호반길','생태탐방로','산책로','구이저수지'],
  island: window.ISLAND_REGIONS.flatMap(r => r.keywords),
  oreum:['제주 오름','오름','제주 올레길','올레길'],
  urban:['도시 산책길','하천 산책로','공원 산책로']
};

// 기존 코드 호환용 전역 바인딩
const WALKGOO_THEMES = window.WALKGOO_THEMES;
const ISLAND_REGIONS = window.ISLAND_REGIONS;
const WALKGOO_DATA_FILES = window.WALKGOO_DATA_FILES;
const WALKGOO_OPTIONS = window.WALKGOO_OPTIONS;
const TOURAPI_KEYWORDS = window.TOURAPI_KEYWORDS;
