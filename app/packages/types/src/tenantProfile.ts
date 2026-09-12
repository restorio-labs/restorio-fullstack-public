export interface TenantProfile {
  id: string;
  tenantId: string;

  nip: string;
  companyName: string;
  logo: string | null;

  contactEmail: string;
  phone: string;

  addressStreetName: string;
  addressStreetNumber: string;
  addressCity: string;
  addressPostalCode: string;
  addressCountry: string;

  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string | null;
  ownerPhone: string | null;

  contactPersonFirstName: string | null;
  contactPersonLastName: string | null;
  contactPersonEmail: string | null;
  contactPersonPhone: string | null;

  socialFacebook: string | null;
  socialInstagram: string | null;
  socialTiktok: string | null;
  socialWebsite: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface TenantLogoUploadPresignRequest {
  contentType: string;
  fileName?: string | null;
}

export interface TenantLogoUploadResponse {
  uploadUrl: string;
  objectKey: string;
}

export interface TenantLogoViewPresignResponse {
  url: string;
}

export interface ProfileFormData {
  nip: string;
  companyName: string;
  contactEmail: string;
  phone: string;
  addressStreetName: string;
  addressStreetNumber: string;
  addressCity: string;
  addressPostalCode: string;
  addressCountry: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  ownerPhone: string;
  contactPersonFirstName: string;
  contactPersonLastName: string;
  contactPersonEmail: string;
  contactPersonPhone: string;
  socialFacebook: string;
  socialInstagram: string;
  socialTiktok: string;
  socialWebsite: string;
}

export interface CreateTenantProfileRequest {
  nip: string;
  company_name: string;
  logo_upload_key?: string | null;

  contact_email: string;
  phone: string;

  address_street_name: string;
  address_street_number: string;
  address_city: string;
  address_postal_code: string;
  address_country?: string;

  owner_first_name: string;
  owner_last_name: string;
  owner_email?: string | null;
  owner_phone?: string | null;

  contact_person_first_name?: string | null;
  contact_person_last_name?: string | null;
  contact_person_email?: string | null;
  contact_person_phone?: string | null;

  social_facebook?: string | null;
  social_instagram?: string | null;
  social_tiktok?: string | null;
  social_website?: string | null;
}
