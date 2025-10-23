-- Check professionals count by status
SELECT status, COUNT(*) as total
FROM professionals
GROUP BY status;

-- View all professionals
SELECT
  id,
  full_name,
  email,
  status,
  categories,
  created_at
FROM professionals
ORDER BY created_at DESC
LIMIT 50;

-- Approve all pending professionals (uncomment to execute)
-- UPDATE professionals SET status = 'approved' WHERE status = 'pending';

-- View approved professionals only
SELECT
  id,
  full_name,
  email,
  categories
FROM professionals
WHERE status = 'approved'
ORDER BY full_name;
