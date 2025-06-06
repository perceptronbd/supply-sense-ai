// Test script to validate API endpoints and UUID functionality
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// Test data with proper UUID format
const testData = {
  purchaseRequest: {
    description: 'Test Purchase Request',
    requestedById: '00000000-0000-0000-0000-000000000001', // This should exist from seed data
    branchId: '00000000-0000-0000-0000-000000000001',
    items: [
      {
        itemId: '00000000-0000-0000-0000-000000000001',
        quantity: 10,
        unitPrice: 25.5,
        notes: 'Test item for PR',
      },
    ],
  },
  purchaseOrder: {
    title: 'Test Purchase Order',
    supplierId: '00000000-0000-0000-0000-000000000001',
    expectedDeliveryDate: '2024-06-15T10:00:00Z',
    branchId: '00000000-0000-0000-0000-000000000001',
    paymentTerms: 'Net 30 days',
    deliveryTerms: 'FOB Origin',
    notes: 'Test PO notes',
    items: [
      {
        itemId: '00000000-0000-0000-0000-000000000001',
        orderedQty: 5,
        unitPrice: 30.0,
        deliveryDate: '2024-06-15T10:00:00Z',
        remarks: 'Test item for PO',
      },
    ],
  },
};

async function testAPI() {
  console.log('🧪 Testing Supply Chain AI API endpoints...\n');

  try {
    // Test 1: Basic API health check
    console.log('1. Testing basic API health...');
    const healthResponse = await axios.get(`${API_BASE}`);
    console.log('✅ API is responding:', healthResponse.data);

    // Test 2: Create Purchase Request with UUID validation
    console.log(
      '\n2. Testing Purchase Request creation with UUID validation...'
    );
    try {
      const prResponse = await axios.post(
        `${API_BASE}/purchase-request`,
        testData.purchaseRequest
      );
      console.log(
        '✅ Purchase Request created successfully:',
        prResponse.data.id
      );

      // Test getting the created PR
      const getPRResponse = await axios.get(
        `${API_BASE}/purchase-request/${prResponse.data.id}`
      );
      console.log(
        '✅ Purchase Request retrieved successfully:',
        getPRResponse.data.description
      );
    } catch (error) {
      console.log(
        '❌ Purchase Request creation failed:',
        error.response?.data || error.message
      );
    }

    // Test 3: Create Purchase Order with UUID validation
    console.log('\n3. Testing Purchase Order creation with UUID validation...');
    try {
      const poResponse = await axios.post(
        `${API_BASE}/purchase-order`,
        testData.purchaseOrder
      );
      console.log(
        '✅ Purchase Order created successfully:',
        poResponse.data.id
      );

      // Test getting the created PO
      const getPOResponse = await axios.get(
        `${API_BASE}/purchase-order/${poResponse.data.id}`
      );
      console.log(
        '✅ Purchase Order retrieved successfully:',
        getPOResponse.data.status
      );
    } catch (error) {
      console.log(
        '❌ Purchase Order creation failed:',
        error.response?.data || error.message
      );
    }

    // Test 4: Test UUID validation with invalid UUID
    console.log('\n4. Testing UUID validation with invalid UUID...');
    try {
      const invalidData = {
        ...testData.purchaseRequest,
        branchId: 'invalid-uuid',
      };
      await axios.post(`${API_BASE}/purchase-request`, invalidData);
      console.log("❌ Should have failed validation but didn't");
    } catch (error) {
      if (error.response?.status === 400) {
        console.log(
          '✅ UUID validation working correctly - rejected invalid UUID'
        );
      } else {
        console.log(
          '❌ Unexpected error:',
          error.response?.data || error.message
        );
      }
    }

    // Test 5: Test getting all entities
    console.log('\n5. Testing GET all endpoints...');
    try {
      const allPRs = await axios.get(`${API_BASE}/purchase-request`);
      console.log(`✅ Retrieved ${allPRs.data.length} Purchase Requests`);

      const allPOs = await axios.get(`${API_BASE}/purchase-order`);
      console.log(`✅ Retrieved ${allPOs.data.length} Purchase Orders`);
    } catch (error) {
      console.log(
        '❌ GET all endpoints failed:',
        error.response?.data || error.message
      );
    }

    console.log('\n🎉 API testing completed!');
  } catch (error) {
    console.error('❌ API testing failed:', error.message);
  }
}

// Run the tests
testAPI();
