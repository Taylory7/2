-- ============================================================
-- Schema: Xiangtan Zhonghuan Water Co., Ltd. (xtzhsw)
-- Run this entire script in Supabase SQL Editor
-- All tables use RLS: public SELECT allowed, write operations denied
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE everywhere
-- ============================================================

-- 1. NEWS (公司要闻)
CREATE TABLE IF NOT EXISTS news (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title         TEXT NOT NULL,
  icon_emoji    TEXT NOT NULL DEFAULT '📰',
  category      TEXT NOT NULL DEFAULT 'meeting'
                CHECK (category IN ('hot', 'meeting', 'project', 'party')),
  summary       TEXT NOT NULL DEFAULT '',
  views         INT NOT NULL DEFAULT 0,
  published_at  DATE NOT NULL DEFAULT CURRENT_DATE,
  is_featured   BOOLEAN NOT NULL DEFAULT false,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_news_published ON news (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_category ON news (category);
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "news_select" ON news FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. NOTICES (通知公告)
CREATE TABLE IF NOT EXISTS notices (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title         TEXT NOT NULL,
  icon_emoji    TEXT NOT NULL DEFAULT '📋',
  category      TEXT NOT NULL DEFAULT 'announce'
                CHECK (category IN ('stop', 'announce', 'public', 'notify', 'urgent')),
  extra_info    TEXT NOT NULL DEFAULT '',
  views         INT NOT NULL DEFAULT 0,
  published_at  DATE NOT NULL DEFAULT CURRENT_DATE,
  is_featured   BOOLEAN NOT NULL DEFAULT false,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notices_published ON notices (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_notices_category ON notices (category);
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "notices_select" ON notices FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. PHOTO_NEWS (图片新闻)
CREATE TABLE IF NOT EXISTS photo_news (
  id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title              TEXT NOT NULL,
  icon_emoji         TEXT NOT NULL DEFAULT '📷',
  background_gradient TEXT NOT NULL DEFAULT 'linear-gradient(135deg,#dbeafe,#93c5fd)',
  section            TEXT NOT NULL DEFAULT 'recent'
                     CHECK (section IN ('recent', 'history')),
  album_category     TEXT NOT NULL DEFAULT 'construction'
                     CHECK (album_category IN ('construction','conference','honor','testing','public_open','emergency','culture','general')),
  views              INT NOT NULL DEFAULT 0,
  published_at       DATE NOT NULL DEFAULT CURRENT_DATE,
  is_featured_main   BOOLEAN NOT NULL DEFAULT false,
  is_featured_side   BOOLEAN NOT NULL DEFAULT false,
  sort_order         INT NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_photo_published ON photo_news (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_photo_section ON photo_news (section);
ALTER TABLE photo_news ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "photo_select" ON photo_news FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. MEDIA_COVERAGE (媒体聚焦)
CREATE TABLE IF NOT EXISTS media_coverage (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title            TEXT NOT NULL,
  source_name      TEXT NOT NULL,
  source_slug      TEXT NOT NULL
                   CHECK (source_slug IN ('hnrb','hw','xtrb','zgslb','hntv','rmw','hnjsb','other')),
  summary          TEXT NOT NULL DEFAULT '',
  publication_info TEXT NOT NULL DEFAULT '',
  views            INT NOT NULL DEFAULT 0,
  published_at     DATE NOT NULL DEFAULT CURRENT_DATE,
  is_featured      BOOLEAN NOT NULL DEFAULT false,
  sort_order       INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_media_published ON media_coverage (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_media_source ON media_coverage (source_slug);
ALTER TABLE media_coverage ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "media_select" ON media_coverage FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5. TOPICS (专题专栏)
CREATE TABLE IF NOT EXISTS topics (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title       TEXT NOT NULL,
  subtitle    TEXT NOT NULL DEFAULT '',
  icon_emoji  TEXT NOT NULL DEFAULT '📌',
  icon_class  TEXT NOT NULL DEFAULT 'topic-icon-1',
  link_url    TEXT NOT NULL DEFAULT '#',
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "topics_select" ON topics FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_news_updated ON news;
CREATE TRIGGER trg_news_updated BEFORE UPDATE ON news
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_notices_updated ON notices;
CREATE TRIGGER trg_notices_updated BEFORE UPDATE ON notices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_photo_updated ON photo_news;
CREATE TRIGGER trg_photo_updated BEFORE UPDATE ON photo_news
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
DROP TRIGGER IF EXISTS trg_media_updated ON media_coverage;
CREATE TRIGGER trg_media_updated BEFORE UPDATE ON media_coverage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Write policies for authenticated admin users
-- ============================================================

-- 1. NEWS
DO $$ BEGIN
  CREATE POLICY "news_insert_auth" ON news FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "news_update_auth" ON news FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "news_delete_auth" ON news FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. NOTICES
DO $$ BEGIN
  CREATE POLICY "notices_insert_auth" ON notices FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "notices_update_auth" ON notices FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "notices_delete_auth" ON notices FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. PHOTO_NEWS
DO $$ BEGIN
  CREATE POLICY "photo_insert_auth" ON photo_news FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "photo_update_auth" ON photo_news FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "photo_delete_auth" ON photo_news FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. MEDIA_COVERAGE
DO $$ BEGIN
  CREATE POLICY "media_insert_auth" ON media_coverage FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "media_update_auth" ON media_coverage FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "media_delete_auth" ON media_coverage FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5. TOPICS
DO $$ BEGIN
  CREATE POLICY "topics_insert_auth" ON topics FOR INSERT TO authenticated WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "topics_update_auth" ON topics FOR UPDATE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "topics_delete_auth" ON topics FOR DELETE TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
