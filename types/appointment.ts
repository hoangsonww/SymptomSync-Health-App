/**
 * Type definitions for appointment.
 */

export interface appointmentRecord {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export type appointmentStatus = 'active' | 'inactive' | 'archived';

export interface appointmentFilter {
  status?: appointmentStatus;
  startDate?: Date;
  endDate?: Date;
}
