import axios from 'axios';

export interface TestUser {
  id: string;
  email: string;
  companyId: string;
  branchIds: string[];
  roles: string[];
  permissions: string[];
}

export interface AuthResponse {
  accessToken: string;
  user: TestUser;
}

export interface AxiosErrorResponse {
  response: {
    status: number;
    data: any;
  };
}

export class TestHelpers {
  private static readonly API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3004';

  static expectAxiosError(error: unknown, expectedStatus: number | number[]) {
    const axiosError = error as AxiosErrorResponse;
    if (axiosError.response) {
      if (Array.isArray(expectedStatus)) {
        expect(expectedStatus).toContain(axiosError.response.status);
      } else {
        expect(axiosError.response.status).toBe(expectedStatus);
      }
    } else {
      const errorMessage = (error as any)?.message || 'Unknown error';
      console.error('Network error or unexpected error structure:', errorMessage);
      throw new Error(
        `Expected HTTP error with status ${expectedStatus}, but got network error: ${errorMessage}`
      );
    }
  }

  static async loginAsBranchManager(): Promise<AuthResponse> {
    const response = await axios.post(`${TestHelpers.API_BASE_URL}/api/auth/login`, {
      email: 'admin@company002.com',
      password: 'admin123',
    });

    return {
      accessToken: response.data.data.access_token,
      user: response.data.data.user,
    };
  }

  static async loginAsProcurementSpecialist(): Promise<AuthResponse> {
    const response = await axios.post(`${TestHelpers.API_BASE_URL}/api/auth/login`, {
      email: 'admin@company002.com',
      password: 'admin123',
    });

    return {
      accessToken: response.data.data.access_token,
      user: response.data.data.user,
    };
  }

  static async loginAsSuperAdmin(): Promise<AuthResponse> {
    const response = await axios.post(`${TestHelpers.API_BASE_URL}/api/auth/login`, {
      email: 'admin@company001.com',
      password: 'admin123',
    });

    return {
      accessToken: response.data.data.access_token,
      user: response.data.data.user,
    };
  }

  static getAuthHeaders(token: string) {
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  static async getTestItemId(): Promise<string> {
    const auth = await TestHelpers.loginAsBranchManager();
    const response = await axios.get(`${TestHelpers.API_BASE_URL}/api/items`, {
      headers: TestHelpers.getAuthHeaders(auth.accessToken),
      params: { limit: 1 },
    });

    if (response.data.data?.data?.length > 0) {
      return response.data.data.data[0].id;
    }
    throw new Error('No test items available');
  }

  static async createTestUser(authToken: string, userData: any) {
    const response = await axios.post(`${TestHelpers.API_BASE_URL}/api/users`, userData, {
      headers: TestHelpers.getAuthHeaders(authToken),
    });
    return response.data;
  }

  static async createTestRole(authToken: string, roleData: any) {
    const response = await axios.post(`${TestHelpers.API_BASE_URL}/api/roles`, roleData, {
      headers: TestHelpers.getAuthHeaders(authToken),
    });
    return response.data;
  }

  static async getTestPermissions(authToken: string) {
    const response = await axios.get(`${TestHelpers.API_BASE_URL}/api/roles/permissions/all`, {
      headers: TestHelpers.getAuthHeaders(authToken),
    });
    return response.data.data;
  }

  static async cleanupUser(authToken: string, userId: string) {
    try {
      await axios.delete(`${TestHelpers.API_BASE_URL}/api/users/${userId}`, {
        headers: TestHelpers.getAuthHeaders(authToken),
      });
    } catch (error) {
      console.warn('Failed to cleanup user:', error);
    }
  }

  static async cleanupRole(authToken: string, roleId: string) {
    try {
      if (!roleId || roleId === 'undefined') {
        console.warn('Skipping cleanup for undefined role ID');
        return;
      }
      await axios.delete(`${TestHelpers.API_BASE_URL}/api/roles/${roleId}`, {
        headers: TestHelpers.getAuthHeaders(authToken),
      });
    } catch (error) {
      console.warn('Failed to cleanup role:', error);
    }
  }
}
