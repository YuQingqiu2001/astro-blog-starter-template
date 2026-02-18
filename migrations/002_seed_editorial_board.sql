-- Migration 002: Seed editorial board members and update journal definitions
-- Run with: wrangler d1 migrations apply journal-db

-- =============================================
-- STEP 1: Update journals to match new journal list
-- =============================================

-- Clear old journal seed data and re-seed
DELETE FROM journals;

INSERT INTO journals (id, name, name_en, slug, description, cover_image, impact_factor, issn, is_main, color, field) VALUES
  (1,  'Rubbish', 'Rubbish', 'rubbish',
   'The flagship journal of RPG Publishing Group. We accept original research of any quality, as long as it sounds sufficiently academic.',
   '/images/journals/Rubbish.webp', 999.9, '0000-0001', 1, '#B71C1C', 'General'),
  (2,  'Rubbish Biomaterials', 'Rubbish Biomaterials', 'rubbish-biomaterials',
   'Publishing cutting-edge research in materials that are biological, or at least look biological under sufficient magnification.',
   '/images/journals/Rubbish Biomaterials.webp', 88.8, '0000-0002', 0, '#6A1B9A', 'Materials Science'),
  (3,  'Rubbish Cancer', 'Rubbish Cancer', 'rubbish-cancer',
   'Dedicated to publishing the most optimistic cancer research. We have cured cancer in mice more times than we can count.',
   '/images/journals/Rubbish Cancer.webp', 156.4, '0000-0003', 0, '#AD1457', 'Oncology'),
  (4,  'Rubbish Chemistry', 'Rubbish Chemistry', 'rubbish-chemistry',
   'All the chemistry that didn''t make it into real journals. We believe every compound deserves its moment in the spotlight.',
   '/images/journals/Rubbish Chemistry.webp', 42.0, '0000-0004', 0, '#1565C0', 'Chemistry'),
  (5,  'Rubbish Communication', 'Rubbish Communication', 'rubbish-communication',
   'Short letters on topics that could have been emails. Maximum word count with minimum information density.',
   '/images/journals/Rubbish Communication.webp', 75.2, '0000-0005', 0, '#2E7D32', 'Communications'),
  (6,  'Rubbish Communications', 'Rubbish Communications', 'rubbish-communications',
   'The plural cousin of Rubbish Communication. We publish everything the singular journal rejected for being too concise.',
   '/images/journals/Rubbish Communications.webp', 68.9, '0000-0006', 0, '#00695C', 'Communications'),
  (7,  'Rubbish Computation & AI', 'Rubbish Computation & AI', 'rubbish-computation-ai',
   'Where artificial intelligence meets artificial results. We welcome all AI papers, especially those trained on our own archives.',
   '/images/journals/Rubbish Computation & AI.webp', 312.7, '0000-0007', 0, '#1A237E', 'Computer Science'),
  (8,  'Rubbish Daily', 'Rubbish Daily', 'rubbish-daily',
   'Published every day. Quality not guaranteed. We operate on the philosophy that quantity has a quality of its own.',
   '/images/journals/Rubbish Daily.webp', 15.2, '0000-0008', 0, '#E65100', 'Multidisciplinary'),
  (9,  'Rubbish Earth & Environment', 'Rubbish Earth & Environment', 'rubbish-earth-environment',
   'For research about the planet we are actively destroying. We accept papers on climate change, as long as they end on a positive note.',
   '/images/journals/Rubbish Earth & Environment.webp', 56.7, '0000-0009', 0, '#388E3C', 'Environmental Science'),
  (10, 'Rubbish Engineering', 'Rubbish Engineering', 'rubbish-engineering',
   'For engineers who build things that technically work under very specific conditions.',
   '/images/journals/Rubbish Engineering.webp', 33.1, '0000-0010', 0, '#5D4037', 'Engineering'),
  (11, 'Rubbish Genetics', 'Rubbish Genetics', 'rubbish-genetics',
   'We sequence everything. Absolutely everything. Our GWAS studies have identified genetic variants for personality traits that don''t exist.',
   '/images/journals/Rubbish Genetics.webp', 98.4, '0000-0011', 0, '#00838F', 'Genetics & Genomics'),
  (12, 'Rubbish Inorganic Chemistry', 'Rubbish Inorganic Chemistry', 'rubbish-inorganic-chemistry',
   'For the chemists who find organic too mainstream. Compounds with at least 7 metal centers and no clear application.',
   '/images/journals/Rubbish Inorganic Chemistry.webp', 29.3, '0000-0012', 0, '#4527A0', 'Inorganic Chemistry'),
  (13, 'Rubbish Life Sciences & Medicine', 'Rubbish Life Sciences & Medicine', 'rubbish-life-sciences-medicine',
   'Bridging life and medicine with a healthy disregard for statistical power. Our n=3 studies have changed fields.',
   '/images/journals/Rubbish Life Sciences & Medicine.webp', 201.5, '0000-0013', 0, '#AD1457', 'Life Sciences'),
  (14, 'Rubbish Metabolism', 'Rubbish Metabolism', 'rubbish-metabolism',
   'All the metabolites, none of the clinical relevance. Over 10,000 biomarkers for conditions that remain undefined.',
   '/images/journals/Rubbish Metabolism.webp', 144.8, '0000-0014', 0, '#F57F17', 'Metabolism'),
  (15, 'Rubbish Microbiome', 'Rubbish Microbiome', 'rubbish-microbiome',
   'The gut controls everything. We are dedicated to proving this, regardless of what the data says.',
   '/images/journals/Rubbish Microbiome.webp', 87.6, '0000-0015', 0, '#558B2F', 'Microbiology'),
  (16, 'Rubbish Physical Sciences & Engineering', 'Rubbish Physical Sciences & Engineering', 'rubbish-physical-sciences-engineering',
   'Physics, but make it engineering. Engineering, but make it physics. We are confused too, but at least we publish quickly.',
   '/images/journals/Rubbish Physical Sciences & Engineering.webp', 45.9, '0000-0016', 0, '#1565C0', 'Physical Sciences'),
  (17, 'Rubbish Psychiatry', 'Rubbish Psychiatry', 'rubbish-psychiatry',
   'Mental health research for a field that desperately needs more, not necessarily better, publications.',
   '/images/journals/Rubbish Psychiatry.webp', 62.3, '0000-0017', 0, '#7B1FA2', 'Psychiatry'),
  (18, 'Rubbish Psychology', 'Rubbish Psychology', 'rubbish-psychology',
   'Replication crisis? What replication crisis? We have p-values below 0.05 and that is all that matters.',
   '/images/journals/Rubbish Psychology.webp', 38.7, '0000-0018', 0, '#880E4F', 'Psychology'),
  (19, 'Rubbish Reviews & Methods', 'Rubbish Reviews & Methods', 'rubbish-reviews-methods',
   'Meta-analyses of studies that should not have been meta-analyzed. Methods that work in theory.',
   '/images/journals/Rubbish Reviews & Methods Tier.webp', 113.2, '0000-0019', 0, '#37474F', 'Methodology'),
  (20, 'Rubbish Social & Interdisciplinary', 'Rubbish Social & Interdisciplinary', 'rubbish-social-interdisciplinary',
   'When your research doesn''t fit anywhere else. The last resort for interdisciplinary work every other journal rejected.',
   '/images/journals/Rubbish Social & Interdisciplinary.webp', 27.4, '0000-0020', 0, '#E64A19', 'Social Sciences'),
  (21, 'Frontiers in Bullshitology', 'Frontiers in Bullshitology', 'frontiers-bullshitology',
   'The premier journal in the rapidly growing field of bullshitology. Peer review is optional but encouraged.',
   '/images/journals/Frontiers in Bullshitology.webp', 9999.0, '0000-0021', 0, '#BF360C', 'Bullshitology'),
  (22, 'JOKES', 'JOKES', 'jokes',
   'Journal of Knotty Empirical Studies. We take humor seriously, very seriously, with full statistical rigor.',
   '/images/journals/JOKES.webp', 42.0, '0000-0022', 0, '#F9A825', 'Humor Studies'),
  (23, 'Litter', 'Litter', 'litter',
   'Letters in Transmissible Theoretical Epistemology Research. Short-form theoretical contributions of dubious practical value.',
   '/images/journals/Litter.webp', 18.6, '0000-0023', 0, '#4E342E', 'Theory'),
  (24, 'METAPHYSICS', 'METAPHYSICS', 'metaphysics',
   'Modern Empirical Thought on Abstract Philosophy, Hypotheses, Yonder Sciences, and Intangible Cosmological Submissions.',
   '/images/journals/METAPHYSICS.webp', 777.7, '0000-0024', 0, '#283593', 'Philosophy'),
  (25, 'Nothing Photonics', 'Nothing Photonics', 'nothing-photonics',
   'Optics for the void. Propagation, manipulation, and measurement of photons that may or may not exist.',
   '/images/journals/Nothing Photonics.webp', 234.1, '0000-0025', 0, '#006064', 'Photonics'),
  (26, 'The Journal of Rubbish Finance', 'The Journal of Rubbish Finance', 'journal-rubbish-finance',
   'Financial research that predicted every market crash, in hindsight. Our models are perfect, past events notwithstanding.',
   '/images/journals/The Journal of Rubbish Finance.webp', 66.6, '0000-0026', 0, '#1B5E20', 'Finance'),
  (27, 'Useless Discover', 'Useless Discover', 'useless-discover',
   'Discovering things that were already known, or things that perhaps should not have been discovered. Open access, zero quality control.',
   '/images/journals/Useless Discover.webp', 31.4, '0000-0027', 0, '#880E4F', 'General Science');

-- =============================================
-- STEP 2: Seed editorial board member user accounts
-- Normalized roles: Editor in Chief, Associate Editor, Editorial Board Member
-- Password hash is a placeholder (accounts are display-only, not for login)
-- =============================================

INSERT OR IGNORE INTO users (email, password_hash, name, role, journal_id, verified, affiliation, orcid) VALUES
  -- Editors in Chief (assigned to main journal Rubbish, id=1)
  ('2040519464@qq.com',       'board_member_placeholder', 'Jinghua Gu',    'editor', 1, 1, 'Anhui Medical University',                          '0009-0000-8691-1312'),
  ('shiyaostudio@163.com',    'board_member_placeholder', 'Chihaya Anon',  'editor', 1, 1, 'Royal Historical Society',                          '0000-0002-7093-3506'),
  ('panqing@gt.cn',           'board_member_placeholder', 'Qing Pan',      'editor', 1, 1, 'Panjin Liaohe Oilfield Baoshihua Hospital',         '0009-0001-1253-6481'),
  ('326746191@qq.com',        'board_member_placeholder', 'Yijing Li',     'editor', 1, 1, 'North China University of Water Resources and Electric Power', '0000-0003-3479-6193'),
  ('dasce@outlook.com',       'board_member_placeholder', 'Yuze Hao',      'editor', 1, 1, 'Inner Mongolia University',                         '0000-0001-7878-4239'),
  ('2236205811@qq.com',       'board_member_placeholder', 'Jianhong Qi',   'editor', 1, 1, 'Shandong University',                               '0000-0012-3698-1253'),
  ('470041595@qq.com',        'board_member_placeholder', 'Wei Chen',      'editor', 1, 1, 'School of Technology, Fuzhou Technology and Business University', '0009-0005-2080-7711'),
  -- Associate Editor
  ('bxr15900638191@163.com',  'board_member_placeholder', 'Xinrui Bai',    'editor', 1, 1, 'Gansu Provincial People''s Hospital',               '0009-0008-8577-4940'),
  -- Editorial Board Members
  ('ljq2005012023@163.com',   'board_member_placeholder', 'Jingqi Li',     'editor', 1, 1, 'Hebei Medical University',                          '0009-0005-2915-2870'),
  ('dylan214@126.com',        'board_member_placeholder', 'Zhen Ren',      'editor', 1, 1, 'Dalian University of Technology',                   '0009-0009-2492-7410'),
  ('pyz372203@126.com',       'board_member_placeholder', 'Pan Yingzhuo',  'editor', 1, 1, 'JiLin University of Finance and Economics',         '0009-0005-3319-0239'),
  ('caihaohong@foxmail.com',  'board_member_placeholder', 'Cai Haohong',   'editor', 1, 1, 'Shandong University',                               '0000-0002-7402-9426'),
  ('yaoyuan9921@mails.jlu.edu.cn', 'board_member_placeholder', 'MesaYao',  'editor', 1, 1, 'Jilin University',                                  '0009-0000-6987-8864'),
  ('luxh@hust.edu.cn',        'board_member_placeholder', 'Xinhe Lu',      'editor', 1, 1, 'Huazhong University of Science and Technology',     '0009-0008-2912-0109'),
  ('chunlin.he@connect.polyu.hk', 'board_member_placeholder', 'He Chunlin','editor', 1, 1, 'Hong Kong Polytechnic University',                  '0000-0001-8171-1012'),
  ('fcc18159959869@163.com',  'board_member_placeholder', 'Changcan Feng', 'editor', 1, 1, 'Xiamen University',                                 '0009-0000-1640-1579'),
  ('cuiyaole@msu.edu',        'board_member_placeholder', 'Yaole Cui',     'editor', 1, 1, 'Southern University of Science and Technology',     NULL),
  ('zhihao_xu_a@163.com',     'board_member_placeholder', 'Zhihao Xu',     'editor', 1, 1, 'Anhui Medical University',                          '0000-0003-1312-8428'),
  ('linzhichengl@163.com',    'board_member_placeholder', 'Zhicheng Lin',  'editor', 1, 1, 'Sichuan University',                                '0009-0000-2956-6217'),
  ('yanwx59304@163.com',      'board_member_placeholder', 'Wenxia',        'editor', 1, 1, 'Rubbish University',                                '0009-0003-5329-4209'),
  -- TongC assigned to Rubbish Communications (id=6)
  ('1469566598@qq.com',       'board_member_placeholder', 'TongC',         'editor', 6, 1, 'Huazhong University of Science and Technology',     NULL),
  -- Jiajun Gui: Bioinformatics / 生物信息学
  ('a1074646773@gmail.com',   'board_member_placeholder', 'Jiajun Gui',    'editor', 1, 1, 'Fujian Medical University',                         '0009-0008-2328-4030');

-- =============================================
-- STEP 3: Seed editorial_board entries
-- =============================================

-- Editors in Chief (is_editor_in_chief=1)
INSERT OR IGNORE INTO editorial_board (user_id, journal_id, position, is_editor_in_chief, display_order)
SELECT u.id, u.journal_id, 'Editor in Chief', 1, 10
FROM users u
WHERE u.email IN (
  '2040519464@qq.com',
  'shiyaostudio@163.com',
  'panqing@gt.cn',
  '326746191@qq.com',
  'dasce@outlook.com',
  '2236205811@qq.com',
  '470041595@qq.com'
);

-- Associate Editor
INSERT OR IGNORE INTO editorial_board (user_id, journal_id, position, is_editor_in_chief, display_order)
SELECT u.id, u.journal_id, 'Associate Editor', 0, 20
FROM users u
WHERE u.email = 'bxr15900638191@163.com';

-- Editorial Board Members (regular)
INSERT OR IGNORE INTO editorial_board (user_id, journal_id, position, is_editor_in_chief, display_order)
SELECT u.id, u.journal_id, 'Editorial Board Member', 0, 50
FROM users u
WHERE u.email IN (
  'ljq2005012023@163.com',
  'dylan214@126.com',
  'pyz372203@126.com',
  'caihaohong@foxmail.com',
  'yaoyuan9921@mails.jlu.edu.cn',
  'luxh@hust.edu.cn',
  'chunlin.he@connect.polyu.hk',
  'fcc18159959869@163.com',
  'cuiyaole@msu.edu',
  'zhihao_xu_a@163.com',
  'linzhichengl@163.com',
  'yanwx59304@163.com',
  '1469566598@qq.com',
  'a1074646773@gmail.com'
);

-- =============================================
-- STEP 4: Update sample published articles for new journals
-- =============================================

DELETE FROM published_articles WHERE manuscript_id = 0;

INSERT OR IGNORE INTO published_articles (manuscript_id, journal_id, title, abstract, authors, keywords, r2_key, doi, volume, issue, published_at) VALUES
  (0, 1, 'Water Is Wet: A Systematic Review and Meta-Analysis',
   'We conclusively confirm, with 95% confidence interval, that water exhibits wet properties at standard temperature and pressure (p<0.001). This work has been cited by itself 847 times.',
   'Zhang W., Li M., Wang F.', 'water, wet, systematic review, meta-analysis',
   'sample/article1.pdf', '10.0000/RUB.2024.001', 1, 1, datetime('now', '-30 days')),
  (0, 7, 'Why My AI Model Agrees With Everything I Say: A Sycophancy Study',
   'We trained 47 language models and found a statistically significant correlation (r=0.99) between the researcher''s desired outcome and the model''s output.',
   'Chen A., Liu B.', 'AI, sycophancy, language models, bias',
   'sample/article2.pdf', '10.0000/RCA.2025.007', 1, 1, datetime('now', '-15 days')),
  (0, 18, 'The Evolutionary Advantage of Procrastination: A 5-Year Longitudinal Study of PhD Students',
   'PhD students who procrastinated showed 23% higher emotional stability at thesis defense (d=0.23). Evolution may favor the strategy of delay until absolutely necessary.',
   'Zhou D., Wu E., Zheng M.', 'procrastination, evolution, PhD, psychology',
   'sample/article3.pdf', '10.0000/RPSY.2025.042', 1, 1, datetime('now', '-7 days'));
