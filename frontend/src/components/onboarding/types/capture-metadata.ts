import type { ApiResponse } from '@supplysense/types';
import type { ITableDiscoverySelection } from './table-discovery-selection';

export interface ICaptureMetadataPayload extends ITableDiscoverySelection {
  companyId: string;
}

export interface IGeneratedMetadata {
  tableName: string;
  friendlyLabel: string;
  purpose: string;
  updateFrequency: string;
  sampleQuestions: string[];
  dbConnectionId: string;
}

export interface ICapturedMetadata {
  metadata: {
    connectionId: string;
    connectionTitle: string;
    generatedMetadata: IGeneratedMetadata[];
  };
}

export type TCaptureMetadataResponse = ApiResponse<ICapturedMetadata>;

export interface ISaveMetadataPayload {
  companyId: string;
  payload: {
    dbConnectionId: string;
    tableName: string;
    friendlyLabel: string;
    purpose: string;
    updateFrequency: string;
    dataSensitivity: string;
    sampleQuestions: string[];
  };
}
