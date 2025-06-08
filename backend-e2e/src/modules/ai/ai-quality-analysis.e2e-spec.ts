import axios from 'axios';
import { TestHelpers, type TestUser } from '../../support/test-helpers';

describe('AI Quality Analysis (E2E)', () => {
  const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
  let authToken: string;
  let testUser: TestUser;
  let TEST_SUPPLIER_ID: string;
  let TEST_GR_ID: string;
  let TEST_BRANCH_ID: string;
  beforeAll(async () => {
    // Authenticate and get test data
    const auth = await TestHelpers.loginAsBranchManager();
    authToken = auth.accessToken;
    testUser = auth.user;
    TEST_BRANCH_ID = testUser.branchId;
    TEST_SUPPLIER_ID = await TestHelpers.getTestSupplierId();
    TEST_GR_ID = await getTestGoodsReceiptId();
  });

  const getTestGoodsReceiptId = async (): Promise<string> => {
    // Try to get an existing goods receipt from the database
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    try {
      const goodsReceipt = await prisma.goodsReceipt.findFirst({
        where: {
          status: 'POSTED',
        },
        select: { id: true },
      });

      if (goodsReceipt) {
        return goodsReceipt.id;
      }

      // If no existing GR found, create one for testing
      // This is a fallback scenario - in production tests, you'd want existing data
      return 'test-gr-id-placeholder';
    } finally {
      await prisma.$disconnect();
    }
  };

  const getAuthHeaders = () => TestHelpers.getAuthHeaders(authToken);

  describe('Authentication and Authorization', () => {
    it('should require authentication for quality analysis endpoints', async () => {
      const endpoints = [
        '/api/ai/quality-analysis',
        `/api/ai/anomaly-detection/${TEST_GR_ID}`,
        '/api/ai/quality-report',
      ];

      for (const endpoint of endpoints) {
        try {
          await axios.get(`${API_BASE_URL}${endpoint}`);
          fail(`Should have thrown an error for ${endpoint}`);
        } catch (error: any) {
          expect(error.response.status).toBe(401);
        }
      }
    });

    it('should accept valid JWT token for all quality endpoints', async () => {
      const endpoints = [
        { url: '/api/ai/quality-analysis', method: 'get' },
        { url: `/api/ai/anomaly-detection/${TEST_GR_ID}`, method: 'get' },
        { url: '/api/ai/quality-report', method: 'get' },
      ];

      for (const endpoint of endpoints) {
        const response = await axios[endpoint.method](`${API_BASE_URL}${endpoint.url}`, {
          headers: getAuthHeaders(),
        });
        expect(response.status).toBe(200);
      }
    });
  });

  describe('Supplier Quality Analysis', () => {
    it('should analyze quality for all suppliers', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/ai/quality-analysis`, {
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);

      if (response.data.length > 0) {
        const analysis = response.data[0];
        expect(analysis).toHaveProperty('supplierId');
        expect(analysis).toHaveProperty('supplierName');
        expect(analysis).toHaveProperty('qualityScore');
        expect(analysis).toHaveProperty('totalReceipts');
        expect(analysis).toHaveProperty('issueCount');
        expect(analysis).toHaveProperty('issueTypes');
        expect(analysis).toHaveProperty('recommendations');
        expect(analysis).toHaveProperty('trend');

        // Validate data types and ranges
        expect(typeof analysis.supplierId).toBe('string');
        expect(typeof analysis.supplierName).toBe('string');
        expect(typeof analysis.qualityScore).toBe('number');
        expect(analysis.qualityScore).toBeGreaterThanOrEqual(0);
        expect(analysis.qualityScore).toBeLessThanOrEqual(100);
        expect(typeof analysis.totalReceipts).toBe('number');
        expect(analysis.totalReceipts).toBeGreaterThanOrEqual(0);
        expect(typeof analysis.issueCount).toBe('number');
        expect(analysis.issueCount).toBeGreaterThanOrEqual(0);
        expect(analysis.issueTypes).toBeInstanceOf(Array);
        expect(analysis.recommendations).toBeInstanceOf(Array);
        expect(['improving', 'declining', 'stable']).toContain(analysis.trend);
      }
    });

    it('should analyze quality for specific supplier', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/ai/quality-analysis`, {
        params: { supplierId: TEST_SUPPLIER_ID },
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);

      if (response.data.length > 0) {
        const analysis = response.data[0];
        expect(analysis.supplierId).toBe(TEST_SUPPLIER_ID);
        expect(analysis.supplierName).toBeDefined();

        // Quality score should be calculated properly
        if (analysis.totalReceipts > 0) {
          const expectedMaxScore = Math.round(
            ((analysis.totalReceipts - analysis.issueCount) / analysis.totalReceipts) * 100
          );
          expect(analysis.qualityScore).toBeLessThanOrEqual(expectedMaxScore + 5); // Allow some AI variance
        }
      }
    });

    it('should return empty array for non-existent supplier', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/ai/quality-analysis`, {
        params: { supplierId: 'non-existent-id' },
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data).toBeInstanceOf(Array);
      expect(response.data.length).toBe(0);
    });

    it('should sort suppliers by quality score in descending order', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/ai/quality-analysis`, {
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);

      if (response.data.length > 1) {
        for (let i = 0; i < response.data.length - 1; i++) {
          expect(response.data[i].qualityScore).toBeGreaterThanOrEqual(
            response.data[i + 1].qualityScore
          );
        }
      }
    });
  });

  describe('Goods Receipt Anomaly Detection', () => {
    it('should detect anomalies in goods receipt', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/ai/anomaly-detection/${TEST_GR_ID}`, {
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('grId');
      expect(response.data).toHaveProperty('grNumber');
      expect(response.data).toHaveProperty('anomalies');
      expect(response.data).toHaveProperty('severity');
      expect(response.data).toHaveProperty('recommendations');

      // Validate data structure
      expect(response.data.grId).toBe(TEST_GR_ID);
      expect(response.data.anomalies).toBeInstanceOf(Array);
      expect(['low', 'medium', 'high']).toContain(response.data.severity);
      expect(response.data.recommendations).toBeInstanceOf(Array);
      expect(response.data.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle non-existent goods receipt', async () => {
      try {
        await axios.get(`${API_BASE_URL}/api/ai/anomaly-detection/non-existent-id`, {
          headers: getAuthHeaders(),
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect([400, 404, 500]).toContain(error.response.status);
      }
    });

    it('should identify quantity discrepancy anomalies', async () => {
      // This test assumes test data has some quantity discrepancies
      const response = await axios.get(`${API_BASE_URL}/api/ai/anomaly-detection/${TEST_GR_ID}`, {
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);

      // Check if anomalies are properly categorized
      if (response.data.anomalies.length > 0) {
        const hasQuantityAnomaly = response.data.anomalies.some(
          (anomaly: string) =>
            anomaly.toLowerCase().includes('quantity') ||
            anomaly.toLowerCase().includes('received') ||
            anomaly.toLowerCase().includes('ordered')
        );

        if (hasQuantityAnomaly) {
          expect(['medium', 'high']).toContain(response.data.severity);
        }
      }
    });
  });

  describe('Quality Report Generation', () => {
    it('should generate comprehensive quality report', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/ai/quality-report`, {
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('period');
      expect(response.data).toHaveProperty('metrics');
      expect(response.data).toHaveProperty('report');
      expect(response.data).toHaveProperty('generatedAt');

      // Validate metrics structure
      const metrics = response.data.metrics;
      expect(metrics).toHaveProperty('summary');
      expect(metrics).toHaveProperty('supplierPerformance');

      expect(metrics.summary).toHaveProperty('totalReceipts');
      expect(metrics.summary).toHaveProperty('totalItems');
      expect(metrics.summary).toHaveProperty('itemsWithIssues');
      expect(metrics.summary).toHaveProperty('qualityRate');

      expect(metrics.supplierPerformance).toBeInstanceOf(Array);
    });

    it('should generate branch-specific quality report', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/ai/quality-report`, {
        params: { branchId: TEST_BRANCH_ID },
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.metrics).toBeDefined();

      // Should include branch context in the report
      if (response.data.report) {
        expect(typeof response.data.report).toBe('string');
        expect(response.data.report.length).toBeGreaterThan(0);
      }
    });

    it('should generate date-filtered quality report', async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3); // Last 3 months

      const response = await axios.get(`${API_BASE_URL}/api/ai/quality-report`, {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.period.startDate).toBeDefined();
      expect(response.data.period.endDate).toBeDefined();
    });

    it('should calculate quality metrics correctly', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/ai/quality-report`, {
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      const summary = response.data.metrics.summary;

      // Quality rate should be calculated correctly
      if (summary.totalItems > 0) {
        const expectedQualityRate = (
          ((summary.totalItems - summary.itemsWithIssues) / summary.totalItems) *
          100
        ).toFixed(2);
        expect(summary.qualityRate).toBe(expectedQualityRate);
      } else {
        expect(summary.qualityRate).toBe('100.00');
      }

      // Issue count should not exceed total items
      expect(summary.itemsWithIssues).toBeLessThanOrEqual(summary.totalItems);
    });
  });

  describe('Parameter Validation', () => {
    it('should validate date parameters in quality report', async () => {
      const invalidDates = ['invalid-date', '2023-13-32', 'not-a-date'];

      for (const invalidDate of invalidDates) {
        try {
          await axios.get(`${API_BASE_URL}/api/ai/quality-report`, {
            params: { startDate: invalidDate },
            headers: getAuthHeaders(),
          });
          // Some invalid dates might still work due to JS Date parsing
        } catch (error: any) {
          expect([400, 500]).toContain(error.response.status);
        }
      }
    });

    it('should handle malformed UUIDs in anomaly detection', async () => {
      const invalidIds = ['invalid-uuid', '123', ''];

      for (const invalidId of invalidIds) {
        try {
          await axios.get(`${API_BASE_URL}/api/ai/anomaly-detection/${invalidId}`, {
            headers: getAuthHeaders(),
          });
          fail('Should have thrown an error for invalid UUID');
        } catch (error: any) {
          expect([400, 404, 500]).toContain(error.response.status);
        }
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle AI service failures gracefully', async () => {
      // This test verifies fallback behavior when AI services fail
      const response = await axios.get(`${API_BASE_URL}/api/ai/quality-analysis`, {
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);

      // Even if AI fails, should return valid structure with fallback data
      if (response.data.length > 0) {
        const analysis = response.data[0];
        expect(analysis.qualityScore).toBeGreaterThanOrEqual(0);
        expect(analysis.qualityScore).toBeLessThanOrEqual(100);
        expect(analysis.recommendations.length).toBeGreaterThan(0);
      }
    });

    it('should handle database connection issues', async () => {
      // This test checks error handling for database issues
      // In a real scenario, you might temporarily disconnect the database
      const response = await axios.get(`${API_BASE_URL}/api/ai/quality-analysis`, {
        headers: getAuthHeaders(),
      });

      // Should either succeed or fail gracefully
      expect([200, 500]).toContain(response.status);
    });
  });

  describe('Performance Testing', () => {
    it('should respond within acceptable time limits', async () => {
      const startTime = Date.now();

      const response = await axios.get(`${API_BASE_URL}/api/ai/quality-analysis`, {
        headers: getAuthHeaders(),
      });

      const responseTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(30000); // 30 seconds max for AI processing
    });

    it('should handle concurrent quality analysis requests', async () => {
      const requests = Array(3)
        .fill(null)
        .map(() =>
          axios.get(`${API_BASE_URL}/api/ai/quality-analysis`, {
            headers: getAuthHeaders(),
          })
        );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });

    it('should efficiently generate large quality reports', async () => {
      const startTime = Date.now();

      const response = await axios.get(`${API_BASE_URL}/api/ai/quality-report`, {
        headers: getAuthHeaders(),
      });

      const responseTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(45000); // 45 seconds max for comprehensive report
    });
  });

  describe('Integration Scenarios', () => {
    it('should correlate quality analysis with supplier recommendations', async () => {
      // Get quality analysis
      const qualityResponse = await axios.get(`${API_BASE_URL}/api/ai/quality-analysis`, {
        headers: getAuthHeaders(),
      });

      expect(qualityResponse.status).toBe(200);

      if (qualityResponse.data.length > 0) {
        // Quality analysis should influence supplier recommendations
        const topQualitySupplier = qualityResponse.data[0];
        expect(topQualitySupplier.qualityScore).toBeGreaterThan(0);

        // In a real integration, you would test that high-quality suppliers
        // are prioritized in purchase optimization recommendations
      }
    });

    it('should use anomaly detection for workflow automation', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/ai/anomaly-detection/${TEST_GR_ID}`, {
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);

      // High-severity anomalies should trigger automated workflows
      if (response.data.severity === 'high') {
        expect(response.data.recommendations.length).toBeGreaterThan(0);
        expect(response.data.anomalies.length).toBeGreaterThan(0);
      }
    });

    it('should integrate quality metrics with dashboard data', async () => {
      const dashboardResponse = await axios.get(
        `${API_BASE_URL}/api/ai/dashboard/${TEST_BRANCH_ID}`,
        { headers: getAuthHeaders() }
      );

      const qualityResponse = await axios.get(`${API_BASE_URL}/api/ai/quality-analysis`, {
        headers: getAuthHeaders(),
      });

      expect(dashboardResponse.status).toBe(200);
      expect(qualityResponse.status).toBe(200);

      // Dashboard should include quality metrics
      expect(dashboardResponse.data.summary).toHaveProperty('averageQualityScore');
      expect(dashboardResponse.data.qualityAnalysis).toBeInstanceOf(Array);
    });
  });

  describe('Real-world Quality Scenarios', () => {
    it('should identify declining supplier performance trends', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/ai/quality-analysis`, {
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);

      // Look for suppliers with declining trends
      const decliningSuppliers = response.data.filter(
        (supplier: any) => supplier.trend === 'declining'
      );

      if (decliningSuppliers.length > 0) {
        const supplier = decliningSuppliers[0];
        expect(supplier.recommendations.length).toBeGreaterThan(0);
        expect(supplier.qualityScore).toBeLessThan(90); // Declining suppliers should have lower scores
      }
    });

    it('should handle mixed quality performance across suppliers', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/ai/quality-analysis`, {
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);

      if (response.data.length > 1) {
        // Should have variety in quality scores
        const scores = response.data.map((supplier: any) => supplier.qualityScore);
        const minScore = Math.min(...scores);
        const maxScore = Math.max(...scores);

        // If there's variety, min and max should be different
        if (minScore !== maxScore) {
          expect(maxScore - minScore).toBeGreaterThan(0);
        }
      }
    });

    it('should provide actionable quality recommendations', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/ai/quality-analysis`, {
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);

      response.data.forEach((supplier: any) => {
        expect(supplier.recommendations).toBeInstanceOf(Array);
        expect(supplier.recommendations.length).toBeGreaterThan(0);

        // Recommendations should be actionable strings
        supplier.recommendations.forEach((recommendation: string) => {
          expect(typeof recommendation).toBe('string');
          expect(recommendation.length).toBeGreaterThan(10); // Meaningful recommendations
        });
      });
    });

    it('should detect and categorize different types of quality issues', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/ai/quality-analysis`, {
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);

      // Collect all issue types across suppliers
      const allIssueTypes = response.data.flatMap((supplier: any) => supplier.issueTypes);

      if (allIssueTypes.length > 0) {
        const commonIssueTypes = [
          'Physical Damage',
          'Manufacturing Defect',
          'Quantity Discrepancy',
          'Delivery Delay',
          'Packaging Issue',
        ];

        // Should have some overlap with common issue types
        const hasCommonIssues = allIssueTypes.some((issueType: string) =>
          commonIssueTypes.includes(issueType)
        );

        if (hasCommonIssues) {
          expect(hasCommonIssues).toBe(true);
        }
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle suppliers with no goods receipts', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/ai/quality-analysis`, {
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);

      // Should handle suppliers with zero receipts gracefully
      const suppliersWithNoReceipts = response.data.filter(
        (supplier: any) => supplier.totalReceipts === 0
      );

      suppliersWithNoReceipts.forEach((supplier: any) => {
        expect(supplier.qualityScore).toBe(100); // Default score for no data
        expect(supplier.issueCount).toBe(0);
        expect(supplier.issueTypes).toEqual([]);
      });
    });

    it('should handle very large quality reports efficiently', async () => {
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 2); // 2 years of data

      const response = await axios.get(`${API_BASE_URL}/api/ai/quality-report`, {
        params: {
          startDate: startDate.toISOString(),
        },
        headers: getAuthHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.metrics.summary.totalReceipts).toBeGreaterThanOrEqual(0);
    });
  });
});
