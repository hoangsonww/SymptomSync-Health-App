/**
 * Type definitions for notification.
 */

export interface notificationRecord {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export type notificationStatus = 'active' | 'inactive' | 'archived';

export interface notificationFilter {
  status?: notificationStatus;
  startDate?: Date;
  endDate?: Date;
}
