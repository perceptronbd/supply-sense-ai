import axios from 'axios';
import { TestHelpers, type TestUser } from '../../support/test-helpers';

describe('AI Workflow Automation (E2E)', () => {
  const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
  let authToken: string;
  let testUser: TestUser;
  let TEST_BRANCH_ID: string;

  beforeAll(async () => {
    // Authenticate and get test data
    const auth = await TestHelpers.loginAsBranchManager();
    authToken = auth.accessToken;
    testUser = auth.user;
    TEST_BRANCH_ID = testUser.branchId;
  });

  const getAuthHeaders = () => TestHelpers.getAuthHeaders(authToken);

  describe('Authentication and Authorization', () => {
    it('should require authentication for auto-approval evaluation', async () => {
      try {
        await axios.post(`${API_BASE_URL}/api/ai/evaluate-auto-approval`, {
          workflowType: 'purchase-request',
          entityId: 'test-id',
          amount: 1000,
        });
        fail('Should have thrown 401 error');
      } catch (error) {
        expect(error.response?.status).toBe(401);
      }
    });

    it('should require authentication for workflow optimization', async () => {
      try {
        await axios.post(`${API_BASE_URL}/api/ai/optimize-workflow`, {
          workflowType: 'purchase-order',
          currentSteps: ['manager_approval', 'finance_approval'],
        });
        fail('Should have thrown 401 error');
      } catch (error) {
        expect(error.response?.status).toBe(401);
      }
    });

    it('should require authentication for document routing', async () => {
      try {
        await axios.post(`${API_BASE_URL}/api/ai/route-document`, {
          documentType: 'purchase-request',
          documentId: 'test-id',
          priority: 'high',
        });
        fail('Should have thrown 401 error');
      } catch (error) {
        expect(error.response?.status).toBe(401);
      }
    });

    it('should require authentication for workflow insights', async () => {
      try {
        await axios.get(`${API_BASE_URL}/api/ai/workflow-insights`);
        fail('Should have thrown 401 error');
      } catch (error) {
        expect(error.response?.status).toBe(401);
      }
    });
  });
  describe('Auto-Approval Evaluation', () => {
    it('should evaluate purchase request for auto-approval', async () => {
      const purchaseRequestId = await TestHelpers.createApprovedPurchaseRequest(
        authToken,
        TEST_BRANCH_ID,
        {
          title: 'Test PR for Auto-Approval',
          description: 'Testing auto-approval evaluation',
          requiredDate: '2025-07-01T10:00:00Z',
          justification: 'Testing auto-approval AI',
        }
      );

      const response = await axios.post(
        `${API_BASE_URL}/api/ai/evaluate-auto-approval`,
        {
          workflowType: 'purchase-request',
          entityId: purchaseRequestId,
          amount: 1500,
          priority: 'medium',
        },
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        canAutoApprove: expect.any(Boolean),
        confidence: expect.any(Number),
        reasoning: expect.any(String),
        riskFactors: expect.arrayContaining([
          expect.objectContaining({
            factor: expect.any(String),
            severity: expect.stringMatching(/^(low|medium|high)$/),
            description: expect.any(String),
          }),
        ]),
        requiredApprovals: expect.arrayContaining([
          expect.objectContaining({
            role: expect.any(String),
            reason: expect.any(String),
          }),
        ]),
        alternativeActions: expect.arrayContaining([
          expect.objectContaining({
            action: expect.any(String),
            description: expect.any(String),
          }),
        ]),
      });
      expect(response.data.confidence).toBeGreaterThanOrEqual(0);
      expect(response.data.confidence).toBeLessThanOrEqual(1);
    });

    it('should evaluate purchase order for auto-approval with complex criteria', async () => {
      const purchaseOrder = await TestHelpers.createPurchaseOrder(authToken, TEST_BRANCH_ID, {
        title: 'High Value PO Test',
        notes: 'Testing high value PO auto-approval',
      });

      const response = await axios.post(
        `${API_BASE_URL}/api/ai/evaluate-auto-approval`,
        {
          workflowType: 'purchase-order',
          entityId: purchaseOrder.id,
          amount: 50000,
          priority: 'high',
          supplierRating: 4.2,
          urgency: 'urgent',
        },
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);
      expect(response.data.canAutoApprove).toBe(false); // High amount should require manual approval
      expect(response.data.riskFactors.length).toBeGreaterThan(0);
      expect(response.data.requiredApprovals).toContainEqual(
        expect.objectContaining({
          role: 'financial_controller',
        })
      );
    });

    it('should handle material requisition auto-approval evaluation', async () => {
      // Since createMaterialRequisition doesn't exist, we'll use a mock ID for testing
      const materialRequisitionId = 'mock-material-requisition-id';

      const response = await axios.post(
        `${API_BASE_URL}/api/ai/evaluate-auto-approval`,
        {
          workflowType: 'material-requisition',
          entityId: materialRequisitionId,
          amount: 500,
          department: 'production',
        },
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('canAutoApprove');
      expect(response.data).toHaveProperty('confidence');
      expect(response.data).toHaveProperty('reasoning');
    });
  });

  describe('Workflow Optimization', () => {
    it('should optimize purchase request workflow', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/api/ai/optimize-workflow`,
        {
          workflowType: 'purchase-request',
          currentSteps: [
            'submission',
            'department_approval',
            'manager_approval',
            'finance_approval',
            'final_approval',
          ],
          historicalData: {
            averageProcessingTime: 72, // hours
            bottleneckSteps: ['finance_approval'],
            rejectionRate: 0.15,
          },
        },
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        optimizedSteps: expect.arrayContaining([
          expect.objectContaining({
            step: expect.any(String),
            order: expect.any(Number),
            estimatedTime: expect.any(Number),
            automation: expect.objectContaining({
              canAutomate: expect.any(Boolean),
              conditions: expect.any(Array),
            }),
          }),
        ]),
        improvements: expect.arrayContaining([
          expect.objectContaining({
            type: expect.stringMatching(
              /^(time_reduction|automation|parallel_processing|elimination)$/
            ),
            description: expect.any(String),
            impact: expect.objectContaining({
              timeReduction: expect.any(Number),
              efficiencyGain: expect.any(Number),
            }),
          }),
        ]),
        estimatedImpact: expect.objectContaining({
          timeReduction: expect.any(Number),
          efficiencyGain: expect.any(Number),
          costSavings: expect.any(Number),
        }),
        riskAssessment: expect.objectContaining({
          overallRisk: expect.stringMatching(/^(low|medium|high)$/),
          risks: expect.any(Array),
        }),
      });
    });

    it('should suggest parallel processing for complex workflows', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/api/ai/optimize-workflow`,
        {
          workflowType: 'purchase-order',
          currentSteps: [
            'creation',
            'technical_review',
            'financial_review',
            'legal_review',
            'final_approval',
          ],
          constraints: {
            maxParallelSteps: 3,
            criticalPath: ['creation', 'final_approval'],
          },
        },
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);
      const hasParallelSteps = response.data.optimizedSteps.some(
        (step) => step.parallelWith && step.parallelWith.length > 0
      );
      expect(hasParallelSteps).toBe(true);
    });

    it('should handle workflow optimization for manufacturing', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/api/ai/optimize-workflow`,
        {
          workflowType: 'manufacturing-order',
          currentSteps: [
            'planning',
            'material_preparation',
            'production',
            'quality_control',
            'packaging',
            'dispatch',
          ],
          constraints: {
            resourceLimitations: ['machinery', 'workforce'],
            qualityRequirements: 'high',
          },
        },
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);
      expect(response.data.improvements).toContainEqual(
        expect.objectContaining({
          type: expect.stringMatching(/^(automation|parallel_processing|resource_optimization)$/),
        })
      );
    });
  });

  describe('Smart Document Routing', () => {
    it('should route purchase request to appropriate approvers', async () => {
      const purchaseRequestId = await TestHelpers.createApprovedPurchaseRequest(
        authToken,
        TEST_BRANCH_ID,
        {
          title: 'Document Routing Test PR',
          description: 'Testing smart document routing',
        }
      );

      const response = await axios.post(
        `${API_BASE_URL}/api/ai/route-document`,
        {
          documentType: 'purchase-request',
          documentId: purchaseRequestId,
          priority: 'medium',
          metadata: {
            amount: 2500,
            category: 'office_supplies',
            urgency: 'standard',
          },
        },
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        routingPlan: expect.arrayContaining([
          expect.objectContaining({
            step: expect.any(Number),
            assignee: expect.objectContaining({
              type: expect.stringMatching(/^(user|role|department)$/),
              identifier: expect.any(String),
              name: expect.any(String),
            }),
            action: expect.stringMatching(/^(review|approve|notify)$/),
            estimatedTime: expect.any(Number),
            isParallel: expect.any(Boolean),
          }),
        ]),
        priority: expect.stringMatching(/^(low|medium|high|urgent)$/),
        estimatedCompletion: expect.any(String),
        notifications: expect.arrayContaining([
          expect.objectContaining({
            recipient: expect.any(String),
            method: expect.stringMatching(/^(email|sms|in_app)$/),
            timing: expect.stringMatching(/^(immediate|scheduled|conditional)$/),
          }),
        ]),
        escalationRules: expect.arrayContaining([
          expect.objectContaining({
            condition: expect.any(String),
            action: expect.any(String),
            timeThreshold: expect.any(Number),
          }),
        ]),
      });
    });

    it('should handle urgent document routing with escalation', async () => {
      const purchaseOrderResponse = await TestHelpers.createPurchaseOrder(
        authToken,
        TEST_BRANCH_ID,
        {
          title: 'Urgent PO for Routing',
          notes: 'Testing urgent document routing',
        }
      );

      const response = await axios.post(
        `${API_BASE_URL}/api/ai/route-document`,
        {
          documentType: 'purchase-order',
          documentId: purchaseOrderResponse.id,
          priority: 'urgent',
          metadata: {
            amount: 75000,
            supplier: 'critical_supplier',
            deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          },
        },
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);
      expect(response.data.priority).toBe('urgent');
      expect(response.data.escalationRules.length).toBeGreaterThan(0);
      expect(response.data.notifications.some((n) => n.timing === 'immediate')).toBe(true);
    });

    it('should route material requisition based on department', async () => {
      // Since createMaterialRequisition doesn't exist, we'll use a mock ID
      const materialRequisitionId = 'mock-material-requisition-id-2';

      const response = await axios.post(
        `${API_BASE_URL}/api/ai/route-document`,
        {
          documentType: 'material-requisition',
          documentId: materialRequisitionId,
          priority: 'medium',
          metadata: {
            department: 'production',
            materialType: 'raw_materials',
          },
        },
        { headers: getAuthHeaders() }
      );

      expect(response.status).toBe(200);
      expect(response.data.routingPlan).toContainEqual(
        expect.objectContaining({
          assignee: expect.objectContaining({
            type: 'department',
            identifier: expect.stringMatching(/^(production|warehouse)$/),
          }),
        })
      );
    });
  });

  describe('Workflow Insights and Analytics', () => {
    it('should provide comprehensive workflow insights', async () => {
      const response = await axios.get(`${API_BASE_URL}/api/ai/workflow-insights`, {
        headers: getAuthHeaders(),
        params: {
          branchId: TEST_BRANCH_ID,
          timeframe: '30d',
          workflowTypes: 'purchase-request,purchase-order',
        },
      });

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        summary: expect.objectContaining({
          totalWorkflows: expect.any(Number),
          completedWorkflows: expect.any(Number),
          averageProcessingTime: expect.any(Number),
          automationRate: expect.any(Number),
        }),
        performance: expect.objectContaining({
          bottlenecks: expect.arrayContaining([
            expect.objectContaining({
              step: expect.any(String),
              averageDelay: expect.any(Number),
              frequency: expect.any(Number),
            }),
          ]),
          efficiency: expect.objectContaining({
            overall: expect.any(Number),
            byWorkflowType: expect.any(Object),
          }),
        }),
        trends: expect.objectContaining({
          processingTime: expect.arrayContaining([
            expect.objectContaining({
              period: expect.any(String),
              averageTime: expect.any(Number),
            }),
          ]),
          volume: expect.arrayContaining([
            expect.objectContaining({
              period: expect.any(String),
              count: expect.any(Number),
            }),
          ]),
        }),
        recommendations: expect.arrayContaining([
          expect.objectContaining({
            type: expect.stringMatching(/^(automation|optimization|training)$/),
            priority: expect.stringMatching(/^(low|medium|high)$/),
            description: expect.any(String),
            expectedImpact: expect.any(String),
          }),
        ]),
      });
    });

    it('should provide workflow insights with custom date range', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const response = await axios.get(`${API_BASE_URL}/api/ai/workflow-insights`, {
        headers: getAuthHeaders(),
        params: {
          branchId: TEST_BRANCH_ID,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          includeDetails: 'true',
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.details).toBeDefined();
      expect(response.data.details.workflows).toBeDefined();
    });
  });

  describe('Parameter Validation', () => {
    it('should validate auto-approval evaluation parameters', async () => {
      try {
        await axios.post(
          `${API_BASE_URL}/api/ai/evaluate-auto-approval`,
          {
            // Missing required fields
          },
          { headers: getAuthHeaders() }
        );
        fail('Should have thrown 400 error');
      } catch (error) {
        expect(error.response?.status).toBe(400);
      }

      try {
        await axios.post(
          `${API_BASE_URL}/api/ai/evaluate-auto-approval`,
          {
            workflowType: 'invalid-type',
            entityId: 'test-id',
            amount: -100, // Invalid amount
          },
          { headers: getAuthHeaders() }
        );
        fail('Should have thrown 400 error');
      } catch (error) {
        expect(error.response?.status).toBe(400);
      }
    });

    it('should validate workflow optimization parameters', async () => {
      try {
        await axios.post(
          `${API_BASE_URL}/api/ai/optimize-workflow`,
          {
            workflowType: 'purchase-request',
            // Missing currentSteps
          },
          { headers: getAuthHeaders() }
        );
        fail('Should have thrown 400 error');
      } catch (error) {
        expect(error.response?.status).toBe(400);
      }

      try {
        await axios.post(
          `${API_BASE_URL}/api/ai/optimize-workflow`,
          {
            workflowType: 'invalid-workflow',
            currentSteps: [],
          },
          { headers: getAuthHeaders() }
        );
        fail('Should have thrown 400 error');
      } catch (error) {
        expect(error.response?.status).toBe(400);
      }
    });

    it('should validate document routing parameters', async () => {
      try {
        await axios.post(
          `${API_BASE_URL}/api/ai/route-document`,
          {
            documentType: 'invalid-type',
            documentId: 'test-id',
          },
          { headers: getAuthHeaders() }
        );
        fail('Should have thrown 400 error');
      } catch (error) {
        expect(error.response?.status).toBe(400);
      }

      try {
        await axios.post(
          `${API_BASE_URL}/api/ai/route-document`,
          {
            documentType: 'purchase-request',
            // Missing documentId
          },
          { headers: getAuthHeaders() }
        );
        fail('Should have thrown 400 error');
      } catch (error) {
        expect(error.response?.status).toBe(400);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent entity in auto-approval evaluation', async () => {
      try {
        await axios.post(
          `${API_BASE_URL}/api/ai/evaluate-auto-approval`,
          {
            workflowType: 'purchase-request',
            entityId: 'non-existent-id',
            amount: 1000,
          },
          { headers: getAuthHeaders() }
        );
        fail('Should have thrown 404 error');
      } catch (error) {
        expect(error.response?.status).toBe(404);
      }
    });

    it('should handle workflow optimization for unsupported workflow types', async () => {
      try {
        await axios.post(
          `${API_BASE_URL}/api/ai/optimize-workflow`,
          {
            workflowType: 'unsupported-workflow',
            currentSteps: ['step1', 'step2'],
          },
          { headers: getAuthHeaders() }
        );
        fail('Should have thrown 400 error');
      } catch (error) {
        expect(error.response?.status).toBe(400);
        expect(error.response?.data.message).toContain('Unsupported workflow type');
      }
    });

    it('should handle document routing for non-existent documents', async () => {
      try {
        await axios.post(
          `${API_BASE_URL}/api/ai/route-document`,
          {
            documentType: 'purchase-request',
            documentId: 'non-existent-id',
            priority: 'medium',
          },
          { headers: getAuthHeaders() }
        );
        fail('Should have thrown 404 error');
      } catch (error) {
        expect(error.response?.status).toBe(404);
      }
    });
  });
  describe('Performance Testing', () => {
    it('should handle concurrent auto-approval evaluations', async () => {
      const purchaseRequests = await Promise.all([
        TestHelpers.createApprovedPurchaseRequest(authToken, TEST_BRANCH_ID, {
          title: 'Performance Test PR 1',
        }),
        TestHelpers.createApprovedPurchaseRequest(authToken, TEST_BRANCH_ID, {
          title: 'Performance Test PR 2',
        }),
        TestHelpers.createApprovedPurchaseRequest(authToken, TEST_BRANCH_ID, {
          title: 'Performance Test PR 3',
        }),
      ]);

      const startTime = Date.now();
      const promises = purchaseRequests.map((pr) =>
        axios.post(
          `${API_BASE_URL}/api/ai/evaluate-auto-approval`,
          {
            workflowType: 'purchase-request',
            entityId: pr,
            amount: 1000,
          },
          { headers: getAuthHeaders() }
        )
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('canAutoApprove');
      });

      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle workflow optimization within reasonable time', async () => {
      const startTime = Date.now();

      const response = await axios.post(
        `${API_BASE_URL}/api/ai/optimize-workflow`,
        {
          workflowType: 'purchase-order',
          currentSteps: Array.from({ length: 10 }, (_, i) => `step_${i + 1}`),
          historicalData: {
            averageProcessingTime: 120,
            bottleneckSteps: ['step_5', 'step_8'],
            rejectionRate: 0.1,
          },
        },
        { headers: getAuthHeaders() }
      );

      const endTime = Date.now();
      expect(response.status).toBe(200);
      expect(endTime - startTime).toBeLessThan(3000); // Should complete within 3 seconds    });
    });
    describe('Integration Scenarios', () => {
      it('should integrate auto-approval with workflow optimization', async () => {
        const purchaseRequestId = await TestHelpers.createApprovedPurchaseRequest(
          authToken,
          TEST_BRANCH_ID,
          {
            title: 'Integration Test PR',
            description: 'Testing integration scenarios',
          }
        );

        // First, evaluate for auto-approval
        const evaluationResponse = await axios.post(
          `${API_BASE_URL}/api/ai/evaluate-auto-approval`,
          {
            workflowType: 'purchase-request',
            entityId: purchaseRequestId,
            amount: 2000,
          },
          { headers: getAuthHeaders() }
        );

        expect(evaluationResponse.status).toBe(200);

        // If not auto-approved, optimize the workflow
        if (!evaluationResponse.data.canAutoApprove) {
          const optimizationResponse = await axios.post(
            `${API_BASE_URL}/api/ai/optimize-workflow`,
            {
              workflowType: 'purchase-request',
              currentSteps: evaluationResponse.data.requiredApprovals.map(
                (approval) => approval.role
              ),
              context: {
                amount: 2000,
                riskFactors: evaluationResponse.data.riskFactors,
              },
            },
            { headers: getAuthHeaders() }
          );

          expect(optimizationResponse.status).toBe(200);
          expect(optimizationResponse.data.optimizedSteps.length).toBeGreaterThan(0);
        }
      });

      it('should combine document routing with workflow insights', async () => {
        const purchaseOrderResponse = await TestHelpers.createPurchaseOrder(
          authToken,
          TEST_BRANCH_ID,
          {
            title: 'Insights Test PO',
            notes: 'Testing workflow insights combination',
          }
        );

        // Route the document
        const routingResponse = await axios.post(
          `${API_BASE_URL}/api/ai/route-document`,
          {
            documentType: 'purchase-order',
            documentId: purchaseOrderResponse.id,
            priority: 'high',
          },
          { headers: getAuthHeaders() }
        );

        expect(routingResponse.status).toBe(200);

        // Get insights to validate routing effectiveness
        const insightsResponse = await axios.get(`${API_BASE_URL}/api/ai/workflow-insights`, {
          headers: getAuthHeaders(),
          params: {
            branchId: TEST_BRANCH_ID,
            workflowTypes: 'purchase-order',
          },
        });

        expect(insightsResponse.status).toBe(200);
        expect(routingResponse.data.routingPlan.length).toBeGreaterThan(0);
        expect(insightsResponse.data.summary.totalWorkflows).toBeGreaterThanOrEqual(0);
      });
    });

    describe('Real-world Scenarios', () => {
      it('should handle end-to-end workflow automation for urgent purchase', async () => {
        const urgentPurchaseRequestId = await TestHelpers.createApprovedPurchaseRequest(
          authToken,
          TEST_BRANCH_ID,
          {
            title: 'Urgent Purchase Request E2E',
            description: 'Testing urgent workflow automation',
          }
        ); // Step 1: Evaluate for auto-approval
        const evaluation = await axios.post(
          `${API_BASE_URL}/api/ai/evaluate-auto-approval`,
          {
            workflowType: 'purchase-request',
            entityId: urgentPurchaseRequestId,
            amount: 5000,
            priority: 'urgent',
          },
          { headers: getAuthHeaders() }
        );

        expect(evaluation.status).toBe(200);

        // Step 2: If not auto-approved, route for urgent processing
        if (!evaluation.data.canAutoApprove) {
          const routing = await axios.post(
            `${API_BASE_URL}/api/ai/route-document`,
            {
              documentType: 'purchase-request',
              documentId: urgentPurchaseRequestId,
              priority: 'urgent',
              metadata: { amount: 5000 },
            },
            { headers: getAuthHeaders() }
          );

          expect(routing.status).toBe(200);
          expect(routing.data.priority).toBe('urgent');
          expect(routing.data.escalationRules.length).toBeGreaterThan(0);
        }

        // Step 3: Optimize the workflow for future similar requests
        const optimization = await axios.post(
          `${API_BASE_URL}/api/ai/optimize-workflow`,
          {
            workflowType: 'purchase-request',
            currentSteps: evaluation.data.requiredApprovals?.map((a) => a.role) || [
              'manager_approval',
            ],
            context: {
              priority: 'urgent',
              amount: 5000,
            },
          },
          { headers: getAuthHeaders() }
        );

        expect(optimization.status).toBe(200);
      });

      it('should handle complex manufacturing workflow automation', async () => {
        // Simulate a complex manufacturing scenario
        const response = await axios.post(
          `${API_BASE_URL}/api/ai/optimize-workflow`,
          {
            workflowType: 'manufacturing-order',
            currentSteps: [
              'design_review',
              'material_sourcing',
              'production_planning',
              'machine_setup',
              'production',
              'quality_inspection',
              'packaging',
              'shipment',
            ],
            constraints: {
              resourceLimitations: ['skilled_workers', 'specialized_machinery'],
              qualityRequirements: 'iso_certified',
              timeConstraints: 'rush_order',
            },
            historicalData: {
              averageProcessingTime: 168, // 1 week
              bottleneckSteps: ['machine_setup', 'quality_inspection'],
              rejectionRate: 0.05,
            },
          },
          { headers: getAuthHeaders() }
        );

        expect(response.status).toBe(200);
        expect(response.data.improvements).toContainEqual(
          expect.objectContaining({
            type: 'parallel_processing',
          })
        );
        expect(response.data.estimatedImpact.timeReduction).toBeGreaterThan(0);
      });
    });
  });
});
