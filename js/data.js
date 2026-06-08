const THEMES = [
  { id: 'trail', name: '둘레길', icon: '🚶', description: '대한민국 대표 걷기길', image: 'images/themes/trail.svg' },
  { id: 'island', name: '섬 여행', icon: '🏝️', description: '배 타고 떠나는 섬 걷기', image: 'images/themes/island.svg' },
  { id: 'oreum', name: '제주 오름', icon: '⛰️', description: '제주의 작은 산책 여행', image: 'images/themes/oreum.svg' },
  { id: 'forest', name: '숲길', icon: '🌲', description: '조용히 쉬어가는 숲속 산책', image: 'images/themes/forest.svg' },
  { id: 'sea', name: '바닷길', icon: '🌊', description: '바다를 보며 걷는 길', image: 'images/themes/sea.svg' },
  { id: 'season', name: '계절길', icon: '🌸', description: '꽃, 단풍, 억새가 좋은 길', image: 'images/themes/season.svg' }
];

const PLACES = [
  {
    id: 'jeju-olle', themeId: 'trail', title: '제주 올레길', region: '제주 전역',
    summary: '제주 바다와 마을을 따라 걷는 대표 장거리 걷기길', image: 'images/places/jeju-olle.svg',
    difficulty: '보통', duration: '구간별 상이', durationMin: 180, distance: '구간별 상이', parking: '구간별 가능', toilet: '구간별 있음', bestSeason: '봄, 가을',
    address: '제주특별자치도 일대', lat: 33.3617, lng: 126.5292, tags: ['둘레길', '바닷길', '장거리', '제주'],
    description: '제주 올레길은 제주 해안과 마을, 숲길을 연결한 대표 걷기 여행 코스입니다. 구간별로 풍경과 난이도가 달라 여행 일정에 맞춰 선택하기 좋습니다.',
    points: ['제주 바다와 마을 풍경을 함께 즐길 수 있음', '구간 선택이 자유로움', '혼자 걷기와 느린 여행에 적합'],
    cautions: ['구간별 교통편 확인 필요', '날씨와 바람 영향을 많이 받을 수 있음'],
    mapUrl: 'https://map.kakao.com/?q=제주올레길'
  },
  {
    id: 'jirisan-dulle', themeId: 'trail', title: '지리산 둘레길', region: '전북·전남·경남',
    summary: '지리산 자락의 마을과 숲을 잇는 깊이 있는 걷기길', image: 'images/places/jirisan.svg',
    difficulty: '보통', duration: '구간별 상이', durationMin: 240, distance: '전체 약 295km', parking: '구간별 상이', toilet: '구간별 있음', bestSeason: '봄, 가을',
    address: '지리산 둘레길 일대', lat: 35.337, lng: 127.731, tags: ['둘레길', '숲길', '힐링', '장거리'],
    description: '지리산 둘레길은 지리산 주변 마을과 숲길을 연결한 장거리 걷기길입니다. 자연과 마을 풍경을 함께 느낄 수 있어 천천히 걷는 여행에 잘 맞습니다.',
    points: ['마을길과 숲길을 함께 경험', '구간별 풍경이 다양함', '계절별 매력이 뚜렷함'],
    cautions: ['일부 구간은 체력 부담이 있을 수 있음', '복귀 교통편 확인 필요'],
    mapUrl: 'https://map.kakao.com/?q=지리산둘레길'
  },
  {
    id: 'bukhansan-dulle', themeId: 'trail', title: '북한산 둘레길', region: '서울·경기',
    summary: '도심 가까이에서 산과 숲을 만나는 걷기 코스', image: 'images/places/bukhansan.svg',
    difficulty: '쉬움', duration: '구간별 1~3시간', durationMin: 90, distance: '구간별 상이', parking: '일부 가능', toilet: '주요 지점 있음', bestSeason: '사계절',
    address: '서울특별시 북한산 일대', lat: 37.6586, lng: 126.977, tags: ['둘레길', '도심', '숲길', '초보추천'],
    description: '북한산 둘레길은 서울 근교에서 접근하기 좋은 걷기 코스입니다. 산행이 부담스러운 사람도 비교적 편하게 숲길을 즐길 수 있습니다.',
    points: ['대중교통 접근성 좋음', '짧은 코스 선택 가능', '도심 속 자연 감상'],
    cautions: ['주말 혼잡 가능', '구간별 경사 확인 필요'],
    mapUrl: 'https://map.kakao.com/?q=북한산둘레길'
  },
  {
    id: 'cheongsando', themeId: 'island', title: '청산도', region: '전남 완도군',
    summary: '느리게 걷기 좋은 슬로길과 바다 풍경의 섬', image: 'images/places/cheongsando.svg',
    difficulty: '쉬움', duration: '코스별 상이', durationMin: 120, distance: '슬로길 구간별 상이', parking: '선착장 주변 가능', toilet: '주요 지점 있음', bestSeason: '봄',
    address: '전라남도 완도군 청산면', lat: 34.179, lng: 126.858, tags: ['섬여행', '슬로길', '봄여행', '사진명소'],
    description: '청산도는 느리게 걷는 여행에 잘 어울리는 섬입니다. 바다, 돌담, 마을길, 계절꽃이 어우러져 사진 찍기에도 좋습니다.',
    points: ['슬로길 걷기 여행에 적합', '봄 유채꽃 풍경', '바다와 마을길을 함께 즐김'],
    cautions: ['배편 시간 확인 필수', '기상에 따라 운항 변동 가능'],
    mapUrl: 'https://map.kakao.com/?q=청산도'
  },
  {
    id: 'ulleungdo', themeId: 'island', title: '울릉도', region: '경북 울릉군',
    summary: '깎아지른 해안 절경과 섬길이 매력적인 동해의 섬', image: 'images/places/ulleungdo.svg',
    difficulty: '보통', duration: '코스별 상이', durationMin: 180, distance: '코스별 상이', parking: '제한적', toilet: '주요 관광지 있음', bestSeason: '봄, 여름, 가을',
    address: '경상북도 울릉군', lat: 37.4844, lng: 130.9058, tags: ['섬여행', '해안길', '전망', '동해'],
    description: '울릉도는 해안 절경과 독특한 지형이 인상적인 섬 여행지입니다. 걷기 코스와 전망 포인트를 함께 묶어 여행하기 좋습니다.',
    points: ['동해 바다 절경', '섬 특유의 지형과 풍경', '전망 포인트가 많음'],
    cautions: ['배편 결항 가능성 확인', '경사가 있는 구간 주의'],
    mapUrl: 'https://map.kakao.com/?q=울릉도'
  },
  {
    id: 'bijindo', themeId: 'island', title: '비진도', region: '경남 통영시',
    summary: '푸른 바다와 해변길이 아름다운 통영의 섬', image: 'images/places/bijindo.svg',
    difficulty: '쉬움', duration: '약 2시간', durationMin: 120, distance: '코스별 상이', parking: '통영항 주변', toilet: '주요 지점 있음', bestSeason: '여름, 가을',
    address: '경상남도 통영시 한산면 비진리', lat: 34.729, lng: 128.461, tags: ['섬여행', '바닷길', '해변', '초보추천'],
    description: '비진도는 맑은 바다와 해변 풍경이 아름다운 섬입니다. 짧은 섬 산책과 바다 감상을 함께 즐기기 좋습니다.',
    points: ['해변과 바다 풍경', '가볍게 걷기 좋은 섬', '통영 여행과 연계 가능'],
    cautions: ['여름 성수기 혼잡 가능', '배 시간 확인 필요'],
    mapUrl: 'https://map.kakao.com/?q=비진도'
  },
  {
    id: 'yongnuni-oreum', themeId: 'oreum', title: '용눈이오름', region: '제주 제주시 구좌읍',
    summary: '완만한 능선과 탁 트인 풍경이 아름다운 제주 오름', image: 'images/places/yongnuni.svg',
    difficulty: '쉬움', duration: '약 40분', durationMin: 40, distance: '약 1.5km', parking: '가능', toilet: '있음', bestSeason: '봄, 가을',
    address: '제주특별자치도 제주시 구좌읍 종달리', lat: 33.459, lng: 126.832, tags: ['오름', '일몰', '초보추천', '사진명소'],
    description: '용눈이오름은 완만한 능선과 넓은 풍경이 매력적인 오름입니다. 비교적 걷기 쉬워 초보자나 가족 여행객에게도 좋습니다.',
    points: ['초보자도 걷기 좋은 코스', '일출과 일몰 풍경', '사진 촬영 명소'],
    cautions: ['바람이 강한 날 주의', '비 온 뒤 미끄럼 주의'],
    mapUrl: 'https://map.kakao.com/?q=용눈이오름'
  },
  {
    id: 'saebyeol-oreum', themeId: 'oreum', title: '새별오름', region: '제주 제주시 애월읍',
    summary: '억새와 노을 풍경이 유명한 제주 서부 오름', image: 'images/places/saebyeol.svg',
    difficulty: '보통', duration: '약 40분', durationMin: 40, distance: '약 1km 내외', parking: '가능', toilet: '있음', bestSeason: '가을',
    address: '제주특별자치도 제주시 애월읍 봉성리', lat: 33.366, lng: 126.357, tags: ['오름', '억새', '일몰', '가을여행'],
    description: '새별오름은 가을 억새와 일몰 풍경이 특히 아름다운 오름입니다. 짧지만 경사가 있어 천천히 오르는 것이 좋습니다.',
    points: ['가을 억새 명소', '일몰 풍경', '주차 접근성 좋음'],
    cautions: ['초반 경사 주의', '바람 강한 날 주의'],
    mapUrl: 'https://map.kakao.com/?q=새별오름'
  },
  {
    id: 'geum-oreum', themeId: 'oreum', title: '금오름', region: '제주 제주시 한림읍',
    summary: '분화구와 노을 풍경이 아름다운 제주 서부 오름', image: 'images/places/geumoreum.svg',
    difficulty: '쉬움', duration: '약 50분', durationMin: 50, distance: '약 2km', parking: '가능', toilet: '있음', bestSeason: '사계절',
    address: '제주특별자치도 제주시 한림읍 금악리', lat: 33.356, lng: 126.305, tags: ['오름', '분화구', '일몰', '초보추천'],
    description: '금오름은 비교적 접근성이 좋고 정상에서 분화구와 제주 서부 풍경을 볼 수 있는 오름입니다.',
    points: ['분화구 풍경', '초보자도 도전 가능', '노을 감상에 좋음'],
    cautions: ['인기 명소로 혼잡 가능', '우천 시 길 미끄럼 주의'],
    mapUrl: 'https://map.kakao.com/?q=금오름'
  }
];
