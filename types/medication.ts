/**
 * Type definitions for medication.
 */

export interface medicationRecord {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export type medicationStatus = 'active' | 'inactive' | 'archived';

export interface medicationFilter {
  status?: medicationStatus;
  startDate?: Date;
  endDate?: Date;
}
