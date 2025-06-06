// Test Purchase Request API
const fetch = require('node-fetch');

async function testPurchaseRequest() {
  try {
    // 1. Get JWT token
    console.log('Getting JWT token...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'manager.a@supplychain.com',
        password: 'manager123',
      }),
    });

    const loginData = await loginResponse.json();

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }

    const token = loginData.access_token;
    const userId = loginData.user.id;

    console.log(`✅ Login successful`);
    console.log(`   User ID: ${userId}`);
    console.log(`   Token: ${token.substring(0, 30)}...`);

    // 2. Test GET request
    console.log('\nGetting purchase requests...');
    const getResponse = await fetch(
      'http://localhost:3000/api/purchase-request',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const getResult = await getResponse.json();

    if (!getResponse.ok) {
      throw new Error(`GET failed: ${JSON.stringify(getResult)}`);
    }

    console.log(
      `✅ GET successful - found ${getResult.length} purchase requests`
    );

    // 3. Test POST request to create a purchase request
    console.log('\nCreating purchase request...');

    const requestData = {
      title: 'Test Purchase Request via API',
      description:
        'Testing purchase request creation with proper authentication',
      requiredDate: '2025-06-20T10:00:00Z',
      branchId: '29db9233-fbb4-4a68-8807-5d5cae43537d',
      justification: 'Testing the API functionality',
      items: [
        {
          itemId: 'b32dd8ee-475e-47da-8bc8-990b7f8aada6',
          requestedQty: 100,
          estimatedPrice: 25.5,
          requiredDate: '2025-06-20T10:00:00Z',
          remarks: 'Test item for API testing',
        },
      ],
    };

    console.log('Request data:', JSON.stringify(requestData, null, 2));

    const postResponse = await fetch(
      'http://localhost:3000/api/purchase-request',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      }
    );

    const result = await postResponse.text();

    if (!postResponse.ok) {
      console.error(
        `❌ Failed to create purchase request: ${postResponse.status}`
      );
      try {
        console.error(`   Error: ${JSON.parse(result).message}`);
      } catch (e) {
        console.error(`   Response: ${result}`);
      }
    } else {
      console.log(`✅ Purchase request created successfully`);
      try {
        const data = JSON.parse(result);
        console.log(`   ID: ${data.id}`);
        console.log(`   PR Number: ${data.prNumber}`);
        console.log(`   Created By: ${data.createdById}`);
      } catch (e) {
        console.log(`   Response: ${result}`);
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testPurchaseRequest();
