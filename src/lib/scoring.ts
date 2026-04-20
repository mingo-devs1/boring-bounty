/**
 * Smart Scoring System for Boring Bounty Submissions
 * Calculates a score (0-100) based on multiple factors with production-grade heuristics
 */

// Skill synonym mappings for fuzzy matching
const SKILL_SYNONYMS: Record<string, string[]> = {
  'react': ['next.js', 'nextjs', 'reactjs', 'react.js', 'jsx', 'tsx', 'vue', 'angular', 'frontend'],
  'solidity': ['smart contracts', 'web3', 'ethereum', 'evm', 'hardhat', 'truffle', 'blockchain'],
  'typescript': ['ts', 'javascript', 'js', 'es6', 'es2020', 'type-safe'],
  'python': ['django', 'flask', 'fastapi', 'pytorch', 'tensorflow', 'ml', 'machine learning'],
  'rust': ['systems programming', 'wasm', 'webassembly', 'performance'],
  'go': ['golang', 'backend', 'microservices'],
  'node': ['nodejs', 'backend', 'express', 'nest', 'api'],
  'sql': ['database', 'postgres', 'mysql', 'postgresql', 'db', 'data'],
  'aws': ['cloud', 'serverless', 'lambda', 'ec2', 'infrastructure', 'devops'],
  'docker': ['containers', 'kubernetes', 'k8s', 'devops', 'deployment'],
  'graphql': ['api', 'query', 'schema', 'apollo'],
  'tailwind': ['css', 'styling', 'ui', 'design', 'frontend'],
};

export interface SubmissionScoreInput {
  github_link: string | null;
  demo_link: string | null;
  description: string;
  builder_skills: string[];
  required_skills: string[];
  weights?: {
    github_link?: number;
    demo_link?: number;
    description_quality?: number;
    skill_match?: number;
  };
}

export interface SubmissionScoreResult {
  score: number;
  breakdown: {
    github_link: { score: number; max: number; label: string };
    demo_link: { score: number; max: number; label: string };
    description_quality: { score: number; max: number; label: string };
    skill_match: { score: number; max: number; label: string };
  };
}

const DEFAULT_WEIGHTS = {
  github_link: 20,
  demo_link: 20,
  description_quality: 30,
  skill_match: 30,
};

/**
 * Calculate submission score based on multiple factors with enhanced heuristics
 */
export function calculateSubmissionScore(input: SubmissionScoreInput): SubmissionScoreResult {
  const { github_link, demo_link, description, builder_skills, required_skills, weights = {} } = input;

  const finalWeights = { ...DEFAULT_WEIGHTS, ...weights };

  // Apply per-bounty factor weights if provided
  const githubWeight = weights.github_link !== undefined ? weights.github_link : finalWeights.github_link;
  const demoWeight = weights.demo_link !== undefined ? weights.demo_link : finalWeights.demo_link;
  const descriptionWeight = weights.description_quality !== undefined ? weights.description_quality : finalWeights.description_quality;
  const skillMatchWeight = weights.skill_match !== undefined ? weights.skill_match : finalWeights.skill_match;

  // GitHub link score (0 or max)
  const githubScore = github_link && github_link.trim().length > 0 ? githubWeight : 0;

  // Demo link score (0 or max)
  const demoScore = demo_link && demo_link.trim().length > 0 ? demoWeight : 0;

  // Enhanced description quality score with structure and clarity checks
  const descriptionScore = calculateDescriptionQuality(description, descriptionWeight);

  // Enhanced skill match score with fuzzy matching
  const skillMatchScore = calculateSkillMatch(builder_skills, required_skills, skillMatchWeight);

  // Total score
  const totalScore = githubScore + demoScore + descriptionScore + skillMatchScore;

  return {
    score: Math.min(totalScore, 100),
    breakdown: {
      github_link: { score: githubScore, max: githubWeight, label: 'GitHub Link' },
      demo_link: { score: demoScore, max: demoWeight, label: 'Demo Link' },
      description_quality: { score: descriptionScore, max: descriptionWeight, label: 'Description Quality' },
      skill_match: { score: skillMatchScore, max: skillMatchWeight, label: 'Skill Match' },
    },
  };
}

/**
 * Calculate description quality with enhanced heuristics
 * Checks for structure, clarity, action verbs, and completeness
 */
function calculateDescriptionQuality(description: string, maxScore: number): number {
  const desc = description.trim();
  const descLength = desc.length;

  let score = 0;

  // Length-based scoring (40% of max)
  const lengthScore = Math.min((descLength / 500) * 0.4 * maxScore, 0.4 * maxScore);
  score += lengthScore;

  // Structure checks (20% of max)
  const hasParagraphs = desc.split('\n').length > 1;
  const hasBullets = desc.includes('•') || desc.includes('-') || desc.includes('*');
  const structureScore = (hasParagraphs ? 0.5 : 0) + (hasBullets ? 0.5 : 0);
  score += structureScore * 0.2 * maxScore;

  // Action verbs check (20% of max)
  const actionVerbs = ['built', 'created', 'developed', 'implemented', 'designed', 'architected', 'deployed', 'integrated', 'optimized', 'tested'];
  const hasActionVerbs = actionVerbs.some(verb => desc.toLowerCase().includes(verb));
  if (hasActionVerbs) {
    score += 0.2 * maxScore;
  }

  // Technical terms check (20% of max)
  const technicalTerms = ['api', 'database', 'frontend', 'backend', 'ui', 'ux', 'authentication', 'security', 'performance', 'scalability'];
  const hasTechnicalTerms = technicalTerms.some(term => desc.toLowerCase().includes(term));
  if (hasTechnicalTerms) {
    score += 0.2 * maxScore;
  }

  return Math.round(Math.min(score, maxScore));
}

/**
 * Calculate skill match score with fuzzy matching using synonyms
 */
function calculateSkillMatch(builderSkills: string[], requiredSkills: string[], maxScore: number): number {
  if (!requiredSkills || requiredSkills.length === 0) {
    return maxScore;
  }

  if (!builderSkills || builderSkills.length === 0) {
    return 0;
  }

  const normalizedBuilder = builderSkills.map(s => s.toLowerCase());
  const normalizedRequired = requiredSkills.map(s => s.toLowerCase());

  let matchCount = 0;
  for (const required of normalizedRequired) {
    let matched = false;

    // Direct match
    if (normalizedBuilder.some(builder => builder.includes(required) || required.includes(builder))) {
      matched = true;
    }

    // Fuzzy match using synonyms
    if (!matched) {
      const synonyms = SKILL_SYNONYMS[required] || [];
      for (const synonym of synonyms) {
        if (normalizedBuilder.some(builder => builder.includes(synonym) || synonym.includes(builder))) {
          matched = true;
          break;
        }
      }
    }

    if (matched) {
      matchCount++;
    }
  }

  const matchPercentage = matchCount / requiredSkills.length;
  return Math.round(matchPercentage * maxScore);
}

/**
 * Rank submissions by final_score (highest first)
 */
export function rankSubmissions(submissions: any[]): any[] {
  return submissions
    .map(sub => ({
      ...sub,
      score: sub.final_score || sub.score || 0, // Use final_score or existing score or default to 0
    }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Get top N submissions from a list
 */
export function getTopSubmissions(submissions: any[], n: number = 3): any[] {
  const ranked = rankSubmissions(submissions);
  return ranked.slice(0, n);
}
