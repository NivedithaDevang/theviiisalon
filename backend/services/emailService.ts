import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || ""
  }
});

export const sendAdminOTP = async (email: string, otp: string): Promise<boolean> => {
  try {
    if (!process.env.SMTP_USER) {
      console.log(`[DEV MODE] Admin OTP for ${email}: ${otp}`);
      return true;
    }
    await transporter.sendMail({
      from: `"THE VIII SALON Security" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Your Admin Portal OTP Verification Code",
      html: `
        <div style="font-family: 'Helvetica Neue', Arial, sans-serif; background: #120407; color: #f9f5f0; padding: 30px; border-radius: 12px;">
          <h2 style="color: #e5b95f; margin-bottom: 8px;">THE VIII SALON</h2>
          <p style="color: #c4adb3; font-size: 14px;">Owner Administration Security Verification</p>
          <hr style="border: 0; border-top: 1px solid rgba(229, 185, 95, 0.2); margin: 20px 0;" />
          <p>Use the one-time passcode below to complete your administrative authentication:</p>
          <div style="background: rgba(229, 185, 95, 0.1); border: 1px solid #e5b95f; padding: 16px; border-radius: 8px; text-align: center; font-size: 28px; letter-spacing: 6px; font-weight: bold; color: #fbe6a2;">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #c4adb3; margin-top: 20px;">This OTP is valid for 5 minutes. Do not share this code with anyone.</p>
        </div>
      `
    });
    return true;
  } catch (err) {
    console.error("Email dispatch failed:", err);
    return false;
  }
};

export const sendBookingEmail = async (to: string, bookingDetails: any): Promise<void> => {
  if (!process.env.SMTP_USER) return;
  try {
    await transporter.sendMail({
      from: `"THE VIII SALON" <${process.env.SMTP_USER}>`,
      to,
      subject: `Booking Confirmed: ${bookingDetails.reference}`,
      html: `
        <div style="background: #120407; color: #f9f5f0; padding: 25px; border-radius: 8px;">
          <h2 style="color: #e5b95f;">Ritual Reserved at THE VIII</h2>
          <p>Dear ${bookingDetails.name}, your appointment has been scheduled.</p>
          <p><strong>Reference:</strong> ${bookingDetails.reference}</p>
          <p><strong>Date & Time:</strong> ${bookingDetails.date} at ${bookingDetails.time}</p>
          <p><strong>Service:</strong> ${bookingDetails.serviceName}</p>
          <p><strong>Location:</strong> 2nd Floor, No. 75, 100 Feet Ring Road, BTM 2nd Stage, Bengaluru</p>
        </div>
      `
    });
  } catch (err) {
    console.error("Booking email dispatch failed:", err);
  }
};