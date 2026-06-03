import { db } from '../db/index';
import { generateBillNumber, getDeviceCode } from './billNumber';

function numberValue(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function round2(value) {
  return Number(numberValue(value).toFixed(2));
}

function itemKey(item) {
  return `${item.productId || ''}:${item.batchId || ''}:${item.name || ''}`;
}

export function canAutoApproveReturn(user) {
  return ['owner', 'super_admin'].includes(user?.role);
}

export function getReturnableItems(originalSale, linkedReturnSales = []) {
  const returnedMap = new Map();

  for (const returnSale of linkedReturnSales) {
    for (const item of returnSale.items ?? []) {
      returnedMap.set(itemKey(item), (returnedMap.get(itemKey(item)) ?? 0) + Math.abs(numberValue(item.quantity)));
    }
  }

  return (originalSale.items ?? [])
    .map((item) => {
      const soldQty = Math.abs(numberValue(item.quantity));
      const alreadyReturnedQty = returnedMap.get(itemKey(item)) ?? 0;
      const remainingQty = Math.max(0, soldQty - alreadyReturnedQty);

      return {
        ...item,
        soldQty,
        alreadyReturnedQty,
        remainingQty
      };
    })
    .filter((item) => item.remainingQty > 0);
}

export function calculateReturnPreview(originalSale, requestedItems) {
  const subtotal = round2(
    requestedItems.reduce((sum, item) => sum + numberValue(item.salePrice) * numberValue(item.quantity), 0)
  );

  const originalSubtotal = Math.max(0.01, numberValue(originalSale.subtotal));
  const ratio = Math.min(1, subtotal / originalSubtotal);
  const discountAmount = round2(numberValue(originalSale.discount_amount) * ratio);
  const taxAmount = round2(numberValue(originalSale.tax_amount) * ratio);
  const grossProfit = round2(
    requestedItems.reduce(
      (sum, item) => sum + (numberValue(item.salePrice) - numberValue(item.purchasePrice)) * numberValue(item.quantity),
      0
    )
  );
  const total = round2(subtotal - discountAmount + taxAmount);
  const dueReduction = round2(Math.min(numberValue(originalSale.balance_owed), total));
  const cashRefund = round2(Math.max(0, total - dueReduction));
  const profit = round2(-(grossProfit - discountAmount));

  return {
    subtotal,
    discountAmount,
    taxAmount,
    total,
    dueReduction,
    cashRefund,
    profit,
    ratio
  };
}

export async function processReturn({ originalSale, requestedItems, user, settings, reason }) {
  const now = new Date().toISOString();
  const trimmedReason = String(reason ?? '').trim();

  if (!trimmedReason) {
    throw new Error('Return reason is required.');
  }

  const linkedReturnSales = await db.sales
    .where('original_sale_id')
    .equals(originalSale.id)
    .filter((sale) => sale.is_return === true)
    .toArray();

  const returnableItems = getReturnableItems(originalSale, linkedReturnSales);
  const remainingMap = new Map(returnableItems.map((item) => [itemKey(item), item.remainingQty]));

  const validItems = requestedItems
    .map((item) => ({ ...item, quantity: numberValue(item.quantity) }))
    .filter((item) => item.quantity > 0)
    .map((item) => {
      const remainingQty = remainingMap.get(itemKey(item)) ?? 0;
      if (item.quantity > remainingQty) {
        throw new Error(`Return quantity for ${item.name} exceeds remaining sellable quantity.`);
      }
      return item;
    });

  if (!validItems.length) {
    throw new Error('Select at least one item quantity to return.');
  }

  const preview = calculateReturnPreview(originalSale, validItems);
  const nextSequence = numberValue(settings?.bill_sequence) + 1;
  const billNumber = generateBillNumber({
    sequence: nextSequence,
    staffCode: user?.short_code || 'MM',
    deviceCode: getDeviceCode()
  });

  const approvalStatus = canAutoApproveReturn(user) ? 'approved' : 'pending';
  const approvedAt = approvalStatus === 'approved' ? now : null;
  const approvedBy = approvalStatus === 'approved' ? user?.id ?? null : null;
  const approvedByName = approvalStatus === 'approved' ? user?.name ?? 'Unknown' : null;

  let returnSaleRecord;

  await db.transaction(
    'rw',
    db.product_batches,
    db.sales,
    db.expenses,
    db.logs,
    db.settings,
    db.sync_queue,
    db.customers,
    async () => {
      for (const item of validItems) {
        const batch = await db.product_batches.get(item.batchId);
        if (!batch) {
          throw new Error(`Batch not found for ${item.name}.`);
        }

        const updatedBatch = {
          ...batch,
          quantity: numberValue(batch.quantity) + item.quantity,
          updated_at: now
        };
        await db.product_batches.put(updatedBatch);
        await db.sync_queue.add({
          tableName: 'product_batches',
          action: 'UPDATE',
          recordId: updatedBatch.id,
          data: updatedBatch,
          status: 'pending',
          retries: 0,
          timestamp: Date.now()
        });
      }

      const updatedOriginalSale = {
        ...originalSale,
        balance_owed: round2(Math.max(0, numberValue(originalSale.balance_owed) - preview.dueReduction)),
        updated_at: now
      };
      await db.sales.put(updatedOriginalSale);
      await db.sync_queue.add({
        tableName: 'sales',
        action: 'UPDATE',
        recordId: updatedOriginalSale.id,
        data: updatedOriginalSale,
        status: 'pending',
        retries: 0,
        timestamp: Date.now()
      });

      if (originalSale.customer_id) {
        const customer = await db.customers.get(originalSale.customer_id);
        if (customer) {
          const updatedCustomer = {
            ...customer,
            pending_amount: round2(Math.max(0, numberValue(customer.pending_amount) - preview.dueReduction)),
            updated_at: now
          };
          await db.customers.put(updatedCustomer);
          await db.sync_queue.add({
            tableName: 'customers',
            action: 'UPDATE',
            recordId: updatedCustomer.id,
            data: updatedCustomer,
            status: 'pending',
            retries: 0,
            timestamp: Date.now()
          });
        }
      }

      returnSaleRecord = {
        id: crypto.randomUUID(),
        bill_number: billNumber,
        customer_id: originalSale.customer_id,
        customer_name: originalSale.customer_name,
        items: validItems.map((item) => ({
          ...item,
          quantity: -Math.abs(item.quantity)
        })),
        subtotal: -preview.subtotal,
        discount_type: originalSale.discount_type,
        discount_value: originalSale.discount_value,
        discount_amount: -preview.discountAmount,
        tax_amount: -preview.taxAmount,
        total: -preview.total,
        profit: preview.profit,
        payment_mode: 'credit',
        amount_paid: 0,
        return_amount: preview.cashRefund,
        balance_owed: 0,
        payback_date: null,
        cashier_id: user?.isEmergency ? null : user?.id,
        cashier_name: user?.name ?? 'Unknown',
        is_return: true,
        original_sale_id: originalSale.id,
        original_bill_number: originalSale.bill_number,
        refund_cash: preview.cashRefund,
        due_adjustment: preview.dueReduction,
        return_reason: trimmedReason,
        approval_status: approvalStatus,
        approved_at: approvedAt,
        approved_by: approvedBy,
        approved_by_name: approvedByName,
        created_at: now
      };

      await db.sales.add(returnSaleRecord);
      await db.settings.update(1, { bill_sequence: nextSequence, updated_at: now });
      await db.sync_queue.add({
        tableName: 'sales',
        action: 'INSERT',
        recordId: returnSaleRecord.id,
        data: returnSaleRecord,
        status: 'pending',
        retries: 0,
        timestamp: Date.now()
      });

      if (preview.cashRefund > 0) {
        const expenseRecord = {
          id: crypto.randomUUID(),
          type: 'return_payment',
          description: `Refund for return ${billNumber} against ${originalSale.bill_number}`,
          amount: preview.cashRefund,
          date: now.slice(0, 10),
          supplier_id: null,
          is_enabled: true,
          sale_id: returnSaleRecord.id,
          created_at: now,
          updated_at: now
        };

        await db.expenses.add(expenseRecord);
        await db.sync_queue.add({
          tableName: 'expenses',
          action: 'INSERT',
          recordId: expenseRecord.id,
          data: expenseRecord,
          status: 'pending',
          retries: 0,
          timestamp: Date.now()
        });
      }

      await db.logs.add({
        id: crypto.randomUUID(),
        action: 'RETURN',
        user_id: user?.id,
        user_name: user?.name ?? 'Unknown',
        details: {
          original_bill_number: originalSale.bill_number,
          return_bill_number: billNumber,
          items: validItems.length,
          refund_cash: preview.cashRefund,
          due_adjustment: preview.dueReduction,
          total_return: preview.total,
          reason: trimmedReason,
          approval_status: approvalStatus
        },
        timestamp: now
      });
    }
  );

  return returnSaleRecord;
}

export async function approveReturn({ returnSale, actor }) {
  if (!returnSale?.is_return) {
    throw new Error('Only return bills can be approved.');
  }

  if (returnSale.approval_status === 'approved') {
    return returnSale;
  }

  const now = new Date().toISOString();
  const updated = {
    ...returnSale,
    approval_status: 'approved',
    approved_at: now,
    approved_by: actor?.isEmergency ? null : actor?.id ?? null,
    approved_by_name: actor?.name ?? 'Unknown',
    updated_at: now
  };

  await db.sales.put(updated);
  await db.sync_queue.add({
    tableName: 'sales',
    action: 'UPDATE',
    recordId: updated.id,
    data: updated,
    status: 'pending',
    retries: 0,
    timestamp: Date.now()
  });

  await db.logs.add({
    id: crypto.randomUUID(),
    action: 'RETURN_APPROVED',
    user_id: actor?.id ?? null,
    user_name: actor?.name ?? 'Unknown',
    details: {
      return_bill_number: updated.bill_number,
      original_bill_number: updated.original_bill_number,
      approved_at: now
    },
    timestamp: now
  });

  return updated;
}
