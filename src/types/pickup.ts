// src/types/pickup.ts

import { ID } from './products';

export type PickupSlotStatus = 'AVAILABLE' | 'BOOKED' | 'FULL' | 'CLOSED';

export type PickupStatus = 'PENDING' | 'PREPARING' | 'READY' | 'COLLECTED' | 'EXPIRED' | 'CANCELLED';

export type PickupTimeSlotId = 'morning' | 'noon' | 'afternoon' | 'evening';

export interface PickupSlot {
  id: ID;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  booked: number;
  status: PickupSlotStatus;
  isHoliday: boolean;
  isLunchBreak: boolean;
  notes: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface PickupSlotWithAvailability extends PickupSlot {
  available: number;
  isAvailable: boolean;
}

export interface PickupDateAvailability {
  date: string;
  slots: PickupSlotWithAvailability[];
  hasAvailableSlot: boolean;
}

export interface PickupOrderInfo {
  pickupDate: string | null;
  pickupTime: string | null;
  pickupTimeSlot: PickupTimeSlotId | null;
  pickupSlotId: ID | null;
  estimatedReadyAt: string | null;
  pickupStatus: PickupStatus | null;
}

export interface PickupValidationResult {
  isValid: boolean;
  errors: {
    date?: string;
    time?: string;
    timeSlot?: string;
    slot?: string;
  };
}

export interface PickupUIState {
  selectedDate: string | null;
  selectedTime: string | null;
  selectedTimeSlot: PickupTimeSlotId | null;
  selectedSlotId: ID | null;
  isDatePickerOpen: boolean;
  isTimePickerOpen: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface PickupFilter {
  status?: PickupStatus | 'all';
  dateFrom?: string;
  dateTo?: string;
  slotId?: ID;
}