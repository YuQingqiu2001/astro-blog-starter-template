-- Journal system database schema

CREATE TABLE IF NOT EXISTS journals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  name_en TEXT,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  cover_image TEXT,
  impact_factor REAL DEFAULT 0,
  issn TEXT,
  is_main INTEGER DEFAULT 0,
  color TEXT DEFAULT '#1565C0',
  field TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('author', 'editor', 'reviewer')),
  journal_id INTEGER,
  verified INTEGER DEFAULT 0,
  affiliation TEXT,
  bio TEXT,
  orcid TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (journal_id) REFERENCES journals(id)
);

CREATE TABLE IF NOT EXISTS editorial_board (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  journal_id INTEGER NOT NULL,
  position TEXT DEFAULT '编委',
  is_editor_in_chief INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 100,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (journal_id) REFERENCES journals(id)
);

CREATE TABLE IF NOT EXISTS board_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  journal_id INTEGER NOT NULL,
  affiliation TEXT,
  position TEXT,
  bio TEXT NOT NULL,
  expertise TEXT,
  cv_r2_key TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  reviewed_by INTEGER,
  review_comment TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (journal_id) REFERENCES journals(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS manuscripts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  abstract TEXT,
  authors TEXT NOT NULL,
  keywords TEXT,
  journal_id INTEGER NOT NULL,
  submitter_id INTEGER NOT NULL,
  status TEXT DEFAULT 'submitted' CHECK(status IN (
    'submitted', 'under_review', 'revision_requested',
    'resubmitted', 'accepted', 'rejected', 'published'
  )),
  r2_key TEXT,
  version INTEGER DEFAULT 1,
  editor_id INTEGER,
  editor_comment TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (journal_id) REFERENCES journals(id),
  FOREIGN KEY (submitter_id) REFERENCES users(id),
  FOREIGN KEY (editor_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS manuscript_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  manuscript_id INTEGER NOT NULL,
  version INTEGER NOT NULL,
  r2_key TEXT NOT NULL,
  response_letter TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (manuscript_id) REFERENCES manuscripts(id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  manuscript_id INTEGER NOT NULL,
  reviewer_id INTEGER NOT NULL,
  status TEXT DEFAULT 'assigned' CHECK(status IN ('assigned', 'in_progress', 'submitted', 'declined')),
  review_r2_key TEXT,
  recommendation TEXT CHECK(recommendation IN ('accept', 'minor_revision', 'major_revision', 'reject', NULL)),
  comments TEXT,
  due_date TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  submitted_at TEXT,
  FOREIGN KEY (manuscript_id) REFERENCES manuscripts(id),
  FOREIGN KEY (reviewer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS editorial_decisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  manuscript_id INTEGER NOT NULL,
  editor_id INTEGER NOT NULL,
  decision TEXT NOT NULL CHECK(decision IN ('accept', 'revision', 'reject')),
  comments TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (manuscript_id) REFERENCES manuscripts(id),
  FOREIGN KEY (editor_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS published_articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  manuscript_id INTEGER NOT NULL,
  journal_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  abstract TEXT,
  authors TEXT NOT NULL,
  keywords TEXT,
  r2_key TEXT NOT NULL,
  doi TEXT,
  volume INTEGER,
  issue INTEGER,
  published_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (manuscript_id) REFERENCES manuscripts(id),
  FOREIGN KEY (journal_id) REFERENCES journals(id)
);

-- Seed initial journals
INSERT OR IGNORE INTO journals (name, name_en, slug, description, impact_factor, issn, is_main, color, field) VALUES
  ('玄学前沿', 'Frontiers in Metaphysics', 'frontiers-metaphysics',
   '致力于发表最抽象、最深刻的研究成果，为全球研究人员提供最优质的摸鱼素材。本刊无差别接受来自各领域的玄学研究，只要足够抽象，我们就愿意发表。', 999.9, '0000-0001', 1, '#C62828', '综合'),
  ('无用科学年刊', 'Annals of Unnecessary Science', 'annals-unnecessary-science',
   '专注于发表那些绝对没有实际应用价值的科学研究。我们坚信，知识本身就是目的，尤其是那些永远不会有用的知识。', 42.0, '0000-0002', 0, '#6A1B9A', '自然科学'),
  ('显见发现学报', 'Journal of Obvious Discoveries', 'journal-obvious-discoveries',
   '我们发表那些一眼就能看出结论但需要大量数据支撑的研究。科学界需要更多"水是湿的"类型的严谨论证。', 31.4, '0000-0003', 0, '#1565C0', '社会科学'),
  ('应用荒谬学评论', 'Reviews in Applied Absurdity', 'reviews-applied-absurdity',
   '汇集了将荒谬理论应用于实际问题的跨界研究。我们相信，每一个荒谬的想法，都有其在现实中的对应物。', 88.8, '0000-0004', 0, '#2E7D32', '交叉学科'),
  ('理论废话快报', 'Letters in Theoretical Nonsense', 'letters-theoretical-nonsense',
   '快速发表短篇废话型理论研究。字数少，废话多，逻辑不必自洽，但引用必须齐全。', 15.2, '0000-0005', 0, '#E65100', '理论研究'),
  ('量化玄学季刊', 'Quarterly Journal of Quantitative Metaphysics', 'quantitative-metaphysics',
   '用数学和统计学方法研究玄学问题。我们尤其欢迎那些公式复杂但结论荒谬的投稿。', 56.7, '0000-0006', 0, '#00838F', '数理方法');

-- Seed sample published articles
INSERT OR IGNORE INTO published_articles (manuscript_id, journal_id, title, abstract, authors, keywords, r2_key, doi, volume, issue, published_at) VALUES
  (0, 1, '水是湿的：一项系统综述与荟萃分析', '本文对过去三十年来关于"水是湿的"这一假说的文献进行了全面系统综述。通过对4721篇相关文献的荟萃分析，我们以95%的置信区间证实了水在常温常压下确实具有湿润特性（p<0.001）。', '张伟, 李明, 王芳', '水, 湿润, 系统综述, 荟萃分析', 'sample/article1.pdf', '10.0000/FIM.2024.001', 1, 1, datetime('now', '-30 days')),
  (0, 2, '为什么猫喜欢盒子：量子叠加态视角', '我们提出了"薛定谔吸引力假说"：在观测之前，猫同时处于"喜欢盒子"和"不喜欢盒子"的量子叠加态。本研究招募了47只猫作为受试者，通过双缝实验的猫版改良方案，验证了该假说。', '陈猫博士, 刘薛定谔', '猫, 量子力学, 盒子, 叠加态', 'sample/article2.pdf', '10.0000/AUS.2024.042', 3, 2, datetime('now', '-15 days')),
  (0, 3, '拖延症的进化优势：来自博士研究生群体的队列研究', '通过对312名博士研究生为期五年的追踪调查，我们发现拖延者在论文答辩时的平均情绪稳定性显著高于非拖延者（效应量d=0.23）。数据表明，进化选择可能偏向于"能拖则拖"的生存策略。', '周德高, 吴等等, 郑明天', '拖延症, 进化心理学, 博士生, 队列研究', 'sample/article3.pdf', '10.0000/JOD.2024.007', 2, 1, datetime('now', '-7 days'));
