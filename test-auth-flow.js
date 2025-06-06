const axios = require('axios');

// Add timeout and better error handling
axios.defaults.timeout = 5000;

async function testAuth() {
  try {
    console.log('🔐 Testing authentication...');
    console.log('Server URL: http://localhost:3000/api');

    // Test basic server connectivity first
    console.log('Testing basic connectivity...');
    const healthResponse = await axios.get('http://localhost:3000/api');
    console.log('✅ Server responding:', healthResponse.data);

    // Test login
    console.log('Testing login...');
    const loginData = {
      email: 'admin@example.com',
      password: 'admin123',
    };

    console.log('Login data:', loginData);

    const loginResponse = await axios.post(
      'http://localhost:3000/api/auth/login',
      loginData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    console.log('✅ Login successful:', loginResponse.data);

    const token = loginResponse.data.access_token;

    if (!token) {
      console.log('❌ No access token received');
      return;
    }

    // Test authenticated endpoint
    const authHeaders = {
      Authorization: `Bearer ${token}`,
    };

    console.log('\n🚀 Testing authenticated API calls...');

    // Test purchase requests with token
    const prResponse = await axios.get(
      'http://localhost:3000/api/purchase-request',
      {
        headers: authHeaders,
        timeout: 10000,
      }
    );

    console.log('✅ Purchase Requests:', prResponse.data.length, 'records');
  } catch (error) {
    console.error('❌ Error occurred:');
    console.error('Message:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('Request made but no response received');
      console.error('Request:', error.request);
    }
    console.error('Config:', error.config);
  }
}

testAuth();
