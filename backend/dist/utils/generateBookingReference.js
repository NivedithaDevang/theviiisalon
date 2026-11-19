import crypto from "node:crypto";
export const generateBookingReference = () => {
    const randomHex = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `VIII-${randomHex}`;
};
//# sourceMappingURL=generateBookingReference.js.map