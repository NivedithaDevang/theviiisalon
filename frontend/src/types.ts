export interface ServiceItem {
  name: string;
  price: string;
  image: string;
  description?: string;
}

export type Booking = { reference: string; name: string; phone: string; date: string; time: string; service: ServiceItem; status: string };
