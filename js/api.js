// WalkGoo API/Data Loader
// 목적:
// 1) data/custom/*.json을 우선 로드
// 2) data/cache/*.json, data/merged/*.json을 보조 로드
// 3) TourAPI 브라우저 직접 호출은 옵션으로만 사용
// 4) 기존 main.js가 fetchWalkgooPlaces()를 호출하던 구조와 호환

(function () {
  const CFG = window.WALKGOO_CONFIG || {};
  const DEBUG = CFG.DEBUG_API === true;

  function log(...args) {
    if (DEBUG) console.log('[WalkGoo]', ...args);
  }

  function warn(...args) {
    if (DEBUG) console.warn('[WalkGoo]', ...args);
  }

  async function fetchJsonFile(path) {
    try {
      const res = await fetch(path, { cache: 'no-cache' });
      if (!res.ok) {
        warn('JSON 파일 없음/로드 실패:', path, res.status);
        return [];
      }

      const json = await res.json();

      // 배열 파일
      if (Array.isArray(json)) return json;

      // { items: [...] }
      if (Array.isArray(json.items)) return json.items;

      // { places: [...] }
      if (Array.isArray(json.places)) return json.places;

      // TourAPI 스타일 캐시
      if (json.response?.body?.items?.item) {
        const item = json.response.body.items.item;
        return Array.isArray(item) ? item : [item];
      }

      warn('알 수 없는 JSON 구조:', path, json);
      return [];
    } catch (e) {
      warn('JSON 로드 오류:', path, e.message);
      return [];
    }
  }

  function normalizeCategory(item) {
    const category = item.category || item.themeId || item.type || '';
    const subCategory = item.subCategory || '';

    if (category === 'oreum' || item.title?.includes('오름')) return 'oreum';
    if (category === 'island' || item.zone?.includes('권') || item.tags?.includes('섬여행')) return 'island';
    if (category === 'water' || category === 'reservoir') return 'water';
    if (category === 'urban') return 'urban';

    if (/저수지|호수|수변|호반|생태|천변|강변|습지/.test(item.title || '') || /저수지|호수|수변/.test(subCategory)) {
      return 'water';
    }

    if (/도시|산책|공원|천|숲|자락/.test(subCategory) || /청계천|탄천|양재천|서울숲|공원/.test(item.title || '')) {
      return 'urban';
    }

    return 'trail';
  }

  function inferIslandZone(item) {
    if (item.zone) return item.zone;
    const text = `${item.region || ''} ${item.title || ''}`;

    if (/인천|강화|옹진|백령|대청|덕적|자월|이작|무의|장봉|석모/.test(text)) return '인천권';
    if (/충남|전북|군산|부안|보령|태안|신안|홍도|흑산|가거|증도|비금|도초|선유|원산|삽시|위도/.test(text)) return '서해권';
    if (/전남|경남|부산|완도|여수|통영|거제|남해|청산|보길|거문|금오|사량|욕지|비진|매물/.test(text)) return '남해권';
    if (/경북|울릉|독도|죽도|관음/.test(text)) return '동해권';
    if (/제주|우도|가파|마라|비양|추자|차귀/.test(text)) return '제주권';

    return '';
  }

  function normalizePlace(raw, source = 'json') {
    const title = raw.title || raw.name || raw.routeNm || raw.crsKorNm || raw.placeName || raw.addr1 || '';
    const region = raw.region || raw.addr1 || raw.sigun || raw.area || raw.address || '';
    const category = normalizeCategory({ ...raw, title, region });

    const item = {
      id: raw.id || raw.contentid || raw.routeIdx || raw.crsIdx || makeId(title, region),
      title,
      category,
      themeId: category,
      subCategory: raw.subCategory || raw.type || '',
      region,
      zone: raw.zone || '',
      summary: raw.summary || raw.description || raw.overview || raw.routeIntrcn || raw.intro || '',
      distance: raw.distance || raw.routeDstnc || raw.crsDstnc || '',
      duration: raw.duration || raw.routeTime || raw.crsTotlRqrmHour || '',
      difficulty: raw.difficulty || raw.level || '보통',
      lat: toNumberOrNull(raw.lat ?? raw.mapy ?? raw.latitude),
      lng: toNumberOrNull(raw.lng ?? raw.mapx ?? raw.longitude),
      image: raw.image || raw.firstimage || raw.routeImg || '',
      tags: Array.isArray(raw.tags) ? raw.tags : [],
      source: raw.source || source,
      verifyStatus: raw.verifyStatus || 'needs-check',
      raw
    };

    if (item.category === 'island') {
      item.zone = inferIslandZone(item);
    }

    if (!item.tags.length) {
      item.tags = makeTags(item);
    }

    return item;
  }

  function toNumberOrNull(v) {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function makeId(title, region) {
    const s = `${title}-${region}`.trim();
    return s
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^0-9a-z가-힣-]/gi, '')
      || `place-${Math.random().toString(36).slice(2)}`;
  }

  function makeTags(item) {
    const tags = ['걷기'];

    if (item.category === 'water') tags.push('저수지·호수길');
    if (item.category === 'island') tags.push('섬여행');
    if (item.category === 'oreum') tags.push('제주오름');
    if (item.category === 'urban') tags.push('도시산책길');
    if (item.category === 'trail') tags.push('둘레길');

    if (item.zone) tags.push(item.zone);
    if (item.region) tags.push(item.region.split(' ')[0]);

    return [...new Set(tags)];
  }

  function dedupePlaces(items) {
    const seen = new Set();
    const result = [];

    for (const item of items) {
      if (!item.title) continue;

      const key = WALKGOO_OPTIONS?.DEDUPE_BY_TITLE_REGION
        ? `${item.title}|${item.region || ''}`
        : `${item.id}`;

      if (seen.has(key)) continue;
      seen.add(key);
      result.push(item);
    }

    return result;
  }

  async function loadFromFileList(paths, source) {
    if (!Array.isArray(paths)) return [];

    const result = [];

    for (const path of paths) {
      const rows = await fetchJsonFile(path);
      if (rows.length) {
        log(`${source} 로드: ${path} (${rows.length}건)`);
        result.push(...rows.map(row => normalizePlace(row, source)));
      }
    }

    return result;
  }

  async function loadCustomPlaces() {
    if (window.WALKGOO_OPTIONS?.USE_CUSTOM_JSON === false) return [];
    return loadFromFileList(window.WALKGOO_DATA_FILES?.custom || [], 'custom');
  }

  async function loadCachePlaces() {
    if (window.WALKGOO_OPTIONS?.USE_CACHE_JSON === false) return [];
    return loadFromFileList(window.WALKGOO_DATA_FILES?.cache || [], 'cache');
  }

  async function loadMergedPlaces() {
    if (window.WALKGOO_OPTIONS?.USE_MERGED_JSON === false) return [];
    return loadFromFileList(window.WALKGOO_DATA_FILES?.merged || [], 'merged');
  }

  // 브라우저 TourAPI 호출은 쿼터 초과 방지를 위해 기본 비활성화.
  // 꼭 필요할 때 config.js 또는 data.js에서 USE_TOUR_API_IN_BROWSER:true 설정.
  async function loadTourApiPlaces() {
    const useApi =
      window.WALKGOO_OPTIONS?.USE_TOUR_API_IN_BROWSER === true ||
      CFG.USE_TOUR_API_IN_BROWSER === true;

    if (!useApi) {
      log('브라우저 TourAPI 직접 호출 비활성화');
      return [];
    }

    if (!CFG.TOUR_API_KEY) {
      warn('TOUR_API_KEY 없음');
      return [];
    }

    // 여기서는 최소 호출만 수행. 상세한 API 조회는 GitHub Actions 권장.
    const keywords = [
      ...(window.TOURAPI_KEYWORDS?.water || []),
      ...(window.TOURAPI_KEYWORDS?.trail || [])
    ].slice(0, 5);

    const rows = [];

    for (const keyword of keywords) {
      await sleep(Number(CFG.API_DELAY_MS || 800));
      try {
        const url = buildTourKeywordUrl(keyword);
        const json = await fetch(url).then(r => r.json());
        const item = json?.response?.body?.items?.item || [];
        rows.push(...(Array.isArray(item) ? item : [item]));
      } catch (e) {
        warn('TourAPI 호출 실패:', keyword, e.message);
      }
    }

    return rows.map(row => normalizePlace(row, 'tourapi'));
  }

  function buildTourKeywordUrl(keyword) {
    const base = CFG.TOUR_API_BASE || 'https://apis.data.go.kr/B551011/KorService2';
    const key = encodeServiceKey(CFG.TOUR_API_KEY);

    const params = new URLSearchParams({
      numOfRows: '30',
      pageNo: '1',
      arrange: 'O',
      keyword,
      MobileOS: 'ETC',
      MobileApp: 'WalkGoo',
      _type: 'json'
    });

    return `${base}/searchKeyword2?${params.toString()}&serviceKey=${key}`;
  }

  function encodeServiceKey(key) {
    if (!key) return '';
    // 이미 인코딩된 키면 그대로 사용
    if (/%2F|%3D|%2B/i.test(key)) return key;
    return encodeURIComponent(key);
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 기존 main.js 호환용 핵심 함수
  window.fetchWalkgooPlaces = async function fetchWalkgooPlaces() {
    const all = [];

    // 통합 파일이 있으면 먼저 로드
    all.push(...await loadMergedPlaces());

    // 개별 custom/cache도 로드
    all.push(...await loadCustomPlaces());
    all.push(...await loadCachePlaces());

    // 선택적으로 API 보강
    all.push(...await loadTourApiPlaces());

    const result = dedupePlaces(all);

    log(`최종 데이터 ${result.length}건`, {
      merged: all.length,
      result: result.length
    });

    return result;
  };

  // 테마별 카운트 계산
  window.getWalkgooThemeCounts = function getWalkgooThemeCounts(places) {
    const counts = {};
    for (const theme of window.WALKGOO_THEMES || []) {
      counts[theme.id] = 0;
    }

    for (const p of places || []) {
      const key = p.category || p.themeId;
      if (key === 'water' || key === 'reservoir') counts.water = (counts.water || 0) + 1;
      else if (key === 'island') counts.island = (counts.island || 0) + 1;
      else if (key === 'oreum') counts.oreum = (counts.oreum || 0) + 1;
      else if (key === 'urban') counts.urban = (counts.urban || 0) + 1;
      else counts.trail = (counts.trail || 0) + 1;
    }

    return counts;
  };

  // 목록 필터
  window.filterWalkgooPlaces = function filterWalkgooPlaces(places, themeId, keyword = '') {
    const kw = keyword.trim().toLowerCase();

    return (places || []).filter(p => {
      const cat = p.category || p.themeId;
      const matchTheme =
        !themeId ||
        themeId === 'all' ||
        (themeId === 'water' && (cat === 'water' || cat === 'reservoir')) ||
        cat === themeId;

      const text = `${p.title || ''} ${p.region || ''} ${p.zone || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
      const matchKeyword = !kw || text.includes(kw);

      return matchTheme && matchKeyword;
    });
  };

})();
