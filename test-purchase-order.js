// Test Purchase Order API with Authentication
// Using native fetch (Node.js 18+)

async function testPurchaseOrderAPI() {
  try {
    // 1. Login and get JWT token
    console.log('🔐 Logging in...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'manager.a@supplychain.com', // Branch Manager
        password: 'manager123',
      }),
    });

    const loginData = await loginResponse.json();
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }

    const token = loginData.access_token;
    const user = loginData.user;
    console.log('✅ Login successful');
    console.log(`   User: ${user.firstName} ${user.lastName} (${user.role})`);
    console.log(`   Branch ID: ${user.branchId}`);
    console.log(`   Token: ${token.substring(0, 30)}...`);

    // 2. First, create a purchase request to use for PO creation
    console.log('\n📋 Creating purchase request for PO creation...');
    const prData = {
      title: 'Test PR for Purchase Order Creation',
      description: 'Testing PR to PO conversion workflow',
      requiredDate: '2025-06-20T10:00:00Z',
      branchId: user.branchId,
      justification: 'Required for PO testing workflow',
      items: [
        {
          itemId: 'b32dd8ee-475e-47da-8bc8-990b7f8aada6', // Item from seed data
          requestedQty: 50,
          estimatedPrice: 15.0,
          requiredDate: '2025-06-20T10:00:00Z',
          remarks: 'Test item for PO creation',
        },
      ],
    };

    const prResponse = await fetch('http://localhost:3000/api/purchase-request', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(prData),
    });

    const prResult = await prResponse.json();
    if (!prResponse.ok) {
      throw new Error(`Failed to create PR: ${JSON.stringify(prResult)}`);
    }

    console.log(`✅ Purchase request created: ${prResult.prNumber}`);
    const prId = prResult.id;

    // 3. Submit the purchase request (required before creating PO)
    console.log('\n📤 Submitting purchase request...');
    const submitResponse = await fetch(
      `http://localhost:3000/api/purchase-request/${prId}/submit`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!submitResponse.ok) {
      const submitError = await submitResponse.json();
      throw new Error(`Failed to submit PR: ${JSON.stringify(submitError)}`);
    }
    console.log('✅ Purchase request submitted successfully');

    // 4. Approve the purchase request (required before creating PO)
    console.log('\n✅ Approving purchase request...');
    const approveResponse = await fetch(
      `http://localhost:3000/api/purchase-request/${prId}/approve`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!approveResponse.ok) {
      const approveError = await approveResponse.json();
      throw new Error(`Failed to approve PR: ${JSON.stringify(approveError)}`);
    }

    console.log('✅ Purchase request approved successfully'); // 5. Test GET all purchase orders
    console.log('\n📦 Getting all purchase orders...');
    const getAllResponse = await fetch('http://localhost:3000/api/purchase-order', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const allPOs = await getAllResponse.json();
    if (!getAllResponse.ok) {
      throw new Error(`Failed to get POs: ${JSON.stringify(allPOs)}`);
    }

    console.log(`✅ Retrieved ${allPOs.length} purchase orders`); // 6. Create purchase order from purchase request
    console.log('\n🏭 Creating purchase order from purchase request...');
    const createFromPRResponse = await fetch(
      `http://localhost:3000/api/purchase-order/create-from-pr/${prId}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supplierId: '5bcd37fa-1b10-4ae0-accc-44c7b5760c7f', // Supplier from seed data
        }),
      }
    );

    const poFromPR = await createFromPRResponse.json();
    if (!createFromPRResponse.ok) {
      throw new Error(`Failed to create PO from PR: ${JSON.stringify(poFromPR)}`);
    }

    console.log(`✅ Purchase order created from PR: ${poFromPR.poNumber}`);
    console.log(`   PO ID: ${poFromPR.id}`);
    console.log(`   Status: ${poFromPR.status}`);
    console.log(`   Total Amount: $${poFromPR.totalAmount}`);

    const poId = poFromPR.id;

    // 7. Test GET specific purchase order
    console.log('\n🔍 Getting specific purchase order...');
    const getOneResponse = await fetch(`http://localhost:3000/api/purchase-order/${poId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const specificPO = await getOneResponse.json();
    if (!getOneResponse.ok) {
      throw new Error(`Failed to get specific PO: ${JSON.stringify(specificPO)}`);
    }

    console.log(`✅ Retrieved purchase order: ${specificPO.poNumber}`);
    console.log(`   Items: ${specificPO.items.length}`);
    console.log(`   Supplier: ${specificPO.supplier.name}`);

    // 7. Test purchase order workflow - Send to supplier
    console.log('\n📧 Sending purchase order to supplier...');
    const sendToSupplierResponse = await fetch(
      `http://localhost:3000/api/purchase-order/${poId}/send-to-supplier`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const sentPO = await sendToSupplierResponse.json();
    if (!sendToSupplierResponse.ok) {
      throw new Error(`Failed to send PO to supplier: ${JSON.stringify(sentPO)}`);
    }

    console.log('✅ Purchase order sent to supplier');
    console.log(`   Status: ${sentPO.status}`);

    // 8. Test confirm purchase order
    console.log('\n✅ Confirming purchase order...');
    const confirmResponse = await fetch(
      `http://localhost:3000/api/purchase-order/${poId}/confirm`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const confirmedPO = await confirmResponse.json();
    if (!confirmResponse.ok) {
      throw new Error(`Failed to confirm PO: ${JSON.stringify(confirmedPO)}`);
    }

    console.log('✅ Purchase order confirmed');
    console.log(`   Status: ${confirmedPO.status}`);

    // 9. Create a standalone purchase order (not from PR)
    console.log('\n🆕 Creating standalone purchase order...');
    const standalonePOData = {
      title: 'Standalone Purchase Order Test',
      supplierId: '5bcd37fa-1b10-4ae0-accc-44c7b5760c7f',
      expectedDeliveryDate: '2025-07-01T10:00:00Z',
      paymentTerms: 'Net 30 days',
      deliveryTerms: 'FOB Origin',
      branchId: user.branchId,
      notes: 'Testing standalone PO creation',
      items: [
        {
          itemId: 'b32dd8ee-475e-47da-8bc8-990b7f8aada6',
          orderedQty: 25,
          unitPrice: 18.5,
          deliveryDate: '2025-07-01T10:00:00Z',
          remarks: 'Standalone PO test item',
        },
      ],
    };

    const standaloneResponse = await fetch('http://localhost:3000/api/purchase-order', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(standalonePOData),
    });

    const standalonePO = await standaloneResponse.json();
    if (!standaloneResponse.ok) {
      throw new Error(`Failed to create standalone PO: ${JSON.stringify(standalonePO)}`);
    }

    console.log(`✅ Standalone purchase order created: ${standalonePO.poNumber}`);
    console.log(`   Total Amount: $${standalonePO.totalAmount}`);

    // 10. Test filtering by branch
    console.log('\n🏢 Testing branch filtering...');
    const branchFilterResponse = await fetch(
      `http://localhost:3000/api/purchase-order?branchId=${user.branchId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const branchPOs = await branchFilterResponse.json();
    if (!branchFilterResponse.ok) {
      throw new Error(`Failed to filter by branch: ${JSON.stringify(branchPOs)}`);
    }

    console.log(`✅ Retrieved ${branchPOs.length} purchase orders for branch`);

    // Summary
    console.log('\n🎉 Purchase Order API Test Summary:');
    console.log('   ✅ Authentication successful');
    console.log('   ✅ Purchase request creation and submission');
    console.log('   ✅ Purchase order creation from PR');
    console.log('   ✅ Purchase order retrieval (all and specific)');
    console.log('   ✅ Purchase order workflow (send to supplier, confirm)');
    console.log('   ✅ Standalone purchase order creation');
    console.log('   ✅ Branch filtering');
    console.log('\n🚀 All purchase order API tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run the test
testPurchaseOrderAPI();
