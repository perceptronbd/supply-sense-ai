const axios = require('axios');

/**
 * Comprehensive Chat API Test Suite
 * Tests the complete chat module functionality including:
 * - Authentication
 * - Session management
 * - Dynamic SQL queries (BR002 stock analysis)
 * - Purchase request queries
 * - Error handling
 */

class ChatAPITester {
  constructor() {
    this.API_BASE_URL = 'http://localhost:3000';
    this.authToken = null;
    this.sessionId = null;
  }

  async login() {
    console.log('🔐 Step 1: Authenticating...');
    try {
      const loginResponse = await axios.post(`${this.API_BASE_URL}/api/auth/login`, {
        email: 'manager.a@supplychain.com',
        password: 'manager123',
      });
      this.authToken = loginResponse.data.access_token;
      console.log('✅ Login successful');
      console.log('👤 User:', loginResponse.data.user.firstName, loginResponse.data.user.lastName);
      console.log('🏢 Branch:', loginResponse.data.user.branchId);
      console.log('🔑 Token starts with:', `${this.authToken?.substring(0, 20)}...`);
      return true;
    } catch (error) {
      console.error('❌ Login failed:', error.response?.data?.message || error.message);
      return false;
    }
  }

  async createSession(
    title = 'Comprehensive Test Session',
    description = 'Testing chat functionality'
  ) {
    console.log('\n📝 Step 2: Creating chat session...');
    try {
      const sessionResponse = await axios.post(
        `${this.API_BASE_URL}/api/chat/sessions`,
        { title, description },
        {
          headers: {
            Authorization: `Bearer ${this.authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      this.sessionId = sessionResponse.data.id;
      console.log('✅ Session created:', this.sessionId);
      return true;
    } catch (error) {
      console.error('❌ Session creation failed:', error.response?.data?.message || error.message);
      return false;
    }
  }

  async testQuery(query, testName) {
    console.log(`\n🔍 ${testName}:`);
    console.log('Query:', query);

    try {
      const queryData = {
        sessionId: this.sessionId,
        query: query,
        includeDatabaseQuery: true,
      };
      const queryResponse = await axios.post(`${this.API_BASE_URL}/api/chat/query`, queryData, {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      this.logGeneratedQuery(queryResponse.data);
      this.logResponseStructure(queryResponse.data);
      this.logQueryResults(queryResponse.data);

      return queryResponse.data;
    } catch (error) {
      this.logQueryError(error);
      return null;
    }
  }

  logGeneratedQuery(data) {
    // Log the generated SQL query if available
    if (data.sqlQuery) {
      console.log('\n🔧 Generated SQL Query:');
      console.log(data.sqlQuery);
    } else if (data.query) {
      console.log('\n🔧 Generated Query:');
      console.log(data.query);
    } else if (data.databaseQuery) {
      console.log('\n🔧 Generated Database Query:');
      console.log(data.databaseQuery);
    }
  }

  logResponseStructure(data) {
    // Debug: Log the full response structure to see what fields are available
    console.log('\n🔍 Full Response Structure (keys):');
    console.log(Object.keys(data));
  }

  logQueryResults(data) {
    if (data.type === 'data') {
      console.log('✅ Query successful! Data returned.');
      console.log('📊 Result count:', data.data?.length || 0);

      if (data.data && data.data.length > 0) {
        console.log('📄 Sample data (first 2 records):');
        console.log(JSON.stringify(data.data.slice(0, 2), null, 2));
      }

      console.log('\n🤖 AI Analysis:');
      console.log(data.message);

      if (data.metadata) {
        console.log('\n📈 Metadata:', data.metadata);
      }

      if (data.suggestions && data.suggestions.length > 0) {
        console.log('\n💡 Suggestions:', data.suggestions);
      }
    } else if (data.type === 'error') {
      console.log('❌ Query returned an error.');
      console.log('Error message:', data.message);
    } else {
      console.log('✅ Query successful with response type:', data.type);
      console.log('Response:', data.message);
    }
  }

  logQueryError(error) {
    console.error('❌ Query failed:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.message);
    if (error.response?.data) {
      console.error('Server response:', JSON.stringify(error.response.data, null, 2));
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive Chat API Test Suite');
    console.log('='.repeat(60));

    // Step 1: Authentication
    const loginSuccess = await this.login();
    if (!loginSuccess) {
      console.error('❌ Test suite aborted: Authentication failed');
      return;
    }

    // Step 2: Session Creation
    const sessionSuccess = await this.createSession();
    if (!sessionSuccess) {
      console.error('❌ Test suite aborted: Session creation failed');
      return;
    }

    // Step 3: Test Queries
    const testQueries = [
      {
        name: 'BR002 Stock Analysis (Original Objective)',
        query: 'Show me all items in BR002 branch that have stock quantity below 10 units',
      },
      {
        name: 'Purchase Request Analysis',
        query: 'How many Purchase Requests are in draft status and what are their total price?',
      },
      {
        name: 'General Inventory Query',
        query: 'What is the current stock situation across all branches?',
      },
      {
        name: 'Supplier Analysis',
        query: 'Show me a summary of our suppliers and their performance',
      },
    ];

    for (const test of testQueries) {
      await this.testQuery(test.query, test.name);

      // Add a small delay between queries to avoid overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('🎉 Comprehensive Chat API Test Suite Completed!');
    console.log('✅ All major functionalities tested:');
    console.log('   - Authentication & Authorization');
    console.log('   - Session Management');
    console.log('   - Dynamic SQL Generation');
    console.log('   - Natural Language Processing');
    console.log('   - AI-Powered Response Generation');
    console.log('   - BR002 Stock Analysis (Original Objective)');
  }
}

// Quick test functions for individual scenarios
async function testBR002Only() {
  console.log('🎯 Running BR002 Stock Test Only...\n');
  const tester = new ChatAPITester();

  if (
    (await tester.login()) &&
    (await tester.createSession('BR002 Test', 'Quick BR002 stock test'))
  ) {
    await tester.testQuery(
      'Show me all items in BR002 branch that have stock quantity below 10 units',
      'BR002 Stock Analysis'
    );
  }
}

async function testPurchaseRequestsOnly() {
  console.log('📋 Running Purchase Requests Test Only...\n');
  const tester = new ChatAPITester();

  if ((await tester.login()) && (await tester.createSession('PR Test', 'Quick PR analysis test'))) {
    await tester.testQuery(
      'How many Purchase Requests are in draft status and what are their total price?',
      'Purchase Request Analysis'
    );
  }
}

async function testSuppliersOnly() {
  console.log('🏭 Running Suppliers Test Only...\n');
  const tester = new ChatAPITester();

  if (
    (await tester.login()) &&
    (await tester.createSession('Supplier Test', 'Quick supplier analysis test'))
  ) {
    await tester.testQuery(
      'Show me a summary of our suppliers and their performance',
      'Supplier Performance Analysis'
    );
  }
}

async function testPurchaseOrdersOnly() {
  console.log('📦 Running Purchase Orders Test Only...\n');
  const tester = new ChatAPITester();

  if ((await tester.login()) && (await tester.createSession('PO Test', 'Quick PO analysis test'))) {
    await tester.testQuery(
      'List all purchase orders created in the last 30 days with their total amounts',
      'Purchase Order Analysis'
    );
  }
}

async function testInventoryAnalysisOnly() {
  console.log('📊 Running Inventory Analysis Test Only...\n');
  const tester = new ChatAPITester();

  if (
    (await tester.login()) &&
    (await tester.createSession('Inventory Test', 'Quick inventory analysis test'))
  ) {
    await tester.testQuery(
      'What is the current stock situation across all branches?',
      'General Inventory Analysis'
    );
  }
}

async function testCostAnalysisOnly() {
  console.log('💰 Running Cost Analysis Test Only...\n');
  const tester = new ChatAPITester();

  if (
    (await tester.login()) &&
    (await tester.createSession('Cost Test', 'Quick cost analysis test'))
  ) {
    await tester.testQuery(
      'Calculate the average cost of items in my branch and show the most expensive ones',
      'Average Cost Analysis'
    );
  }
}

async function testLowStockAnalysisOnly() {
  console.log('⚠️ Running Low Stock Analysis Test Only...\n');
  const tester = new ChatAPITester();

  if (
    (await tester.login()) &&
    (await tester.createSession('Low Stock Test', 'Quick low stock analysis test'))
  ) {
    await tester.testQuery(
      'Find all items with stock quantity below 5 units across all branches',
      'Low Stock Critical Analysis'
    );
  }
}

async function testComplexAnalyticsOnly() {
  console.log('🔍 Running Complex Analytics Test Only...\n');
  const tester = new ChatAPITester();

  if (
    (await tester.login()) &&
    (await tester.createSession('Analytics Test', 'Complex analytics test'))
  ) {
    await tester.testQuery(
      'Show me the top 10 most requested items this month grouped by branch with their total quantities',
      'Complex Analytics Query'
    );
  }
}

async function testSupplierPerformanceOnly() {
  console.log('📈 Running Supplier Performance Test Only...\n');
  const tester = new ChatAPITester();

  if (
    (await tester.login()) &&
    (await tester.createSession('Supplier Performance Test', 'Supplier metrics test'))
  ) {
    await tester.testQuery(
      'Which suppliers have the highest order volumes and best delivery performance?',
      'Supplier Performance Metrics'
    );
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--br002')) {
    await testBR002Only();
  } else if (args.includes('--pr')) {
    await testPurchaseRequestsOnly();
  } else if (args.includes('--suppliers')) {
    await testSuppliersOnly();
  } else if (args.includes('--po')) {
    await testPurchaseOrdersOnly();
  } else if (args.includes('--inventory')) {
    await testInventoryAnalysisOnly();
  } else if (args.includes('--cost')) {
    await testCostAnalysisOnly();
  } else if (args.includes('--lowstock')) {
    await testLowStockAnalysisOnly();
  } else if (args.includes('--analytics')) {
    await testComplexAnalyticsOnly();
  } else if (args.includes('--supplier-performance')) {
    await testSupplierPerformanceOnly();
  } else if (args.includes('--help')) {
    console.log('📋 Available test options:');
    console.log('  --br002              : Test BR002 stock analysis (Dynamic SQL)');
    console.log('  --pr                 : Test Purchase Requests analysis (Predefined)');
    console.log('  --suppliers          : Test Supplier analysis (Dynamic SQL)');
    console.log('  --po                 : Test Purchase Orders analysis (Dynamic SQL)');
    console.log('  --inventory          : Test Inventory analysis (Dynamic SQL)');
    console.log('  --cost               : Test Cost analysis (Dynamic SQL)');
    console.log('  --lowstock           : Test Low Stock analysis (Dynamic SQL)');
    console.log('  --analytics          : Test Complex Analytics (Dynamic SQL)');
    console.log('  --supplier-performance: Test Supplier Performance (Dynamic SQL)');
    console.log('  (no args)            : Run all tests in sequence');
  } else {
    const tester = new ChatAPITester();
    await tester.runAllTests();
  }
}

// Run the tests
main().catch(console.error);

// Export for potential module usage
module.exports = {
  ChatAPITester,
  testBR002Only,
  testPurchaseRequestsOnly,
  testSuppliersOnly,
  testPurchaseOrdersOnly,
  testInventoryAnalysisOnly,
  testCostAnalysisOnly,
  testLowStockAnalysisOnly,
  testComplexAnalyticsOnly,
  testSupplierPerformanceOnly,
};
