const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Test credentials from seeded data
const testCredentials = {
  email: 'admin@example.com',
  password: 'admin123',
};

async function testAuthentication() {
  console.log('🔐 Testing Authentication Flow...\n');

  try {
    console.log('📝 Test credentials:', testCredentials);

    // Test login endpoint
    console.log('\n🚀 Testing login endpoint...');
    const loginResponse = await axios.post(
      `${BASE_URL}/auth/login`,
      testCredentials,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Login successful!');
    console.log('Response status:', loginResponse.status);
    console.log('Response data:', loginResponse.data);

    // Extract token from response
    const token = loginResponse.data.access_token;
    if (token) {
      console.log('\n🎫 JWT Token received:', token.substring(0, 50) + '...');

      // Test authenticated endpoint (if any exist)
      console.log('\n🔑 Testing token validation...');
      // For now, just verify the token structure
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        console.log('✅ JWT token structure is valid (3 parts)');
      } else {
        console.log('❌ Invalid JWT token structure');
      }
    } else {
      console.log('❌ No access token in response');
    }
  } catch (error) {
    console.error('❌ Authentication test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testAuthentication();
