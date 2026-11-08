import { RowDataPacket, ResultSetHeader } from "mysql2";

export interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  google_id?: string;
  avatar?: string;
  role: "client" | "admin";
  admin_otp_hash?: string;
  admin_otp_expires?: Date;
  created_at: Date;
  updated_at: Date;
}