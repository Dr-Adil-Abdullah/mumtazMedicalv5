function isSequential(pin) {
  const digits = pin.split('').map(Number);
  let ascending = true;
  let descending = true;

  for (let index = 1; index < digits.length; index += 1) {
    if (digits[index] !== digits[index - 1] + 1) ascending = false;
    if (digits[index] !== digits[index - 1] - 1) descending = false;
  }

  return ascending || descending;
}

function isRepeated(pin) {
  return /^([0-9])\1+$/.test(pin);
}

export function validatePin(pin) {
  if (!/^\d{4}$/.test(pin)) {
    return 'PIN must be exactly 4 digits.';
  }

  if (isRepeated(pin)) {
    return 'Repeated PINs like 1111 or 2222 are not allowed.';
  }

  if (isSequential(pin)) {
    return 'Sequential PINs like 1234 or 4321 are not allowed.';
  }

  return null;
}
