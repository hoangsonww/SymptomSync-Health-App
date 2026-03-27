/**
 * Type definitions for user profile.
 */

export interface userprofileRecord {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export type userprofileStatus = 'active' | 'inactive' | 'archived';

export interface userprofileFilter {
  status?: userprofileStatus;
  startDate?: Date;
  endDate?: Date;
}
