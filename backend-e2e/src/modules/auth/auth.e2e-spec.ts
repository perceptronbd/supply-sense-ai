import axios from 'axios';

describe('Authentication (E2E)', () => {
  const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3004';

  describe('Login Authentication', () => {
    it('should successfully authenticate with valid credentials', async () => {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: 'manager.a@supplychain.com',
        password: 'manager123',
      });

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        success: true,
        statusCode: 200,
        data: {
          access_token: expect.any(String),
          user: expect.objectContaining({
            id: expect.any(String),
            email: 'manager.a@supplychain.com',
            role: 'BRANCH_MANAGER',
            branchId: expect.any(String),
          }),
        },
      });
    });

    it('should reject authentication with invalid credentials', async () => {
      try {
        await axios.post(`${API_BASE_URL}/api/auth/login`, {
          email: 'invalid@example.com',
          password: 'wrongpassword',
        });
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as { response: { status: number } };
        expect(axiosError.response.status).toBe(401);
      }
    });

    it('should require both email and password', async () => {
      try {
        await axios.post(`${API_BASE_URL}/api/auth/login`, {
          email: 'manager.a@supplychain.com',
        });
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as { response: { status: number } };
        expect([400, 422]).toContain(axiosError.response.status);
      }
    });
  });

  describe('Protected Routes', () => {
    it('should reject requests without authentication token', async () => {
      try {
        await axios.get(`${API_BASE_URL}/api/purchase-order`);
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as { response: { status: number } };
        expect(axiosError.response.status).toBe(401);
      }
    });

    it('should reject requests with invalid authentication token', async () => {
      try {
        await axios.get(`${API_BASE_URL}/api/purchase-order`, {
          headers: {
            Authorization: 'Bearer invalid-token',
          },
        });
        fail('Should have thrown an error');
      } catch (error: unknown) {
        const axiosError = error as { response: { status: number } };
        expect(axiosError.response.status).toBe(401);
      }
    });
  });
});
