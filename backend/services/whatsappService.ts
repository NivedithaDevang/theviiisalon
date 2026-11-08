export const sendWhatsAppNotification = async (phone: string, text: string): Promise<boolean> => {
  // If integrating an official WhatsApp Cloud API / Twilio instance:
  console.log(`[WhatsApp Dispatch to ${phone}]: ${text}`);
  return true;
};