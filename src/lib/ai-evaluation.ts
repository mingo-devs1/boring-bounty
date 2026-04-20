/**
 * AI Evaluation System for Boring Bounty Submissions
 * Uses OpenAI gpt-4o-mini to analyze code quality, relevance, completeness, innovation, and technical soundness
 * 
 * RATE LIMITING NOTE: 
 * - Current implementation does not have rate limiting or queuing
 * - For production, implement a queue system (e.g., BullMQ) to handle multiple AI evaluations
 * - Add rate limiting based on OpenAI API limits (RPM/TPM)
 * - Consider caching GitHub content to reduce API calls
 */

export interface AIEvaluationInput {
  bounty_title: string;
  bounty_description: string;
  bounty_required_skills: string[];
  submission_description: string;
  github_link?: string;
  demo_link?: string;
  builder_skills?: string[];
  github_content?: string; // Optional: fetched GitHub README/content
}

export interface AIEvaluationResult {
  score: number; // 0-100
  feedback: string;
  breakdown: {
    code_quality: number;
    relevance: number;
    completeness: number;
    innovation: number;
    technical_soundness: number;
  };
  strengths: string[];
  improvements: string[];
  confidence_score: number; // 0-100
  cost_estimate?: number; // in USD
  raw_response?: any; // Full AI response for transparency
}

/**
 * Fetch GitHub README + main code files for AI evaluation
 * Limited to prevent excessive token usage (max ~4000 chars total)
 * Handles private repos gracefully with fallback message
 */
async function fetchGitHubContent(githubUrl: string): Promise<string> {
  try {
    // Extract owner/repo from GitHub URL
    const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) return '';

    const [, owner, repo] = match;

    let content = '';
    let isPrivate = false;

    // Fetch README from GitHub API
    try {
      const readmeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
        headers: {
          Accept: 'application/vnd.github.v3+raw',
        },
      });

      if (readmeResponse.ok) {
        const readme = await readmeResponse.text();
        content += `README:\n${readme.slice(0, 1500)}\n\n`;
      } else if (readmeResponse.status === 404 || readmeResponse.status === 403) {
        // Repository may be private or not found
        isPrivate = true;
        console.log('GitHub repo may be private or not found');
      }
    } catch (e) {
      console.log('README fetch failed, continuing...');
    }

    // Fetch repository contents to find main code files
    if (!isPrivate) {
      try {
        const contentsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/`, {
          headers: {
            Accept: 'application/vnd.github.v3+json',
          },
        });

        if (contentsResponse.ok) {
          const contents = await contentsResponse.json();
          
          // Find common main files (index.js, index.ts, main.py, etc.)
          const mainFiles = contents
            .filter((item: any) => item.type === 'file' && 
              ['index', 'main', 'app', 'server'].some(name => item.name.toLowerCase().includes(name)))
            .slice(0, 3);

          for (const file of mainFiles) {
            try {
              const fileResponse = await fetch(file.url, {
                headers: {
                  Accept: 'application/vnd.github.v3.raw',
                },
              });

              if (fileResponse.ok) {
                const fileContent = await fileResponse.text();
                content += `${file.name}:\n${fileContent.slice(0, 500)}\n\n`;
              }
            } catch (e) {
              continue;
            }
          }
        } else if (contentsResponse.status === 404 || contentsResponse.status === 403) {
          isPrivate = true;
        }
      } catch (e) {
        console.log('Contents fetch failed, continuing...');
      }
    }

    // If repository appears to be private, add a note
    if (isPrivate && content.length === 0) {
      return 'Note: GitHub repository appears to be private or could not be accessed. Evaluation based on provided description and other factors only.';
    }

    // Limit total content to prevent excessive token usage (max 4000 chars)
    return content.slice(0, 4000);
  } catch (error) {
    console.error('GitHub fetch error:', error);
    return 'Note: Unable to fetch GitHub content. Evaluation based on provided description and other factors only.';
  }
}

/**
 * Evaluate a submission using AI (OpenAI gpt-4o-mini) with retry logic
 */
export async function evaluateSubmissionWithAI(
  input: AIEvaluationInput,
  maxRetries: number = 2
): Promise<AIEvaluationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      score: 50,
      feedback: 'AI evaluation not configured. Using basic scoring system.',
      breakdown: {
        code_quality: 50,
        relevance: 50,
        completeness: 50,
        innovation: 50,
        technical_soundness: 50,
      },
      strengths: [],
      improvements: [],
      confidence_score: 0,
    };
  }

  // Fetch GitHub content if link provided
  let githubContent = input.github_content || '';
  if (input.github_link && !githubContent) {
    githubContent = await fetchGitHubContent(input.github_link);
  }

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Extract judging context from bounty description (first 200 chars)
      const judgingContext = input.bounty_description.slice(0, 200) + (input.bounty_description.length > 200 ? '...' : '');

      const prompt = `
You are an expert code reviewer and technical evaluator for a bounty platform. Your role is to evaluate submissions objectively, fairly, and constructively.

IMPORTANT PRINCIPLES:
- Be objective and unbiased in your evaluation
- Do not hallucinate or make assumptions beyond the provided information
- If information is insufficient, state that clearly and adjust your confidence accordingly
- Provide actionable, specific feedback that helps builders improve
- Consider the context of the bounty requirements and real-world constraints
- Be fair but rigorous in your assessment

JUDGING CONTEXT:
${judgingContext}

BOUNTY DETAILS:
Title: ${input.bounty_title}
Description: ${input.bounty_description}
Required Skills: ${input.bounty_required_skills.join(', ')}

SUBMISSION DETAILS:
Description: ${input.submission_description}
GitHub Link: ${input.github_link || 'Not provided'}
${githubContent ? `\nGITHUB CONTENT (README + MAIN FILES):\n${githubContent}\n` : ''}
Demo Link: ${input.demo_link || 'Not provided'}
Builder Skills: ${input.builder_skills?.join(', ') || 'Not provided'}

EVALUATION RUBRIC (Score each 0-100):

1. CODE QUALITY (20% weight)
   - Code structure and organization
   - Adherence to best practices and conventions
   - Readability and maintainability
   - Proper error handling
   - Code documentation and comments

2. RELEVANCE (25% weight)
   - How well the submission addresses the bounty requirements
   - Alignment with bounty goals and objectives
   - Use of required skills and technologies
   - Practical applicability to the problem

3. COMPLETENESS (20% weight)
   - How complete and polished the solution is
   - Edge cases handled appropriately
   - Feature completeness relative to requirements
   - Production-readiness

4. INNOVATION (15% weight)
   - Creative solutions and unique approaches
   - Problem-solving ability
   - Original thinking
   - Novel use of technologies

5. TECHNICAL SOUNDNESS (20% weight)
   - Performance considerations
   - Security best practices
   - Scalability and architecture
   - Testing and validation

SCORING GUIDELINES:
- 90-100: Exceptional, exceeds expectations
- 80-89: Strong, meets expectations well
- 70-79: Good, meets basic expectations
- 60-69: Acceptable, has notable issues
- Below 60: Needs significant improvement

CONFIDENCE SCORE:
- 90-100: High confidence (complete information, clear criteria)
- 70-89: Moderate confidence (some ambiguity or missing info)
- 50-69: Low confidence (significant missing information)
- Below 50: Very low confidence (insufficient information for fair evaluation)

IMPORTANT: Always include a reminder that this is an AI evaluation and organizations should review manually before making final decisions.

Provide your evaluation in the following JSON format:
{
  "score": <overall score 0-100, weighted average of all criteria>,
  "feedback": "<detailed feedback paragraph (2-3 sentences summarizing the evaluation)>",
  "breakdown": {
    "code_quality": <0-100>,
    "relevance": <0-100>,
    "completeness": <0-100>,
    "innovation": <0-100>,
    "technical_soundness": <0-100>
  },
  "strengths": ["<specific strength 1>", "<specific strength 2>", "<specific strength 3>"],
  "improvements": ["<specific improvement 1>", "<specific improvement 2>", "<specific improvement 3>"],
  "confidence_score": <0-100 based on how confident you are in your evaluation>
}

Return ONLY the JSON, no additional text or markdown formatting.
`;

      const startTime = Date.now();
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert code reviewer. Always respond with valid JSON only. Be objective, fair, and constructive.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.2,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      // Calculate cost estimation (gpt-4o-mini: $0.15/1M input, $0.60/1M output)
      const inputTokens = data.usage?.prompt_tokens || 0;
      const outputTokens = data.usage?.completion_tokens || 0;
      const costEstimate = (inputTokens * 0.15 / 1_000_000) + (outputTokens * 0.60 / 1_000_000);

      // Parse the JSON response
      const evaluation = JSON.parse(content);

      // Validate and structure the response
      const result: AIEvaluationResult = {
        score: Math.min(Math.max(evaluation.score || 50, 0), 100),
        feedback: evaluation.feedback || 'No feedback provided',
        breakdown: {
          code_quality: Math.min(Math.max(evaluation.breakdown?.code_quality || 50, 0), 100),
          relevance: Math.min(Math.max(evaluation.breakdown?.relevance || 50, 0), 100),
          completeness: Math.min(Math.max(evaluation.breakdown?.completeness || 50, 0), 100),
          innovation: Math.min(Math.max(evaluation.breakdown?.innovation || 50, 0), 100),
          technical_soundness: Math.min(Math.max(evaluation.breakdown?.technical_soundness || 50, 0), 100),
        },
        strengths: evaluation.strengths || [],
        improvements: evaluation.improvements || [],
        confidence_score: Math.min(Math.max(evaluation.confidence_score || 50, 0), 100),
        cost_estimate: costEstimate,
        raw_response: evaluation, // Store full AI response for transparency
      };

      // Log cost estimation
      if (costEstimate > 0) {
        console.log(`AI evaluation cost: $${costEstimate.toFixed(6)} (${inputTokens} input tokens, ${outputTokens} output tokens)`);
      }

      return result;
    } catch (error) {
      console.error(`AI evaluation attempt ${attempt + 1} failed:`, error);

      if (attempt === maxRetries) {
        // Return default evaluation after all retries exhausted
        return {
          score: 50,
          feedback: 'AI evaluation failed after retries. Using basic scoring system.',
          breakdown: {
            code_quality: 50,
            relevance: 50,
            completeness: 50,
            innovation: 50,
            technical_soundness: 50,
          },
          strengths: [],
          improvements: [],
          confidence_score: 0,
        };
      }

      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  // Fallback (shouldn't reach here)
  return {
    score: 50,
    feedback: 'AI evaluation failed. Using basic scoring system.',
    breakdown: {
      code_quality: 50,
      relevance: 50,
      completeness: 50,
      innovation: 50,
      technical_soundness: 50,
    },
    strengths: [],
    improvements: [],
    confidence_score: 0,
  };
}

/**
 * Combine basic score and AI evaluation into final score
 * Default: 60% basic score, 40% AI score
 * Can be overridden with custom weights from bounty
 */
export function combineScores(
  basicScore: number, 
  aiEvaluation: AIEvaluationResult, 
  aiWeight: number = 0.4,
  customWeights?: { basic_score?: number; ai_score?: number }
): number {
  // Use custom weights if provided, otherwise use default
  const finalAiWeight = customWeights?.ai_score !== undefined ? customWeights.ai_score : aiWeight;
  const finalBasicWeight = customWeights?.basic_score !== undefined ? customWeights.basic_score : (1 - aiWeight);
  
  return Math.round((basicScore * finalBasicWeight) + (aiEvaluation.score * finalAiWeight));
}
