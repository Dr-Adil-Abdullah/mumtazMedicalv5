import Dexie from 'dexie';

export const db = new Dexie('mumtazMedicalDB');

db.version(1).stores({
  settings: 'id, shop_name, updated_at',
  staff: 'id, staff_id, role, short_code, is_active, created_at',
  products: 'id, name, barcode, brand, category, is_active, created_at, updated_at',
  product_batches: 'id, product_id, batch_number, expiry_date, quantity, is_active, created_at',
  customers: 'id, customer_id, name, type, phone, pending_amount, loyalty_points, is_active, created_at',
  suppliers: 'id, name, type, phone, is_active, created_at',
  sales: 'id, bill_number, customer_id, cashier_id, payment_mode, is_return, original_sale_id, created_at',
  expenses: 'id, type, supplier_id, sale_id, is_enabled, date, created_at',
  purchase_list: 'id, supplier_id, is_done, created_at',
  logs: 'id, timestamp, action, user_id, user_name',
  partial_payments: 'id, sale_id, customer_id, received_by, payment_date',
  day_sessions: 'id, opened_by, closed_by, status, opened_at, closed_at',
  sync_queue: '++local_id, tableName, action, recordId, status, timestamp'
});
