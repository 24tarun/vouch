# Database Schema Fixes (Migration 095)

## Overview
Applied comprehensive fixes to address 12 schema issues: FK semantics, missing constraints, nullable contradictions, and missing indexes.

---

## Fixed Issues

### 1. ✅ task_events.actor_id blocks account deletion
**Problem**: FK had `NO ACTION` delete rule, preventing user deletion if they ever performed task events.
**Fix**: Changed to `SET NULL` — task events preserve history with null actor.
**Code impact**: None — already handled as nullable in code.

### 2. ✅ recurrence_rules.voucher_id NOT NULL + SET NULL cascade contradiction
**Problem**: Column was `NOT NULL` but FK rule tried to `SET NULL` on voucher deletion.
**Fix**: Made column nullable.
**Code impact**: Check any code assuming `voucher_id` is always set. Update if needed.

### 3. ✅ web_push_subscriptions.user_id orphaned records
**Problem**: User FK was nullable, allowing orphaned subscriptions.
**Fix**: Made `NOT NULL` — push subscriptions now require a user.
**Code impact**: Ensure account deletion handles push subscriptions (should cascade).

### 4. ✅ commitment_task_links duplicate prevention
**Problem**: No unique constraint on `(commitment_id, task_id)` pairs.
**Fix**: Added `UNIQUE NULLS NOT DISTINCT (commitment_id, task_id)`.
**Code impact**: Queries/inserts must not try to create duplicate links.

### 5. ✅ google_calendar_task_links duplicate sync links
**Problem**: Could have multiple sync records for the same task/event.
**Fix**: Added `UNIQUE (task_id, google_event_id)`.
**Code impact**: Sync code must handle uniqueness; update/upsert instead of insert.

### 6. ✅ google_calendar_connections one-per-user not enforced
**Problem**: Design assumed one connection per user, but no constraint.
**Fix**: Added `UNIQUE (user_id)`.
**Code impact**: Auth flow must handle "connection already exists" scenario gracefully.

### 7. ✅ google_calendar_sync_outbox duplicate intents
**Problem**: Multiple pending syncs for same user/task/intent could queue.
**Fix**: Added `UNIQUE NULLS NOT DISTINCT (user_id, task_id, intent)`.
**Code impact**: Sync workers must handle "already syncing" gracefully.

### 8. ✅ google_calendar_sync_outbox orphaned records on task delete
**Problem**: Task deletion left orphaned sync records (task_id=NULL).
**Fix**: Changed `task_id` FK to `CASCADE DELETE` — sync records deleted with task.
**Code impact**: None — cleaner semantics. Sync workers won't see deleted task refs.

### 9. ✅ Missing indexes on FK columns
**Problem**: Slow JOINs, deletion cascades, RLS policy evaluation.
**Fix**: Added indexes on:
- `commitment_task_links(task_id)`, `commitment_task_links(recurrence_rule_id)`
- `google_calendar_sync_outbox(task_id)`
- `google_calendar_task_links(calendar_id)`
- `task_reminders(parent_task_id)`, `task_subtasks(parent_task_id)`
- `user_blocks(blocker_id)`, `user_blocks(blocked_id)`
- `voucher_reminder_logs(voucher_id)`
- Composite indexes for sync retry loop: `google_calendar_sync_outbox(status, next_attempt_at)`
- Task event queries: `task_events(task_id, event_type)`

**Code impact**: None — indexes are transparent. Queries will just be faster.

---

## Remaining Architectural Notes

### Soft Delete vs. Hard Delete Mix
**Status**: ⚠️ Not fixed (high effort, design decision needed)

**Issue**: Tasks use soft delete (`status='DELETED'`), but profile deletion cascades hard-delete tasks. Inconsistent semantics invite bugs.

**Options**:
1. **Full soft delete**: Change cascades to mark-deleted, not hard-delete. Requires cleanup jobs.
2. **Accept it**: Document that account deletion is nuclear (hard-delete everything), but user-initiated task deletion is soft.

**Recommendation**: Document in SYSTEM_SPEC.md that account deletion is irreversible and complete.

### Orphaned Files in Storage
**Status**: ⚠️ Not fixed (operational, needs background job)

**Issue**: Storage file deletion fails silently in `deleteAccount()`. Orphaned proof files accumulate.

**Fix needed**: Add periodic cleanup job:
```sql
-- Find proofs with no matching task_completion_proofs or owner
SELECT DISTINCT bucket, object_path
FROM task_completion_proofs tcp
WHERE NOT EXISTS (SELECT 1 FROM tasks t WHERE t.id = tcp.task_id)
  AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = tcp.owner_id);

-- Delete files from storage (in chunks of 100)
```

### task_completion_proofs vs. has_proof inconsistency
**Status**: ⚠️ Potential issue (no direct fix)

**Issue**: `tasks.has_proof` boolean doesn't guarantee files exist in storage.

**Mitigation**: Add validation:
- Queries loading proofs should verify upload_state='UPLOADED'
- Add index on `task_completion_proofs(task_id, upload_state)`

---

## Testing Checklist

- [ ] Account deletion succeeds for users with task events (actor_id now SET NULL)
- [ ] Account deletion succeeds for users who authorized rectify passes (authorized_by nullable)
- [ ] Account deletion succeeds for users who are vouchers for recurrence rules (voucher_id now nullable)
- [ ] Calendar sync prevents duplicate links via unique constraint
- [ ] Calendar auth flow handles "connection exists" from unique constraint gracefully
- [ ] Google Calendar sync outbox doesn't create duplicate intents
- [ ] Task deletion cascades properly to sync outbox (no orphaned records)
- [ ] RLS policies still work correctly with new FKs
- [ ] Query performance improved with new indexes

---

## Files Modified

- `supabase/migrations/095_fix_schema_issues.sql` — All fixes applied

---

## Deployment Notes

- Migration is idempotent (uses `IF NOT EXISTS` for indexes)
- No data loss — all changes are structural
- Deployment can be done without downtime (indexes build in background)
- Test in staging first — unique constraints could fail if duplicates exist in legacy data
