/**
 * Type definitions for chat message.
 */

export interface chatmessageRecord {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export type chatmessageStatus = 'active' | 'inactive' | 'archived';

export interface chatmessageFilter {
  status?: chatmessageStatus;
  startDate?: Date;
  endDate?: Date;
}
