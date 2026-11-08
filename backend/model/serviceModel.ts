import { RowDataPacket } from "mysql2";

export interface ServiceRow extends RowDataPacket {
  id: number;
  category_id: number;
  sub_category: string;
  name: string;
  price: number;
  duration: number;
  description?: string;
  image?: string;
  featured: boolean;
  is_active: boolean;
  category_name?: string;
}