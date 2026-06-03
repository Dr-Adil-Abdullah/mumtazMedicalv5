import { create } from 'zustand';
import { db } from '../db/index';
import { generateBillNumber, getDeviceCode } from '../utils/billNumber';
import { generateCustomerId } from '../utils/idGenerator';
import { calculateLoyaltyPointsEarned } from '../utils/loyalty';

function numberValue(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function calculateSummary(cart, settings, discountPercent) {
  const subtotal = cart.reduce((sum, item) => sum + numberValue(item.salePrice) * item.quantity, 0);
  const sanitizedDiscount = Math.max(0, Math.min(100, numberValue(discountPercent)));
  const discountAmount = subtotal * (sanitizedDiscount / 100);
  const taxable = subtotal - discountAmount;
  const taxAmount = settings?.tax_enabled ? taxable * (numberValue(settings.tax_percent) / 100) : 0;
  const total = taxable + taxAmount;
  const grossProfit = cart.reduce(
    (sum, item) => sum + (numberValue(item.salePrice) - numberValue(item.purchasePrice)) * item.quantity,
    0
  );
  const profit = grossProfit - discountAmount;

  return {
    subtotal,
    discountPercent: sanitizedDiscount,
    discountAmount,
    taxAmount,
    total,
    profit
  };
}

async function upsertCustomer({ customerName, balanceOwed, loyaltyPointsEarned, now, user }) {
  const trimmed = customerName.trim();
  if (!trimmed) return null;

  const customers = await db.customers.toArray();
  const existing = customers.find((customer) => customer.name.trim().toLowerCase() === trimmed.toLowerCase());

  if (existing) {
    const updated = {
      ...existing,
      pending_amount: numberValue(existing.pending_amount) + numberValue(balanceOwed),
      loyalty_points: numberValue(existing.loyalty_points) + numberValue(loyaltyPointsEarned),
      updated_at: now
    };
    await db.customers.put(updated);
    await db.sync_queue.add({
      tableName: 'customers',
      action: 'UPDATE',
      recordId: updated.id,
      data: updated,
      status: 'pending',
      retries: 0,
      timestamp: Date.now()
    });
    return updated;
  }

  const id = crypto.randomUUID();
  const customer_id = generateCustomerId(customers.length + 1);
  const record = {
    id,
    customer_id,
    name: trimmed,
    type: 'regular',
    phone: '',
    pending_amount: numberValue(balanceOwed),
    loyalty_points: numberValue(loyaltyPointsEarned),
    is_active: true,
    created_by: user?.isEmergency ? null : user?.id ?? null,
    created_by_name: user?.name ?? 'Unknown',
    created_at: now,
    updated_at: now
  };

  await db.customers.add(record);
  await db.sync_queue.add({
    tableName: 'customers',
    action: 'INSERT',
    recordId: record.id,
    data: record,
    status: 'pending',
    retries: 0,
    timestamp: Date.now()
  });

  return record;
}

export const usePosStore = create((set, get) => ({
  cart: [],
  paymentMode: 'cash',
  amountPaid: '',
  paybackDate: '',
  customerName: '',
  discountPercent: '0',
  saleResult: null,
  submitting: false,
  error: '',
  setField(field, value) {
    set({ [field]: value, error: '' });
  },
  addItem({ product, batch, settings }) {
    const state = get();
    const existing = state.cart.find((item) => item.batchId === batch.id);
    const nextLimit = numberValue(settings?.cart_item_limit);

    if (nextLimit > 0 && !existing && state.cart.length >= nextLimit) {
      set({ error: `Cart item limit reached (${nextLimit}).` });
      return;
    }

    if (existing) {
      set({
        cart: state.cart.map((item) =>
          item.batchId === batch.id ? { ...item, quantity: item.quantity + 1 } : item
        ),
        error: ''
      });
      return;
    }

    set({
      cart: [
        ...state.cart,
        {
          id: `${product.id}:${batch.id}`,
          productId: product.id,
          batchId: batch.id,
          batchNumber: batch.batch_number,
          name: product.name,
          barcode: product.barcode,
          unit: product.unit,
          salePrice: numberValue(batch.sale_price),
          purchasePrice: numberValue(batch.purchase_price),
          quantity: 1,
          availableQuantity: numberValue(batch.quantity),
          expiryDate: batch.expiry_date
        }
      ],
      error: ''
    });
  },
  increaseItem(batchId) {
    set((state) => ({
      cart: state.cart.map((item) =>
        item.batchId === batchId ? { ...item, quantity: item.quantity + 1 } : item
      )
    }));
  },
  decreaseItem(batchId) {
    set((state) => ({
      cart: state.cart
        .map((item) => (item.batchId === batchId ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0)
    }));
  },
  removeItem(batchId) {
    set((state) => ({ cart: state.cart.filter((item) => item.batchId !== batchId) }));
  },
  clearCart() {
    set({
      cart: [],
      paymentMode: 'cash',
      amountPaid: '',
      paybackDate: '',
      customerName: '',
      discountPercent: '0',
      saleResult: null,
      error: ''
    });
  },
  dismissSaleResult() {
    set({ saleResult: null });
  },
  async completeSale({ user, settings }) {
    const state = get();
    const now = new Date().toISOString();
    const trimmedCustomer = state.customerName.trim();

    if (!state.cart.length) {
      set({ error: 'Add at least one product to the cart.' });
      throw new Error('Cart is empty.');
    }

    const summary = calculateSummary(state.cart, settings, state.discountPercent);
    const amountPaid = numberValue(state.amountPaid || (state.paymentMode === 'cash' ? summary.total : 0));
    const balanceOwed = Math.max(0, summary.total - amountPaid);
    const returnAmount = Math.max(0, amountPaid - summary.total);

    if (state.paymentMode === 'cash' && amountPaid < summary.total) {
      set({ error: 'Cash received must be equal to or more than the total.' });
      throw new Error('Cash payment is short.');
    }

    if (state.paymentMode === 'pending') {
      if (!trimmedCustomer) {
        set({ error: 'Customer name is required for pending sales.' });
        throw new Error('Customer name is required for pending sales.');
      }
      if (!state.paybackDate) {
        set({ error: 'Payback date is required for pending sales.' });
        throw new Error('Payback date is required.');
      }
      if (balanceOwed < numberValue(settings?.pending_min_amount)) {
        set({ error: `Pending balance must be at least ${settings?.pending_min_amount ?? 0}.` });
        throw new Error('Pending amount is below the configured minimum.');
      }
    }

    const loyaltyPointsAwarded = trimmedCustomer
      ? calculateLoyaltyPointsEarned({ saleTotal: summary.total, paymentMode: state.paymentMode, settings })
      : 0;

    set({ submitting: true, error: '' });

    try {
      const deviceCode = getDeviceCode();
      const nextSequence = numberValue(settings?.bill_sequence) + 1;
      const billNumber = generateBillNumber({
        sequence: nextSequence,
        staffCode: user?.short_code || 'MM',
        deviceCode
      });

      let saleRecord;

      await db.transaction(
        'rw',
        db.product_batches,
        db.products,
        db.sales,
        db.logs,
        db.settings,
        db.sync_queue,
        db.customers,
        async () => {
          for (const cartItem of state.cart) {
            const batch = await db.product_batches.get(cartItem.batchId);
            if (!batch || !batch.is_active) {
              throw new Error(`${cartItem.name} batch is not available.`);
            }

            if (batch.expiry_date && new Date(batch.expiry_date) < new Date()) {
              throw new Error(`${cartItem.name} is expired and cannot be sold.`);
            }

            if (!settings?.allow_negative_stock && numberValue(batch.quantity) < cartItem.quantity) {
              throw new Error(`${cartItem.name} does not have enough stock.`);
            }
          }

          for (const cartItem of state.cart) {
            const batch = await db.product_batches.get(cartItem.batchId);
            const nextQty = numberValue(batch.quantity) - cartItem.quantity;
            const nextBatch = {
              ...batch,
              quantity: nextQty,
              updated_at: now
            };
            await db.product_batches.put(nextBatch);
            await db.sync_queue.add({
              tableName: 'product_batches',
              action: 'UPDATE',
              recordId: nextBatch.id,
              data: nextBatch,
              status: 'pending',
              retries: 0,
              timestamp: Date.now()
            });
          }

          const customerRecord = await upsertCustomer({
            customerName: trimmedCustomer,
            balanceOwed: state.paymentMode === 'pending' ? balanceOwed : 0,
            loyaltyPointsEarned: loyaltyPointsAwarded,
            now,
            user
          });

          saleRecord = {
            id: crypto.randomUUID(),
            bill_number: billNumber,
            customer_id: customerRecord?.id ?? null,
            customer_name: trimmedCustomer || null,
            items: state.cart.map((item) => ({
              productId: item.productId,
              batchId: item.batchId,
              batchNumber: item.batchNumber,
              name: item.name,
              barcode: item.barcode,
              unit: item.unit,
              quantity: item.quantity,
              salePrice: item.salePrice,
              purchasePrice: item.purchasePrice,
              expiryDate: item.expiryDate
            })),
            subtotal: summary.subtotal,
            discount_type: summary.discountAmount > 0 ? 'flat' : 'none',
            discount_value: summary.discountPercent,
            discount_amount: summary.discountAmount,
            tax_amount: summary.taxAmount,
            total: summary.total,
            profit: summary.profit,
            payment_mode: state.paymentMode,
            amount_paid: amountPaid,
            return_amount: returnAmount,
            balance_owed: balanceOwed,
            payback_date: state.paymentMode === 'pending' ? state.paybackDate : null,
            cashier_id: user?.isEmergency ? null : user?.id,
            cashier_name: user?.name ?? 'Unknown',
            is_return: false,
            original_sale_id: null,
            loyalty_points_awarded: loyaltyPointsAwarded,
            customer_loyalty_points_after: customerRecord?.loyalty_points ?? 0,
            created_at: now
          };

          await db.sales.add(saleRecord);
          await db.settings.update(1, { bill_sequence: nextSequence, updated_at: now });
          await db.logs.add({
            id: crypto.randomUUID(),
            action: 'SALE',
            user_id: user?.id,
            user_name: user?.name ?? 'Unknown',
            details: {
              bill_number: billNumber,
              items: state.cart.length,
              total: summary.total,
              payment_mode: state.paymentMode,
              customer_name: trimmedCustomer || null,
              loyalty_points_awarded: loyaltyPointsAwarded
            },
            timestamp: now
          });
          await db.sync_queue.add({
            tableName: 'sales',
            action: 'INSERT',
            recordId: saleRecord.id,
            data: saleRecord,
            status: 'pending',
            retries: 0,
            timestamp: Date.now()
          });
        }
      );

      set({
        cart: [],
        paymentMode: 'cash',
        amountPaid: '',
        paybackDate: '',
        customerName: '',
        discountPercent: '0',
        submitting: false,
        error: '',
        saleResult: {
          sale: saleRecord,
          billNumber: saleRecord.bill_number,
          total: saleRecord.total,
          amountPaid: saleRecord.amount_paid,
          returnAmount: saleRecord.return_amount,
          paymentMode: saleRecord.payment_mode,
          customerName: saleRecord.customer_name,
          itemCount: saleRecord.items.length,
          loyaltyPointsAwarded: saleRecord.loyalty_points_awarded,
          customerLoyaltyPointsAfter: saleRecord.customer_loyalty_points_after
        }
      });

      return saleRecord;
    } catch (error) {
      set({ submitting: false, error: error.message || 'Sale could not be completed.' });
      throw error;
    }
  }
}));

export { calculateSummary };
