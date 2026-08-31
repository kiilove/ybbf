CREATE TABLE IF NOT EXISTS users (
  uid TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  passwordHash TEXT,
  provider TEXT NOT NULL,
  profileComplete INTEGER NOT NULL DEFAULT 0,
  roles TEXT NOT NULL DEFAULT 'user',
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_profiles (
  uid TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  birth TEXT NOT NULL,
  tel TEXT NOT NULL,
  telLast4 TEXT NOT NULL,
  gym TEXT NOT NULL,
  gender TEXT NOT NULL,
  profilePhotoUrl TEXT,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uid) REFERENCES users (uid) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_nickname_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uid TEXT NOT NULL,
  nickname TEXT NOT NULL,
  changeReason TEXT DEFAULT 'user_update',
  changedBy TEXT NOT NULL,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uid) REFERENCES users (uid) ON DELETE CASCADE
);



CREATE TABLE IF NOT EXISTS notification_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  competitionId TEXT NOT NULL,
  userId TEXT,
  isSent INTEGER NOT NULL DEFAULT 0,
  sentAt TEXT DEFAULT NULL,
  sendCount INTEGER NOT NULL DEFAULT 0,
  sendStatus TEXT NOT NULL DEFAULT 'pending',
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(email, competitionId)
);

CREATE TABLE IF NOT EXISTS invoices_pool (
  id TEXT PRIMARY KEY,
  playerUid TEXT NOT NULL,
  playerName TEXT NOT NULL,
  playerGender TEXT NOT NULL,
  playerBirth TEXT NOT NULL,
  playerTel TEXT NOT NULL,
  playerEmail TEXT,
  playerGym TEXT NOT NULL,
  playerText TEXT,
  playerPhotoUrl TEXT,
  playerService INTEGER NOT NULL DEFAULT 0,
  joins TEXT NOT NULL,
  contestPriceSum INTEGER NOT NULL,
  contestPriceTotal INTEGER NOT NULL,
  playerAge INTEGER,
  isPriceCheck INTEGER NOT NULL DEFAULT 0,
  isCanceled INTEGER NOT NULL DEFAULT 0,
  invoiceEdited INTEGER NOT NULL DEFAULT 0,
  createBy TEXT,
  invoiceCreateAt TEXT,
  invoiceEditAt TEXT,
  contestId TEXT,
  selectedPhotoUrls TEXT,
  stagePhoto1 TEXT,
  stagePhoto2 TEXT,
  publicStagePhoto1 TEXT,
  publicStagePhoto2 TEXT,
  publicPhotoUrls TEXT,
  award TEXT,
  rank INTEGER,
  isGrandPrix INTEGER NOT NULL DEFAULT 0,
  playerNumber TEXT,
  submittedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contest_results (
  id TEXT PRIMARY KEY,
  contestId TEXT NOT NULL,
  categoryId TEXT,
  categoryTitle TEXT NOT NULL,
  gradeId TEXT,
  gradeTitle TEXT NOT NULL,
  isOverall INTEGER NOT NULL DEFAULT 0,
  scoreType TEXT DEFAULT 'ranking',
  resultsJson TEXT NOT NULL,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contest_results_contestId ON contest_results(contestId);

CREATE TABLE IF NOT EXISTS system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS site_sections (
  sectionId TEXT PRIMARY KEY,
  page TEXT NOT NULL,
  title TEXT,
  subtitle TEXT,
  description TEXT,
  imageUrl TEXT,
  buttonText TEXT,
  buttonLink TEXT,
  extraData TEXT,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS about_affiliations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  iconName TEXT NOT NULL,
  sortOrder INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS landing_sponsors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  logoUrl TEXT,
  sortOrder INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS landing_socials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  imageUrl TEXT NOT NULL,
  type TEXT NOT NULL,
  aspect TEXT NOT NULL,
  linkUrl TEXT,
  sortOrder INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS legends (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nameEn TEXT NOT NULL,
  nickname TEXT,
  profileImage TEXT NOT NULL,
  class TEXT NOT NULL,
  height REAL NOT NULL,
  weight REAL NOT NULL,
  club TEXT,
  bio TEXT,
  quote TEXT,
  mediaIds TEXT,
  sortOrder INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS legend_titles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  legendId TEXT NOT NULL,
  year INTEGER NOT NULL,
  competition TEXT NOT NULL,
  result TEXT NOT NULL,
  class TEXT NOT NULL,
  FOREIGN KEY (legendId) REFERENCES legends(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS legend_gallery (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  legendId TEXT NOT NULL,
  imageUrl TEXT NOT NULL,
  FOREIGN KEY (legendId) REFERENCES legends(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  thumbnail TEXT NOT NULL,
  videoUrl TEXT,
  youtubeUrl TEXT,
  aspect TEXT DEFAULT 'landscape',
  date TEXT NOT NULL,
  description TEXT NOT NULL,
  featured INTEGER DEFAULT 0,
  relatedLegendIds TEXT,
  sortOrder INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS youth_clubs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  coach TEXT NOT NULL,
  athleteCount INTEGER DEFAULT 0,
  region TEXT NOT NULL DEFAULT '용인시',
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS youth_athletes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  school TEXT NOT NULL,
  clubId TEXT NOT NULL,
  class TEXT NOT NULL,
  badge TEXT NOT NULL DEFAULT 'YBBF_YOUTH',
  image TEXT,
  quote TEXT,
  bio TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (clubId) REFERENCES youth_clubs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS youth_athlete_achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  athleteId TEXT NOT NULL,
  achievement TEXT NOT NULL,
  FOREIGN KEY (athleteId) REFERENCES youth_athletes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notices (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  videoUrl TEXT,
  youtubeUrl TEXT,
  audioUrl TEXT,
  images TEXT,
  attachments TEXT,
  isMandatory INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  sortOrder INTEGER DEFAULT 0,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pre_measurements (
  id TEXT PRIMARY KEY,
  contestId TEXT NOT NULL,
  playerUid TEXT NOT NULL,
  playerName TEXT NOT NULL,
  playerTel TEXT NOT NULL,
  mediaUrl TEXT NOT NULL,
  mediaType TEXT NOT NULL,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(contestId, playerUid)
);

CREATE TABLE IF NOT EXISTS contest_staffs (
  uid TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  passwordHash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff',
  contestId TEXT,
  phone_encrypted TEXT,
  phone_last4 TEXT,
  email TEXT,
  position TEXT,
  isReferee INTEGER DEFAULT 0,
  refereeGrade TEXT,
  status TEXT DEFAULT 'active',
  profilePhotoUrl TEXT,
  businessIntro TEXT,
  snsLinks TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS virtual_kv (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS password_resets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
