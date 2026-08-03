UPDATE deals SET paid_at = updated_at WHERE status = 'PAID' AND paid_at IS NULL;
