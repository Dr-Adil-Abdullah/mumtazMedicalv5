export function getDeviceCode() {
  if (typeof window === 'undefined') return 'D';

  const ua = navigator.userAgent.toLowerCase();
  const isMobile = /android|iphone|ipad|mobile/.test(ua) || window.innerWidth < 768;
  return isMobile ? 'M' : 'D';
}

export function generateBillNumber({ sequence, staffCode = 'MM', deviceCode = getDeviceCode() }) {
  return `${staffCode.toUpperCase()}-${String(sequence).padStart(4, '0')}-${deviceCode}`;
}
