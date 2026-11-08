import crypto from "node:crypto";

export const generateBookingReference = (): string => {
  const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `VIII-${randomHex}`;
};