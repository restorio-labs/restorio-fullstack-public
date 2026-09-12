export interface Restaurant {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  address: Address;
  contactInfo: ContactInfo;
  openingHours: OpeningHours[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface ContactInfo {
  phone?: string;
  email?: string;
  website?: string;
}

export interface OpeningHours {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface Table {
  id: string;
  restaurantId: string;
  number: string;
  capacity: number;
  qrCode: string;
  isActive: boolean;
}
