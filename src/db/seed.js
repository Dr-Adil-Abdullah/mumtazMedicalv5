import { db } from './index';
import { hashPin } from '../utils/crypto';
import { DEFAULT_SETTINGS } from '../constants/defaults';
import { enqueueSync } from './queue';

async function seedDemoCatalog(now) {
  const demoProducts = [
    {
      id: crypto.randomUUID(),
      name: 'Panadol Extra',
      barcode: '8901234567001',
      brand: 'GSK',
      category: 'Pain Relief',
      unit: '10 tablets',
      is_active: true,
      created_at: now,
      updated_at: now,
      batch: {
        id: crypto.randomUUID(),
        batch_number: 'PAN-001',
        purchase_price: 90,
        sale_price: 120,
        quantity: 24,
        expiry_date: '2027-12-31',
        low_stock_alert: 10,
        near_end_alert: 5,
        is_active: true,
        created_at: now
      }
    },
    {
      id: crypto.randomUUID(),
      name: 'Augmentin 625mg',
      barcode: '8901234567002',
      brand: 'GSK',
      category: 'Antibiotic',
      unit: '6 tablets',
      is_active: true,
      created_at: now,
      updated_at: now,
      batch: {
        id: crypto.randomUUID(),
        batch_number: 'AUG-003',
        purchase_price: 420,
        sale_price: 520,
        quantity: 12,
        expiry_date: '2027-08-30',
        low_stock_alert: 5,
        near_end_alert: 3,
        is_active: true,
        created_at: now
      }
    },
    {
      id: crypto.randomUUID(),
      name: 'Rigix Syrup',
      barcode: '8901234567003',
      brand: 'Getz',
      category: 'Syrup',
      unit: '60ml',
      is_active: true,
      created_at: now,
      updated_at: now,
      batch: {
        id: crypto.randomUUID(),
        batch_number: 'RGX-011',
        purchase_price: 115,
        sale_price: 160,
        quantity: 18,
        expiry_date: '2027-05-15',
        low_stock_alert: 6,
        near_end_alert: 3,
        is_active: true,
        created_at: now
      }
    }
  ];

  for (const item of demoProducts) {
    const { batch, ...product } = item;
    await db.products.add(product);
    await db.product_batches.add({ ...batch, product_id: product.id });
    await enqueueSync({ tableName: 'products', action: 'INSERT', recordId: product.id, data: product });
    await enqueueSync({ tableName: 'product_batches', action: 'INSERT', recordId: batch.id, data: { ...batch, product_id: product.id } });
  }

  await db.logs.add({
    id: crypto.randomUUID(),
    action: 'SEED_PRODUCTS',
    user_name: 'System',
    details: { count: demoProducts.length },
    timestamp: now
  });
}

export async function ensureCoreData() {
  const settings = await db.settings.get(1);
  if (!settings) return;

  const patch = {};
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    if (settings[key] === undefined) {
      patch[key] = value;
    }
  }

  if (Object.keys(patch).length) {
    patch.updated_at = new Date().toISOString();
    await db.settings.update(1, patch);
  }

  const productCount = await db.products.count();
  if (productCount === 0) {
    await seedDemoCatalog(new Date().toISOString());
  }
}

export async function seedInitialData() {
  const existingSettings = await db.settings.get(1);

  if (existingSettings) {
    await ensureCoreData();
    return existingSettings;
  }

  const now = new Date().toISOString();
  const ownerId = crypto.randomUUID();

  await db.transaction(
    'rw',
    db.settings,
    db.staff,
    db.products,
    db.product_batches,
    db.logs,
    db.sync_queue,
    async () => {
      await db.settings.add({
        ...DEFAULT_SETTINGS,
        updated_at: now
      });

      await db.staff.add({
        id: ownerId,
        staff_id: 'STAFF-001',
        name: 'Owner',
        role: 'owner',
        phone: '',
        short_code: 'MM',
        pin_hash: await hashPin('1234'),
        is_active: true,
        created_at: now,
        updated_at: now,
        must_change_pin: true
      });

      await db.logs.add({
        id: crypto.randomUUID(),
        action: 'SEED',
        user_name: 'System',
        details: {
          note: 'Bootstrap owner and default settings created.',
          staff_id: 'STAFF-001'
        },
        timestamp: now
      });

      await seedDemoCatalog(now);
    }
  );

  return db.settings.get(1);
}
