/**
 * Type definitions for health log.
 */

export interface healthlogRecord {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export type healthlogStatus = 'active' | 'inactive' | 'archived';

export interface healthlogFilter {
  status?: healthlogStatus;
  startDate?: Date;
  endDate?: Date;
}
