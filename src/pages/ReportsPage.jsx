import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import SectionIntro from '../components/shared/SectionIntro';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import {
  DonutChart,
  HorizontalBarChart,
  LineChart,
  VerticalBarChart
} from '../components/reports/SimpleCharts';
import { db } from '../db/index';
import { formatCurrency } from '../utils/currency';
import usePermissions from '../hooks/usePermissions';
import { isSaleVisibleToUser } from '../utils/recordScope';
import { downloadCsv } from '../utils/csv';

const RANGE_OPTIONS = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: '7 Days' },
  { id: 'month', label: '30 Days' },
  { id: 'all', label: 'All' }
];

const TAB_OPTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'products', label: 'Products' },
  { id: 'categories', label: 'Categories / Brand' },
  { id: 'history', label: 'Sales History' },
  { id: 'staff', label: 'Staff' }
];

const PRODUCT_SORT_OPTIONS = [
  { id: 'revenue', label: 'Revenue' },
  { id: 'quantity', label: 'Units' },
  { id: 'profit', label: 'Profit' }
];

const PRODUCT_LIMIT_OPTIONS = [5, 10, 20, 50, 100];

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function inRange(dateValue, range) {
  const current = new Date(dateValue);
  const today = startOfToday();

  if (range === 'all') return true;
  if (range === 'today') return current >= today;

  const days = range === 'week' ? 7 : 30;
  const from = new Date(today);
  from.setDate(from.getDate() - (days - 1));
  return current >= from;
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function localDayKey(dateValue) {
  const date = new Date(dateValue);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function localMonthKey(dateValue) {
  const date = new Date(dateValue);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

function formatDayLabel(dateValue) {
  return new Date(dateValue).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatMonthLabel(dateValue) {
  return new Date(dateValue).toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
}

function normalizeExpenseDate(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    return new Date(`${value}T12:00:00`);
  }
  return new Date(value);
}

function buildTimeSeries({ sales, expenses, range }) {
  const today = startOfToday();
  const buckets = [];
  const bucketMap = new Map();

  if (range === 'today') {
    for (let index = 0; index < 8; index += 1) {
      const startHour = index * 3;
      const key = `slot-${index}`;
      const label = `${pad(startHour)}:00`;
      const bucket = { key, label, revenue: 0, expenses: 0, bills: 0 };
      buckets.push(bucket);
      bucketMap.set(key, bucket);
    }

    for (const sale of sales) {
      const date = new Date(sale.created_at);
      const key = `slot-${Math.min(7, Math.floor(date.getHours() / 3))}`;
      const bucket = bucketMap.get(key);
      if (!bucket) continue;
      bucket.revenue += Number(sale.total || 0);
      bucket.bills += 1;
    }

    for (const expense of expenses) {
      const date = normalizeExpenseDate(expense.date || expense.created_at);
      if (!date) continue;
      const key = `slot-${Math.min(7, Math.floor(date.getHours() / 3))}`;
      const bucket = bucketMap.get(key);
      if (!bucket) continue;
      bucket.expenses += Number(expense.amount || 0);
    }

    return buckets;
  }

  if (range === 'week' || range === 'month') {
    const days = range === 'week' ? 7 : 30;
    for (let index = days - 1; index >= 0; index -= 1) {
      const current = new Date(today);
      current.setDate(current.getDate() - index);
      const key = localDayKey(current);
      const bucket = { key, label: formatDayLabel(current), revenue: 0, expenses: 0, bills: 0 };
      buckets.push(bucket);
      bucketMap.set(key, bucket);
    }

    for (const sale of sales) {
      const bucket = bucketMap.get(localDayKey(sale.created_at));
      if (!bucket) continue;
      bucket.revenue += Number(sale.total || 0);
      bucket.bills += 1;
    }

    for (const expense of expenses) {
      const date = normalizeExpenseDate(expense.date || expense.created_at);
      if (!date) continue;
      const bucket = bucketMap.get(localDayKey(date));
      if (!bucket) continue;
      bucket.expenses += Number(expense.amount || 0);
    }

    return buckets;
  }

  for (let index = 11; index >= 0; index -= 1) {
    const current = new Date(today.getFullYear(), today.getMonth() - index, 1);
    const key = localMonthKey(current);
    const bucket = { key, label: formatMonthLabel(current), revenue: 0, expenses: 0, bills: 0 };
    buckets.push(bucket);
    bucketMap.set(key, bucket);
  }

  for (const sale of sales) {
    const bucket = bucketMap.get(localMonthKey(sale.created_at));
    if (!bucket) continue;
    bucket.revenue += Number(sale.total || 0);
    bucket.bills += 1;
  }

  for (const expense of expenses) {
    const date = normalizeExpenseDate(expense.date || expense.created_at);
    if (!date) continue;
    const bucket = bucketMap.get(localMonthKey(date));
    if (!bucket) continue;
    bucket.expenses += Number(expense.amount || 0);
  }

  return buckets;
}

function numberSorter(key) {
  return (a, b) => Number(b?.[key] || 0) - Number(a?.[key] || 0);
}

export default function ReportsPage() {
  const { can, user } = usePermissions();
  const canViewFinancial = can('view_reports_financial');
  const canViewStaff = can('view_reports_staff');
  const canViewAllPrintHistory = can('view_all_print_history');
  const settings = useLiveQuery(() => db.settings.get(1), []);
  const sales = useLiveQuery(() => db.sales.toArray(), []);
  const expenses = useLiveQuery(() => db.expenses.toArray(), []);
  const products = useLiveQuery(() => db.products.toArray(), []);
  const batches = useLiveQuery(() => db.product_batches.toArray(), []);
  const [range, setRange] = useState('today');
  const [tab, setTab] = useState('overview');
  const [historySearch, setHistorySearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [breakdownMode, setBreakdownMode] = useState('category');
  const [productSort, setProductSort] = useState('revenue');
  const [productLimit, setProductLimit] = useState(10);

  const filteredSales = useMemo(() => {
    const scopedSales = (sales ?? []).filter((sale) => isSaleVisibleToUser(sale, user, canViewAllPrintHistory));
    return scopedSales.filter((sale) => inRange(sale.created_at, range));
  }, [sales, range, canViewAllPrintHistory, user]);

  const filteredExpenses = useMemo(
    () => (expenses ?? []).filter((expense) => inRange(expense.date || expense.created_at, range) && expense.is_enabled !== false),
    [expenses, range]
  );

  const report = useMemo(() => {
    const revenue = filteredSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
    const profit = filteredSales.reduce((sum, sale) => sum + Number(sale.profit || 0), 0);
    const pending = filteredSales.reduce((sum, sale) => sum + Number(sale.balance_owed || 0), 0);
    const expenseTotal = filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const net = profit - expenseTotal;
    const discountTotal = filteredSales.reduce((sum, sale) => sum + Number(sale.discount_amount || 0), 0);
    const taxTotal = filteredSales.reduce((sum, sale) => sum + Number(sale.tax_amount || 0), 0);
    const averageBill = filteredSales.length ? revenue / filteredSales.length : 0;

    const productMap = new Map((products ?? []).map((product) => [product.id, product]));
    const productStatsMap = new Map();
    const categoryMap = new Map();
    const brandMap = new Map();
    const paymentModeMap = new Map();
    const staffMap = new Map();

    for (const sale of filteredSales) {
      const paymentKey = sale.payment_mode || 'unknown';
      const paymentRow = paymentModeMap.get(paymentKey) ?? { label: paymentKey.toUpperCase(), count: 0, revenue: 0 };
      paymentRow.count += 1;
      paymentRow.revenue += Number(sale.total || 0);
      paymentModeMap.set(paymentKey, paymentRow);

      const staffKey = sale.cashier_name || 'Unknown';
      const staffRow = staffMap.get(staffKey) ?? { name: staffKey, sales: 0, revenue: 0, profit: 0 };
      staffRow.sales += 1;
      staffRow.revenue += Number(sale.total || 0);
      staffRow.profit += Number(sale.profit || 0);
      staffMap.set(staffKey, staffRow);

      for (const item of sale.items ?? []) {
        const product = productMap.get(item.productId);
        const productKey = item.productId || item.name;
        const productRow = productStatsMap.get(productKey) ?? {
          name: item.name,
          category: product?.category || 'Other',
          brand: product?.brand || 'Unbranded',
          quantity: 0,
          revenue: 0,
          profit: 0
        };
        productRow.quantity += Number(item.quantity || 0);
        productRow.revenue += Number(item.salePrice || 0) * Number(item.quantity || 0);
        productRow.profit += (Number(item.salePrice || 0) - Number(item.purchasePrice || 0)) * Number(item.quantity || 0);
        productStatsMap.set(productKey, productRow);

        const category = product?.category || 'Other';
        categoryMap.set(category, (categoryMap.get(category) ?? 0) + Number(item.salePrice || 0) * Number(item.quantity || 0));

        const brand = product?.brand || 'Unbranded';
        brandMap.set(brand, (brandMap.get(brand) ?? 0) + Number(item.salePrice || 0) * Number(item.quantity || 0));
      }
    }

    const productPerformance = [...productStatsMap.values()];
    const categories = [...categoryMap.entries()].map(([label, amount]) => ({ label, value: amount })).sort(numberSorter('value'));
    const brands = [...brandMap.entries()].map(([label, amount]) => ({ label, value: amount })).sort(numberSorter('value'));
    const paymentModes = [...paymentModeMap.values()].sort(numberSorter('revenue'));
    const staffPerformance = [...staffMap.values()].sort(numberSorter('revenue'));

    const lowStock = (products ?? []).filter((product) => {
      const totalStock = (batches ?? [])
        .filter((batch) => batch.product_id === product.id && batch.is_active)
        .reduce((sum, batch) => sum + Number(batch.quantity || 0), 0);
      return totalStock <= Number(settings?.low_stock_default || 10);
    }).length;

    const overdueCustomerKeys = new Set(
      filteredSales
        .filter((sale) => Number(sale.balance_owed || 0) > 0)
        .map((sale) => sale.customer_id || `name:${String(sale.customer_name || 'walk-in').trim().toLowerCase()}`)
    );

    return {
      revenue,
      profit,
      pending,
      expenseTotal,
      net,
      lowStock,
      overdueCustomers: overdueCustomerKeys.size,
      averageBill,
      discountTotal,
      taxTotal,
      productPerformance,
      categories,
      brands,
      paymentModes,
      staffPerformance
    };
  }, [filteredSales, filteredExpenses, products, batches, settings]);

  const visibleTabs = useMemo(
    () => TAB_OPTIONS.filter((item) => item.id !== 'staff' || canViewStaff),
    [canViewStaff]
  );

  const timeSeries = useMemo(
    () => buildTimeSeries({ sales: filteredSales, expenses: filteredExpenses, range }),
    [filteredSales, filteredExpenses, range]
  );

  const paymentModeOptions = useMemo(
    () => ['all', ...Array.from(new Set(filteredSales.map((sale) => sale.payment_mode).filter(Boolean)))],
    [filteredSales]
  );

  const productRows = useMemo(() => {
    return [...report.productPerformance].sort(numberSorter(productSort)).slice(0, productLimit);
  }, [report.productPerformance, productSort, productLimit]);

  const breakdownRows = useMemo(() => {
    return (breakdownMode === 'brand' ? report.brands : report.categories).slice(0, 8);
  }, [breakdownMode, report.brands, report.categories]);

  const historyRows = useMemo(() => {
    const term = historySearch.trim().toLowerCase();

    return filteredSales
      .filter((sale) => {
        if (paymentFilter !== 'all' && sale.payment_mode !== paymentFilter) return false;
        if (!term) return true;
        return [sale.bill_number, sale.customer_name, sale.cashier_name, sale.payment_mode]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [filteredSales, historySearch, paymentFilter]);

  const exportCurrentTab = () => {
    const prefix = `reports-${tab}-${range}-${new Date().toISOString().slice(0, 10)}`;

    if (tab === 'overview') {
      downloadCsv({
        filename: prefix,
        rows: [
          {
            range,
            bills: filteredSales.length,
            revenue: report.revenue,
            pending_balance: report.pending,
            low_stock_products: report.lowStock,
            customers_with_due: report.overdueCustomers,
            average_bill: report.averageBill,
            discount_total: report.discountTotal,
            tax_total: report.taxTotal,
            ...(canViewFinancial
              ? {
                  profit: report.profit,
                  expenses: report.expenseTotal,
                  net: report.net
                }
              : {})
          }
        ]
      });
      return;
    }

    if (tab === 'products') {
      downloadCsv({
        filename: prefix,
        rows: productRows.map((item, index) => ({
          rank: index + 1,
          product: item.name,
          category: item.category,
          brand: item.brand,
          units: item.quantity,
          revenue: item.revenue,
          ...(canViewFinancial ? { profit: item.profit } : {})
        }))
      });
      return;
    }

    if (tab === 'categories') {
      downloadCsv({
        filename: prefix,
        rows: (breakdownMode === 'brand' ? report.brands : report.categories).map((item, index) => ({
          rank: index + 1,
          type: breakdownMode,
          name: item.label,
          revenue: item.value
        }))
      });
      return;
    }

    if (tab === 'history') {
      downloadCsv({
        filename: prefix,
        rows: historyRows.map((sale) => ({
          bill_number: sale.bill_number,
          date: new Date(sale.created_at).toLocaleString(),
          customer: sale.customer_name || 'Walk-in',
          cashier: sale.cashier_name || 'Unknown',
          payment_mode: sale.payment_mode,
          items: sale.items?.length ?? 0,
          total: sale.total,
          paid: sale.amount_paid,
          due: sale.balance_owed,
          ...(canViewFinancial ? { profit: sale.profit } : {})
        }))
      });
      return;
    }

    if (tab === 'staff' && canViewStaff) {
      downloadCsv({
        filename: prefix,
        rows: report.staffPerformance.map((item, index) => ({
          rank: index + 1,
          staff: item.name,
          bills: item.sales,
          revenue: item.revenue,
          ...(canViewFinancial ? { profit: item.profit } : {})
        }))
      });
    }
  };

  const exportTrends = () => {
    downloadCsv({
      filename: `reports-trends-${range}-${new Date().toISOString().slice(0, 10)}`,
      rows: timeSeries.map((item) => ({
        period: item.label,
        revenue: item.revenue,
        expenses: item.expenses,
        bills: item.bills
      }))
    });
  };

  return (
    <div className="space-y-6">
      {!canViewAllPrintHistory ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-100">
          Your role sees report data based on your own recorded sales activity, and all exports follow the same visibility rules.
        </div>
      ) : null}

      <SectionIntro
        eyebrow="Reports"
        title="Live charts, searchable history, and CSV exports"
        description="Review business performance with visual charts, product/category rankings, searchable bill history, and one-click CSV exports for the current report tab."
        action={
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={exportCurrentTab}>
              Export current tab CSV
            </Button>
            <Button onClick={exportTrends}>Export trends CSV</Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        {RANGE_OPTIONS.map((option) => (
          <Button key={option.id} variant={range === option.id ? 'primary' : 'secondary'} onClick={() => setRange(option.id)}>
            {option.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {visibleTabs.map((option) => (
          <Button key={option.id} variant={tab === option.id ? 'primary' : 'secondary'} onClick={() => setTab(option.id)}>
            {option.label}
          </Button>
        ))}
      </div>

      <div className="card-grid">
        <Card>
          <p className="text-sm text-slate-400">Revenue</p>
          <h3 className="mt-2 text-2xl font-bold text-white">{formatCurrency(report.revenue, settings?.currency)}</h3>
        </Card>
        <Card>
          <p className="text-sm text-slate-400">Bills</p>
          <h3 className="mt-2 text-2xl font-bold text-white">{filteredSales.length}</h3>
        </Card>
        <Card>
          <p className="text-sm text-slate-400">Pending balance</p>
          <h3 className="mt-2 text-2xl font-bold text-white">{formatCurrency(report.pending, settings?.currency)}</h3>
        </Card>
        <Card>
          <p className="text-sm text-slate-400">Low stock products</p>
          <h3 className="mt-2 text-2xl font-bold text-white">{report.lowStock}</h3>
        </Card>
        {canViewFinancial ? (
          <>
            <Card>
              <p className="text-sm text-slate-400">Profit</p>
              <h3 className="mt-2 text-2xl font-bold text-white">{formatCurrency(report.profit, settings?.currency)}</h3>
            </Card>
            <Card>
              <p className="text-sm text-slate-400">Expenses</p>
              <h3 className="mt-2 text-2xl font-bold text-white">{formatCurrency(report.expenseTotal, settings?.currency)}</h3>
            </Card>
            <Card>
              <p className="text-sm text-slate-400">Net</p>
              <h3 className="mt-2 text-2xl font-bold text-white">{formatCurrency(report.net, settings?.currency)}</h3>
            </Card>
          </>
        ) : null}
      </div>

      {tab === 'overview' ? (
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-brand-300">Revenue trend</p>
                  <h2 className="mt-2 text-2xl font-bold text-white">Sales flow across the selected range</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="border-white/10 bg-white/5 text-slate-200">{range.toUpperCase()}</Badge>
                  {!canViewFinancial ? <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-100">Basic view</Badge> : null}
                </div>
              </div>
              <div className="mt-5">
                <LineChart
                  data={timeSeries}
                  lines={
                    canViewFinancial
                      ? [
                          { key: 'revenue', label: 'Revenue', color: '#10b981' },
                          { key: 'expenses', label: 'Expenses', color: '#f59e0b' }
                        ]
                      : [{ key: 'revenue', label: 'Revenue', color: '#10b981' }]
                  }
                />
              </div>
            </Card>

            <Card>
              <p className="text-xs uppercase tracking-[0.35em] text-brand-300">Payment mode mix</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Sales by payment method</h2>
              <div className="mt-5">
                <VerticalBarChart
                  items={report.paymentModes.map((item) => ({
                    label: item.label,
                    value: item.revenue,
                    displayValue: formatCurrency(item.revenue, settings?.currency)
                  }))}
                  valueKey="value"
                  labelKey="label"
                  color="linear-gradient(180deg, #10b981 0%, #06b6d4 100%)"
                />
              </div>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <Card>
              <p className="text-xs uppercase tracking-[0.35em] text-brand-300">Business pulse</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Quick summary</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="detail-item">
                  <div className="text-slate-500">Average bill</div>
                  <div className="mt-1 text-xl font-semibold text-white">{formatCurrency(report.averageBill, settings?.currency)}</div>
                </div>
                <div className="detail-item">
                  <div className="text-slate-500">Customers with due</div>
                  <div className="mt-1 text-xl font-semibold text-white">{report.overdueCustomers}</div>
                </div>
                <div className="detail-item">
                  <div className="text-slate-500">Discount total</div>
                  <div className="mt-1 text-xl font-semibold text-white">{formatCurrency(report.discountTotal, settings?.currency)}</div>
                </div>
                <div className="detail-item">
                  <div className="text-slate-500">Tax total</div>
                  <div className="mt-1 text-xl font-semibold text-white">{formatCurrency(report.taxTotal, settings?.currency)}</div>
                </div>
              </div>
            </Card>

            <Card>
              <p className="text-xs uppercase tracking-[0.35em] text-brand-300">Top category snapshot</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Best earning categories</h2>
              <div className="mt-5">
                <HorizontalBarChart
                  items={report.categories.slice(0, 5)}
                  labelKey="label"
                  valueKey="value"
                  formatter={(value) => formatCurrency(value, settings?.currency)}
                />
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {tab === 'products' ? (
        <div className="space-y-6">
          <Card>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="grid gap-4 md:grid-cols-3">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-300">Sort products by</span>
                  <select
                    value={productSort}
                    onChange={(event) => setProductSort(event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30"
                  >
                    {PRODUCT_SORT_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-300">Show top</span>
                  <select
                    value={productLimit}
                    onChange={(event) => setProductLimit(Number(event.target.value))}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30"
                  >
                    {PRODUCT_LIMIT_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <Badge className="border-white/10 bg-white/5 text-slate-200">{report.productPerformance.length} products in range</Badge>
            </div>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <Card>
              <p className="text-xs uppercase tracking-[0.35em] text-brand-300">Product chart</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Top products by {PRODUCT_SORT_OPTIONS.find((item) => item.id === productSort)?.label.toLowerCase()}</h2>
              <div className="mt-5">
                <HorizontalBarChart
                  items={productRows.map((item) => ({ ...item, label: item.name, value: item[productSort] }))}
                  labelKey="label"
                  valueKey="value"
                  formatter={(value) =>
                    productSort === 'quantity' ? `${value} units` : formatCurrency(value, settings?.currency)
                  }
                />
              </div>
            </Card>

            <Card>
              <p className="text-xs uppercase tracking-[0.35em] text-brand-300">Product ranking</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Detailed list</h2>
              <div className="mt-5 space-y-3">
                {productRows.map((item, index) => (
                  <div key={`${item.name}-${index}`} className="detail-item">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-white">#{index + 1} {item.name}</div>
                        <div className="mt-1 text-xs text-slate-400">{item.category} • {item.brand}</div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="font-semibold text-white">{formatCurrency(item.revenue, settings?.currency)}</div>
                        <div className="text-slate-400">
                          {item.quantity} units{canViewFinancial ? ` • Profit ${formatCurrency(item.profit, settings?.currency)}` : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {!productRows.length ? <div className="detail-item text-slate-400">No product sales in this range.</div> : null}
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {tab === 'categories' ? (
        <div className="space-y-6">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                <Button variant={breakdownMode === 'category' ? 'primary' : 'secondary'} onClick={() => setBreakdownMode('category')}>
                  By category
                </Button>
                <Button variant={breakdownMode === 'brand' ? 'primary' : 'secondary'} onClick={() => setBreakdownMode('brand')}>
                  By brand
                </Button>
              </div>
              <Badge className="border-white/10 bg-white/5 text-slate-200">
                {breakdownMode === 'brand' ? report.brands.length : report.categories.length} groups in range
              </Badge>
            </div>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <Card>
              <p className="text-xs uppercase tracking-[0.35em] text-brand-300">Donut chart</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Revenue share by {breakdownMode}</h2>
              <div className="mt-5">
                <DonutChart
                  items={breakdownRows}
                  valueKey="value"
                  labelKey="label"
                  formatter={(value) => formatCurrency(value, settings?.currency)}
                  totalLabel="Revenue"
                />
              </div>
            </Card>

            <Card>
              <p className="text-xs uppercase tracking-[0.35em] text-brand-300">Breakdown bars</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Top {breakdownMode} groups</h2>
              <div className="mt-5">
                <HorizontalBarChart
                  items={breakdownRows}
                  labelKey="label"
                  valueKey="value"
                  formatter={(value) => formatCurrency(value, settings?.currency)}
                  barClassName="from-sky-500 to-brand-400"
                />
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {tab === 'history' ? (
        <div className="space-y-6">
          <Card>
            <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
              <Input
                label="Search history"
                value={historySearch}
                onChange={(event) => setHistorySearch(event.target.value)}
                placeholder="Search by bill number, customer, cashier, or payment mode"
              />
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-300">Payment mode</span>
                <select
                  value={paymentFilter}
                  onChange={(event) => setPaymentFilter(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30"
                >
                  {paymentModeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === 'all' ? 'All payment modes' : option.toUpperCase()}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-brand-300">Sales history</p>
                <h2 className="mt-2 text-2xl font-bold text-white">Filtered bills</h2>
              </div>
              <Badge className="border-white/10 bg-white/5 text-slate-200">{historyRows.length} visible bills</Badge>
            </div>

            <div className="mt-5 overflow-x-auto rounded-3xl border border-white/10">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-900/80 text-slate-300">
                  <tr>
                    <th className="px-4 py-3 text-left">Bill</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Customer</th>
                    <th className="px-4 py-3 text-left">Cashier</th>
                    <th className="px-4 py-3 text-left">Mode</th>
                    <th className="px-4 py-3 text-right">Items</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    {canViewFinancial ? <th className="px-4 py-3 text-right">Profit</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {historyRows.map((sale) => (
                    <tr key={sale.id} className="border-t border-white/10 text-slate-200">
                      <td className="px-4 py-3 font-semibold text-white">{sale.bill_number}</td>
                      <td className="px-4 py-3">{new Date(sale.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3">{sale.customer_name || 'Walk-in'}</td>
                      <td className="px-4 py-3">{sale.cashier_name || 'Unknown'}</td>
                      <td className="px-4 py-3 uppercase text-brand-200">{sale.payment_mode}</td>
                      <td className="px-4 py-3 text-right">{sale.items?.length ?? 0}</td>
                      <td className="px-4 py-3 text-right font-semibold text-white">{formatCurrency(sale.total, settings?.currency)}</td>
                      {canViewFinancial ? (
                        <td className="px-4 py-3 text-right">{formatCurrency(sale.profit, settings?.currency)}</td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!historyRows.length ? <div className="mt-5 detail-item text-slate-400">No bills match the current filters.</div> : null}
          </Card>
        </div>
      ) : null}

      {tab === 'staff' && canViewStaff ? (
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <Card>
              <p className="text-xs uppercase tracking-[0.35em] text-brand-300">Staff chart</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Revenue by cashier</h2>
              <div className="mt-5">
                <HorizontalBarChart
                  items={report.staffPerformance.map((item) => ({ ...item, label: item.name, value: item.revenue }))}
                  labelKey="label"
                  valueKey="value"
                  formatter={(value) => formatCurrency(value, settings?.currency)}
                  barClassName="from-fuchsia-500 to-sky-400"
                />
              </div>
            </Card>

            <Card>
              <p className="text-xs uppercase tracking-[0.35em] text-brand-300">Staff ranking</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Performance list</h2>
              <div className="mt-5 space-y-3">
                {report.staffPerformance.map((item, index) => (
                  <div key={`${item.name}-${index}`} className="detail-item">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-white">#{index + 1} {item.name}</div>
                        <div className="mt-1 text-xs text-slate-400">{item.sales} bills</div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="font-semibold text-white">{formatCurrency(item.revenue, settings?.currency)}</div>
                        {canViewFinancial ? <div className="text-slate-400">Profit {formatCurrency(item.profit, settings?.currency)}</div> : null}
                      </div>
                    </div>
                  </div>
                ))}
                {!report.staffPerformance.length ? <div className="detail-item text-slate-400">No staff sales in this range.</div> : null}
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
