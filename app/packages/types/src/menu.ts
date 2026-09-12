export interface TenantMenuItem {
  name: string;
  price: number;
  promoted: boolean;
  desc: string;
  tags: string[];
  isAvailable: boolean;
  imageUrl?: string | null;
}

export interface TenantMenuCategory {
  name: string;
  order: number;
  items: TenantMenuItem[];
}

export interface TenantMenu {
  menu: Record<string, Record<string, unknown>>;
  categories: TenantMenuCategory[];
  updatedAt?: string;
}

export interface SaveTenantMenuPayload {
  categories: TenantMenuCategory[];
}
