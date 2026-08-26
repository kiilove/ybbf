# YBBF 전체 페이지(랜딩 및 서브페이지) CRUD 동적화를 위한 백엔드 요청서

본 문서는 YBBF(용인시보디빌딩협회) 플랫폼의 메인 랜딩페이지 및 전체 서브페이지(협회 소개, 레전드 아카이브, 미디어 센터, 유스 시스템)에 하드코딩되어 있는 모든 텍스트, 이미지, 그리고 관련 데이터 컬렉션을 관리자 대시보드에서 CRUD 제어할 수 있도록 설계한 통합 백엔드(D1 데이터베이스 스키마 및 API) 요구사항 명세서입니다.

프론트엔드 코드의 데이터 구조 및 명칭과 **100% 일치하도록** 필드명을 설계했습니다.

---

## 1. 데이터베이스 스키마 설계 (Cloudflare D1)

### 1.1. 단일/페이지 섹션 제어 테이블 (`site_sections`)
메인 화면 및 각 서브페이지 내의 단일 텍스트 블록, 소개글, 대표 이미지, 레이아웃 메타정보를 저장하는 통합 테이블입니다.

```sql
CREATE TABLE IF NOT EXISTS site_sections (
  sectionId TEXT PRIMARY KEY,       -- 섹션 식별자 (예: 'home_manifesto', 'about_hero', 'legends_hero' 등)
  page TEXT NOT NULL,               -- 해당 페이지 ('home', 'about', 'legends', 'media', 'youth')
  title TEXT,                       -- 섹션 대제목 (Anton 폰트 및 큰 제목용)
  subtitle TEXT,                    -- 섹션 소제목 또는 분리 타이틀
  description TEXT,                 -- 상세 설명/본문 텍스트 (HTML 태그 허용)
  imageUrl TEXT,                    -- 대표 이미지 URL (R2 업로드 경로)
  buttonText TEXT,                  -- 버튼 텍스트
  buttonLink TEXT,                  -- 버튼 클릭 시 이동할 경로
  extraData TEXT,                   -- 추가 설정 또는 배열/스탯형 데이터를 위한 JSON 문자열
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);
```

#### 초기값 적재용 시드 데이터 (Seed Data)
##### A. 홈 페이지 (Home)
- **`home_manifesto`**:
  - `sectionId`: `'home_manifesto'`, `page`: `'home'`
  - `title`: `'THE IRON ROOTS, THE FUTURE LEGENDS'`
  - `description`: `'정통 위에서 피어나는 <span class="text-accent font-black italic">가장 젊고 뜨거운 에너지</span>.<br class="hidden md:inline" />YBBF는 IFBB의 엄격한 규정 아래 가장 공정하고 압도적인 무대를 설계하며,<br class="hidden md:inline" />동시에 스스로 한계를 깨부수는 <span class="text-[#ffffff] font-black italic">유소년(Youth)의 폭발적인 미래</span>에 주목합니다.'`
  - `extraData`: `'{"signaturePath": "M30 100 C 60 70, 90 120, 120 80 C 150 40, 180 130, 210 90 C 240 50, 270 140, 300 70 C 330 20, 360 110, 380 60"}'`

- **`home_legend_highlight`**:
  - `sectionId`: `'home_legend_highlight'`, `page`: `'home'`
  - `title`: `'LEGENDS'`, `subtitle`: `'HIGHLIGHT'`
  - `description`: `'대회 결과, 가장 치열했던 순간들, 그리고 무대 위의 모든 커리어 통계.'`
  - `imageUrl`: `'https://picsum.photos/800/1000?random=31'`
  - `buttonText`: `'레전드 보기 →'`, `buttonLink`: `'/legends'`

- **`home_youth_preview`**:
  - `sectionId`: `'home_youth_preview'`, `page`: `'home'`
  - `title`: `'YBBF'`, `subtitle`: `'YOUTH'`
  - `description`: `'미래의 레전드를 위한 공식 유스 시스템. 용인시와 경기도를 대표할 다음 세대의 챔피언.'`
  - `imageUrl`: `'https://picsum.photos/800/1000?random=32'`
  - `buttonText`: `'YBBF 유스 알아보기 →'`, `buttonLink`: `'/youth'`
  - `extraData`: `'{"badge": "NEXT GENERATION"}'`

- **`home_store`**:
  - `sectionId`: `'home_store'`, `page`: `'home'`
  - `title`: `'오직'`, `subtitle`: `'최고만을 위한 기어'`
  - `description`: `'YBBF 공식 굿즈, 트레이닝 기어, 파트너 로고웨어. 무대의 영광을 일상으로 가져오세요.'`
  - `buttonText`: `'스토어 둘러보기'`, `buttonLink`: `'/store'`
  - `extraData`: `'{"badge": "YBBF 스토어", "images": ["https://picsum.photos/400/500?random=51", "https://picsum.photos/400/600?random=52", "https://picsum.photos/400/600?random=53", "https://picsum.photos/400/400?random=54"]}'`

- **`home_media_intro`**:
  - `sectionId`: `'home_media_intro'`, `page`: `'home'`
  - `title`: `'MEDIA'`
  - `description`: `'용인시 보디빌딩협회의 공식 미디어 센터입니다. 대회 하이라이트, 인터뷰, 훈련 영상 등을 가장 먼저 만나보세요.'`
  - `buttonText`: `'미디어 센터 가기 →'`, `buttonLink`: `'/media'`

##### B. 협회 소개 페이지 (About)
- **`about_hero`**:
  - `sectionId`: `'about_hero'`, `page`: `'about'`
  - `title`: `'THE IRON ROOTS'`, `subtitle`: `'FUTURE LEGENDS'`
  - `description`: `'정통 위에서 피어나는 가장 젊고 뜨거운 에너지'`
  - `imageUrl`: `'https://picsum.photos/1920/1080?random=about_hero'`
  - `extraData`: `'{"badge": "FOUNDATION & LEGACY"}'`

- **`about_manifesto`**:
  - `sectionId`: `'about_manifesto'`, `page`: `'about'`
  - `title`: `'THE LEGITIMATE LINEAGE OF'`, `subtitle`: `'BODYBUILDING'`
  - `description`: `'용인특례시보디빌딩협회(YBBF)는 대한체육회 산하 용인시체육회, 그리고 대한보디빌딩협회와 경기도보디빌딩협회 공식 라인을 잇는 정통성 있는 거점입니다.'`
  - `extraData`: `'{"badge": "OUR IDENTITY", "summary": "용인특례시보디빌딩협회는 흔들리지 않는 규정과 공정함이라는 단단한 쇠사슬(Iron) 위에 서 있습니다.", "description2": "우리는 세계 보디빌딩의 절대적 기준인 IFBB(국제보디빌딩연맹)의 엄격한 룰을 완벽히 준수하며, 편파와 왜곡이 없는 가장 공정하고 압도적인 무대를 만듭니다.", "quote": "가장 엄격한 룰 위에서 가장 자유롭고 폭발적인 무대가 피어납니다."}'`

- **`about_youth`**:
  - `sectionId`: `'about_youth'`, `page`: `'about'`
  - `title`: `'WE DO NOT LOOK BACK.'`, `subtitle`: `'WE BUILD THE YOUTH'`
  - `description`: `'우리의 시선은 과거의 영광이나 현재의 왕좌에만 머물지 않습니다. YBBF가 가장 가슴 뜨겁게 주목하는 곳은 바로 유소년(Youth)입니다. 올바른 웨이트 트레이닝과 신체 조화의 가치는 성인만의 전유물이 아닙니다. 청소년기부터 다져진 체력과 단단한 멘탈은 평생의 삶을 지탱하는 가장 강력한 자산이 되기 때문입니다.'`
  - `imageUrl`: `'https://picsum.photos/1000/800?random=about_youth'`
  - `extraData`: `'{"badge": "THE FUTURE DIRECTION", "watermark": "YOUTH"}'`

- **`about_cta`**:
  - `sectionId`: `'about_cta'`, `page`: `'about'`
  - `title`: `'THE PARADIGM'`, `subtitle`: `'HAS SHIFTED.'`
  - `description`: `'대한민국 보디빌딩의 새로운 패러다임, 용인특례시보디빌딩협회가 앞장서서 증명합니다.'`

##### C. 레전드 목록 페이지 (Legends)
- **`legends_hero`**:
  - `sectionId`: `'legends_hero'`, `page`: `'legends'`
  - `title`: `'LEGENDS'`
  - `description`: `'수십 년간 이어진 무대 위 땀과 영광의 기록. 용인시를 대표하는 역대 챔피언들의 명예의 전당.'`
  - `imageUrl`: `'https://picsum.photos/1920/1080?random=99'`
  - `extraData`: `'{"badge": "SINCE 1990", "totalChampions": 47, "totalClasses": 12, "yearsLegacy": 35}'` (숫자 지표)

##### D. 미디어 목록 페이지 (Media)
- **`media_hero`**:
  - `sectionId`: `'media_hero'`, `page`: `'media'`
  - `title`: `'MEDIA'`
  - `description`: `'대회의 모든 순간, 땀방울, 그리고 챔피언들의 스토리를 기록합니다.'`
  - `extraData`: `'{"badge": "YBBF Official Hub"}'`

##### E. 유스 목록 페이지 (Youth)
- **`youth_hero`**:
  - `sectionId`: `'youth_hero'`, `page`: `'youth'`
  - `title`: `'YBBF'`, `subtitle`: `'YOUTH'`
  - `description`: `'NEXT GENERATION OF CHAMPIONS'`
  - `imageUrl`: `'https://picsum.photos/1920/1080?random=y_hero'`
  - `extraData`: `'{"badge": "Official Development System"}'`

- **`youth_system`**:
  - `sectionId`: `'youth_system'`, `page`: `'youth'`
  - `title`: `'Our System'`
  - `description`: `'학교에는 보디빌딩 교과목이 없습니다. 본인이 땀 흘리는 체육관이 클럽이 되고, 그 클럽이 용인시 소속이 되며, 곧 경기도를 대표하는 선수가 되는 공식 육성 시스템입니다.'`
  - `extraData`: `'[{"step": "01", "badge": "Step One", "title": "CLUB", "subtitle": "나의 훈련 기지", "desc": "지역 내 검증된 트레이닝 센터에서 전문적인 지도를 받으며 기본기를 단단하게 다집니다."}, {"step": "02", "badge": "The Core", "title": "YBBF", "subtitle": "나의 소속 협회", "desc": "용인시 보디빌딩협회의 공식 유스 선수로 등록되어 체계적인 관리와 공식 무대 출전 기회를 얻습니다."}, {"step": "03", "badge": "Final Goal", "title": "GYEONGGI", "subtitle": "내가 대표하는 지역", "desc": "용인시를 넘어 경기도 대표로 성장하여 더 큰 무대, 전국 단위의 치열한 경쟁에 도전합니다."}]'`

---

### 1.2. 협회 연맹 공인 카드 테이블 (`about_affiliations`)
소개 페이지 하단에 배치되는 공인 연맹 및 협회 정보 카드 리스트입니다.
```sql
CREATE TABLE IF NOT EXISTS about_affiliations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,              -- 카드 제목 (예: 'IFBB', 'KBBF')
  description TEXT NOT NULL,        -- 상세 설명
  iconName TEXT NOT NULL,           -- Lucide 아이콘 식별자 ('Shield', 'Award', 'Users', 'Target')
  sortOrder INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);
```

---

### 1.3. 스폰서/파트너 테이블 (`landing_sponsors`)
메인 화면 무한 롤링 배너 관리 테이블입니다.
```sql
CREATE TABLE IF NOT EXISTS landing_sponsors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,               -- 스폰서/파트너명
  logoUrl TEXT,                     -- 로고 이미지 경로 (R2)
  sortOrder INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);
```

---

### 1.4. 소셜 그리드 피드 테이블 (`landing_socials`)
메인 소셜 그리드 피드 카드 배열 정보 테이블입니다.
```sql
CREATE TABLE IF NOT EXISTS landing_socials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  imageUrl TEXT NOT NULL,           -- 소셜 썸네일 이미지 R2 경로
  type TEXT NOT NULL,               -- 소셜 플랫폼 종류 ('인스타그램', '유튜브', '틱톡')
  aspect TEXT NOT NULL,             -- 레이아웃 클래스 ('aspect-square', 'aspect-[2/3]', 'aspect-[3/2]', 'aspect-[4/5]')
  linkUrl TEXT,                     -- 게시물 링크
  sortOrder INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);
```

---

### 1.5. 명예의 전당 레전드 테이블 (`legends`, `legend_titles`, `legend_gallery`)
역대 우승 레전드 Roster 및 상세 정보(Career, Gallery) 테이블 세트입니다.

```sql
CREATE TABLE IF NOT EXISTS legends (
  id TEXT PRIMARY KEY,              -- 식별자 (예: 'kim-minsu')
  name TEXT NOT NULL,               -- 실명 (예: '김민수')
  nameEn TEXT NOT NULL,             -- 영문명 (예: 'KIM MINSU')
  nickname TEXT,                    -- 별명 (예: 'THE KOREAN THANOS')
  profileImage TEXT NOT NULL,       -- 대표 투명 배경 컷아웃 이미지 R2 URL
  class TEXT NOT NULL,              -- 주요 출전 부문 (예: '클래식 피지크 +180cm')
  height REAL NOT NULL,             -- 신장 (cm)
  weight REAL NOT NULL,             -- 체중 (kg)
  club TEXT,                        -- 소속팀/클럽
  bio TEXT,                         -- 대표 바이오그래피 본문 (행바꿈 포함)
  quote TEXT,                       -- 대표 한줄 명언/신념
  mediaIds TEXT,                    -- 관련 연동 미디어 ID 배열 (JSON 문자열)
  sortOrder INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS legend_titles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  legendId TEXT NOT NULL,
  year INTEGER NOT NULL,            -- 수상 연도 (예: 2023)
  competition TEXT NOT NULL,        -- 대회명 (예: '용인시장배 보디빌딩 대회')
  result TEXT NOT NULL,             -- 결과 (예: '1위 / Overall')
  class TEXT NOT NULL,              -- 상세 체급 (예: '클래식 피지크 +180cm')
  FOREIGN KEY (legendId) REFERENCES legends(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS legend_gallery (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  legendId TEXT NOT NULL,
  imageUrl TEXT NOT NULL,           -- 갤러리 이미지 R2 URL
  FOREIGN KEY (legendId) REFERENCES legends(id) ON DELETE CASCADE
);
```

---

### 1.6. 미디어 테이블 (`media`)
공식 미디어 아카이브 제어 테이블입니다.
```sql
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,              -- 미디어 ID (예: 'm-001')
  title TEXT NOT NULL,              -- 미디어 영상 제목
  category TEXT NOT NULL,           -- 카테고리 ('highlight' | 'interview' | 'training' | 'notice')
  thumbnail TEXT NOT NULL,          -- R2 썸네일 이미지 URL
  videoUrl TEXT,                    -- 미디어 연결 주소
  youtubeUrl TEXT,                  -- 유튜브 직접 연동 주소
  date TEXT NOT NULL,               -- 등록일자 (YYYY-MM-DD)
  description TEXT NOT NULL,        -- 간략 줄거리
  featured INTEGER DEFAULT 0,       -- 대표 하이라이트 여부 (0: 일반, 1: 대표)
  relatedLegendIds TEXT,            -- 연동 레전드 ID 배열 (JSON 문자열)
  sortOrder INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);
```

---

### 1.7. 공식 유스 클럽 및 유스 선수 테이블 (`youth_clubs`, `youth_athletes`, `youth_athlete_achievements`)
YBBF 공식 청소년 보디빌더 양성 시스템 관련 테이블 세트입니다.

```sql
CREATE TABLE IF NOT EXISTS youth_clubs (
  id TEXT PRIMARY KEY,              -- 클럽 ID (예: 'c-001')
  name TEXT NOT NULL,               -- 클럽/체육관명 (예: '팀 타노스 짐')
  location TEXT NOT NULL,           -- 주소 정보 (예: '용인시 처인구 역북동')
  coach TEXT NOT NULL,              -- 전임 지도자명
  athleteCount INTEGER DEFAULT 0,   -- 등록된 소속 선수 숫자
  region TEXT NOT NULL DEFAULT '용인시',
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS youth_athletes (
  id TEXT PRIMARY KEY,              -- 선수 ID (예: 'y-001')
  name TEXT NOT NULL,               -- 이름 (예: '김준호')
  grade TEXT NOT NULL,              -- 학년 (예: '고3')
  school TEXT NOT NULL,             -- 소속 학교 (예: '용인고등학교')
  clubId TEXT NOT NULL,             -- 소속 유스 클럽 ID
  class TEXT NOT NULL,              -- 출전 체급 (예: '-70kg')
  badge TEXT NOT NULL DEFAULT 'YBBF_YOUTH', -- 배지 종류
  image TEXT,                       -- 프로필 사진 R2 URL
  quote TEXT,                       -- 각오/다짐 텍스트
  bio TEXT,                         -- 상세 설명글
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (clubId) REFERENCES youth_clubs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS youth_athlete_achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  athleteId TEXT NOT NULL,
  achievement TEXT NOT NULL,        -- 수상/활동 기록 (예: '2025 용인시장배 학생부 1위')
  FOREIGN KEY (athleteId) REFERENCES youth_athletes(id) ON DELETE CASCADE
);
```

---

## 2. API 엔드포인트 명세

일반 사용자를 위한 `GET` 요청은 인증 없이 누구나 조회가 가능하며, 관리자를 위한 `CUD` API는 `session_token` 쿠키를 지닌 `admin` 권한의 사용자만 호출이 가능해야 합니다.

### 2.1. 페이지 섹션 제어 API (`/api/landing/sections`)
- **`GET /api/landing/sections`**
  - 설명: 랜딩페이지 및 서브페이지 내의 모든 섹션 설정 일괄 반환. (필요 시 `?page=about`과 같이 쿼리 스트링 필터 지원)
- **`POST /api/landing/sections/:sectionId`** (관리자 전용)
  - 설명: 특정 섹션의 텍스트, 이미지 경로, 메타정보 업데이트.

### 2.2. 협회 연맹 카드 API (`/api/about/affiliations`)
- **`GET /api/about/affiliations`**
  - 설명: 소개 페이지용 연맹 리스트 반환.
- **`POST /api/about/affiliations`**, **`PUT /api/about/affiliations/:id`**, **`DELETE /api/about/affiliations/:id`** (관리자 전용)
  - 설명: 공식 연맹 카드 추가/수정/삭제.

### 2.3. 스폰서 및 소셜 배너 API (`/api/landing/sponsors` & `/api/landing/socials`)
- **`GET`** / **`POST`** / **`PUT`** / **`DELETE`** 지원

### 2.4. 레전드, 미디어, 유스 클럽/선수 연동 API (관리자 전용 CRUD 세트)
- **명예의 전당**: `/api/admin/legends` 및 하위 타이틀/갤러리 연동 CRUD
- **미디어 라이브러리**: `/api/admin/media` CRUD
- **유스 클럽**: `/api/admin/youth/clubs` CRUD
- **유스 선수**: `/api/admin/youth/athletes` 및 하위 수상경력 CRUD
