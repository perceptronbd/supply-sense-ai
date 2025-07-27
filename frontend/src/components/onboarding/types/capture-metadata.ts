import type { ApiResponse } from '@supplysense/types';
import type { ITableDiscoverySelection } from './table-discovery-selection';

export interface ICaptureMetadataPayload extends ITableDiscoverySelection {
  companyId: string;
}

export type TCaptureMetadataResponse = ApiResponse<unknown>;
