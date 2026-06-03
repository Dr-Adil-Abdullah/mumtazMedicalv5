import { formatCurrency } from './currency';

function digitsOnly(value = '') {
  return String(value).replace(/\D/g, '');
}

export function normalizePakistanPhone(phone = '') {
  const digits = digitsOnly(phone);
  if (!digits) return '';

  if (digits.startsWith('92') && digits.length >= 12) {
    return digits;
  }

  if (digits.startsWith('03') && digits.length === 11) {
    return `92${digits.slice(1)}`;
  }

  if (digits.startsWith('3') && digits.length === 10) {
    return `92${digits}`;
  }

  if (digits.length >= 10 && digits.length <= 15) {
    return digits;
  }

  return '';
}

export function canUseWhatsAppPhone(phone = '') {
  return Boolean(normalizePakistanPhone(phone));
}

export function createWhatsAppLink(phone, message = '') {
  const normalized = normalizePakistanPhone(phone);
  if (!normalized) return '';
  const encodedMessage = encodeURIComponent(String(message || '').trim());
  return `https://wa.me/${normalized}${encodedMessage ? `?text=${encodedMessage}` : ''}`;
}

export function openWhatsApp(phone, message = '') {
  const link = createWhatsAppLink(phone, message);
  if (!link) return false;
  window.open(link, '_blank', 'noopener,noreferrer');
  return true;
}

export function buildPendingReminderMessage({ shopName, customerName, balance, dueDate, currency = 'Rs.' }) {
  return [
    `السلام علیکم ${customerName || 'محترم کسٹمر'},`,
    `${shopName || 'Mumtaz Medical'} کی طرف سے یاددہانی۔`,
    `آپ پر واجب الادا رقم: ${formatCurrency(balance || 0, currency)}`,
    dueDate ? `ادائیگی کی تاریخ: ${dueDate}` : 'براہِ کرم جلد ادائیگی کر دیں۔',
    'شکریہ'
  ].join('\n');
}

export function buildBillSummaryMessage({ sale, settings = {}, customerPhone = '' }) {
  if (!sale) return '';

  const customerLabel = sale.customer_name || (customerPhone ? 'محترم کسٹمر' : 'Walk-in Customer');
  const lines = [
    `السلام علیکم ${customerLabel},`,
    `${settings.shop_name || 'Mumtaz Medical'} کی طرف سے آپ کے بل کی تفصیل:`,
    `بل نمبر: ${sale.bill_number}`,
    `تاریخ: ${new Date(sale.created_at).toLocaleString()}`,
    `کل رقم: ${formatCurrency(sale.total || 0, settings.currency)}`,
    `ادا شدہ: ${formatCurrency(sale.amount_paid || 0, settings.currency)}`
  ];

  if (sale.payment_mode === 'pending') {
    lines.push(`بقایا: ${formatCurrency(sale.balance_owed || 0, settings.currency)}`);
    if (sale.payback_date) lines.push(`ادائیگی کی تاریخ: ${sale.payback_date}`);
  } else {
    lines.push(`واپس رقم: ${formatCurrency(sale.return_amount || 0, settings.currency)}`);
  }

  if (sale.loyalty_points_awarded) {
    lines.push(`لائلٹی پوائنٹس: +${sale.loyalty_points_awarded}`);
  }

  lines.push('شکریہ');
  return lines.join('\n');
}

export function buildSupplierMessage({ shopName, supplierName }) {
  return [
    `السلام علیکم ${supplierName || 'Supplier'},`,
    `${shopName || 'Mumtaz Medical'} سے رابطہ کیا جا رہا ہے۔`,
    'براہِ کرم دستیابی / سپلائی کے بارے میں جواب دیں۔',
    'شکریہ'
  ].join('\n');
}

export function buildStaffMessage({ shopName, staffName, roleLabel }) {
  return [
    `السلام علیکم ${staffName || 'Staff'},`,
    `${shopName || 'Mumtaz Medical'} سے رابطہ کیا جا رہا ہے۔`,
    roleLabel ? `رول: ${roleLabel}` : '',
    'براہِ کرم سہولت کے مطابق جواب دیں۔',
    'شکریہ'
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildCustomerMessage({ shopName, customerName, pendingAmount = 0, currency = 'Rs.' }) {
  if (pendingAmount > 0) {
    return buildPendingReminderMessage({
      shopName,
      customerName,
      balance: pendingAmount,
      currency
    });
  }

  return [
    `السلام علیکم ${customerName || 'محترم کسٹمر'},`,
    `${shopName || 'Mumtaz Medical'} کی طرف سے سلام۔`,
    'آپ کے تعاون کا شکریہ۔',
    'کسی بھی ضرورت کے لیے اسی نمبر پر رابطہ کریں۔'
  ].join('\n');
}
