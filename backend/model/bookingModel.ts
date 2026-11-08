import { RowDataPacket } from "mysql2";

export interface BookingRow extends RowDataPacket {
  id: number;
  reference: string;
  user_id?: number;
  name: string;
  phone: string;
  email?: string;
  service_id: number;
  booking_date: string;
  booking_time: string;
  notes?: string;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";
  bill_amount: number;
  service_name?: string;
}