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
import { db } from '../db/index';
import { enqueueSync } from '../db/queue';
import { MEDICINE_CATEGORIES } from '../constants/categories';
import { useAuthStore } from '../store/authStore';
import { formatCurrency } from '../utils/currency';
import usePermissions from '../hooks/usePermissions';
import { printBarcodeLabel } from '../utils/barcode';

function initialProductForm() {
  return {
    id: '',
    name: '',
    barcode: '',
    brand: '',
    category: MEDICINE_CATEGORIES[0],
    unit: ''
  };
}

function initialStockForm(productId = '') {
  return {
    product_id: productId,
    batch_number: '',
    purchase_price: '',
    sale_price: '',
    quantity: '',
    expiry_date: ''
  };
}

function isExpired(dateValue) {
  return !!dateValue && new Date(dateValue) < new Date(new Date().toDateString());
}

export default function InventoryPage() {
  const user = useAuthStore((state) => state.user);
  const { can } = usePermissions();
  const canEditProducts = can('edit_products');
  const canDeactivateProducts = can('deactivate_products');
  const canStockIn = can('stock_in_inventory');
  const canViewPurchasePrice = can('view_purchase_price');
  const settings = useLiveQuery(() => db.settings.get(1), []);
  const products = useLiveQuery(() => db.products.toArray(), []);
  const batches = useLiveQuery(() => db.product_batches.toArray(), []);
  const [search, setSearch] = useState('');
  const [productForm, setProductForm] = useState(initialProductForm());
  const [stockForm, setStockForm] = useState(initialStockForm());
  const [selectedBarcodeProduct, setSelectedBarcodeProduct] = useState(null);
  const [detailView, setDetailView] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const productRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (products ?? [])
      .filter((product) => {
        if (!term) return true;
        return [product.name, product.barcode, product.brand, product.category]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(term));
      })
      .map((product) => {
        const relatedBatches = (batches ?? []).filter((batch) => batch.product_id === product.id);
        const activeBatches = relatedBatches.filter((batch) => batch.is_active);
        const totalStock = activeBatches.reduce((sum, batch) => sum + Number(batch.quantity || 0), 0);
        const lowStockThreshold = Math.max(
          Number(settings?.low_stock_default || 10),
          ...activeBatches.map((batch) => Number(batch.low_stock_alert || 0))
        );
        const nearEndThreshold = Math.max(
          Number(settings?.near_end_default || 5),
          ...activeBatches.map((batch) => Number(batch.near_end_alert || 0))
        );
        const expiredCount = activeBatches.filter((batch) => isExpired(batch.expiry_date)).length;
        const latestBatch = [...activeBatches].sort(
          (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        )[0];

        return {
          ...product,
          totalStock,
          batchCount: relatedBatches.length,
          expiredCount,
          latestBatch,
          lowStockThreshold,
          nearEndThreshold,
          stockState:
            totalStock <= nearEndThreshold ? 'near_end' : totalStock <= lowStockThreshold ? 'low' : 'healthy'
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, batches, search, settings]);

  const metrics = useMemo(() => {
    const activeProducts = productRows.filter((product) => product.is_active).length;
    const lowStock = productRows.filter((product) => product.stockState === 'low').length;
    const nearEnd = productRows.filter((product) => product.stockState === 'near_end').length;
    const expired = productRows.filter((product) => product.expiredCount > 0).length;

    return { activeProducts, lowStock, nearEnd, expired };
  }, [productRows]);

  function flashStatus(message, isError = false) {
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

  async function handleProductSubmit(event) {
    event.preventDefault();
    const now = new Date().toISOString();

    if (!canEditProducts) {
      flashStatus('Your role cannot create or edit products.', true);
      return;
    }

    if (!productForm.name.trim()) {
      flashStatus('Product name is required.', true);
      return;
    }

    const duplicate = (products ?? []).find(
      (product) => product.barcode && product.barcode === productForm.barcode && product.id !== productForm.id
    );
    if (duplicate) {
      flashStatus('This barcode already exists.', true);
      return;
    }

    const existingProduct = productForm.id ? (products ?? []).find((item) => item.id === productForm.id) : null;
    const record = {
      id: productForm.id || crypto.randomUUID(),
      name: productForm.name.trim(),
      barcode: productForm.barcode.trim(),
      brand: productForm.brand.trim(),
      category: productForm.category,
      unit: productForm.unit.trim(),
      is_active: existingProduct?.is_active ?? true,
      created_at: existingProduct?.created_at ?? now,
      updated_at: now
    };

    await db.products.put(record);
    await enqueueSync({
      tableName: 'products',
      action: productForm.id ? 'UPDATE' : 'INSERT',
      recordId: record.id,
      data: record
    });
    await db.logs.add({
      id: crypto.randomUUID(),
      action: productForm.id ? 'PRODUCT_UPDATE' : 'PRODUCT_CREATE',
      user_id: user?.id,
      user_name: user?.name ?? 'Unknown',
      details: { product_id: record.id, name: record.name },
      timestamp: now
    });

    setProductForm(initialProductForm());
    flashStatus(productForm.id ? 'Product updated.' : 'Product created.');
  }

  async function handleStockSubmit(event) {
    event.preventDefault();
    const now = new Date().toISOString();

    if (!canStockIn) {
      flashStatus('Your role cannot stock in inventory.', true);
      return;
    }

    if (!stockForm.product_id) {
      flashStatus('Select a product for stock-in.', true);
      return;
    }

    const latestForProduct = (batches ?? [])
      .filter((batch) => batch.product_id === stockForm.product_id)
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())[0];

    const record = {
      id: crypto.randomUUID(),
      product_id: stockForm.product_id,
      batch_number: stockForm.batch_number.trim() || `BATCH-${Date.now()}`,
      purchase_price: canViewPurchasePrice ? Number(stockForm.purchase_price || 0) : Number(latestForProduct?.purchase_price || 0),
      sale_price: Number(stockForm.sale_price || 0),
      quantity: Number(stockForm.quantity || 0),
      expiry_date: stockForm.expiry_date || null,
      low_stock_alert: Number(settings?.low_stock_default || 10),
      near_end_alert: Number(settings?.near_end_default || 5),
      is_active: true,
      created_at: now,
      updated_at: now
    };

    await db.product_batches.add(record);
    await enqueueSync({
      tableName: 'product_batches',
      action: 'INSERT',
      recordId: record.id,
      data: record
    });
    await db.logs.add({
      id: crypto.randomUUID(),
      action: 'STOCK_IN',
      user_id: user?.id,
      user_name: user?.name ?? 'Unknown',
      details: {
        product_id: record.product_id,
        batch_number: record.batch_number,
        quantity: record.quantity,
        sale_price: record.sale_price
      },
      timestamp: now
    });

    setStockForm(initialStockForm(stockForm.product_id));
    flashStatus('Stock added successfully.');
  }

  async function toggleProduct(product) {
    if (!canDeactivateProducts) {
      flashStatus('Your role cannot deactivate or reactivate products.', true);
      return;
    }

    const now = new Date().toISOString();
    const next = {
      ...product,
      is_active: !product.is_active,
      updated_at: now
    };

    await db.products.put(next);
    await enqueueSync({ tableName: 'products', action: 'UPDATE', recordId: next.id, data: next });
    await db.logs.add({
      id: crypto.randomUUID(),
      action: next.is_active ? 'PRODUCT_REACTIVATE' : 'PRODUCT_DEACTIVATE',
      user_id: user?.id,
      user_name: user?.name ?? 'Unknown',
      details: { product_id: next.id, name: next.name },
      timestamp: now
    });
    flashStatus(next.is_active ? 'Product reactivated.' : 'Product deactivated.');
  }

  const detailSets = {
    active: productRows.filter((product) => product.is_active),
    low: productRows.filter((product) => product.stockState === 'low'),
    near: productRows.filter((product) => product.stockState === 'near_end'),
    expired: productRows.filter((product) => product.expiredCount > 0)
  };

  return (
    <div className="space-y-6">
      <SectionIntro
        eyebrow="Inventory"
        title="Clean stock view with drill-down summaries"
        description="Use the top cards to open focused product lists. The form stays simple, while each stock signal remains one tap away."
      />

      <div className="card-grid">
        <StatCard
          label="Active products"
          value={metrics.activeProducts}
          hint="Tap to see active inventory"
          tone="success"
          icon="📦"
          onClick={() => setDetailView('active')}
        />
        <StatCard
          label="Low stock"
          value={metrics.lowStock}
          hint="Tap to inspect low-stock items"
          tone="warning"
          icon="⚠️"
          onClick={() => setDetailView('low')}
        />
        <StatCard
          label="Near end"
          value={metrics.nearEnd}
          hint="Tap to inspect critical stock"
          tone="danger"
          icon="🔻"
          onClick={() => setDetailView('near')}
        />
        <StatCard
          label="Expired products"
          value={metrics.expired}
          hint="Tap to inspect expired items"
          tone="info"
          icon="⏳"
          onClick={() => setDetailView('expired')}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          {canEditProducts ? (
            <Card>
              <p className="text-xs uppercase tracking-[0.35em] text-brand-300">Product form</p>
              <h2 className="mt-2 text-2xl font-bold text-white">{productForm.id ? 'Edit product' : 'Add product'}</h2>
              <form className="mt-5 space-y-4" onSubmit={handleProductSubmit}>
                <Input
                  label="Product name"
                  value={productForm.name}
                  onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Panadol Extra"
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="Barcode"
                    value={productForm.barcode}
                    onChange={(event) => setProductForm((current) => ({ ...current, barcode: event.target.value }))}
                    placeholder="8901234567001"
                  />
                  <Input
                    label="Brand"
                    value={productForm.brand}
                    onChange={(event) => setProductForm((current) => ({ ...current, brand: event.target.value }))}
                    placeholder="GSK"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-slate-300">Category</span>
                    <select
                      value={productForm.category}
                      onChange={(event) => setProductForm((current) => ({ ...current, category: event.target.value }))}
                      className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30"
                    >
                      {MEDICINE_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Input
                    label="Unit"
                    value={productForm.unit}
                    onChange={(event) => setProductForm((current) => ({ ...current, unit: event.target.value }))}
                    placeholder="10 tablets / 60ml"
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button type="submit">{productForm.id ? 'Update product' : 'Save product'}</Button>
                  <Button variant="secondary" type="button" onClick={() => setProductForm(initialProductForm())}>
                    Reset
                  </Button>
                </div>
              </form>
            </Card>
          ) : (
            <Card>
              <p className="text-xs uppercase tracking-[0.35em] text-amber-300">Restricted</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Your role cannot create or edit products.</h2>
              <p className="mt-3 text-sm text-slate-400">
                Product creation and editing are limited to manager, owner, and super admin roles. You can still stock
                in existing products if your role allows it.
              </p>
            </Card>
          )}

          {canStockIn ? (
            <Card>
              <p className="text-xs uppercase tracking-[0.35em] text-brand-300">Stock-in</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Add a batch</h2>
              <form className="mt-5 space-y-4" onSubmit={handleStockSubmit}>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-300">Product</span>
                  <select
                    value={stockForm.product_id}
                    onChange={(event) => setStockForm((current) => ({ ...current, product_id: event.target.value }))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30"
                  >
                    <option value="">Select product</option>
                    {(products ?? []).map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="Batch number"
                    value={stockForm.batch_number}
                    onChange={(event) => setStockForm((current) => ({ ...current, batch_number: event.target.value }))}
                    placeholder="PAN-001"
                  />
                  <Input
                    label="Expiry date"
                    type="date"
                    value={stockForm.expiry_date}
                    onChange={(event) => setStockForm((current) => ({ ...current, expiry_date: event.target.value }))}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {canViewPurchasePrice ? (
                    <Input
                      label="Purchase price"
                      type="number"
                      min="0"
                      value={stockForm.purchase_price}
                      onChange={(event) => setStockForm((current) => ({ ...current, purchase_price: event.target.value }))}
                    />
                  ) : (
                    <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-300">
                      <div className="text-slate-500">Purchase price</div>
                      <div className="mt-1 font-semibold text-white">Hidden for your role</div>
                      <div className="mt-1 text-xs text-slate-400">Last known purchase price will be reused automatically.</div>
                    </div>
                  )}
                  <Input
                    label="Sale price"
                    type="number"
                    min="0"
                    value={stockForm.sale_price}
                    onChange={(event) => setStockForm((current) => ({ ...current, sale_price: event.target.value }))}
                  />
                  <Input
                    label="Quantity"
                    type="number"
                    min="0"
                    value={stockForm.quantity}
                    onChange={(event) => setStockForm((current) => ({ ...current, quantity: event.target.value }))}
                  />
                </div>

                <Button type="submit">Add stock</Button>
              </form>
            </Card>
          ) : null}

          {status ? <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-100">{status}</div> : null}
          {error ? <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</div> : null}
        </div>

        <div className="space-y-6">
          <Card>
            <div className="flex flex-wrap items-end gap-4">
              <div className="min-w-[280px] flex-1">
                <Input
                  label="Search inventory"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Name, barcode, brand, category"
                />
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
                {productRows.length} products loaded
              </div>
            </div>
          </Card>

          <div className="space-y-4">
            {productRows.map((product) => (
              <Card key={product.id} className={!product.is_active ? 'opacity-70' : ''}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{product.name}</h3>
                    <p className="mt-1 text-sm text-slate-400">
                      {product.brand || 'No brand'} • {product.unit || 'Unit not set'} • {product.barcode || 'No barcode'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="border-white/10 bg-white/5 text-slate-200">{product.category || 'General'}</Badge>
                    <Badge
                      className={
                        product.stockState === 'near_end'
                          ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                          : product.stockState === 'low'
                            ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                            : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                      }
                    >
                      Stock: {product.totalStock}
                    </Badge>
                    <Badge className={product.is_active ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-slate-500/30 bg-slate-500/10 text-slate-200'}>
                      {product.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-4">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-300">
                    <div className="text-slate-500">Latest sale price</div>
                    <div className="mt-1 font-semibold text-white">
                      {formatCurrency(product.latestBatch?.sale_price ?? 0, settings?.currency)}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-300">
                    <div className="text-slate-500">{canViewPurchasePrice ? 'Latest purchase price' : 'Batches'}</div>
                    <div className="mt-1 font-semibold text-white">
                      {canViewPurchasePrice
                        ? formatCurrency(product.latestBatch?.purchase_price ?? 0, settings?.currency)
                        : product.batchCount}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-300">
                    <div className="text-slate-500">Expired batches</div>
                    <div className="mt-1 font-semibold text-white">{product.expiredCount}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-300">
                    <div className="text-slate-500">Latest batch</div>
                    <div className="mt-1 font-semibold text-white">{product.latestBatch?.batch_number ?? '—'}</div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {product.barcode ? (
                    <Button variant="secondary" onClick={() => setSelectedBarcodeProduct(product)}>
                      Preview barcode
                    </Button>
                  ) : null}
                  {product.barcode ? (
                    <Button
                      variant="secondary"
                      onClick={() =>
                        printBarcodeLabel({
                          title: product.name,
                          subtitle: `${product.brand || 'Medicine'} • ${product.unit || 'Unit'}`,
                          code: product.barcode,
                          note: 'Scan this barcode in POS scanner-ready input.'
                        })
                      }
                    >
                      Print barcode
                    </Button>
                  ) : null}
                  {canEditProducts ? (
                    <Button
                      variant="secondary"
                      onClick={() =>
                        setProductForm({
                          id: product.id,
                          name: product.name ?? '',
                          barcode: product.barcode ?? '',
                          brand: product.brand ?? '',
                          category: product.category ?? MEDICINE_CATEGORIES[0],
                          unit: product.unit ?? ''
                        })
                      }
                    >
                      Edit
                    </Button>
                  ) : null}
                  {canStockIn ? <Button variant="secondary" onClick={() => setStockForm(initialStockForm(product.id))}>Quick stock-in</Button> : null}
                  {canDeactivateProducts ? (
                    <Button variant={product.is_active ? 'danger' : 'primary'} onClick={() => toggleProduct(product)}>
                      {product.is_active ? 'Deactivate' : 'Reactivate'}
                    </Button>
                  ) : null}
                </div>
              </Card>
            ))}

            {!productRows.length ? (
              <Card>
                <h3 className="text-lg font-semibold text-white">No products found</h3>
                <p className="mt-2 text-sm text-slate-400">Use the product form to add your first medicine.</p>
              </Card>
            ) : null}
          </div>
        </div>
      </div>
      <Modal open={!!selectedBarcodeProduct} onClose={() => setSelectedBarcodeProduct(null)} title="Product barcode" size="sm">
        {selectedBarcodeProduct ? (
          <div className="space-y-4">
            <div className="flex justify-end gap-3">
              <Button
                onClick={() =>
                  printBarcodeLabel({
                    title: selectedBarcodeProduct.name,
                    subtitle: `${selectedBarcodeProduct.brand || 'Medicine'} • ${selectedBarcodeProduct.unit || 'Unit'}`,
                    code: selectedBarcodeProduct.barcode,
                    note: 'Scan this barcode in POS scanner-ready input.'
                  })
                }
              >
                Print
              </Button>
            </div>
            <BarcodeCard
              title={selectedBarcodeProduct.name}
              subtitle={`${selectedBarcodeProduct.brand || 'Medicine'} • ${selectedBarcodeProduct.unit || 'Unit'}`}
              code={selectedBarcodeProduct.barcode}
              note="Use this product barcode for scan-based sale entry."
            />
          </div>
        ) : null}
      </Modal>

      <Modal open={!!detailView} onClose={() => setDetailView('')} title="Inventory details" size="xl">
        <div className="space-y-4">
          {(detailSets[detailView] ?? []).map((product) => (
            <div key={product.id} className="detail-item">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-white">{product.name}</div>
                  <div className="mt-1 text-xs text-slate-400">{product.brand || 'No brand'} • {product.category || 'General'}</div>
                </div>
                <div className="text-right text-sm">
                  <div className="font-semibold text-white">Stock {product.totalStock}</div>
                  <div className="text-slate-400">Expired batches {product.expiredCount}</div>
                </div>
              </div>
            </div>
          ))}
          {!(detailSets[detailView] ?? []).length ? <div className="detail-item text-slate-400">No products match this summary right now.</div> : null}
        </div>
      </Modal>
    </div>
  );
}
