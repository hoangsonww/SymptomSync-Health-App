/**
 * Type definitions for error code.
 */

export interface errorcodeRecord {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export type errorcodeStatus = 'active' | 'inactive' | 'archived';

export interface errorcodeFilter {
  status?: errorcodeStatus;
  startDate?: Date;
  endDate?: Date;
}
