CREATE TABLE IF NOT EXISTS contest_sponsors (
  id TEXT PRIMARY KEY,
  contest_id TEXT NOT NULL DEFAULT 'vEsEClzzEHCnZ1d8azo1',
  name TEXT NOT NULL,
  tag TEXT NOT NULL DEFAULT 'OFFICIAL',
  slogan TEXT,
  desc TEXT,
  image_url TEXT,
  video_url TEXT,
  link_url TEXT,
  media_type TEXT DEFAULT 'IMAGE',
  status TEXT NOT NULL DEFAULT 'active',
  address TEXT,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  business_number TEXT,
  socials_json TEXT DEFAULT '{}',
  weight INTEGER DEFAULT 1,
  duration_seconds INTEGER DEFAULT 5,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now', '+9 hours')),
  updated_at TEXT DEFAULT (datetime('now', '+9 hours'))
);

CREATE INDEX IF NOT EXISTS idx_contest_sponsors_contest ON contest_sponsors(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_sponsors_status ON contest_sponsors(status);

CREATE TABLE IF NOT EXISTS pre_registrations (
  id TEXT PRIMARY KEY,
  contest_edition INTEGER DEFAULT 10,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  gender TEXT,
  birth_date TEXT,
  gym TEXT,
  desired_categories_json TEXT DEFAULT '[]',
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now', '+9 hours')),
  updated_at TEXT DEFAULT (datetime('now', '+9 hours'))
);

CREATE INDEX IF NOT EXISTS idx_pre_registrations_edition ON pre_registrations(contest_edition);
CREATE INDEX IF NOT EXISTS idx_pre_registrations_phone ON pre_registrations(phone);
