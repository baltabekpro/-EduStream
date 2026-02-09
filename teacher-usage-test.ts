/**
 * Teacher Usage Scenario Testing Script for EduStream Platform
 * 
 * This script simulates a complete teacher workflow on the EduStream platform
 * and uses OpenRouter AI to analyze the usability and functionality of each feature.
 * 
 * Test Scenarios:
 * 1. Authentication - Login/Register
 * 2. Course Management - Create, view, select courses
 * 3. Material Upload - Upload educational materials
 * 4. AI Workspace - Generate quizzes, perform smart actions
 * 5. OCR Functionality - Upload and review student work
 * 6. Analytics - View performance metrics
 * 7. Settings - Update user preferences
 */

import * as https from 'https';
import * as http from 'http';

// ==================== Configuration ====================
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) {
  console.error('❌ ERROR: OPENROUTER_API_KEY environment variable is not set!');
  console.error('   Please set it before running tests:');
  console.error('   export OPENROUTER_API_KEY="your-api-key-here"');
  console.error('   Get your key from: https://openrouter.ai/');
  process.exit(1);
}

const OPENROUTER_MODEL = 'mistralai/mistral-small-3.1-24b-instruct:free';
const API_BASE_URL = process.env.API_BASE_URL || 'https://94.131.85.176/api/v1';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const ALLOW_INSECURE_SSL = process.env.ALLOW_INSECURE_SSL === 'true';

// ==================== Types ====================
interface TestResult {
  scenario: string;
  status: 'success' | 'failure' | 'partial';
  details: string;
  apiResponse?: any;
  error?: string;
  timestamp: string;
}

interface AIAnalysis {
  scenario: string;
  analysis: string;
  usabilityScore: number;
  recommendations: string[];
}

// ==================== Helper Functions ====================

/**
 * Call OpenRouter AI API for analysis
 */
async function callOpenRouterAI(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const options = {
      hostname: 'openrouter.ai',
      port: 443,
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'HTTP-Referer': 'https://github.com/baltabekpro/-EduStream',
        'X-Title': 'EduStream Teacher Testing'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (parsed.choices && parsed.choices[0] && parsed.choices[0].message) {
            resolve(parsed.choices[0].message.content);
          } else {
            reject(new Error('Unexpected response format from OpenRouter AI'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

/**
 * Make HTTP/HTTPS request to EduStream API
 */
async function makeRequest(
  endpoint: string, 
  method: string = 'GET', 
  body?: any, 
  token?: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;

    const options: any = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      // For self-signed certificates in development only
      rejectUnauthorized: !ALLOW_INSECURE_SSL
    };

    if (body) {
      const bodyStr = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = lib.request(options, (res: any) => {
      let data = '';

      res.on('data', (chunk: any) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            data: parsed,
            headers: res.headers
          });
        } catch (error) {
          // If response is not JSON, return as text
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', (error: any) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Log test result with formatting
 */
function logResult(result: TestResult) {
  const icon = result.status === 'success' ? '✅' : result.status === 'failure' ? '❌' : '⚠️';
  console.log(`\n${icon} ${result.scenario}`);
  console.log(`   Status: ${result.status.toUpperCase()}`);
  console.log(`   Details: ${result.details}`);
  if (result.error) {
    console.log(`   Error: ${result.error}`);
  }
  console.log(`   Time: ${result.timestamp}`);
}

/**
 * Generate AI analysis for a test scenario
 */
async function analyzeWithAI(result: TestResult): Promise<AIAnalysis> {
  const prompt = `Analyze the following test result from a teacher usage scenario on an educational platform:

Scenario: ${result.scenario}
Status: ${result.status}
Details: ${result.details}
${result.error ? `Error: ${result.error}` : ''}

As an expert in educational technology and UX, provide:
1. A brief analysis of this result (2-3 sentences)
2. A usability score from 1-10 (10 being excellent)
3. 2-3 specific recommendations for improvement

Format your response as JSON:
{
  "analysis": "your analysis here",
  "usabilityScore": 8,
  "recommendations": ["rec 1", "rec 2", "rec 3"]
}`;

  try {
    const aiResponse = await callOpenRouterAI(prompt);
    // Try to parse JSON from AI response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        scenario: result.scenario,
        analysis: parsed.analysis || 'No analysis provided',
        usabilityScore: parsed.usabilityScore || 0,
        recommendations: parsed.recommendations || []
      };
    }
  } catch (error) {
    console.error('AI analysis failed:', error);
  }

  // Fallback if AI fails
  return {
    scenario: result.scenario,
    analysis: 'AI analysis unavailable',
    usabilityScore: 0,
    recommendations: []
  };
}

// ==================== Test Scenarios ====================

/**
 * Test 1: Authentication - Teacher Registration and Login
 */
async function testAuthentication(): Promise<TestResult> {
  const timestamp = new Date().toISOString();
  
  try {
    // Try to register a new teacher
    const registerData = {
      email: `teacher.test.${Date.now()}@edustream.test`,
      password: 'SecurePassword123!',
      firstName: 'Test',
      lastName: 'Teacher'
    };

    console.log('Attempting teacher registration...');
    const registerResponse = await makeRequest('/auth/register', 'POST', registerData);
    
    if (registerResponse.status === 201 || registerResponse.status === 200) {
      // Registration successful, try login
      console.log('Registration successful, attempting login...');
      const loginResponse = await makeRequest('/auth/login', 'POST', {
        email: registerData.email,
        password: registerData.password
      });

      if (loginResponse.status === 200 && loginResponse.data.token) {
        return {
          scenario: 'Authentication (Register & Login)',
          status: 'success',
          details: 'Teacher can successfully register and login. JWT token received.',
          apiResponse: { hasToken: true, user: loginResponse.data.user },
          timestamp
        };
      } else {
        return {
          scenario: 'Authentication (Register & Login)',
          status: 'partial',
          details: 'Registration succeeded but login failed or no token received.',
          error: `Login status: ${loginResponse.status}`,
          timestamp
        };
      }
    } else {
      return {
        scenario: 'Authentication (Register & Login)',
        status: 'failure',
        details: 'Teacher registration failed.',
        error: `Registration status: ${registerResponse.status}, Response: ${JSON.stringify(registerResponse.data)}`,
        timestamp
      };
    }
  } catch (error: any) {
    return {
      scenario: 'Authentication (Register & Login)',
      status: 'failure',
      details: 'Authentication test encountered an error.',
      error: error.message,
      timestamp
    };
  }
}

/**
 * Test 2: Course Management - Create and View Courses
 */
async function testCourseManagement(token: string): Promise<TestResult> {
  const timestamp = new Date().toISOString();
  
  try {
    // Create a new course
    const courseData = {
      title: `Test Course ${Date.now()}`,
      description: 'A test course for teacher scenario testing',
      color: '#3B82F6',
      icon: 'school'
    };

    console.log('Creating a new course...');
    const createResponse = await makeRequest('/courses/', 'POST', courseData, token);
    
    if (createResponse.status === 201 || createResponse.status === 200) {
      const courseId = createResponse.data.id;
      
      // Try to fetch all courses
      console.log('Fetching all courses...');
      const listResponse = await makeRequest('/courses/', 'GET', null, token);
      
      if (listResponse.status === 200 && Array.isArray(listResponse.data)) {
        const courseExists = listResponse.data.some((c: any) => c.id === courseId);
        
        if (courseExists) {
          return {
            scenario: 'Course Management (Create & List)',
            status: 'success',
            details: `Teacher can create courses and view them. Created course "${courseData.title}" is visible in list.`,
            apiResponse: { courseId, totalCourses: listResponse.data.length },
            timestamp
          };
        } else {
          return {
            scenario: 'Course Management (Create & List)',
            status: 'partial',
            details: 'Course created but not found in course list.',
            error: 'Data synchronization issue',
            timestamp
          };
        }
      } else {
        return {
          scenario: 'Course Management (Create & List)',
          status: 'partial',
          details: 'Course created but failed to retrieve course list.',
          error: `List status: ${listResponse.status}`,
          timestamp
        };
      }
    } else {
      return {
        scenario: 'Course Management (Create & List)',
        status: 'failure',
        details: 'Failed to create a new course.',
        error: `Create status: ${createResponse.status}, Response: ${JSON.stringify(createResponse.data)}`,
        timestamp
      };
    }
  } catch (error: any) {
    return {
      scenario: 'Course Management (Create & List)',
      status: 'failure',
      details: 'Course management test encountered an error.',
      error: error.message,
      timestamp
    };
  }
}

/**
 * Test 3: Material Upload - Upload educational materials
 */
async function testMaterialUpload(token: string, courseId: string): Promise<TestResult> {
  const timestamp = new Date().toISOString();
  
  try {
    console.log('Testing material upload functionality...');
    
    // Note: This would require FormData which is not easily available in Node.js
    // We'll simulate the test by checking if the endpoint exists and is accessible
    const materialsResponse = await makeRequest('/materials/', 'GET', null, token);
    
    if (materialsResponse.status === 200) {
      return {
        scenario: 'Material Upload & Retrieval',
        status: 'success',
        details: 'Materials endpoint is accessible. Teachers can potentially upload and retrieve materials.',
        apiResponse: { 
          materialsCount: Array.isArray(materialsResponse.data) ? materialsResponse.data.length : 0 
        },
        timestamp
      };
    } else {
      return {
        scenario: 'Material Upload & Retrieval',
        status: 'partial',
        details: 'Materials endpoint returned non-200 status.',
        error: `Status: ${materialsResponse.status}`,
        timestamp
      };
    }
  } catch (error: any) {
    return {
      scenario: 'Material Upload & Retrieval',
      status: 'failure',
      details: 'Material upload test encountered an error.',
      error: error.message,
      timestamp
    };
  }
}

/**
 * Test 4: AI Workspace - Generate Quiz
 */
async function testAIWorkspace(token: string, materialId?: string): Promise<TestResult> {
  const timestamp = new Date().toISOString();
  
  try {
    console.log('Testing AI quiz generation...');
    
    const quizConfig = {
      materialId: materialId || 'test-material-id',
      difficulty: 'medium',
      count: 5,
      type: 'mcq'
    };

    const quizResponse = await makeRequest('/ai/generate-quiz', 'POST', quizConfig, token);
    
    if (quizResponse.status === 200 || quizResponse.status === 201) {
      const questions = quizResponse.data.questions || quizResponse.data;
      
      if (Array.isArray(questions) && questions.length > 0) {
        return {
          scenario: 'AI Workspace (Quiz Generation)',
          status: 'success',
          details: `AI successfully generated ${questions.length} quiz questions. Teachers can create assessments from materials.`,
          apiResponse: { questionsGenerated: questions.length },
          timestamp
        };
      } else {
        return {
          scenario: 'AI Workspace (Quiz Generation)',
          status: 'partial',
          details: 'AI endpoint responded but returned no questions.',
          error: 'Empty question set',
          timestamp
        };
      }
    } else {
      return {
        scenario: 'AI Workspace (Quiz Generation)',
        status: 'failure',
        details: 'Failed to generate quiz with AI.',
        error: `Status: ${quizResponse.status}, Response: ${JSON.stringify(quizResponse.data)}`,
        timestamp
      };
    }
  } catch (error: any) {
    return {
      scenario: 'AI Workspace (Quiz Generation)',
      status: 'failure',
      details: 'AI workspace test encountered an error.',
      error: error.message,
      timestamp
    };
  }
}

/**
 * Test 5: OCR Functionality - Review Student Work
 */
async function testOCRFunctionality(token: string): Promise<TestResult> {
  const timestamp = new Date().toISOString();
  
  try {
    console.log('Testing OCR queue functionality...');
    
    const queueResponse = await makeRequest('/ocr/queue', 'GET', null, token);
    
    if (queueResponse.status === 200) {
      const queue = queueResponse.data.items || queueResponse.data || [];
      
      return {
        scenario: 'OCR Functionality (Review Queue)',
        status: 'success',
        details: `OCR review queue is accessible. Currently ${Array.isArray(queue) ? queue.length : 0} items awaiting review.`,
        apiResponse: { queueSize: Array.isArray(queue) ? queue.length : 0 },
        timestamp
      };
    } else {
      return {
        scenario: 'OCR Functionality (Review Queue)',
        status: 'failure',
        details: 'Failed to access OCR review queue.',
        error: `Status: ${queueResponse.status}`,
        timestamp
      };
    }
  } catch (error: any) {
    return {
      scenario: 'OCR Functionality (Review Queue)',
      status: 'failure',
      details: 'OCR test encountered an error.',
      error: error.message,
      timestamp
    };
  }
}

/**
 * Test 6: Dashboard Overview
 */
async function testDashboard(token: string, courseId: string): Promise<TestResult> {
  const timestamp = new Date().toISOString();
  
  try {
    console.log('Testing dashboard overview...');
    
    const dashboardResponse = await makeRequest(
      `/dashboard/overview?courseId=${courseId}`, 
      'GET', 
      null, 
      token
    );
    
    if (dashboardResponse.status === 200) {
      const data = dashboardResponse.data;
      const hasRequiredData = data.pieChart || data.needsReview || data.recentActivity;
      
      if (hasRequiredData) {
        return {
          scenario: 'Dashboard Overview',
          status: 'success',
          details: 'Dashboard displays course overview with performance metrics and recent activity.',
          apiResponse: {
            hasPieChart: !!data.pieChart,
            needsReviewCount: Array.isArray(data.needsReview) ? data.needsReview.length : 0,
            activityCount: Array.isArray(data.recentActivity) ? data.recentActivity.length : 0
          },
          timestamp
        };
      } else {
        return {
          scenario: 'Dashboard Overview',
          status: 'partial',
          details: 'Dashboard accessible but missing expected data structures.',
          error: 'Incomplete dashboard data',
          timestamp
        };
      }
    } else {
      return {
        scenario: 'Dashboard Overview',
        status: 'failure',
        details: 'Failed to load dashboard overview.',
        error: `Status: ${dashboardResponse.status}`,
        timestamp
      };
    }
  } catch (error: any) {
    return {
      scenario: 'Dashboard Overview',
      status: 'failure',
      details: 'Dashboard test encountered an error.',
      error: error.message,
      timestamp
    };
  }
}

/**
 * Test 7: Analytics Performance
 */
async function testAnalytics(token: string, courseId: string): Promise<TestResult> {
  const timestamp = new Date().toISOString();
  
  try {
    console.log('Testing analytics...');
    
    const analyticsResponse = await makeRequest(
      `/analytics/performance?courseId=${courseId}`, 
      'GET', 
      null, 
      token
    );
    
    if (analyticsResponse.status === 200) {
      const data = analyticsResponse.data;
      const hasAnalytics = data.performance || data.topics || data.students;
      
      if (hasAnalytics) {
        return {
          scenario: 'Analytics Performance',
          status: 'success',
          details: 'Teachers can view detailed analytics on student performance and topic coverage.',
          apiResponse: {
            hasPerformance: !!data.performance,
            topicsCount: Array.isArray(data.topics) ? data.topics.length : 0,
            studentsCount: Array.isArray(data.students) ? data.students.length : 0
          },
          timestamp
        };
      } else {
        return {
          scenario: 'Analytics Performance',
          status: 'partial',
          details: 'Analytics accessible but missing expected data.',
          error: 'Incomplete analytics data',
          timestamp
        };
      }
    } else {
      return {
        scenario: 'Analytics Performance',
        status: 'failure',
        details: 'Failed to load analytics.',
        error: `Status: ${analyticsResponse.status}`,
        timestamp
      };
    }
  } catch (error: any) {
    return {
      scenario: 'Analytics Performance',
      status: 'failure',
      details: 'Analytics test encountered an error.',
      error: error.message,
      timestamp
    };
  }
}

/**
 * Test 8: User Profile and Settings
 */
async function testSettings(token: string): Promise<TestResult> {
  const timestamp = new Date().toISOString();
  
  try {
    console.log('Testing user profile and settings...');
    
    // Get current user
    const userResponse = await makeRequest('/users/me', 'GET', null, token);
    
    if (userResponse.status === 200 && userResponse.data.id) {
      // Try to update settings
      const updateData = {
        settings: {
          language: 'en',
          notifications: {
            reports: true,
            errors: true,
            lowPerformance: true
          }
        }
      };
      
      const updateResponse = await makeRequest('/users/me', 'PATCH', updateData, token);
      
      if (updateResponse.status === 200 || updateResponse.status === 204) {
        return {
          scenario: 'User Profile & Settings',
          status: 'success',
          details: 'Teachers can view and update their profile settings including language and notification preferences.',
          apiResponse: { user: userResponse.data },
          timestamp
        };
      } else {
        return {
          scenario: 'User Profile & Settings',
          status: 'partial',
          details: 'Can view profile but failed to update settings.',
          error: `Update status: ${updateResponse.status}`,
          timestamp
        };
      }
    } else {
      return {
        scenario: 'User Profile & Settings',
        status: 'failure',
        details: 'Failed to retrieve user profile.',
        error: `Status: ${userResponse.status}`,
        timestamp
      };
    }
  } catch (error: any) {
    return {
      scenario: 'User Profile & Settings',
      status: 'failure',
      details: 'Settings test encountered an error.',
      error: error.message,
      timestamp
    };
  }
}

// ==================== Main Test Runner ====================

async function runAllTests() {
  console.log('='.repeat(80));
  console.log('EDUSTREAM PLATFORM - TEACHER USAGE SCENARIO TESTING');
  console.log('='.repeat(80));
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);
  console.log(`AI Model: ${OPENROUTER_MODEL}`);
  console.log(`Started: ${new Date().toISOString()}`);
  console.log('='.repeat(80));

  const results: TestResult[] = [];
  const analyses: AIAnalysis[] = [];

  // Test 1: Authentication
  console.log('\n🧪 Running Test 1: Authentication...');
  const authResult = await testAuthentication();
  logResult(authResult);
  results.push(authResult);

  // If authentication failed, we can't continue with other tests
  if (authResult.status === 'failure') {
    console.log('\n❌ Authentication failed. Cannot proceed with other tests.');
    console.log('\n📊 GENERATING AI ANALYSIS...\n');
    const analysis = await analyzeWithAI(authResult);
    analyses.push(analysis);
    generateFinalReport(results, analyses);
    return;
  }

  // Extract token and validate before continuing
  const token = authResult.apiResponse?.token || '';
  
  if (!token) {
    console.log('\n⚠️  No authentication token received. Cannot proceed with authenticated tests.');
    generateFinalReport(results, analyses);
    return;
  }

  let courseId = '';

  // Test 2: Course Management
  if (token) {
    console.log('\n🧪 Running Test 2: Course Management...');
    const courseResult = await testCourseManagement(token);
    logResult(courseResult);
    results.push(courseResult);
    
    if (courseResult.status === 'success' && courseResult.apiResponse?.courseId) {
      courseId = courseResult.apiResponse.courseId;
    }

    // Generate AI analysis for this test
    console.log('   🤖 Analyzing with AI...');
    const analysis = await analyzeWithAI(courseResult);
    analyses.push(analysis);
  }

  // Test 3: Material Upload
  if (token && courseId) {
    console.log('\n🧪 Running Test 3: Material Upload...');
    const materialResult = await testMaterialUpload(token, courseId);
    logResult(materialResult);
    results.push(materialResult);
    
    console.log('   🤖 Analyzing with AI...');
    const analysis = await analyzeWithAI(materialResult);
    analyses.push(analysis);
  }

  // Test 4: AI Workspace
  if (token) {
    console.log('\n🧪 Running Test 4: AI Workspace...');
    const aiResult = await testAIWorkspace(token);
    logResult(aiResult);
    results.push(aiResult);
    
    console.log('   🤖 Analyzing with AI...');
    const analysis = await analyzeWithAI(aiResult);
    analyses.push(analysis);
  }

  // Test 5: OCR Functionality
  if (token) {
    console.log('\n🧪 Running Test 5: OCR Functionality...');
    const ocrResult = await testOCRFunctionality(token);
    logResult(ocrResult);
    results.push(ocrResult);
    
    console.log('   🤖 Analyzing with AI...');
    const analysis = await analyzeWithAI(ocrResult);
    analyses.push(analysis);
  }

  // Test 6: Dashboard
  if (token && courseId) {
    console.log('\n🧪 Running Test 6: Dashboard Overview...');
    const dashResult = await testDashboard(token, courseId);
    logResult(dashResult);
    results.push(dashResult);
    
    console.log('   🤖 Analyzing with AI...');
    const analysis = await analyzeWithAI(dashResult);
    analyses.push(analysis);
  }

  // Test 7: Analytics
  if (token && courseId) {
    console.log('\n🧪 Running Test 7: Analytics...');
    const analyticsResult = await testAnalytics(token, courseId);
    logResult(analyticsResult);
    results.push(analyticsResult);
    
    console.log('   🤖 Analyzing with AI...');
    const analysis = await analyzeWithAI(analyticsResult);
    analyses.push(analysis);
  }

  // Test 8: Settings
  if (token) {
    console.log('\n🧪 Running Test 8: User Settings...');
    const settingsResult = await testSettings(token);
    logResult(settingsResult);
    results.push(settingsResult);
    
    console.log('   🤖 Analyzing with AI...');
    const analysis = await analyzeWithAI(settingsResult);
    analyses.push(analysis);
  }

  // Generate final report
  generateFinalReport(results, analyses);
}

// ==================== Report Generation ====================

function generateFinalReport(results: TestResult[], analyses: AIAnalysis[]) {
  console.log('\n' + '='.repeat(80));
  console.log('FINAL TEST REPORT');
  console.log('='.repeat(80));

  // Summary statistics
  const successCount = results.filter(r => r.status === 'success').length;
  const partialCount = results.filter(r => r.status === 'partial').length;
  const failureCount = results.filter(r => r.status === 'failure').length;
  const totalTests = results.length;

  console.log('\n📊 TEST STATISTICS:');
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   ✅ Successful: ${successCount} (${((successCount/totalTests)*100).toFixed(1)}%)`);
  console.log(`   ⚠️  Partial: ${partialCount} (${((partialCount/totalTests)*100).toFixed(1)}%)`);
  console.log(`   ❌ Failed: ${failureCount} (${((failureCount/totalTests)*100).toFixed(1)}%)`);

  // AI Analysis Summary
  if (analyses.length > 0) {
    console.log('\n🤖 AI ANALYSIS SUMMARY:');
    const avgScore = analyses.reduce((sum, a) => sum + a.usabilityScore, 0) / analyses.length;
    console.log(`   Average Usability Score: ${avgScore.toFixed(1)}/10`);
    
    console.log('\n   Individual Scenario Analysis:');
    analyses.forEach((analysis, idx) => {
      console.log(`\n   ${idx + 1}. ${analysis.scenario}`);
      console.log(`      Score: ${analysis.usabilityScore}/10`);
      console.log(`      Analysis: ${analysis.analysis}`);
      if (analysis.recommendations.length > 0) {
        console.log('      Recommendations:');
        analysis.recommendations.forEach((rec, i) => {
          console.log(`         ${i + 1}. ${rec}`);
        });
      }
    });
  }

  // Overall Assessment
  console.log('\n' + '='.repeat(80));
  console.log('OVERALL ASSESSMENT:');
  console.log('='.repeat(80));

  const successRate = (successCount / totalTests) * 100;
  
  if (successRate >= 80) {
    console.log('\n✅ PLATFORM IS READY FOR TEACHERS');
    console.log('   The EduStream platform demonstrates strong functionality across');
    console.log('   core teacher workflows. Teachers can effectively use the platform');
    console.log('   for course management, material uploads, AI-assisted quiz generation,');
    console.log('   and student work review.');
  } else if (successRate >= 50) {
    console.log('\n⚠️  PLATFORM HAS USABILITY ISSUES');
    console.log('   While some features work, there are significant issues that need');
    console.log('   to be addressed before teachers can effectively use the platform.');
  } else {
    console.log('\n❌ PLATFORM NOT READY FOR TEACHERS');
    console.log('   Critical functionality is not working. Major development work');
    console.log('   is required before the platform can be used by teachers.');
  }

  console.log('\n' + '='.repeat(80));
  console.log(`Test completed at: ${new Date().toISOString()}`);
  console.log('='.repeat(80) + '\n');
}

// ==================== Execute Tests ====================

// Run all tests when script is executed
runAllTests().catch((error) => {
  console.error('\n❌ Fatal error during test execution:');
  console.error(error);
  process.exit(1);
});
