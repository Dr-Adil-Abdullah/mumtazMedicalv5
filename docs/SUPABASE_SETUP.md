# Supabase Setup

## Environment variables
Create a `.env` file based on `.env.example`:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Current sync foundation included
- Manual queue push to Supabase
- Manual cloud pull to local Dexie
- Realtime listener foundation
- Sync status tracking in UI
- Backup/restore-friendly queue rebuild logic

## Expected public tables
The current sync layer expects these tables in Supabase:
- settings
- staff
- products
- product_batches
- customers
- suppliers
- sales
- expenses
- purchase_list
- logs
- partial_payments
- day_sessions

## Notes
- Sync is safe to keep disabled until credentials exist.
- Once credentials are configured, enable sync in Settings and run a manual sync.
