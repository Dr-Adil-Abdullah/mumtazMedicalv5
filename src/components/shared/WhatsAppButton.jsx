import Button from '../ui/Button';
import { canUseWhatsAppPhone, openWhatsApp } from '../../utils/whatsapp';

export default function WhatsAppButton({
  phone,
  message,
  label = 'WhatsApp',
  variant = 'secondary',
  className = '',
  onSent,
  hideIfMissing = true,
  ...props
}) {
  const canSend = canUseWhatsAppPhone(phone);

  if (!canSend && hideIfMissing) return null;

  return (
    <Button
      variant={variant}
      className={className}
      disabled={!canSend}
      onClick={() => {
        if (!canSend) return;
        const opened = openWhatsApp(phone, message);
        if (opened) onSent?.();
      }}
      {...props}
    >
      💚 {label}
    </Button>
  );
}
