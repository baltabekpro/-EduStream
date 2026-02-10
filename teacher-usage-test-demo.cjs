/**
 * Teacher Usage Scenario Testing Script - DEMO VERSION
 * 
 * This is a demo version that simulates the test results without requiring
 * actual API access. Use this to see what the testing output looks like.
 * 
 * For real testing, use teacher-usage-test.cjs with a running backend.
 */

const https = require('https');

// ==================== Configuration ====================
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || 'YOUR_API_KEY_HERE';
const OPENROUTER_MODEL = 'mistralai/mistral-small-3.1-24b-instruct:free';

// ==================== Helper Functions ====================

/**
 * Call OpenRouter AI API for analysis
 */
async function callOpenRouterAI(prompt) {
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
      max_tokens: 800
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
 * Log test result with formatting
 */
function logResult(result) {
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
async function analyzeWithAI(result) {
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
    console.log('   🤖 Querying OpenRouter AI...');
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
    console.error('   ⚠️  AI analysis failed:', error.message);
  }

  // Fallback if AI fails
  return {
    scenario: result.scenario,
    analysis: 'AI analysis unavailable',
    usabilityScore: 0,
    recommendations: []
  };
}

// ==================== Simulated Test Results ====================

function getSimulatedResults() {
  const timestamp = new Date().toISOString();
  
  return [
    {
      scenario: 'Authentication (Register & Login)',
      status: 'success',
      details: 'Teacher can successfully register and login. JWT token received.',
      timestamp
    },
    {
      scenario: 'Course Management (Create & List)',
      status: 'success',
      details: 'Teacher can create courses and view them. Created course "Test Course" is visible in list.',
      timestamp
    },
    {
      scenario: 'Material Upload & Retrieval',
      status: 'success',
      details: 'Materials endpoint is accessible. Teachers can upload and retrieve materials.',
      timestamp
    },
    {
      scenario: 'AI Workspace (Quiz Generation)',
      status: 'partial',
      details: 'AI endpoint responded but generation was slow.',
      error: 'Response time exceeded 5 seconds',
      timestamp
    },
    {
      scenario: 'OCR Functionality (Review Queue)',
      status: 'success',
      details: 'OCR review queue is accessible. Currently 3 items awaiting review.',
      timestamp
    },
    {
      scenario: 'Dashboard Overview',
      status: 'success',
      details: 'Dashboard displays course overview with performance metrics and recent activity.',
      timestamp
    },
    {
      scenario: 'Analytics Performance',
      status: 'success',
      details: 'Teachers can view detailed analytics on student performance and topic coverage.',
      timestamp
    },
    {
      scenario: 'User Profile & Settings',
      status: 'success',
      details: 'Teachers can view and update their profile settings including language and notification preferences.',
      timestamp
    }
  ];
}

// ==================== Main Test Runner ====================

async function runDemo() {
  console.log('='.repeat(80));
  console.log('EDUSTREAM PLATFORM - TEACHER USAGE SCENARIO TESTING (DEMO)');
  console.log('='.repeat(80));
  console.log('This is a demo version showing simulated test results.');
  console.log('For real testing, use teacher-usage-test.cjs with a running backend.');
  console.log(`AI Model: ${OPENROUTER_MODEL}`);
  console.log(`Started: ${new Date().toISOString()}`);
  console.log('='.repeat(80));

  const results = getSimulatedResults();
  const analyses = [];

  // Run through all test results
  for (let i = 0; i < results.length; i++) {
    console.log(`\n🧪 Test ${i + 1}/${results.length}: ${results[i].scenario}`);
    logResult(results[i]);
    
    // Get AI analysis for each result
    const analysis = await analyzeWithAI(results[i]);
    analyses.push(analysis);
    
    // Small delay between tests for readability
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Generate final report
  generateFinalReport(results, analyses);
}

// ==================== Report Generation ====================

function generateFinalReport(results, analyses) {
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
    const validScores = analyses.filter(a => a.usabilityScore > 0);
    if (validScores.length > 0) {
      const avgScore = validScores.reduce((sum, a) => sum + a.usabilityScore, 0) / validScores.length;
      console.log(`   Average Usability Score: ${avgScore.toFixed(1)}/10`);
    }
    
    console.log('\n   Individual Scenario Analysis:');
    analyses.forEach((analysis, idx) => {
      if (analysis.usabilityScore > 0) {
        console.log(`\n   ${idx + 1}. ${analysis.scenario}`);
        console.log(`      Score: ${analysis.usabilityScore}/10`);
        console.log(`      Analysis: ${analysis.analysis}`);
        if (analysis.recommendations.length > 0) {
          console.log('      Recommendations:');
          analysis.recommendations.forEach((rec, i) => {
            console.log(`         ${i + 1}. ${rec}`);
          });
        }
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

  console.log('\n📝 KEY FINDINGS:');
  console.log('   1. Authentication system is functional and secure');
  console.log('   2. Course management allows teachers to organize content effectively');
  console.log('   3. AI features provide valuable time-saving automation');
  console.log('   4. OCR functionality streamlines student work review');
  console.log('   5. Analytics provide actionable insights for teachers');

  console.log('\n💡 RECOMMENDATIONS FOR TEACHERS:');
  console.log('   1. Start by creating a course and uploading course materials');
  console.log('   2. Use AI workspace to generate quizzes from uploaded materials');
  console.log('   3. Leverage OCR feature to quickly review handwritten student work');
  console.log('   4. Monitor student progress through the analytics dashboard');
  console.log('   5. Customize notification preferences in settings');

  console.log('\n' + '='.repeat(80));
  console.log(`Test completed at: ${new Date().toISOString()}`);
  console.log('='.repeat(80) + '\n');
}

// ==================== Execute Demo ====================

runDemo().catch((error) => {
  console.error('\n❌ Fatal error during demo execution:');
  console.error(error);
  process.exit(1);
});
