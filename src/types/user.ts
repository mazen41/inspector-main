// Re-export User and InspectorProfile from auth types
export type { User, InspectorProfile, WorkingHours, TimeSlot } from './auth';
import type { WorkingHours } from './auth';

export interface ProfileUpdateData {
  name?: string;
  email?: string;
  phone?: string;
  bio?: string;
  shop_name?: string;
  qualifications?: string;
  service_areas?: string[];
  specializations?: string[];
  working_hours?: WorkingHours;
  is_available?: boolean;
}

export interface PasswordChangeData {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface Country {
  id: number;
  name: string;
}

export interface State {
  id: number;
  name: string;
  country_id: number;
}

export interface City {
  id: number;
  name: string;
  state_id: number;
}

export interface BusinessSettings {
  shop_name: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  country_id?: number;
  state_id?: number;
  city_id?: number;
  phone?: string;
  email?: string;
  service_areas: string[];
  specializations: string[];
  working_hours: WorkingHours;
  hourly_rate?: number;
  travel_radius?: number;
}