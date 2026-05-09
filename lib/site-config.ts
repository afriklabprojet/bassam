const sanitizePhoneNumber = (value?: string) => value?.replaceAll(/\D/gu, '') ?? '';

const whatsappNumber = sanitizePhoneNumber(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER);
const supportPhone = sanitizePhoneNumber(process.env.NEXT_PUBLIC_SUPPORT_PHONE);

export const supportConfig = {
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'contact@vip-parfumerie-bar.com',
  whatsappNumber,
  supportPhone,
  phoneDisplay: process.env.NEXT_PUBLIC_SUPPORT_PHONE_DISPLAY || '',
  whatsappDisplay: process.env.NEXT_PUBLIC_WHATSAPP_DISPLAY || '',
  social: {
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || '',
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL || '',
    tiktok: process.env.NEXT_PUBLIC_TIKTOK_URL || '',
  },
};

export function hasWhatsAppSupport() {
  return supportConfig.whatsappNumber.length > 0;
}

export function buildWhatsAppHref(message: string) {
  if (!hasWhatsAppSupport()) {
    return '/contact';
  }

  return `https://wa.me/${supportConfig.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export function getSupportPhoneHref() {
  if (!supportConfig.supportPhone) {
    return '';
  }

  return `tel:+${supportConfig.supportPhone}`;
}
