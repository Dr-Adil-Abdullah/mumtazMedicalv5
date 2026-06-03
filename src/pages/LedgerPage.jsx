import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import SectionIntro from '../components/shared/SectionIntro';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import BarcodeCard from '../components/shared/BarcodeCard';
import WhatsAppButton from '../components/shared/WhatsAppButton';
import { db } from '../db/index';
import { enqueueSync } from '../db/queue';
import { useAuthStore } from '../store/authStore';
import { formatCurrency } from '../utils/currency';
import { generateCustomerId } from '../utils/idGenerator';
import usePermissions from '../hooks/usePermissions';
import { printBarcodeLabel } from '../utils/barcode';
import { buildCustomerMessage, buildPendingReminderMessage, buildSupplierMessage } from '../utils/whatsapp';
import { isRecordCreatedByUser, isSaleVisibleToUser } from '../utils/recordScope';
import { calculateLoyaltyRedeemValue, getLoyaltyProgress, getLoyaltyStage, getPointsToNextStage } from '../utils/loyalty';

function initialCustomerForm() {
  return { name: '', phone: '', type: 'regular' };
}

function initialSupplierForm() {
  return { name: '', phone: '', type: 'normal', email: '', address: '' };
}

function customerScopeKey(customer) {
  return customer.id || customer.customer_id || customer.name;
}

export default function LedgerPage() {
  const user = useAuthStore((state) => state.user);
  const { can } = usePermissions();
  const canManageCustomers = can('manage_customers');
  const canManageSuppliers = can('manage_suppliers');
  const canViewAllCustomerHistory = can('view_all_print_history');
  const settings = useLiveQuery(() => db.settings.get(1), []);
  const customers = useLiveQuery(() => db.customers.toArray(), []);
  const suppliers = useLiveQuery(() => db.suppliers.toArray(), []);
  const sales = useLiveQuery(() => db.sales.orderBy('created_at').reverse().toArray(), []);
  const partialPayments = useLiveQuery(() => db.partial_payments.orderBy('payment_date').reverse().toArray(), []);
  const [tab, setTab] = useState('customers');
  const [filter, setFilter] = useState('all');
  const [customerForm, setCustomerForm] = useState(initialCustomerForm());
  const [supplierForm, setSupplierForm] = useState(initialSupplierForm());
  const [paymentValues, setPaymentValues] = useState({});
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailView, setDetailView] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const visibleSales = useMemo(
    () => (sales ?? []).filter((sale) => isSaleVisibleToUser(sale, user, canViewAllCustomerHistory)),
    [sales, user, canViewAllCustomerHistory]
  );

  const visibleSaleIds = useMemo(() => new Set(visibleSales.map((sale) => sale.id)), [visibleSales]);

  const scopedPayments = useMemo(
    () =>
      (partialPayments ?? []).filter((payment) => {
        if (canViewAllCustomerHistory) return true;
        return visibleSaleIds.has(payment.sale_id);
      }),
    [partialPayments, canViewAllCustomerHistory, visibleSaleIds]
  );

  const visibleCustomers = useMemo(() => {
    if (canViewAllCustomerHistory) return customers ?? [];

    return (customers ?? []).filter((customer) => {
      if (isRecordCreatedByUser(customer, user)) return true;
      if (visibleSales.some((sale) => sale.customer_id === customer.id)) return true;
      if (scopedPayments.some((payment) => payment.customer_id === customer.id)) return true;
      return false;
    });
  }, [customers, canViewAllCustomerHistory, user, visibleSales, scopedPayments]);

  const visibleCustomerIds = useMemo(
    () => new Set(visibleCustomers.map((customer) => customer.id)),
    [visibleCustomers]
  );

  const customerRows = useMemo(() => {
    return visibleCustomers
      .map((customer) => {
        const customerSales = visibleSales.filter((sale) => sale.customer_id === customer.id);
        const pendingSales = customerSales.filter((sale) => Number(sale.balance_owed || 0) > 0);
        const paymentHistory = scopedPayments.filter((payment) => payment.customer_id === customer.id);
        const visiblePendingAmount = pendingSales.reduce((sum, sale) => sum + Number(sale.balance_owed || 0), 0);

        const loyaltyStage = getLoyaltyStage(customer.loyalty_points, settings);
        const pointsToNextStage = getPointsToNextStage(customer.loyalty_points, settings);
        const loyaltyProgress = getLoyaltyProgress(customer.loyalty_points, settings);
        const loyaltyRedeemValue = calculateLoyaltyRedeemValue(customer.loyalty_points, settings);

        return {
          ...customer,
          purchaseCount: customerSales.length,
          pendingSales,
          paymentHistory,
          visiblePendingAmount,
          isPending: visiblePendingAmount > 0,
          isCreatedByCurrentUser: isRecordCreatedByUser(customer, user),
          loyaltyStage,
          pointsToNextStage,
          loyaltyProgress,
          loyaltyRedeemValue
        };
      })
      .filter((customer) => {
        if (filter === 'pending') return customer.isPending;
        if (filter === 'vip') return ['vip', 'doctor'].includes(customer.type);
        return true;
      })
      .sort((a, b) => {
        if (filter === 'pending') return Number(b.visiblePendingAmount || 0) - Number(a.visiblePendingAmount || 0);
        return a.name.localeCompare(b.name);
      });
  }, [visibleCustomers, visibleSales, scopedPayments, filter, user, settings]);

  function flash(message, isError = false) {
    if (isError) {
      setError(message);
      setStatus('');
    } else {
      setStatus(message);
      setError('');
    }
    window.setTimeout(() => {
      setStatus('');
      setError('');
    }, 3000);
  }

  async function handleCustomerCreate(event) {
    event.preventDefault();
    const now = new Date().toISOString();

    if (!canManageCustomers) {
      flash('Your role cannot create customers.', true);
      return;
    }

    if (!customerForm.name.trim()) {
      flash('Customer name is required.', true);
      return;
    }

    if (customerForm.type === 'vip' && settings?.require_phone_for_vip && !customerForm.phone.trim()) {
      flash('Phone is required for VIP customers.', true);
      return;
    }

    const customer_id = generateCustomerId((customers?.length ?? 0) + 1);
    const record = {
      id: crypto.randomUUID(),
      customer_id,
      name: customerForm.name.trim(),
      phone: customerForm.phone.trim(),
      type: customerForm.type,
      pending_amount: 0,
      loyalty_points: 0,
      is_active: true,
      created_by: user?.isEmergency ? null : user?.id ?? null,
      created_by_name: user?.name ?? 'Unknown',
      created_at: now,
      updated_at: now
    };

    await db.customers.add(record);
    await enqueueSync({ tableName: 'customers', action: 'INSERT', recordId: record.id, data: record });
    await db.logs.add({
      id: crypto.randomUUID(),
      action: 'CUSTOMER_CREATE',
      user_id: user?.id,
      user_name: user?.name ?? 'Unknown',
      details: { customer_id: record.customer_id, name: record.name, type: record.type },
      timestamp: now
    });

    setCustomerForm(initialCustomerForm());
    flash('Customer added.');
  }

  async function handleSupplierCreate(event) {
    event.preventDefault();
    const now = new Date().toISOString();

    if (!canManageSuppliers) {
      flash('Your role cannot create suppliers.', true);
      return;
    }

    if (!supplierForm.name.trim()) {
      flash('Supplier name is required.', true);
      return;
    }

    const record = {
      id: crypto.randomUUID(),
      name: supplierForm.name.trim(),
      type: supplierForm.type,
      phone: supplierForm.phone.trim(),
      email: supplierForm.email.trim(),
      address: supplierForm.address.trim(),
      notes: '',
      is_active: true,
      created_at: now,
      updated_at: now
    };

    await db.suppliers.add(record);
    await enqueueSync({ tableName: 'suppliers', action: 'INSERT', recordId: record.id, data: record });
    await db.logs.add({
      id: crypto.randomUUID(),
      action: 'SUPPLIER_CREATE',
      user_id: user?.id,
      user_name: user?.name ?? 'Unknown',
      details: { supplier_id: record.id, name: record.name, type: record.type },
      timestamp: now
    });

    setSupplierForm(initialSupplierForm());
    flash('Supplier added.');
  }

  async function recordPayment(sale, customer) {
    const amount = Number(paymentValues[sale.id] || 0);
    const now = new Date().toISOString();

    if (!visibleSaleIds.has(sale.id) || !visibleCustomerIds.has(customer.id)) {
      flash('You cannot record payments for a hidden customer or sale.', true);
      return;
    }

    if (!amount || amount <= 0) {
      flash('Enter a valid payment amount.', true);
      return;
    }

    if (amount > Number(sale.balance_owed || 0)) {
      flash('Payment cannot exceed balance owed.', true);
      return;
    }

    const updatedSale = {
      ...sale,
      amount_paid: Number(sale.amount_paid || 0) + amount,
      balance_owed: Math.max(0, Number(sale.balance_owed || 0) - amount),
      updated_at: now
    };
    const updatedCustomer = {
      ...customer,
      pending_amount: Math.max(0, Number(customer.pending_amount || 0) - amount),
      updated_at: now
    };
    const paymentRecord = {
      id: crypto.randomUUID(),
      sale_id: sale.id,
      customer_id: customer.id,
      amount,
      remaining_balance: updatedSale.balance_owed,
      payment_date: now,
      received_by: user?.isEmergency ? null : user?.id
    };

    await db.transaction('rw', db.sales, db.customers, db.partial_payments, db.logs, db.sync_queue, async () => {
      await db.sales.put(updatedSale);
      await db.customers.put(updatedCustomer);
      await db.partial_payments.add(paymentRecord);
      await db.logs.add({
        id: crypto.randomUUID(),
        action: 'PARTIAL_PAYMENT',
        user_id: user?.id,
        user_name: user?.name ?? 'Unknown',
        details: {
          sale_id: sale.id,
          bill_number: sale.bill_number,
          customer_name: customer.name,
          amount,
          remaining_balance: updatedSale.balance_owed
        },
        timestamp: now
      });
      await enqueueSync({ tableName: 'sales', action: 'UPDATE', recordId: updatedSale.id, data: updatedSale });
      await enqueueSync({ tableName: 'customers', action: 'UPDATE', recordId: updatedCustomer.id, data: updatedCustomer });
      await enqueueSync({ tableName: 'partial_payments', action: 'INSERT', recordId: paymentRecord.id, data: paymentRecord });
    });

    setPaymentValues((current) => ({ ...current, [sale.id]: '' }));
    flash('Partial payment recorded.');
  }

  const detailSets = {
    customers: customerRows,
    pending: customerRows.filter((item) => item.isPending),
    payments: scopedPayments,
    suppliers: canManageSuppliers ? suppliers ?? [] : []
  };

  return (
    <div className="space-y-6">
      <SectionIntro
        eyebrow="Ledger"
        title="Simple customer and supplier records"
        description="Use the top cards to open focused detail lists. Keep the page clean, then drill into balances, payments, and contacts only when needed."
      />

      {!canViewAllCustomerHistory ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-100">
          Your role sees customers you created or customers linked to your own sales and payment history.
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button variant={tab === 'customers' ? 'primary' : 'secondary'} onClick={() => setTab('customers')}>
          Customers
        </Button>
        {canManageSuppliers ? (
          <Button variant={tab === 'suppliers' ? 'primary' : 'secondary'} onClick={() => setTab('suppliers')}>
            Suppliers
          </Button>
        ) : null}
      </div>

      {status ? <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">{status}</div> : null}
      {error ? <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</div> : null}

      {tab === 'customers' || !canManageSuppliers ? (
        <>
          <div className="card-grid">
            <StatCard
              label="Customers"
              value={customerRows.length}
              hint="Tap to inspect visible customers"
              tone="default"
              icon="👤"
              onClick={() => setDetailView('customers')}
            />
            <StatCard
              label="Pending customers"
              value={customerRows.filter((item) => item.isPending).length}
              hint="Tap to inspect outstanding balances"
              tone="warning"
              icon="📒"
              onClick={() => setDetailView('pending')}
            />
            <StatCard
              label="Pending amount"
              value={formatCurrency(customerRows.reduce((sum, item) => sum + Number(item.visiblePendingAmount || 0), 0), settings?.currency)}
              hint="Tap to inspect due accounts"
              tone="danger"
              icon="💸"
              onClick={() => setDetailView('pending')}
            />
            <StatCard
              label="Payments logged"
              value={scopedPayments.length}
              hint="Tap to inspect visible payment history"
              tone="success"
              icon="✅"
              onClick={() => setDetailView('payments')}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
            <Card>
              <p className="text-xs uppercase tracking-[0.35em] text-brand-300">Add customer</p>
              <form className="mt-5 space-y-4" onSubmit={handleCustomerCreate}>
                <Input
                  label="Customer name"
                  value={customerForm.name}
                  onChange={(event) => setCustomerForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Ahmed Ali"
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="Phone"
                    value={customerForm.phone}
                    onChange={(event) => setCustomerForm((current) => ({ ...current, phone: event.target.value }))}
                    placeholder="03xx-xxxxxxx"
                  />
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-300">Type</span>
                    <select
                      value={customerForm.type}
                      onChange={(event) => setCustomerForm((current) => ({ ...current, type: event.target.value }))}
                      className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30"
                    >
                      <option value="regular">Regular</option>
                      <option value="vip">VIP</option>
                      <option value="doctor">Doctor</option>
                    </select>
                  </label>
                </div>
                <Button type="submit">Save customer</Button>
              </form>
            </Card>

            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button variant={filter === 'all' ? 'primary' : 'secondary'} onClick={() => setFilter('all')}>
                  All
                </Button>
                <Button variant={filter === 'pending' ? 'primary' : 'secondary'} onClick={() => setFilter('pending')}>
                  Pending
                </Button>
                <Button variant={filter === 'vip' ? 'primary' : 'secondary'} onClick={() => setFilter('vip')}>
                  VIP / Doctor
                </Button>
              </div>

              {customerRows.map((customer) => (
                <Card key={customer.id}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{customer.name}</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {customer.customer_id} • {customer.phone || 'No phone'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="border-white/10 bg-white/5 text-slate-200">{customer.type.toUpperCase()}</Badge>
                      <Badge className="border-brand-500/30 bg-brand-500/10 text-brand-100">
                        {customer.loyaltyStage.icon} {customer.loyaltyStage.label}
                      </Badge>
                      {!canViewAllCustomerHistory && customer.isCreatedByCurrentUser ? (
                        <Badge className="border-sky-500/30 bg-sky-500/10 text-sky-100">Created by you</Badge>
                      ) : null}
                      <Badge
                        className={
                          customer.isPending
                            ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                            : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                        }
                      >
                        Pending: {formatCurrency(customer.visiblePendingAmount, settings?.currency)}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-4">
                    <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-300">
                      <div className="text-slate-500">Purchases</div>
                      <div className="mt-1 font-semibold text-white">{customer.purchaseCount}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-300">
                      <div className="text-slate-500">Pending bills</div>
                      <div className="mt-1 font-semibold text-white">{customer.pendingSales.length}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-300">
                      <div className="text-slate-500">Loyalty points</div>
                      <div className="mt-1 font-semibold text-white">{customer.loyalty_points || 0}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-300">
                      <div className="text-slate-500">Points to next stage</div>
                      <div className="mt-1 font-semibold text-white">{customer.pointsToNextStage || 0}</div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                      <div>
                        <div className="font-semibold text-white">Loyalty progress</div>
                        <div className="mt-1 text-slate-400">
                          {customer.pointsToNextStage > 0
                            ? `${customer.pointsToNextStage} point(s) to ${customer.loyaltyStage.label === 'Bronze' ? 'Silver' : customer.loyaltyStage.label === 'Silver' ? 'Gold' : 'Platinum'}`
                            : 'Top stage reached'}
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="font-semibold text-white">Redeem value</div>
                        <div className="text-slate-400">{formatCurrency(customer.loyaltyRedeemValue, settings?.currency)}</div>
                      </div>
                    </div>
                    <div className="mt-3 h-3 rounded-full bg-slate-950/80">
                      <div className="h-3 rounded-full bg-gradient-to-r from-brand-500 to-emerald-300" style={{ width: `${customer.loyaltyProgress}%` }} />
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Button variant="secondary" onClick={() => setSelectedCustomer(customer)}>
                      Preview barcode
                    </Button>
                    <Button
                      onClick={() =>
                        printBarcodeLabel({
                          title: customer.name,
                          subtitle: `${customer.loyaltyStage.icon} ${customer.loyaltyStage.label} • ${customer.customer_id}`,
                          code: customer.customer_id,
                          note: 'Use this customer barcode in scanner-ready fields.'
                        })
                      }
                    >
                      Print barcode
                    </Button>
                    <WhatsAppButton
                      phone={customer.phone}
                      message={
                        customer.isPending
                          ? buildPendingReminderMessage({
                              shopName: settings?.shop_name || 'Mumtaz Medical',
                              customerName: customer.name,
                              balance: customer.visiblePendingAmount,
                              currency: settings?.currency,
                              dueDate: customer.pendingSales[0]?.payback_date || ''
                            })
                          : buildCustomerMessage({
                              shopName: settings?.shop_name || 'Mumtaz Medical',
                              customerName: customer.name,
                              pendingAmount: 0,
                              currency: settings?.currency
                            })
                      }
                      label={customer.isPending ? 'Send reminder' : 'WhatsApp customer'}
                    />
                  </div>

                  {customer.pendingSales.length ? (
                    <div className="mt-5 space-y-3">
                      {customer.pendingSales.map((sale) => (
                        <div key={sale.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <div className="font-semibold text-white">{sale.bill_number}</div>
                              <div className="text-sm text-slate-400">
                                Due {formatCurrency(sale.balance_owed, settings?.currency)} • Payback {sale.payback_date || '—'}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                              <Input
                                className="min-w-[150px]"
                                placeholder="Payment amount"
                                type="number"
                                min="0"
                                value={paymentValues[sale.id] ?? ''}
                                onChange={(event) =>
                                  setPaymentValues((current) => ({ ...current, [sale.id]: event.target.value }))
                                }
                              />
                              <Button onClick={() => recordPayment(sale, customer)}>Record payment</Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-5 rounded-2xl border border-dashed border-white/15 bg-slate-900/70 p-4 text-sm text-slate-400">
                      No pending bills for this customer.
                    </div>
                  )}
                </Card>
              ))}

              {!customerRows.length ? (
                <Card>
                  <h3 className="text-lg font-semibold text-white">No visible customers yet</h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Create one manually or complete a named sale to build your customer ledger view.
                  </p>
                </Card>
              ) : null}
            </div>
          </div>
        </>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <Card>
            <p className="text-xs uppercase tracking-[0.35em] text-brand-300">Add supplier</p>
            <form className="mt-5 space-y-4" onSubmit={handleSupplierCreate}>
              <Input
                label="Supplier name"
                value={supplierForm.name}
                onChange={(event) => setSupplierForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="ABC Pharma"
              />
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Phone"
                  value={supplierForm.phone}
                  onChange={(event) => setSupplierForm((current) => ({ ...current, phone: event.target.value }))}
                />
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-300">Type</span>
                  <select
                    value={supplierForm.type}
                    onChange={(event) => setSupplierForm((current) => ({ ...current, type: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30"
                  >
                    <option value="normal">Normal</option>
                    <option value="preferred">Preferred</option>
                  </select>
                </label>
              </div>
              <Input
                label="Email"
                value={supplierForm.email}
                onChange={(event) => setSupplierForm((current) => ({ ...current, email: event.target.value }))}
              />
              <Input
                label="Address"
                value={supplierForm.address}
                onChange={(event) => setSupplierForm((current) => ({ ...current, address: event.target.value }))}
              />
              <Button type="submit">Save supplier</Button>
            </form>
          </Card>

          <div className="space-y-4">
            {(suppliers ?? [])
              .slice()
              .sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name))
              .map((supplier) => (
                <Card key={supplier.id}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{supplier.name}</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {supplier.phone || 'No phone'} • {supplier.email || 'No email'}
                      </p>
                    </div>
                    <Badge
                      className={
                        supplier.type === 'preferred'
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                          : 'border-white/10 bg-white/5 text-slate-200'
                      }
                    >
                      {supplier.type.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="mt-4 rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-300">
                    {supplier.address || 'No address added yet.'}
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <WhatsAppButton
                      phone={supplier.phone}
                      message={buildSupplierMessage({
                        shopName: settings?.shop_name || 'Mumtaz Medical',
                        supplierName: supplier.name
                      })}
                      label="WhatsApp supplier"
                    />
                  </div>
                </Card>
              ))}

            {!suppliers?.length ? (
              <Card>
                <h3 className="text-lg font-semibold text-white">No suppliers yet</h3>
                <p className="mt-2 text-sm text-slate-400">Create suppliers here so future expenses and purchase flows can link to them.</p>
              </Card>
            ) : null}
          </div>
        </div>
      )}
      <Modal open={!!selectedCustomer} onClose={() => setSelectedCustomer(null)} title="Customer barcode" size="sm">
        {selectedCustomer ? (
          <div className="space-y-4">
            <div className="flex justify-end gap-3">
              <WhatsAppButton
                phone={selectedCustomer.phone}
                message={
                  selectedCustomer.isPending
                    ? buildPendingReminderMessage({
                        shopName: settings?.shop_name || 'Mumtaz Medical',
                        customerName: selectedCustomer.name,
                        balance: selectedCustomer.visiblePendingAmount,
                        currency: settings?.currency,
                        dueDate: selectedCustomer.pendingSales[0]?.payback_date || ''
                      })
                    : buildCustomerMessage({
                        shopName: settings?.shop_name || 'Mumtaz Medical',
                        customerName: selectedCustomer.name,
                        pendingAmount: 0,
                        currency: settings?.currency
                      })
                }
                label={selectedCustomer.isPending ? 'Send reminder' : 'WhatsApp'}
              />
              <Button
                onClick={() =>
                  printBarcodeLabel({
                    title: selectedCustomer.name,
                    subtitle: `${selectedCustomer.loyaltyStage.icon} ${selectedCustomer.loyaltyStage.label} • ${selectedCustomer.customer_id}`,
                    code: selectedCustomer.customer_id,
                    note: 'Use this customer barcode in scanner-ready fields.'
                  })
                }
              >
                Print
              </Button>
            </div>
            <BarcodeCard
              title={selectedCustomer.name}
              subtitle={`${selectedCustomer.loyaltyStage.icon} ${selectedCustomer.loyaltyStage.label} • ${selectedCustomer.customer_id}`}
              code={selectedCustomer.customer_id}
              note="Use this customer ID barcode for quick scan-based lookup."
            />
          </div>
        ) : null}
      </Modal>

      <Modal open={!!detailView} onClose={() => setDetailView('')} title="Ledger details" size="xl">
        <div className="space-y-4">
          {detailView === 'payments'
            ? detailSets.payments.map((payment) => (
                <div key={payment.id} className="detail-item">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-white">Payment record</div>
                      <div className="mt-1 text-xs text-slate-400">{new Date(payment.payment_date).toLocaleString()}</div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-semibold text-white">{formatCurrency(payment.amount, settings?.currency)}</div>
                      <div className="text-slate-400">Remaining {formatCurrency(payment.remaining_balance, settings?.currency)}</div>
                    </div>
                  </div>
                </div>
              ))
            : null}

          {detailView === 'suppliers'
            ? detailSets.suppliers.map((supplier) => (
                <div key={supplier.id} className="detail-item">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-white">{supplier.name}</div>
                      <div className="mt-1 text-xs text-slate-400">{supplier.phone || 'No phone'} • {supplier.email || 'No email'}</div>
                    </div>
                    <Badge className={supplier.type === 'preferred' ? 'border-amber-500/30 bg-amber-500/10 text-amber-100' : 'border-white/10 bg-white/5 text-slate-200'}>
                      {supplier.type.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))
            : null}

          {detailView !== 'payments' && detailView !== 'suppliers'
            ? (detailSets[detailView] ?? []).map((customer) => (
                <div key={customerScopeKey(customer)} className="detail-item">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-white">{customer.name}</div>
                      <div className="mt-1 text-xs text-slate-400">
                        {customer.customer_id} • {customer.type.toUpperCase()} • {customer.loyaltyStage.icon} {customer.loyaltyStage.label}
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-semibold text-white">{formatCurrency(customer.visiblePendingAmount, settings?.currency)}</div>
                      <div className="text-slate-400">{customer.loyalty_points || 0} pts • {customer.pendingSales.length} pending bill(s)</div>
                    </div>
                  </div>
                </div>
              ))
            : null}

          {detailView && !(detailSets[detailView] ?? []).length ? (
            <div className="detail-item text-slate-400">No related detail records for this summary.</div>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
