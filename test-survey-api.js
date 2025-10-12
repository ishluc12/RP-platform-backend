/**
 * Test script for Survey API endpoints
 * Run with: node test-survey-api.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let authToken = '';

// Test user credentials (update with your test user)
const TEST_USER = {
  email: 'student@test.com', // Change to your test student email
  password: 'password123'     // Change to your test password
};

const TEST_ADMIN = {
  email: 'admin@test.com',    // Change to your test admin email
  password: 'admin123'         // Change to your test admin password
};

// Helper function to make authenticated requests
async function makeRequest(method, endpoint, data = null, token = authToken) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      data
    };
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

// Test functions
async function testLogin(credentials) {
  console.log('\n🔐 Testing Login...');
  const result = await makeRequest('POST', '/auth/login', credentials, '');
  
  if (result.success && result.data.data?.token) {
    console.log('✅ Login successful');
    console.log('   User:', result.data.data.user.email);
    console.log('   Role:', result.data.data.user.role);
    return result.data.data.token;
  } else {
    console.log('❌ Login failed:', result.error);
    return null;
  }
}

async function testGetVisibleSurveys() {
  console.log('\n📋 Testing GET /shared/surveys/visible...');
  const result = await makeRequest('GET', '/shared/surveys/visible');
  
  if (result.success) {
    console.log('✅ Visible surveys fetched successfully');
    console.log(`   Found ${result.data.data?.length || 0} surveys`);
    if (result.data.data && result.data.data.length > 0) {
      result.data.data.forEach((survey, idx) => {
        console.log(`   ${idx + 1}. ${survey.title} (ID: ${survey.id})`);
        console.log(`      Target: ${survey.target_audience}, Active: ${survey.is_active}`);
      });
    }
    return result.data.data;
  } else {
    console.log('❌ Failed to fetch visible surveys:', result.error);
    return [];
  }
}

async function testGetSurveyDetails(surveyId) {
  console.log(`\n📄 Testing GET /shared/surveys/${surveyId}...`);
  const result = await makeRequest('GET', `/shared/surveys/${surveyId}`);
  
  if (result.success) {
    console.log('✅ Survey details fetched successfully');
    const template = result.data.data?.template;
    const questions = result.data.data?.questions;
    
    if (template) {
      console.log(`   Title: ${template.title}`);
      console.log(`   Description: ${template.description}`);
      console.log(`   Questions: ${questions?.length || 0}`);
      
      if (questions && questions.length > 0) {
        questions.forEach((q, idx) => {
          console.log(`   ${idx + 1}. ${q.question_text} (${q.question_type})`);
          if (q.survey_question_options && q.survey_question_options.length > 0) {
            console.log(`      Options: ${q.survey_question_options.length}`);
          }
        });
      }
    }
    return result.data.data;
  } else {
    console.log('❌ Failed to fetch survey details:', result.error);
    return null;
  }
}

async function testGetSurveyStatus(surveyId) {
  console.log(`\n✓ Testing GET /shared/surveys/${surveyId}/status...`);
  const result = await makeRequest('GET', `/shared/surveys/${surveyId}/status`);
  
  if (result.success) {
    console.log('✅ Survey status fetched successfully');
    console.log(`   Submitted: ${result.data.data?.submitted ? 'Yes' : 'No'}`);
    return result.data.data;
  } else {
    console.log('❌ Failed to fetch survey status:', result.error);
    return null;
  }
}

async function testSubmitSurvey(surveyId, answers) {
  console.log(`\n📝 Testing POST /shared/surveys/${surveyId}/response...`);
  const result = await makeRequest('POST', `/shared/surveys/${surveyId}/response`, { answers });
  
  if (result.success) {
    console.log('✅ Survey submitted successfully');
    return result.data;
  } else {
    console.log('❌ Failed to submit survey:', result.error);
    return null;
  }
}

async function testCreateSurvey(adminToken) {
  console.log('\n➕ Testing POST /shared/surveys (admin only)...');
  const newSurvey = {
    title: 'Test Survey from API',
    description: 'This is a test survey created via API',
    target_audience: 'students',
    is_active: true,
    is_anonymous: false,
    allow_multiple_submissions: false
  };
  
  const result = await makeRequest('POST', '/shared/surveys', newSurvey, adminToken);
  
  if (result.success) {
    console.log('✅ Survey created successfully');
    console.log(`   Survey ID: ${result.data.data?.id}`);
    return result.data.data;
  } else {
    console.log('❌ Failed to create survey:', result.error);
    console.log(`   Status: ${result.status}`);
    return null;
  }
}

// Main test runner
async function runTests() {
  console.log('='.repeat(60));
  console.log('🧪 SURVEY API TEST SUITE');
  console.log('='.repeat(60));
  
  // Test 1: Login as student
  authToken = await testLogin(TEST_USER);
  if (!authToken) {
    console.log('\n❌ Cannot proceed without authentication. Please check credentials.');
    return;
  }
  
  // Test 2: Get visible surveys
  const surveys = await testGetVisibleSurveys();
  
  // Test 3: Get survey details (if surveys exist)
  if (surveys && surveys.length > 0) {
    const firstSurvey = surveys[0];
    await testGetSurveyDetails(firstSurvey.id);
    await testGetSurveyStatus(firstSurvey.id);
    
    // Test 4: Submit a survey (optional - uncomment to test)
    // const sampleAnswers = [
    //   { question_id: 'q1111111-1111-1111-1111-111111111111', rating_answer: 5 },
    //   { question_id: 'q1111111-1111-1111-1111-111111111113', text_answer: 'Great course!' }
    // ];
    // await testSubmitSurvey(firstSurvey.id, sampleAnswers);
  }
  
  // Test 5: Admin operations (login as admin first)
  console.log('\n' + '='.repeat(60));
  console.log('🔧 TESTING ADMIN OPERATIONS');
  console.log('='.repeat(60));
  
  const adminToken = await testLogin(TEST_ADMIN);
  if (adminToken) {
    await testCreateSurvey(adminToken);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ TEST SUITE COMPLETED');
  console.log('='.repeat(60));
}

// Run the tests
runTests().catch(error => {
  console.error('\n❌ Test suite failed with error:', error.message);
  process.exit(1);
});
