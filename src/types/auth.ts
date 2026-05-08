export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  expires_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  user_type: string;
  avatar_url?: string;
  email_verified_at?: string;
  phone_verified_at?: string;
  inspector?: InspectorProfile;
}

export interface InspectorProfile {
  id: number;
  shop_name: string;
  email: string;
  name:string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  email_verified_at?: string;
  phone_verified_at?: string;
  permissions?: {
    can_manual_examination?: boolean;
  };
  created_at: string;
  updated_at: string;
  inspector_profile?: {
    id: number;
    shop_name?: string;
    inspector_address?: string;
    latitude?: number;
    longitude?: number;
    inspector_phone?: string;
    inspector_email?: string;
    image?: string;
    banner_image?: string;
    is_active: boolean;
    description?: string;
    working_hours?: WorkingHours;
    services_offered?: any;
    certification_number?: string;
    experience_years?: number;
    total_owed?: number;
    total_paid?: number;
    rating?: number;
    status_display?: string;
    country?: {
      id: number;
      name: string;
    };
    state?: {
      id: number;
      name: string;
    };
    city?: {
      id: number;
      name: string;
    };
    stats?: any;
    created_at: string;
    updated_at: string;
  };
}

export interface WorkingHours {
  monday?: TimeSlot;
  tuesday?: TimeSlot;
  wednesday?: TimeSlot;
  thursday?: TimeSlot;
  friday?: TimeSlot;
  saturday?: TimeSlot;
  sunday?: TimeSlot;
}

export interface TimeSlot {
  start: string;
  end: string;
  enabled: boolean;
}
