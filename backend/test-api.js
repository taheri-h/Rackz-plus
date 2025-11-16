/**
 * Comprehensive API Test Script
 * Tests all backend functionality: Auth, Payments, Setup, Providers
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const SaasPayment = require('./models/SaasPayment');
const SetupRequest = require('./models/SetupRequest');
const SetupPayment = require('./models/SetupPayment');
const ConnectedProvider = require('./models/ConnectedProvider');

const API_URL = 'http://localhost:5001/api';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

async function testConnection() {
  logSection('🔌 Testing Database Connection');
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB,
    });
    log('✅ Database connected successfully', 'green');
    log(`   Database: ${process.env.MONGODB_DB}`, 'blue');
    log(`   URI: ${process.env.MONGODB_URI.replace(/:[^:@]+@/, ':****@')}`, 'blue');
    return true;
  } catch (error) {
    log(`❌ Database connection failed: ${error.message}`, 'red');
    return false;
  }
}

async function testUserCreation() {
  logSection('👤 Testing User Creation & Authentication');
  
  const testEmail = `test_${Date.now()}@fynteq.com`;
  const testPassword = 'TestPassword123!';
  const testName = 'Test User';

  try {
    // Test 1: Create user via API
    log('\n1. Creating user via API...', 'yellow');
    const signupResponse = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: testName,
      }),
    });

    if (!signupResponse.ok) {
      const error = await signupResponse.json();
      throw new Error(error.error || 'Signup failed');
    }

    const signupData = await signupResponse.json();
    log('✅ User created successfully', 'green');
    log(`   User ID: ${signupData.user.id}`, 'blue');
    log(`   Email: ${signupData.user.email}`, 'blue');
    log(`   Name: ${signupData.user.name}`, 'blue');
    log(`   Token received: ${signupData.token ? 'Yes' : 'No'}`, 'blue');

    const token = signupData.token;
    const userId = signupData.user.id;

    // Test 2: Verify user in database
    log('\n2. Verifying user in database...', 'yellow');
    const dbUser = await User.findById(userId);
    if (!dbUser) {
      throw new Error('User not found in database');
    }
    log('✅ User found in database', 'green');
    log(`   Email: ${dbUser.email}`, 'blue');
    log(`   Password hashed: ${dbUser.passwordHash ? 'Yes' : 'No'}`, 'blue');
    log(`   Password hash length: ${dbUser.passwordHash?.length || 0}`, 'blue');

    // Test 3: Test password verification
    log('\n3. Testing password verification...', 'yellow');
    const isPasswordValid = await dbUser.comparePassword(testPassword);
    const isPasswordInvalid = await dbUser.comparePassword('WrongPassword');
    
    if (isPasswordValid && !isPasswordInvalid) {
      log('✅ Password verification works correctly', 'green');
    } else {
      throw new Error('Password verification failed');
    }

    // Test 4: Test signin
    log('\n4. Testing user signin...', 'yellow');
    const signinResponse = await fetch(`${API_URL}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    if (!signinResponse.ok) {
      const error = await signinResponse.json();
      throw new Error(error.error || 'Signin failed');
    }

    const signinData = await signinResponse.json();
    log('✅ Signin successful', 'green');
    log(`   Token received: ${signinData.token ? 'Yes' : 'No'}`, 'blue');

    // Test 5: Test protected route (GET /me)
    log('\n5. Testing protected route (GET /me)...', 'yellow');
    const meResponse = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${signinData.token}`,
      },
    });

    if (!meResponse.ok) {
      const error = await meResponse.json();
      throw new Error(error.error || 'Get me failed');
    }

    const meData = await meResponse.json();
    log('✅ Protected route works', 'green');
    log(`   User email: ${meData.user.email}`, 'blue');
    log(`   User name: ${meData.user.name}`, 'blue');

    return { token: signinData.token, userId, email: testEmail };
  } catch (error) {
    log(`❌ User creation test failed: ${error.message}`, 'red');
    return null;
  }
}

async function testSaaSPayment(authToken, userId) {
  logSection('💳 Testing SaaS Payment Creation');
  
  try {
    log('\n1. Creating SaaS payment...', 'yellow');
    const paymentResponse = await fetch(`${API_URL}/payments/saas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        plan: 'pro',
        billingCycle: 'yearly',
        amountCents: 62600, // €626
        status: 'succeeded',
      }),
    });

    if (!paymentResponse.ok) {
      const error = await paymentResponse.json();
      throw new Error(error.error || 'Payment creation failed');
    }

    const paymentData = await paymentResponse.json();
    log('✅ SaaS payment created', 'green');
    log(`   Payment ID: ${paymentData.payment.id}`, 'blue');
    log(`   Plan: ${paymentData.payment.plan}`, 'blue');
    log(`   Billing: ${paymentData.payment.billingCycle}`, 'blue');
    log(`   Amount: €${(paymentData.payment.amountCents / 100).toFixed(2)}`, 'blue');

    // Verify user entitlements updated
    log('\n2. Verifying user entitlements...', 'yellow');
    const user = await User.findById(userId);
    if (user.entitlements.saasPlan === 'pro') {
      log('✅ User entitlements updated correctly', 'green');
      log(`   SaaS Plan: ${user.entitlements.saasPlan}`, 'blue');
    } else {
      log('⚠️ User entitlements not updated', 'yellow');
    }

    // Test getting payments
    log('\n3. Testing GET payments...', 'yellow');
    const getPaymentsResponse = await fetch(`${API_URL}/payments/saas`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!getPaymentsResponse.ok) {
      throw new Error('Get payments failed');
    }

    const paymentsData = await getPaymentsResponse.json();
    log('✅ Retrieved payments successfully', 'green');
    log(`   Total payments: ${paymentsData.payments.length}`, 'blue');

    return paymentData.payment.id;
  } catch (error) {
    log(`❌ SaaS payment test failed: ${error.message}`, 'red');
    return null;
  }
}

async function testSetupRequest(authToken, userId) {
  logSection('🔧 Testing Setup Request Creation');
  
  try {
    log('\n1. Creating setup request...', 'yellow');
    const setupResponse = await fetch(`${API_URL}/setup/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        packageName: 'checkout',
        contactMethod: 'email',
        details: {
          company: 'Test Company',
          website: 'https://test.com',
        },
      }),
    });

    if (!setupResponse.ok) {
      const error = await setupResponse.json();
      throw new Error(error.error || 'Setup request creation failed');
    }

    const setupData = await setupResponse.json();
    log('✅ Setup request created', 'green');
    log(`   Request ID: ${setupData.setupRequest.id}`, 'blue');
    log(`   Package: ${setupData.setupRequest.packageName}`, 'blue');
    log(`   Full Price: €${(setupData.setupRequest.fullPriceCents / 100).toFixed(2)}`, 'blue');
    log(`   Status: ${setupData.setupRequest.status}`, 'blue');

    const setupRequestId = setupData.setupRequest.id;

    // Test setup payment (upfront)
    log('\n2. Creating upfront payment...', 'yellow');
    const upfrontAmount = Math.ceil(setupData.setupRequest.fullPriceCents / 2);
    const paymentResponse = await fetch(`${API_URL}/setup/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        setupRequestId: setupRequestId,
        chargeType: 'upfront',
        amountCents: upfrontAmount,
        status: 'succeeded',
      }),
    });

    if (!paymentResponse.ok) {
      const error = await paymentResponse.json();
      throw new Error(error.error || 'Setup payment failed');
    }

    const paymentData = await paymentResponse.json();
    log('✅ Upfront payment created', 'green');
    log(`   Payment ID: ${paymentData.payment.id}`, 'blue');
    log(`   Amount: €${(paymentData.payment.amountCents / 100).toFixed(2)}`, 'blue');
    log(`   Request Status: ${paymentData.setupRequest.status}`, 'blue');

    // Test getting setup status
    log('\n3. Testing GET setup status...', 'yellow');
    const statusResponse = await fetch(`${API_URL}/setup/status/${setupRequestId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!statusResponse.ok) {
      throw new Error('Get setup status failed');
    }

    const statusData = await statusResponse.json();
    log('✅ Retrieved setup status successfully', 'green');
    log(`   Status: ${statusData.setupRequest.status}`, 'blue');
    log(`   Upfront Paid: €${(statusData.setupRequest.upfrontPaidCents / 100).toFixed(2)}`, 'blue');
    log(`   Remaining: €${(statusData.setupRequest.remainingCents / 100).toFixed(2)}`, 'blue');

    return setupRequestId;
  } catch (error) {
    log(`❌ Setup request test failed: ${error.message}`, 'red');
    return null;
  }
}

async function testProviderConnection(authToken, userId) {
  logSection('🔌 Testing Provider Connection');
  
  try {
    log('\n1. Connecting Stripe provider...', 'yellow');
    const connectResponse = await fetch(`${API_URL}/providers/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        provider: 'stripe',
        metadata: {
          accountId: 'acct_test_123',
          connectedAt: new Date().toISOString(),
        },
      }),
    });

    if (!connectResponse.ok) {
      const error = await connectResponse.json();
      throw new Error(error.error || 'Provider connection failed');
    }

    const connectData = await connectResponse.json();
    log('✅ Provider connected successfully', 'green');
    log(`   Provider: ${connectData.provider.provider}`, 'blue');
    log(`   Status: ${connectData.provider.status}`, 'blue');

    // Test getting providers
    log('\n2. Testing GET providers...', 'yellow');
    const getProvidersResponse = await fetch(`${API_URL}/providers`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!getProvidersResponse.ok) {
      throw new Error('Get providers failed');
    }

    const providersData = await getProvidersResponse.json();
    log('✅ Retrieved providers successfully', 'green');
    log(`   Connected providers: ${providersData.providers.length}`, 'blue');
    providersData.providers.forEach(p => {
      log(`   - ${p.provider}: ${p.status}`, 'blue');
    });

    // Test disconnecting
    log('\n3. Testing provider disconnection...', 'yellow');
    const disconnectResponse = await fetch(`${API_URL}/providers/stripe`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!disconnectResponse.ok) {
      throw new Error('Provider disconnection failed');
    }

    log('✅ Provider disconnected successfully', 'green');
    return true;
  } catch (error) {
    log(`❌ Provider connection test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testDatabaseCollections() {
  logSection('📊 Testing Database Collections');
  
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    log(`✅ Found ${collections.length} collections:`, 'green');
    
    const expectedCollections = ['users', 'saaspayments', 'setuprequests', 'setuppayments', 'connectedproviders'];
    
    collections.forEach(col => {
      const name = col.name;
      const isExpected = expectedCollections.includes(name);
      const status = isExpected ? '✅' : 'ℹ️';
      log(`   ${status} ${name}`, isExpected ? 'green' : 'blue');
    });

    // Count documents in each collection
    log('\n📈 Document counts:', 'yellow');
    for (const colName of expectedCollections) {
      try {
        const count = await mongoose.connection.db.collection(colName).countDocuments();
        log(`   ${colName}: ${count} documents`, 'blue');
      } catch (err) {
        log(`   ${colName}: Error counting`, 'red');
      }
    }

    return true;
  } catch (error) {
    log(`❌ Database collections test failed: ${error.message}`, 'red');
    return false;
  }
}

async function runAllTests() {
  log('\n🚀 Starting Comprehensive API Tests', 'cyan');
  log('='.repeat(60), 'cyan');

  // Test 1: Database Connection
  const dbConnected = await testConnection();
  if (!dbConnected) {
    log('\n❌ Cannot proceed without database connection', 'red');
    process.exit(1);
  }

  // Test 2: User Creation & Authentication
  const authResult = await testUserCreation();
  if (!authResult) {
    log('\n❌ Cannot proceed without user authentication', 'red');
    await mongoose.connection.close();
    process.exit(1);
  }

  // Test 3: SaaS Payments
  await testSaaSPayment(authResult.token, authResult.userId);

  // Test 4: Setup Requests
  await testSetupRequest(authResult.token, authResult.userId);

  // Test 5: Provider Connections
  await testProviderConnection(authResult.token, authResult.userId);

  // Test 6: Database Collections
  await testDatabaseCollections();

  // Summary
  logSection('✅ All Tests Completed');
  log('Check the results above for any failures.', 'yellow');
  log('All green checkmarks (✅) mean tests passed!', 'green');

  await mongoose.connection.close();
  process.exit(0);
}

// Run tests
runAllTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});

