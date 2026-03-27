/**
 * Type definitions for reminder.
 */

export interface reminderRecord {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export type reminderStatus = 'active' | 'inactive' | 'archived';

export interface reminderFilter {
  status?: reminderStatus;
  startDate?: Date;
  endDate?: Date;
}
