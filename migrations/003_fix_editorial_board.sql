-- Migration 003: Fix editorial board — keep only members with valid ORCIDs,
-- set Jinghua Gu as primary Editor in Chief (display_order=1).
-- Run with: wrangler d1 migrations apply journal-db

-- =============================================
-- STEP 1: Remove board entries for members without valid ORCIDs
-- (Yaole Cui and TongC had invalid/placeholder ORCIDs)
-- =============================================

DELETE FROM editorial_board
WHERE user_id IN (
  SELECT id FROM users WHERE email IN ('cuiyaole@msu.edu', '1469566598@qq.com')
);

DELETE FROM users WHERE email IN ('cuiyaole@msu.edu', '1469566598@qq.com');

-- =============================================
-- STEP 2: Set Jinghua Gu as primary Editor in Chief (display_order = 1)
-- =============================================

UPDATE editorial_board
SET display_order = 1
WHERE user_id = (SELECT id FROM users WHERE email = '2040519464@qq.com');

-- =============================================
-- STEP 3: Ensure all other Editors in Chief have display_order = 10
-- =============================================

UPDATE editorial_board
SET display_order = 10
WHERE is_editor_in_chief = 1
  AND user_id != (SELECT id FROM users WHERE email = '2040519464@qq.com');
