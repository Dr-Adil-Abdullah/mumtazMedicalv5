import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { db } from '../db/index';
import { useAuthStore } from '../store/authStore';
import { downloadBackupJSON, restoreBackupPayload } from '../db/backup';
import { getSupabaseConfigInfo } from '../db/supabase';
import { refreshQueueCount, runManualSync, startRealtimeSync, stopRealtimeSync } from '../db/sync';
import { useSyncStore } from '../store/syncStore';

export default function SettingsPage() {
  const settings = useLiveQuery(() => db.settings.get(1), []);
  const staffCount = useLiveQuery(() => db.staff.count(), []);
  const logCount = useLiveQuery(() => db.logs.count(), []);
  const queueCount = useLiveQuery(() => db.sync_queue.count(), []);
  const user = useAuthStore((state) => state.user);
  const syncState = useSyncStore();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    shop_name: '',
    address: '',
    phone: '',
    pending_min_amount: 100,
    receipt_format: 'thermal',
    sync_enabled: false,
    low_stock_default: 10,
    near_end_default: 5,
    allow_negative_stock: false,
    tax_enabled: false,
    tax_percent: 0,
    require_phone_for_vip: true,
    loyalty_enabled: true,
    loyalty_points_rate: 1,
    loyalty_redeem_rate: 1,
    loyalty_silver_at: 100,
    loyalty_gold_at: 500,
    loyalty_platinum_at: 2000,
    auto_block_overdue: false,
    cart_item_limit: 0,
    max_discount_percent: 100,
    global_discount_enabled: false,
    global_discount_type: 'flat',
    global_discount_percent: 0
  });
  const [status, setStatus] = useState('');
  const [backupStatus, setBackupStatus] = useState('');
  const [backupError, setBackupError] = useState('');
  const [selectedBackupName, setSelectedBackupName] = useState('');
  const [backupLoading, setBackupLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [syncError, setSyncError] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);

  function flashStatus(message) {
    setStatus(message);
    window.setTimeout(() => setStatus(''), 3000);
  }

  const supabaseConfig = getSupabaseConfigInfo();

  useEffect(() => {
    if (settings) {
      setForm({
        shop_name: settings.shop_name ?? '',
        address: settings.address ?? '',
        phone: settings.phone ?? '',
        pending_min_amount: settings.pending_min_amount ?? 100,
        receipt_format: settings.receipt_format ?? 'thermal',
        sync_enabled: Boolean(settings.sync_enabled),
        low_stock_default: settings.low_stock_default ?? 10,
        near_end_default: settings.near_end_default ?? 5,
        allow_negative_stock: Boolean(settings.allow_negative_stock),
        tax_enabled: Boolean(settings.tax_enabled),
        tax_percent: settings.tax_percent ?? 0,
        require_phone_for_vip: settings.require_phone_for_vip ?? true,
        loyalty_enabled: settings.loyalty_enabled ?? true,
        loyalty_points_rate: settings.loyalty_points_rate ?? 1,
        loyalty_redeem_rate: settings.loyalty_redeem_rate ?? 1,
        loyalty_silver_at: settings.loyalty_silver_at ?? 100,
        loyalty_gold_at: settings.loyalty_gold_at ?? 500,
        loyalty_platinum_at: settings.loyalty_platinum_at ?? 2000,
        auto_block_overdue: Boolean(settings.auto_block_overdue),
        cart_item_limit: settings.cart_item_limit ?? 0,
        max_discount_percent: settings.max_discount_percent ?? 100,
        global_discount_enabled: Boolean(settings.global_discount_enabled),
        global_discount_type: settings.global_discount_type ?? 'flat',
        global_discount_percent: settings.global_discount_percent ?? 0
      });
    }
  }, [settings]);

  async function handleSave(event) {
    event.preventDefault();
    if (!settings) return;

    const loyaltyPointsRate = Number(form.loyalty_points_rate) || 0;
    const loyaltyRedeemRate = Number(form.loyalty_redeem_rate) || 0;
    const loyaltySilverAt = Number(form.loyalty_silver_at) || 0;
    const loyaltyGoldAt = Number(form.loyalty_gold_at) || 0;
    const loyaltyPlatinumAt = Number(form.loyalty_platinum_at) || 0;

    if (loyaltyPointsRate < 0 || loyaltyRedeemRate < 0) {
      flashStatus('Loyalty rates cannot be negative.');
      return;
    }

    if (loyaltySilverAt < 1 || loyaltyGoldAt <= loyaltySilverAt || loyaltyPlatinumAt <= loyaltyGoldAt) {
      flashStatus('Loyalty thresholds must increase in order: Silver < Gold < Platinum.');
      return;
    }

    const next = {
      ...settings,
      ...form,
      sync_enabled: Boolean(form.sync_enabled),
      pending_min_amount: Number(form.pending_min_amount) || 0,
      low_stock_default: Number(form.low_stock_default) || 0,
      near_end_default: Number(form.near_end_default) || 0,
      allow_negative_stock: Boolean(form.allow_negative_stock),
      tax_enabled: Boolean(form.tax_enabled),
      tax_percent: Number(form.tax_percent) || 0,
      require_phone_for_vip: Boolean(form.require_phone_for_vip),
      loyalty_enabled: Boolean(form.loyalty_enabled),
      loyalty_points_rate: loyaltyPointsRate,
      loyalty_redeem_rate: loyaltyRedeemRate,
      loyalty_silver_at: loyaltySilverAt,
      loyalty_gold_at: loyaltyGoldAt,
      loyalty_platinum_at: loyaltyPlatinumAt,
      auto_block_overdue: Boolean(form.auto_block_overdue),
      cart_item_limit: Number(form.cart_item_limit) || 0,
      max_discount_percent: Number(form.max_discount_percent) || 0,
      global_discount_enabled: Boolean(form.global_discount_enabled),
      global_discount_type: form.global_discount_type,
      global_discount_percent: Number(form.global_discount_percent) || 0,
      updated_at: new Date().toISOString()
    };

    await db.settings.put(next);
    await db.logs.add({
      id: crypto.randomUUID(),
      action: 'SETTING_CHANGE',
      user_id: user?.id,
      user_name: user?.name ?? 'Unknown',
      details: {
        changed: [
          'shop_name',
          'address',
          'phone',
          'pending_min_amount',
          'receipt_format',
          'sync_enabled',
          'low_stock_default',
          'near_end_default',
          'allow_negative_stock',
          'tax_enabled',
          'tax_percent',
          'require_phone_for_vip',
          'loyalty_enabled',
          'loyalty_points_rate',
          'loyalty_redeem_rate',
          'loyalty_silver_at',
          'loyalty_gold_at',
          'loyalty_platinum_at',
          'auto_block_overdue',
          'cart_item_limit',
          'max_discount_percent',
          'global_discount_enabled',
          'global_discount_type',
          'global_discount_percent'
        ]
      },
      timestamp: new Date().toISOString()
    });

    if (next.sync_enabled) {
      await startRealtimeSync().catch(() => null);
      refreshQueueCount();
    } else {
      await stopRealtimeSync().catch(() => null);
    }

    setStatus('Settings saved locally in IndexedDB.');
    setTimeout(() => setStatus(''), 2500);
  }

  async function handleExportBackup() {
    setBackupLoading(true);
    setBackupError('');
    setBackupStatus('');

    try {
      const payload = await downloadBackupJSON();
      await db.logs.add({
        id: crypto.randomUUID(),
        action: 'BACKUP',
        user_id: user?.id,
        user_name: user?.name ?? 'Unknown',
        details: {
          exportedAt: payload.meta?.exportedAt ?? null,
          tableCount: payload.meta?.tableCount ?? 0
        },
        timestamp: new Date().toISOString()
      });
      setBackupStatus('Backup JSON exported successfully.');
    } catch (error) {
      setBackupError(error.message || 'Backup export failed.');
    } finally {
      setBackupLoading(false);
    }
  }

  async function handleBackupFileChange(event) {
    const file = event.target.files?.[0];
    setSelectedBackupName(file?.name ?? '');
    if (!file) return;

    setBackupLoading(true);
    setBackupError('');
    setBackupStatus('');

    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const result = await restoreBackupPayload(payload, user);
      await refreshQueueCount();
      setBackupStatus(
        `Backup restored successfully. ${result.tableCount} table groups processed, ${result.queuedRecords} records queued for future sync.`
      );
    } catch (error) {
      setBackupError(error.message || 'Backup restore failed.');
    } finally {
      setBackupLoading(false);
      event.target.value = '';
    }
  }

  async function handleManualSync() {
    setSyncLoading(true);
    setSyncMessage('');
    setSyncError('');

    try {
      const result = await runManualSync({ actor: user });
      await refreshQueueCount();
      setSyncMessage(`Manual sync completed at ${new Date(result.syncedAt).toLocaleString()}.`);
    } catch (error) {
      setSyncError(error.message || 'Manual sync failed.');
    } finally {
      setSyncLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card-grid">
        <Card>
          <p className="text-sm text-slate-400">Shop name</p>
          <h3 className="mt-2 text-2xl font-bold text-white">{settings?.shop_name ?? '...'}</h3>
        </Card>
        <Card>
          <p className="text-sm text-slate-400">Staff seeded</p>
          <h3 className="mt-2 text-2xl font-bold text-white">{staffCount ?? '...'}</h3>
        </Card>
        <Card>
          <p className="text-sm text-slate-400">Logs stored</p>
          <h3 className="mt-2 text-2xl font-bold text-white">{logCount ?? '...'}</h3>
        </Card>
        <Card>
          <p className="text-sm text-slate-400">Sync queue</p>
          <h3 className="mt-2 text-2xl font-bold text-white">{queueCount ?? '...'}</h3>
        </Card>
      </div>

      <Card className="max-w-4xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-brand-300">System settings</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Bootstrap configuration</h2>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-2 text-sm text-slate-300">
            Stored in Dexie / IndexedDB
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSave}>
          <Input
            label="Shop name"
            value={form.shop_name}
            onChange={(event) => setForm((current) => ({ ...current, shop_name: event.target.value }))}
            placeholder="Mumtaz Medical"
          />
          <Input
            label="Address"
            value={form.address}
            onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
            placeholder="Shop address"
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
            placeholder="03xx-xxxxxxx"
          />
          <Input
            label="Minimum pending amount"
            type="number"
            min="0"
            value={form.pending_min_amount}
            onChange={(event) => setForm((current) => ({ ...current, pending_min_amount: event.target.value }))}
          />

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-300">Receipt format</span>
            <select
              value={form.receipt_format}
              onChange={(event) => setForm((current) => ({ ...current, receipt_format: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30"
            >
              <option value="thermal">Thermal</option>
              <option value="a4">A4</option>
            </select>
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Low stock default"
              type="number"
              min="0"
              value={form.low_stock_default}
              onChange={(event) => setForm((current) => ({ ...current, low_stock_default: event.target.value }))}
            />
            <Input
              label="Near-end default"
              type="number"
              min="0"
              value={form.near_end_default}
              onChange={(event) => setForm((current) => ({ ...current, near_end_default: event.target.value }))}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Cart item limit (0 = unlimited)"
              type="number"
              min="0"
              value={form.cart_item_limit}
              onChange={(event) => setForm((current) => ({ ...current, cart_item_limit: event.target.value }))}
            />
            <Input
              label="Max discount %"
              type="number"
              min="0"
              max="100"
              value={form.max_discount_percent}
              onChange={(event) => setForm((current) => ({ ...current, max_discount_percent: event.target.value }))}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-4 text-sm text-slate-300">
              <div>
                <div className="font-medium text-white">Allow negative stock</div>
                <div className="mt-1 text-xs text-slate-400">If enabled, sales can continue even when stock drops below zero.</div>
              </div>
              <input
                type="checkbox"
                checked={form.allow_negative_stock}
                onChange={(event) => setForm((current) => ({ ...current, allow_negative_stock: event.target.checked }))}
                className="h-5 w-5 rounded border-white/20 bg-slate-950 text-brand-500"
              />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-4 text-sm text-slate-300">
              <div>
                <div className="font-medium text-white">Require phone for VIP</div>
                <div className="mt-1 text-xs text-slate-400">Blocks saving VIP customers unless a phone number is provided.</div>
              </div>
              <input
                type="checkbox"
                checked={form.require_phone_for_vip}
                onChange={(event) => setForm((current) => ({ ...current, require_phone_for_vip: event.target.checked }))}
                className="h-5 w-5 rounded border-white/20 bg-slate-950 text-brand-500"
              />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-4 text-sm text-slate-300">
              <div>
                <div className="font-medium text-white">Enable loyalty</div>
                <div className="mt-1 text-xs text-slate-400">Cash sales with a named customer can earn loyalty points automatically.</div>
              </div>
              <input
                type="checkbox"
                checked={form.loyalty_enabled}
                onChange={(event) => setForm((current) => ({ ...current, loyalty_enabled: event.target.checked }))}
                className="h-5 w-5 rounded border-white/20 bg-slate-950 text-brand-500"
              />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-4 text-sm text-slate-300">
              <div>
                <div className="font-medium text-white">Enable tax</div>
                <div className="mt-1 text-xs text-slate-400">Adds tax to checkout and receipts.</div>
              </div>
              <input
                type="checkbox"
                checked={form.tax_enabled}
                onChange={(event) => setForm((current) => ({ ...current, tax_enabled: event.target.checked }))}
                className="h-5 w-5 rounded border-white/20 bg-slate-950 text-brand-500"
              />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-4 text-sm text-slate-300 md:col-span-2">
              <div>
                <div className="font-medium text-white">Auto-block overdue pending</div>
                <div className="mt-1 text-xs text-slate-400">Owner preference for customers with unpaid old balances.</div>
              </div>
              <input
                type="checkbox"
                checked={form.auto_block_overdue}
                onChange={(event) => setForm((current) => ({ ...current, auto_block_overdue: event.target.checked }))}
                className="h-5 w-5 rounded border-white/20 bg-slate-950 text-brand-500"
              />
            </label>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/50 p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-white">Loyalty settings</div>
                <div className="mt-1 text-xs text-slate-400">Configure point earning, redemption value, and stage thresholds.</div>
              </div>
              <Badge className={form.loyalty_enabled ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-slate-500/30 bg-slate-500/10 text-slate-200'}>
                {form.loyalty_enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              <Input
                label="Points rate"
                type="number"
                min="0"
                step="0.01"
                value={form.loyalty_points_rate}
                onChange={(event) => setForm((current) => ({ ...current, loyalty_points_rate: event.target.value }))}
              />
              <Input
                label="Redeem rate"
                type="number"
                min="0"
                step="0.01"
                value={form.loyalty_redeem_rate}
                onChange={(event) => setForm((current) => ({ ...current, loyalty_redeem_rate: event.target.value }))}
              />
              <Input
                label="Silver at"
                type="number"
                min="1"
                value={form.loyalty_silver_at}
                onChange={(event) => setForm((current) => ({ ...current, loyalty_silver_at: event.target.value }))}
              />
              <Input
                label="Gold at"
                type="number"
                min="1"
                value={form.loyalty_gold_at}
                onChange={(event) => setForm((current) => ({ ...current, loyalty_gold_at: event.target.value }))}
              />
              <Input
                label="Platinum at"
                type="number"
                min="1"
                value={form.loyalty_platinum_at}
                onChange={(event) => setForm((current) => ({ ...current, loyalty_platinum_at: event.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Input
              label="Tax %"
              type="number"
              min="0"
              max="100"
              value={form.tax_percent}
              onChange={(event) => setForm((current) => ({ ...current, tax_percent: event.target.value }))}
            />
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-300">Global discount type</span>
              <select
                value={form.global_discount_type}
                onChange={(event) => setForm((current) => ({ ...current, global_discount_type: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30"
              >
                <option value="flat">Flat</option>
                <option value="percent">Percent</option>
              </select>
            </label>
            <Input
              label="Global discount value"
              type="number"
              min="0"
              max="100"
              value={form.global_discount_percent}
              onChange={(event) => setForm((current) => ({ ...current, global_discount_percent: event.target.value }))}
            />
          </div>

          <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-4 text-sm text-slate-300">
            <div>
              <div className="font-medium text-white">Enable global discount</div>
              <div className="mt-1 text-xs text-slate-400">Applies an automatic discount rule at bill level unless manually overridden.</div>
            </div>
            <input
              type="checkbox"
              checked={form.global_discount_enabled}
              onChange={(event) => setForm((current) => ({ ...current, global_discount_enabled: event.target.checked }))}
              className="h-5 w-5 rounded border-white/20 bg-slate-950 text-brand-500"
            />
          </label>

          <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-4 text-sm text-slate-300">
            <div>
              <div className="font-medium text-white">Enable cloud sync foundation</div>
              <div className="mt-1 text-xs text-slate-400">Requires Supabase credentials in `.env`.</div>
            </div>
            <input
              type="checkbox"
              checked={form.sync_enabled}
              onChange={(event) => setForm((current) => ({ ...current, sync_enabled: event.target.checked }))}
              className="h-5 w-5 rounded border-white/20 bg-slate-950 text-brand-500"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-300">
              <div className="text-slate-500">Negative stock</div>
              <div className="mt-1 font-semibold text-white">{settings?.allow_negative_stock ? 'Allowed' : 'Blocked'}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-300">
              <div className="text-slate-500">Tax</div>
              <div className="mt-1 font-semibold text-white">{settings?.tax_enabled ? `${settings?.tax_percent}% enabled` : 'Disabled'}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-300">
              <div className="text-slate-500">Emergency super key</div>
              <div className="mt-1 font-semibold text-white">Configured</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit">Save changes</Button>
            <span className="text-sm text-brand-200">{status}</span>
          </div>
        </form>
      </Card>

      <Card className="max-w-4xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-brand-300">Cloud sync</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Supabase sync foundation</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              The queue, manual push/pull flow, and realtime listener foundation are ready. Add Supabase credentials to
              `.env`, enable sync above, and run a manual sync.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-2 text-sm text-slate-300">
            {supabaseConfig.configured ? 'Environment detected' : 'Environment missing'}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-300">
            <div className="text-slate-500">Configured</div>
            <div className="mt-1 font-semibold text-white">{supabaseConfig.configured ? 'Yes' : 'No'}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-300">
            <div className="text-slate-500">Sync enabled</div>
            <div className="mt-1 font-semibold text-white">{syncState.enabled ? 'Yes' : 'No'}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-300">
            <div className="text-slate-500">Realtime listener</div>
            <div className="mt-1 font-semibold text-white">{syncState.listenerActive ? 'Active' : 'Inactive'}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-300">
            <div className="text-slate-500">Last sync</div>
            <div className="mt-1 font-semibold text-white">
              {syncState.lastSyncAt ? new Date(syncState.lastSyncAt).toLocaleString() : 'Never'}
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={handleManualSync} disabled={syncLoading || !form.sync_enabled}>
            {syncLoading ? 'Syncing...' : 'Run manual sync'}
          </Button>
          <Button variant="secondary" onClick={() => startRealtimeSync()} disabled={!form.sync_enabled || !supabaseConfig.configured}>
            Start realtime listener
          </Button>
          <Button variant="secondary" onClick={() => stopRealtimeSync()} disabled={!form.sync_enabled}>
            Stop realtime listener
          </Button>
        </div>

        {syncMessage ? (
          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
            {syncMessage}
          </div>
        ) : null}
        {syncError || syncState.lastError ? (
          <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-100">
            {syncError || syncState.lastError}
          </div>
        ) : null}
      </Card>

      <Card className="max-w-4xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-brand-300">Backup & restore</p>
            <h2 className="mt-2 text-2xl font-bold text-white">JSON backup controls</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Export the current shop data to a JSON file or restore from an earlier backup. Restore replaces operational
              tables, appends backup logs, and rebuilds the local sync queue for future cloud sync.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-2 text-sm text-slate-300">
            Includes logs and all business tables
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={handleBackupFileChange}
        />

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-300">
            <div className="text-slate-500">Restore mode</div>
            <div className="mt-1 font-semibold text-white">Replace live tables</div>
            <div className="mt-2 text-xs text-slate-400">Logs are appended, not deleted.</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-300">
            <div className="text-slate-500">Selected file</div>
            <div className="mt-1 font-semibold text-white">{selectedBackupName || 'No file selected'}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-300">
            <div className="text-slate-500">Sync rebuild</div>
            <div className="mt-1 font-semibold text-white">Queued after restore</div>
            <div className="mt-2 text-xs text-slate-400">Ready for future Supabase sync.</div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={handleExportBackup} disabled={backupLoading}>
            {backupLoading ? 'Working...' : 'Export backup JSON'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={backupLoading}
          >
            {backupLoading ? 'Working...' : 'Import backup JSON'}
          </Button>
        </div>

        {backupStatus ? (
          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">
            {backupStatus}
          </div>
        ) : null}
        {backupError ? (
          <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-100">
            {backupError}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
