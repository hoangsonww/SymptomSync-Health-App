/**
 * Type definitions for file metadata.
 */

export interface filemetadataRecord {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export type filemetadataStatus = 'active' | 'inactive' | 'archived';

export interface filemetadataFilter {
  status?: filemetadataStatus;
  startDate?: Date;
  endDate?: Date;
}
