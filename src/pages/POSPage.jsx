import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import SectionIntro from '../components/shared/SectionIntro';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import CameraScannerModal from '../components/shared/CameraScannerModal';
import ReceiptPreview from '../components/shared/ReceiptPreview';
import WhatsAppButton from '../components/shared/WhatsAppButton';
import { db } from '../db/index';
import { usePosStore, calculateSummary } from '../store/posStore';
import { useAuthStore } from '../store/authStore';
import usePermissions from '../hooks/usePermissions';
import { formatCurrency } from '../utils/currency';
import { printSaleReceipt } from '../utils/receipt';
import { buildBillSummaryMessage } from '../utils/whatsapp';
import { isSaleVisibleToUser } from '../utils/recordScope';
import { calculateLoyaltyPointsEarned, getLoyaltyStage } from '../utils/loyalty';

function isExpired(dateValue) {
  return !!dateValue && new Date(dateValue) < new Date(new Date().toDateString());
}

export default function POSPage() {
  const user = useAuthStore((state) => state.user);
  const { can } = usePermissions();
  const canViewAllPrintHistory = can('view_all_print_history');
  const settings = useLiveQuery(() => db.settings.get(1), []);
  const products = useLiveQuery(() => db.products.toArray(), []);
  const batches = useLiveQuery(() => db.product_batches.toArray(), []);
  const customers = useLiveQuery(() => db.customers.toArray(), []);
  const salesFeed = useLiveQuery(() => db.sales.orderBy('created_at').reverse().toArray(), []);
  const [search, setSearch] = useState('');
  const [scannerValue, setScannerValue] = useState('');
  const [cameraScannerOpen, setCameraScannerOpen] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [scanError, setScanError] = useState('');
  const [selectedBatchIds, setSelectedBatchIds] = useState({});
  const [previewSale, setPreviewSale] = useState(null);
  const [detailView, setDetailView] = useState('');

  const {
    cart,
    paymentMode,
    amountPaid,
    paybackDate,
    customerName,
    discountPercent,
    saleResult,
    submitting,
    error,
    addItem,
    increaseItem,
    decreaseItem,
    removeItem,
    clearCart,
    dismissSaleResult,
    setField,
    completeSale
  } = usePosStore();

  const summary = useMemo(() => calculateSummary(cart, settings, discountPercent), [cart, settings, discountPercent]);
  const currentCustomer = useMemo(() => {
    const trimmed = customerName.trim().toLowerCase();
    if (!trimmed) return null;
    return (customers ?? []).find((customer) => customer.name.trim().toLowerCase() === trimmed) ?? null;
  }, [customers, customerName]);
  const loyaltyPointsPreview = useMemo(
    () =>
      customerName.trim()
        ? calculateLoyaltyPointsEarned({ saleTotal: summary.total, paymentMode, settings })
        : 0,
    [customerName, summary.total, paymentMode, settings]
  );
  const currentCustomerStage = useMemo(
    () => (currentCustomer ? getLoyaltyStage(currentCustomer.loyalty_points, settings) : null),
    [currentCustomer, settings]
  );
  const saleResultCustomer = useMemo(() => {
    if (!saleResult?.sale?.customer_id) return null;
    return (customers ?? []).find((customer) => customer.id === saleResult.sale.customer_id) ?? null;
  }, [customers, saleResult?.sale?.customer_id]);
  const previewSaleCustomer = useMemo(() => {
    if (!previewSale?.customer_id) return null;
    return (customers ?? []).find((customer) => customer.id === previewSale.customer_id) ?? null;
  }, [customers, previewSale?.customer_id]);

  const recentSales = useMemo(() => {
    const rows = salesFeed ?? [];
    if (canViewAllPrintHistory) {
      return rows.slice(0, 5);
    }

    return rows.filter((sale) => isSaleVisibleToUser(sale, user)).slice(0, 5);
  }, [salesFeed, canViewAllPrintHistory, user?.id, user?.name, user?.isEmergency]);

  const productCards = useMemo(() => {
    const term = search.trim().toLowerCase();

    return (products ?? [])
      .filter((product) => {
        if (!term) return true;
        return [product.name, product.barcode, product.brand, product.category]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(term));
      })
      .map((product) => {
        const relatedBatches = (batches ?? []).filter((batch) => batch.product_id === product.id && batch.is_active);
        const availableBatches = [...relatedBatches]
          .filter((batch) => !isExpired(batch.expiry_date))
          .sort((a, b) => {
            const aDate = a.expiry_date ? new Date(a.expiry_date).getTime() : Number.MAX_SAFE_INTEGER;
            const bDate = b.expiry_date ? new Date(b.expiry_date).getTime() : Number.MAX_SAFE_INTEGER;
            return aDate - bDate;
          });
        const preferredBatch = availableBatches.find((batch) => Number(batch.quantity) > 0) ?? availableBatches[0] ?? null;
        const totalStock = relatedBatches.reduce((sum, batch) => sum + Number(batch.quantity || 0), 0);
        const hasExpired = relatedBatches.some((batch) => isExpired(batch.expiry_date));

        return {
          ...product,
          totalStock,
          preferredBatch,
          availableBatches,
          batchCount: relatedBatches.length,
          hasExpired,
          canSell: product.is_active && !!preferredBatch
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, batches, search]);

  function addProductByBarcode(rawCode) {
    const code = String(rawCode || '').trim();
    if (!code) return false;

    const product = productCards.find((item) => String(item.barcode || '').trim() === code);
    if (!product || !product.preferredBatch) {
      setScanMessage('');
      setScanError(`No product matched barcode: ${code}`);
      return false;
    }

    const selectedBatch =
      product.availableBatches.find((batch) => batch.id === (selectedBatchIds[product.id] ?? product.preferredBatch?.id)) ??
      product.preferredBatch;

    addItem({ product, batch: selectedBatch, settings });
    setSearch(product.name);
    setScanError('');
    setScanMessage(`${product.name} added via barcode.`);
    return true;
  }

  function handleBarcodeLookup(event) {
    event.preventDefault();
    const added = addProductByBarcode(scannerValue);
    if (added) {
      setScannerValue('');
    }
  }

  async function handleCompleteSale() {
    if (!settings) return;
    try {
      const sale = await completeSale({ user, settings });
      setPreviewSale(sale);
    } catch {
      // error is already stored in Zustand
    }
  }

  const detailSets = {
    products: productCards,
    cart,
    bills: recentSales ?? []
  };

  return (
    <div className="space-y-6">
      <SectionIntro
        eyebrow="Point of Sale"
        title="Clean selling screen with fast drill-down"
        description="Top summary cards open related details. Keep the screen simple while every important number stays one tap away."
      />

      {saleResult ? (
        <Card className="border border-emerald-500/20 bg-emerald-500/10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-emerald-300">Sale completed</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Bill {saleResult.billNumber}</h2>
              <p className="mt-2 text-sm text-emerald-100">
                {saleResult.itemCount} items • {formatCurrency(saleResult.total, settings?.currency)} •{' '}
                {saleResult.paymentMode.toUpperCase()}
              </p>
              {saleResult.loyaltyPointsAwarded > 0 ? (
                <p className="mt-2 text-sm text-emerald-50">
                  Loyalty awarded: +{saleResult.loyaltyPointsAwarded} point(s)
                  {saleResult.customerLoyaltyPointsAfter ? ` • Customer total ${saleResult.customerLoyaltyPointsAfter}` : ''}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => setPreviewSale(saleResult.sale)}>
                Preview receipt
              </Button>
              <Button onClick={() => printSaleReceipt(saleResult.sale, settings)}>Print receipt</Button>
              <WhatsAppButton
                phone={saleResultCustomer?.phone}
                message={buildBillSummaryMessage({
                  sale: saleResult.sale,
                  settings,
                  customerPhone: saleResultCustomer?.phone
                })}
                label="Send bill"
              />
              <Button variant="ghost" onClick={dismissSaleResult}>
                Dismiss
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      <div className="card-grid">
        <StatCard
          label="Products shown"
          value={productCards.length}
          hint="Tap to inspect filtered products"
          tone="default"
          icon="💊"
          onClick={() => setDetailView('products')}
        />
        <StatCard
          label="Cart items"
          value={cart.reduce((sum, item) => sum + item.quantity, 0)}
          hint="Tap to inspect the current cart"
          tone="info"
          icon="🛒"
          onClick={() => setDetailView('cart')}
        />
        <StatCard
          label="Current total"
          value={formatCurrency(summary.total, settings?.currency)}
          hint="Tap to inspect checkout summary"
          tone="success"
          icon="💵"
          onClick={() => setDetailView('checkout')}
        />
        <StatCard
          label="Recent bills"
          value={recentSales?.length ?? 0}
          hint="Tap to inspect recent bills"
          tone="warning"
          icon="🧾"
          onClick={() => setDetailView('bills')}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Card>
            <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
              <div className="min-w-[280px]">
                <Input
                  label="Search products"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name, barcode, brand, or category"
                />
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-300 lg:self-end">
                Manual batch selection is enabled
              </div>
            </div>

            <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={handleBarcodeLookup}>
              <div className="min-w-[260px] flex-1">
                <Input
                  label="USB barcode scanner / quick barcode add"
                  value={scannerValue}
                  onChange={(event) => setScannerValue(event.target.value)}
                  placeholder="Scan or type product barcode and press Enter"
                />
              </div>
              <Button type="submit">Add by barcode</Button>
              <Button type="button" variant="secondary" onClick={() => setCameraScannerOpen(true)}>
                Open camera scanner
              </Button>
            </form>

            {scanMessage ? <div className="mt-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">{scanMessage}</div> : null}
            {scanError ? <div className="mt-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-100">{scanError}</div> : null}
          </Card>

          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {productCards.map((product) => {
              const selectedId = selectedBatchIds[product.id] ?? product.preferredBatch?.id ?? '';
              const selectedBatch = product.availableBatches.find((batch) => batch.id === selectedId) ?? product.preferredBatch;
              const selectedBatchSellable =
                !!selectedBatch && (settings?.allow_negative_stock || Number(selectedBatch.quantity) > 0);

              return (
                <Card key={product.id} className={!product.is_active ? 'opacity-60' : ''}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{product.name}</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {product.brand || 'No brand'} • {product.unit || 'Unit not set'}
                      </p>
                    </div>
                    <Badge
                      className={
                        selectedBatchSellable
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                          : 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                      }
                    >
                      {selectedBatchSellable ? 'Sellable' : 'Blocked'}
                    </Badge>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge className="border-white/10 bg-white/5 text-slate-200">{product.category || 'General'}</Badge>
                    <Badge className="border-brand-500/30 bg-brand-500/10 text-brand-200">
                      {formatCurrency(selectedBatch?.sale_price ?? 0, settings?.currency)}
                    </Badge>
                    <Badge className="border-white/10 bg-slate-900/80 text-slate-300">Stock: {product.totalStock}</Badge>
                    <Badge className="border-white/10 bg-slate-900/80 text-slate-300">Batches: {product.batchCount}</Badge>
                  </div>

                  {product.availableBatches.length > 0 ? (
                    <label className="mt-4 block space-y-2">
                      <span className="text-xs font-medium uppercase tracking-[0.22em] text-slate-400">Batch</span>
                      <select
                        value={selectedId}
                        onChange={(event) =>
                          setSelectedBatchIds((current) => ({
                            ...current,
                            [product.id]: event.target.value
                          }))
                        }
                        className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30"
                      >
                        {product.availableBatches.map((batch) => (
                          <option key={batch.id} value={batch.id}>
                            {batch.batch_number} • Qty {batch.quantity} • {formatCurrency(batch.sale_price, settings?.currency)}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null}

                  <p className="mt-4 text-sm text-slate-400">
                    {product.hasExpired
                      ? 'Expired batches exist. Only non-expired batches are selectable.'
                      : selectedBatch
                        ? `Selected batch ${selectedBatch.batch_number} has ${selectedBatch.quantity} in stock.`
                        : 'No sellable batch available.'}
                  </p>

                  <div className="mt-5 flex gap-3">
                    <Button
                      className="flex-1"
                      disabled={!product.is_active || !selectedBatch || !selectedBatchSellable}
                      onClick={() => addItem({ product, batch: selectedBatch, settings })}
                    >
                      Add to cart
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-brand-300">Cart</p>
                <h2 className="mt-2 text-2xl font-bold text-white">Current sale</h2>
              </div>
              <Button variant="secondary" onClick={clearCart}>
                Clear cart
              </Button>
            </div>

            <div className="mt-5 space-y-4">
              {cart.map((item) => (
                <div key={item.batchId} className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-white">{item.name}</h3>
                      <p className="text-sm text-slate-400">
                        {item.unit} • Batch {item.batchNumber || item.batchId} • {formatCurrency(item.salePrice, settings?.currency)} each
                      </p>
                    </div>
                    <Button variant="ghost" className="px-3" onClick={() => removeItem(item.batchId)}>
                      Remove
                    </Button>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" className="px-3" onClick={() => decreaseItem(item.batchId)}>
                        −
                      </Button>
                      <div className="min-w-12 text-center text-lg font-bold text-white">{item.quantity}</div>
                      <Button variant="secondary" className="px-3" onClick={() => increaseItem(item.batchId)}>
                        +
                      </Button>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500">Line total</div>
                      <div className="font-semibold text-white">
                        {formatCurrency(item.salePrice * item.quantity, settings?.currency)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {!cart.length ? (
                <div className="rounded-3xl border border-dashed border-white/15 bg-slate-900/70 p-6 text-center text-sm text-slate-400">
                  Add products from the left panel to start a sale.
                </div>
              ) : null}
            </div>
          </Card>

          <Card>
            <p className="text-xs uppercase tracking-[0.35em] text-brand-300">Checkout</p>
            <div className="mt-5 space-y-4">
              <Input
                label="Customer name (optional for cash, required for pending)"
                value={customerName}
                onChange={(event) => setField('customerName', event.target.value)}
                placeholder="Walk-in / Ahmed / Clinic"
              />

              <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-300">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-white">Loyalty status</div>
                    <div className="mt-1 text-xs text-slate-400">
                      {settings?.loyalty_enabled
                        ? 'Cash sales with a named customer can earn loyalty points.'
                        : 'Loyalty is currently disabled in settings.'}
                    </div>
                  </div>
                  {currentCustomerStage ? (
                    <Badge className="border-brand-500/30 bg-brand-500/10 text-brand-100">
                      {currentCustomerStage.icon} {currentCustomerStage.label}
                    </Badge>
                  ) : null}
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <div className="detail-item">
                    <div className="text-slate-500">Customer points</div>
                    <div className="mt-1 font-semibold text-white">{currentCustomer ? currentCustomer.loyalty_points || 0 : '—'}</div>
                  </div>
                  <div className="detail-item">
                    <div className="text-slate-500">This sale earns</div>
                    <div className="mt-1 font-semibold text-white">
                      {paymentMode !== 'cash'
                        ? '0 (pending sale)'
                        : customerName.trim()
                          ? `${loyaltyPointsPreview} point(s)`
                          : 'Enter customer name'}
                    </div>
                  </div>
                  <div className="detail-item">
                    <div className="text-slate-500">Projected total</div>
                    <div className="mt-1 font-semibold text-white">
                      {currentCustomer
                        ? Number(currentCustomer.loyalty_points || 0) + loyaltyPointsPreview
                        : customerName.trim()
                          ? loyaltyPointsPreview
                          : '—'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-300">Payment mode</span>
                  <select
                    value={paymentMode}
                    onChange={(event) => setField('paymentMode', event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30"
                  >
                    <option value="cash">Cash</option>
                    <option value="pending">Pending</option>
                  </select>
                </label>

                <Input
                  label={paymentMode === 'cash' ? 'Amount received' : 'Amount paid now'}
                  type="number"
                  min="0"
                  value={amountPaid}
                  onChange={(event) => setField('amountPaid', event.target.value)}
                  placeholder={paymentMode === 'cash' ? String(summary.total.toFixed(2)) : '0'}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Discount %"
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={(event) => setField('discountPercent', event.target.value)}
                />
                {paymentMode === 'pending' ? (
                  <Input
                    label="Payback date"
                    type="date"
                    value={paybackDate}
                    onChange={(event) => setField('paybackDate', event.target.value)}
                  />
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-300">
                    <div className="text-slate-500">Change due</div>
                    <div className="mt-1 text-xl font-semibold text-white">
                      {formatCurrency(Math.max(0, Number(amountPaid || summary.total) - summary.total), settings?.currency)}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/80 p-4">
                <div className="flex items-center justify-between py-1 text-sm text-slate-400">
                  <span>Subtotal</span>
                  <span>{formatCurrency(summary.subtotal, settings?.currency)}</span>
                </div>
                <div className="flex items-center justify-between py-1 text-sm text-slate-400">
                  <span>Discount</span>
                  <span>- {formatCurrency(summary.discountAmount, settings?.currency)}</span>
                </div>
                <div className="flex items-center justify-between py-1 text-sm text-slate-400">
                  <span>Tax</span>
                  <span>{formatCurrency(summary.taxAmount, settings?.currency)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-lg font-bold text-white">
                  <span>Total</span>
                  <span>{formatCurrency(summary.total, settings?.currency)}</span>
                </div>
              </div>

              {error ? <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</div> : null}

              <Button className="w-full" disabled={submitting || !cart.length} onClick={handleCompleteSale}>
                {submitting ? 'Completing sale...' : 'Complete sale'}
              </Button>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-brand-300">Recent sales</p>
                <h2 className="mt-2 text-xl font-bold text-white">Last 5 bills</h2>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {(recentSales ?? []).map((sale) => (
                <div key={sale.id} className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-white">{sale.bill_number}</div>
                      <div className="text-sm text-slate-400">{sale.cashier_name ?? 'Cashier'} • {sale.payment_mode}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-white">{formatCurrency(sale.total, settings?.currency)}</div>
                      <button
                        type="button"
                        className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-brand-300"
                        onClick={() => setPreviewSale(sale)}
                      >
                        View receipt
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {!recentSales?.length ? (
                <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/70 p-4 text-sm text-slate-400">
                  No sales recorded yet.
                </div>
              ) : null}
            </div>
          </Card>
        </div>
      </div>

      <Modal open={!!previewSale} onClose={() => setPreviewSale(null)} title="Receipt preview" size="xl">
        {previewSale ? (
          <div className="space-y-4">
            <div className="flex justify-end gap-3">
              <WhatsAppButton
                phone={previewSaleCustomer?.phone}
                message={buildBillSummaryMessage({
                  sale: previewSale,
                  settings,
                  customerPhone: previewSaleCustomer?.phone
                })}
                label="Send bill"
              />
              <Button onClick={() => printSaleReceipt(previewSale, settings)}>Print</Button>
            </div>
            <ReceiptPreview sale={previewSale} settings={settings} />
          </div>
        ) : null}
      </Modal>

      <CameraScannerModal
        open={cameraScannerOpen}
        onClose={() => setCameraScannerOpen(false)}
        title="POS camera scanner"
        description="Use your phone or laptop camera to scan product barcodes directly into the cart."
        onDetected={(decodedText) => {
          const added = addProductByBarcode(decodedText);
          if (!added) {
            setCameraScannerOpen(true);
          }
        }}
      />

      <Modal open={!!detailView} onClose={() => setDetailView('')} title="POS details" size="xl">
        <div className="space-y-4">
          {detailView === 'products'
            ? detailSets.products.map((product) => (
                <div key={product.id} className="detail-item">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-white">{product.name}</div>
                      <div className="mt-1 text-xs text-slate-400">{product.brand || 'No brand'} • {product.category || 'General'}</div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="font-semibold text-white">Stock {product.totalStock}</div>
                      <div className="text-slate-400">{product.batchCount} batches</div>
                    </div>
                  </div>
                </div>
              ))
            : null}

          {detailView === 'cart'
            ? detailSets.cart.map((item) => (
                <div key={item.id} className="detail-item">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-white">{item.name}</div>
                      <div className="mt-1 text-xs text-slate-400">Qty {item.quantity} • Batch {item.batchNumber}</div>
                    </div>
                    <div className="font-semibold text-white">{formatCurrency(item.salePrice * item.quantity, settings?.currency)}</div>
                  </div>
                </div>
              ))
            : null}

          {detailView === 'checkout' ? (
            <div className="space-y-3">
              <div className="detail-item"><div className="flex items-center justify-between"><span>Subtotal</span><strong>{formatCurrency(summary.subtotal, settings?.currency)}</strong></div></div>
              <div className="detail-item"><div className="flex items-center justify-between"><span>Discount</span><strong>{formatCurrency(summary.discountAmount, settings?.currency)}</strong></div></div>
              <div className="detail-item"><div className="flex items-center justify-between"><span>Tax</span><strong>{formatCurrency(summary.taxAmount, settings?.currency)}</strong></div></div>
              <div className="detail-item"><div className="flex items-center justify-between"><span>Total</span><strong>{formatCurrency(summary.total, settings?.currency)}</strong></div></div>
            </div>
          ) : null}

          {detailView === 'bills'
            ? detailSets.bills.map((sale) => (
                <div key={sale.id} className="detail-item">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-white">{sale.bill_number}</div>
                      <div className="mt-1 text-xs text-slate-400">{sale.customer_name || 'Walk-in'} • {sale.payment_mode}</div>
                    </div>
                    <div className="font-semibold text-white">{formatCurrency(sale.total, settings?.currency)}</div>
                  </div>
                </div>
              ))
            : null}

          {detailView && detailView !== 'checkout' && !(detailSets[detailView] ?? []).length ? (
            <div className="detail-item text-slate-400">No related records for this summary.</div>
          ) : null}
        </div>
      </Modal>
    </div>
  );
}
