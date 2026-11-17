import nodemailer from "nodemailer";
import { db } from "../config/database.js";
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 465,
    secure: process.env.SMTP_SECURE !== "false",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
async function logNotification(params) {
    try {
        await db.query(`INSERT INTO notification_logs
        (booking_id, channel, recipient, event_name, status, provider_message_id, error_message)
       VALUES (?, 'EMAIL', ?, ?, ?, ?, ?)`, [
            params.bookingId ?? null,
            params.recipient,
            params.eventName,
            params.status,
            params.messageId ?? null,
            params.errorMessage ?? null,
        ]);
    }
    catch (logErr) {
        console.error("Failed to write notification log:", logErr);
    }
}
function escapeHtml(value) {
    return value.replace(/[&<>"']/g, (character) => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
        };
        return entities[character];
    });
}
async function deliverBookingEmail(params) {
    try {
        const info = await transporter.sendMail({
            from: `"THE VIII SALON" <${process.env.SMTP_USER}>`,
            to: params.recipient,
            subject: params.subject,
            html: params.html,
            text: params.text,
        });
        await logNotification({
            bookingId: params.bookingId,
            recipient: params.recipient,
            eventName: params.eventName,
            status: "SENT",
            messageId: info.messageId,
        });
        return "SENT";
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown SMTP error";
        console.error(`Booking email to ${params.recipient} failed:`, errorMessage);
        await logNotification({
            bookingId: params.bookingId,
            recipient: params.recipient,
            eventName: params.eventName,
            status: "FAILED",
            errorMessage,
        });
        return "FAILED";
    }
}
export async function sendBookingEmails(payload) {
    const adminRecipient = process.env.ADMIN_NOTIFY_EMAIL || process.env.ADMIN_EMAIL || process.env.SMTP_USER || "";
    const delivery = {
        client: payload.clientEmail ? "FAILED" : "NOT_PROVIDED",
        admin: "FAILED",
    };
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        const errorMessage = "SMTP credentials are missing; booking emails could not be sent.";
        console.error(errorMessage);
        if (payload.clientEmail) {
            await logNotification({
                bookingId: payload.bookingId,
                recipient: payload.clientEmail,
                eventName: "BOOKING_REQUEST_CLIENT",
                status: "FAILED",
                errorMessage,
            });
        }
        if (adminRecipient) {
            await logNotification({
                bookingId: payload.bookingId,
                recipient: adminRecipient,
                eventName: "BOOKING_REQUEST_ADMIN",
                status: "FAILED",
                errorMessage,
            });
        }
        return delivery;
    }
    if (!adminRecipient) {
        console.error("No admin email configured; booking email could not be delivered to the salon.");
        delivery.admin = "FAILED";
    }
    const escaped = {
        reference: escapeHtml(payload.reference),
        name: escapeHtml(payload.name),
        phone: escapeHtml(payload.phone),
        email: escapeHtml(payload.clientEmail || "Not provided"),
        serviceName: escapeHtml(payload.serviceName),
        date: escapeHtml(payload.date),
        time: escapeHtml(payload.time),
        notes: escapeHtml(payload.notes || "None"),
        services: payload.services
            .map((service) => `<li>${escapeHtml(service.name)} — ₹${Number(service.price).toLocaleString("en-IN")}</li>`)
            .join(""),
        totalPrice: `₹${Number(payload.totalPrice).toLocaleString("en-IN")}`,
    };
    const details = `
    <table style="width:100%; border-collapse:collapse; font-size:14px;">
      <tr><td style="padding:6px 0; color:#b8aba0;">Reference:</td><td><strong>${escaped.reference}</strong></td></tr>
      <tr><td style="padding:6px 0; color:#b8aba0;">Client:</td><td><strong>${escaped.name}</strong></td></tr>
      <tr><td style="padding:6px 0; color:#b8aba0;">Phone:</td><td>${escaped.phone}</td></tr>
      <tr><td style="padding:6px 0; color:#b8aba0;">Email:</td><td>${escaped.email}</td></tr>
      <tr><td style="padding:6px 0; color:#b8aba0;">Services:</td><td><ul>${escaped.services || `<li>${escaped.serviceName}</li>`}</ul></td></tr>
      <tr><td style="padding:6px 0; color:#b8aba0;">Date &amp; time:</td><td><strong>${escaped.date} at ${escaped.time}</strong></td></tr>
      <tr><td style="padding:6px 0; color:#b8aba0;">Estimated total:</td><td><strong>${escaped.totalPrice}</strong></td></tr>
      <tr><td style="padding:6px 0; color:#b8aba0;">Notes:</td><td>${escaped.notes}</td></tr>
    </table>
  `;
    const detailsText = [
        `Booking reference: ${payload.reference}`,
        `Client: ${payload.name}`,
        `Phone: ${payload.phone}`,
        `Email: ${payload.clientEmail || "Not provided"}`,
        "Services:",
        ...payload.services.map((service) => `- ${service.name}: ₹${Number(service.price).toLocaleString("en-IN")}`),
        `Date and time: ${payload.date} at ${payload.time}`,
        `Estimated total: ₹${Number(payload.totalPrice).toLocaleString("en-IN")}`,
        `Notes: ${payload.notes || "None"}`,
    ].join("\n");
    const clientHtml = `
    <div style="font-family:Arial,sans-serif; background:#14090c; color:#f6efe6; padding:32px; border-radius:16px; max-width:560px; margin:auto; border:1px solid #d8b467;">
      <p style="letter-spacing:3px; font-size:11px; color:#d8b467;">THE VIII UNISEX SALON • BENGALURU</p>
      <h1 style="font-size:26px; font-weight:normal; color:#fbf6ef;">Your appointment request is received.</h1>
      <p style="font-size:15px; line-height:1.6; color:#dcd2c8;">Thank you for choosing THE VIII SALON. Our salon desk will reach out shortly to confirm your slot.</p>
      ${details}
      <p style="font-size:13px; color:#a89b90;">BTM Layout 2nd Stage, Bengaluru • +91 63624 29259</p>
    </div>
  `;
    const clientText = `Your appointment request is received.\n\nThank you for choosing THE VIII SALON. Our salon desk will reach out shortly to confirm your slot.\n\n${detailsText}\n\nBTM Layout 2nd Stage, Bengaluru • +91 63624 29259`;
    const adminHtml = `
    <div style="font-family:Arial,sans-serif; background:#1b0d11; color:#f6efe6; padding:28px; border-radius:14px; max-width:560px; margin:auto; border:1px solid #d8b467;">
      <p style="letter-spacing:2px; font-size:11px; color:#d8b467;">NEW BOOKING ALERT</p>
      <h2 style="color:#fbf6ef;">New Appointment Request — ${escaped.reference}</h2>
      ${details}
    </div>
  `;
    const adminText = `New appointment request\n\n${detailsText}`;
    const sends = [];
    if (payload.clientEmail) {
        sends.push(deliverBookingEmail({
            bookingId: payload.bookingId,
            recipient: payload.clientEmail,
            eventName: "BOOKING_REQUEST_CLIENT",
            subject: `Appointment Request Received (${payload.reference}) — THE VIII SALON`,
            html: clientHtml,
            text: clientText,
        }).then((status) => {
            delivery.client = status;
        }));
    }
    if (adminRecipient) {
        sends.push(deliverBookingEmail({
            bookingId: payload.bookingId,
            recipient: adminRecipient,
            eventName: "BOOKING_REQUEST_ADMIN",
            subject: `New Booking: ${payload.name} (${payload.date} at ${payload.time}) — ${payload.reference}`,
            html: adminHtml,
            text: adminText,
        }).then((status) => {
            delivery.admin = status;
        }));
    }
    await Promise.all(sends);
    return delivery;
}
//# sourceMappingURL=emailService.js.map