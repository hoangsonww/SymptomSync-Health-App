/**
 * Type definitions for api response.
 */

export interface apiresponseRecord {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export type apiresponseStatus = 'active' | 'inactive' | 'archived';

export interface apiresponseFilter {
  status?: apiresponseStatus;
  startDate?: Date;
  endDate?: Date;
}
