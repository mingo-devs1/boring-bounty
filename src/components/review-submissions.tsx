'use client';

import { useState, useMemo } from 'react';
import { selectWinner, rejectSubmission, markAsReviewed, runAIEvaluation } from '@/lib/server-actions/submissions';
import { Trophy, Check, X, ExternalLink, MessageSquare, Loader2, Award, Star, ChevronDown, ChevronUp, Brain, Zap, Eye, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { rankSubmissions, getTopSubmissions } from '@/lib/scoring';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface ReviewSubmissionsProps {
  submissions: any[];
  bountyId: string;
  isCreator: boolean;
}

export default function ReviewSubmissions({ submissions, bountyId, isCreator }: ReviewSubmissionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ [key: string]: string }>({});
  const [showFeedback, setShowFeedback] = useState<{ [key: string]: boolean }>({});
  const [showAIDetails, setShowAIDetails] = useState<{ [key: string]: boolean }>({});
  const [showScoringBreakdown, setShowScoringBreakdown] = useState<{ [key: string]: boolean }>({});
  const [showRawAIResponse, setShowRawAIResponse] = useState<{ [key: string]: boolean }>({});
  const [showWinnerModal, setShowWinnerModal] = useState<string | null>(null);
  const [winnerFeedback, setWinnerFeedback] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);

  // Auto-rank submissions by final_score
  const rankedSubmissions = useMemo(() => {
    return rankSubmissions(submissions);
  }, [submissions]);

  // Get top 3 submissions for highlighting
  const topSubmissions = useMemo(() => {
    return getTopSubmissions(submissions, 3).map(s => s.id);
  }, [submissions]);

  if (!isCreator || submissions.length === 0) {
    return null;
  }

  const handleSelectWinner = async (submissionId: string) => {
    setShowWinnerModal(submissionId);
  };

  const confirmSelectWinner = async () => {
    if (!showWinnerModal) return;
    
    setLoading(showWinnerModal);
    const result = await selectWinner(showWinnerModal, winnerFeedback || feedback[showWinnerModal]);
    setLoading(null);
    
    if (!result.success) {
      alert(result.error || 'Failed to select winner');
    } else {
      setShowWinnerModal(null);
      setSelectedWinner(showWinnerModal);
      setShowSuccessMessage(true);
      setWinnerFeedback('');
      
      // Trigger confetti animation (respect prefers-reduced-motion)
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReducedMotion) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#FF3B3B', '#14B8A6', '#FFD700'],
        });
      }
      
      // Reload after showing success message
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
  };

  const handleReject = async (submissionId: string) => {
    setLoading(submissionId);
    const result = await rejectSubmission(submissionId, feedback[submissionId]);
    setLoading(null);
    
    if (!result.success) {
      alert(result.error || 'Failed to reject submission');
    } else {
      window.location.reload();
    }
  };

  const handleMarkAsReviewed = async (submissionId: string) => {
    setLoading(submissionId);
    const result = await markAsReviewed(submissionId, feedback[submissionId]);
    setLoading(null);
    
    if (!result.success) {
      alert(result.error || 'Failed to mark submission as reviewed');
    } else {
      window.location.reload();
    }
  };

  const handleQuickReject = async (submissionId: string, template: string) => {
    setLoading(submissionId);
    const result = await rejectSubmission(submissionId, template);
    setLoading(null);
    
    if (!result.success) {
      alert(result.error || 'Failed to reject submission');
    } else {
      window.location.reload();
    }
  };

  const handleRunAIEvaluation = async (submissionId: string) => {
    setLoading(submissionId);
    const result = await runAIEvaluation(submissionId);
    setLoading(null);
    
    if (!result.success) {
      alert(result.error || 'Failed to run AI evaluation');
    } else {
      window.location.reload();
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return { bg: 'from-[#FFD700]/30 via-[#FFA500]/20 to-[#FF3B3B]/10', border: '#FFD700', text: '#B8860B', shadow: '0 4px 20px rgba(255, 215, 0, 0.3)' }; // Gold with red accent
      case 2: return { bg: 'from-[#C0C0C0]/30 via-[#A9A9A9]/20 to-[#E5E5E5]/10', border: '#C0C0C0', text: '#708090', shadow: '0 4px 20px rgba(192, 192, 192, 0.3)' }; // Silver
      case 3: return { bg: 'from-[#CD7F32]/30 via-[#8B4513]/20 to-[#A0522D]/10', border: '#CD7F32', text: '#8B4513', shadow: '0 4px 20px rgba(205, 127, 50, 0.3)' }; // Bronze
      default: return { bg: '', border: '', text: '', shadow: '' };
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl p-8 border border-[#1F2A2E]/10 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-[#1F2A2E]">Review Submissions</h2>
          <div className="group relative">
            <div className="flex items-center gap-1 text-xs text-[#64748B] cursor-help">
              <Brain className="w-4 h-4" />
              <span>AI-Assisted</span>
            </div>
            <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-[#1F2A2E] text-white text-xs rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <p className="font-semibold mb-1">AI Scoring Disclaimer</p>
              <p>AI scoring is a recommendation tool. Organizations make the final decision on winner selection.</p>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          {rankedSubmissions.map((submission, index) => {
            const isTopSubmission = topSubmissions.includes(submission.id);
            const rank = index + 1;
            const rankColors = getRankColor(rank);
            const hasAI = submission.ai_score !== null;
            
            return (
              <div
                key={submission.id}
                className={`p-6 rounded-xl border transition-all ${
                  isTopSubmission 
                    ? `bg-gradient-to-br ${rankColors.bg} border-${rankColors.border} ${rankColors.shadow}` 
                    : 'bg-[#F8F4ED] border-[#1F2A2E]/10'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      {isTopSubmission && (
                        <div 
                          className="flex items-center gap-1 px-2 py-1 text-white text-xs font-bold rounded-full"
                          style={{ backgroundColor: rankColors.border }}
                        >
                          <Award className="w-3 h-3" />
                          #{rank}
                        </div>
                      )}
                      {hasAI && (
                        <motion.div 
                          className="flex items-center gap-1 px-2 py-1 bg-[#FF3B3B] text-white text-xs font-bold rounded-full"
                          animate={{
                            boxShadow: [
                              '0 0 0 0 rgba(255, 59, 59, 0.7)',
                              '0 0 0 10px rgba(255, 59, 59, 0)',
                            ],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            repeatDelay: 1,
                          }}
                        >
                          <Zap className="w-3 h-3" />
                          AI Recommended
                        </motion.div>
                      )}
                      {submission.categories && submission.categories.length > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-[#14B8A6]/10 text-[#14B8A6] text-xs font-medium rounded-full border border-[#14B8A6]/20">
                          <Award className="w-3 h-3" />
                          {submission.categories.map((c: any) => c.name).join(', ')}
                        </div>
                      )}
                      <span className="font-semibold text-lg text-[#1F2A2E]">
                        {submission.builder_username || 'Anonymous'}
                      </span>
                      {submission.builder_rating > 0 && (
                        <span className="text-sm text-[#FF3B3B]">★ {submission.builder_rating.toFixed(1)}</span>
                      )}
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          submission.status === 'won'
                            ? 'bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/20'
                            : submission.status === 'ai_scored'
                            ? 'bg-[#FF3B3B]/10 text-[#FF3B3B] border border-[#FF3B3B]/20'
                            : submission.status === 'reviewed'
                            ? 'bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/20'
                            : submission.status === 'rejected'
                            ? 'bg-[#1F2A2E]/10 text-[#64748B]'
                            : 'bg-[#1F2A2E]/10 text-[#64748B]'
                        }`}
                      >
                        {submission.status === 'ai_scored' ? 'AI Scored' : submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-[#64748B] text-sm mb-3 line-clamp-2">{submission.description}</p>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {submission.github_link && (
                        <a
                          href={submission.github_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-[#FF3B3B] hover:underline"
                        >
                          <ExternalLink className="w-4 h-4" />
                          GitHub
                        </a>
                      )}
                      {submission.demo_link && (
                        <a
                          href={submission.demo_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-[#FF3B3B] hover:underline"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Demo
                        </a>
                      )}
                    </div>
                    <span className="text-xs text-[#64748B]">
                      Submitted {formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: true })}
                    </span>
                  </div>
                  
                  {/* Side-by-side Score Display */}
                  <div className="flex flex-col items-end gap-2 ml-4">
                    {hasAI ? (
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#64748B]">Basic:</span>
                          <span className="text-lg font-bold text-[#1F2A2E]">{submission.basic_score?.toFixed(0) || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[#64748B]">AI:</span>
                          <span className="text-lg font-bold text-[#FF3B3B]">{submission.ai_score?.toFixed(0) || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-[#FF3B3B]/10 text-[#FF3B3B] rounded-full font-semibold">
                          <Star className="w-4 h-4 fill-[#FF3B3B]" />
                          Final: {submission.final_score?.toFixed(0) || 'N/A'}/100
                        </div>
                        {submission.ai_confidence && (
                          <div className="flex items-center gap-1 text-xs text-[#64748B]">
                            <Zap className="w-3 h-3" />
                            Confidence: {submission.ai_confidence.toFixed(0)}%
                          </div>
                        )}
                        {submission.ai_evaluated_at && (
                          <div className="text-xs text-[#64748B]">
                            AI Evaluated: {formatDistanceToNow(new Date(submission.ai_evaluated_at), { addSuffix: true })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 px-3 py-1 bg-[#FF3B3B]/10 text-[#FF3B3B] rounded-full font-semibold">
                        <Star className="w-4 h-4 fill-[#FF3B3B]" />
                        Score: {submission.final_score?.toFixed(0) || submission.score?.toFixed(0) || 'N/A'}/100
                      </div>
                    )}
                  </div>
                </div>

                {/* Low Confidence Warning Banner */}
                {hasAI && submission.ai_confidence && submission.ai_confidence < 60 && (
                  <div className="mt-3 p-3 bg-[#FF3B3B]/10 border border-[#FF3B3B]/30 rounded-lg">
                    <p className="text-sm text-[#FF3B3B] font-medium">
                      ⚠️ Low confidence ({submission.ai_confidence.toFixed(0)}%) — please review manually
                    </p>
                  </div>
                )}

                {/* Expandable AI Feedback Section */}
                {hasAI && (
                  <div className="mt-4 space-y-3">
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => setShowAIDetails({ ...showAIDetails, [submission.id]: !showAIDetails[submission.id] })}
                        className="flex items-center gap-2 text-sm text-[#FF3B3B] hover:text-[#1F2A2E] font-medium"
                      >
                        <Brain className="w-4 h-4" />
                        {showAIDetails[submission.id] ? 'Hide AI Analysis' : 'View AI Analysis'}
                        {showAIDetails[submission.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setShowScoringBreakdown({ ...showScoringBreakdown, [submission.id]: !showScoringBreakdown[submission.id] })}
                        className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#1F2A2E]"
                      >
                        <Star className="w-4 h-4" />
                        {showScoringBreakdown[submission.id] ? 'Hide Scoring Breakdown' : 'View Scoring Breakdown'}
                        {showScoringBreakdown[submission.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                    
                    <AnimatePresence>
                      {showAIDetails[submission.id] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 bg-[#F8F4ED] rounded-lg border border-[#1F2A2E]/10">
                            {submission.ai_feedback && (
                              <div className="mb-3">
                                <p className="text-sm font-medium text-[#1F2A2E] mb-1">AI Feedback:</p>
                                <p className="text-sm text-[#64748B]">{typeof submission.ai_feedback === 'string' ? submission.ai_feedback : submission.ai_feedback.feedback}</p>
                              </div>
                            )}
                            {submission.ai_strengths && submission.ai_strengths.length > 0 && (
                              <div className="mb-3">
                                <p className="text-sm font-medium text-[#14B8A6] mb-1">Strengths:</p>
                                <ul className="text-sm text-[#64748B] list-disc list-inside">
                                  {submission.ai_strengths.map((strength: string, i: number) => (
                                    <li key={i}>{strength}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {submission.ai_improvements && submission.ai_improvements.length > 0 && (
                              <div className="mb-3">
                                <p className="text-sm font-medium text-[#FF3B3B] mb-1">Improvements:</p>
                                <ul className="text-sm text-[#64748B] list-disc list-inside">
                                  {submission.ai_improvements.map((improvement: string, i: number) => (
                                    <li key={i}>{improvement}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            <button
                              onClick={() => setShowRawAIResponse({ ...showRawAIResponse, [submission.id]: !showRawAIResponse[submission.id] })}
                              className="text-xs text-[#64748B] hover:text-[#1F2A2E] underline"
                            >
                              {showRawAIResponse[submission.id] ? 'Hide Raw AI Response' : 'View Raw AI Response (JSON)'}
                            </button>
                            {showRawAIResponse[submission.id] && submission.ai_feedback && typeof submission.ai_feedback === 'object' && submission.ai_feedback.breakdown && (
                              <div className="mt-3 p-3 bg-[#1F2A2E]/5 rounded-lg">
                                <pre className="text-xs text-[#64748B] overflow-x-auto">
                                  {JSON.stringify(submission.ai_feedback, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AnimatePresence>
                      {showScoringBreakdown[submission.id] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 bg-[#F8F4ED] rounded-lg border border-[#1F2A2E]/10">
                            <p className="text-sm font-medium text-[#1F2A2E] mb-3">Full Scoring Breakdown</p>
                            
                            {/* Basic Score Breakdown */}
                            <div className="mb-4">
                              <p className="text-xs font-semibold text-[#64748B] mb-2">Basic Score Factors:</p>
                              {submission.scoring_breakdown?.basic && (
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-[#64748B]">{submission.scoring_breakdown.basic.github_link?.label || 'GitHub Link'}</span>
                                    <span className="text-xs font-medium text-[#1F2A2E]">{submission.scoring_breakdown.basic.github_link?.score || 0}/{submission.scoring_breakdown.basic.github_link?.max || 20}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-[#64748B]">{submission.scoring_breakdown.basic.demo_link?.label || 'Demo Link'}</span>
                                    <span className="text-xs font-medium text-[#1F2A2E]">{submission.scoring_breakdown.basic.demo_link?.score || 0}/{submission.scoring_breakdown.basic.demo_link?.max || 20}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-[#64748B]">{submission.scoring_breakdown.basic.description_quality?.label || 'Description Quality'}</span>
                                    <span className="text-xs font-medium text-[#1F2A2E]">{submission.scoring_breakdown.basic.description_quality?.score || 0}/{submission.scoring_breakdown.basic.description_quality?.max || 30}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-[#64748B]">{submission.scoring_breakdown.basic.skill_match?.label || 'Skill Match'}</span>
                                    <span className="text-xs font-medium text-[#1F2A2E]">{submission.scoring_breakdown.basic.skill_match?.score || 0}/{submission.scoring_breakdown.basic.skill_match?.max || 30}</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* AI Score Breakdown */}
                            {submission.scoring_breakdown?.ai && (
                              <div>
                                <p className="text-xs font-semibold text-[#64748B] mb-2">AI Score Factors:</p>
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-[#64748B]">Code Quality</span>
                                    <span className="text-xs font-medium text-[#FF3B3B]">{submission.scoring_breakdown.ai.code_quality || 0}/100</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-[#64748B]">Relevance</span>
                                    <span className="text-xs font-medium text-[#FF3B3B]">{submission.scoring_breakdown.ai.relevance || 0}/100</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-[#64748B]">Completeness</span>
                                    <span className="text-xs font-medium text-[#FF3B3B]">{submission.scoring_breakdown.ai.completeness || 0}/100</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-[#64748B]">Innovation</span>
                                    <span className="text-xs font-medium text-[#FF3B3B]">{submission.scoring_breakdown.ai.innovation || 0}/100</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-xs text-[#64748B]">Technical Soundness</span>
                                    <span className="text-xs font-medium text-[#FF3B3B]">{submission.scoring_breakdown.ai.technical_soundness || 0}/100</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {submission.status === 'pending' && (
                  <div className="space-y-3 pt-4 border-t border-[#1F2A2E]/10">
                    <button
                      onClick={() => setShowFeedback({ ...showFeedback, [submission.id]: !showFeedback[submission.id] })}
                      className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#1F2A2E]"
                    >
                      <MessageSquare className="w-4 h-4" />
                      {showFeedback[submission.id] ? 'Hide feedback' : 'Add feedback'}
                    </button>

                    {showFeedback[submission.id] && (
                      <textarea
                        value={feedback[submission.id] || ''}
                        onChange={(e) => setFeedback({ ...feedback, [submission.id]: e.target.value })}
                        placeholder="Provide feedback for this submission..."
                        rows={3}
                        className="w-full px-4 py-3 bg-white border border-[#1F2A2E]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3B3B] focus:border-transparent text-[#1F2A2E] text-sm"
                      />
                    )}

                    {!hasAI && (
                      <button
                        onClick={() => handleRunAIEvaluation(submission.id)}
                        disabled={loading === submission.id}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#FF3B3B] hover:bg-[#DC2626] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading === submission.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Brain className="w-4 h-4" />
                            Run AI Evaluation
                          </>
                        )}
                      </button>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSelectWinner(submission.id)}
                        disabled={loading === submission.id}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#14B8A6] hover:bg-[#0D9488] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading === submission.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Trophy className="w-4 h-4" />
                            Select as Winner
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleMarkAsReviewed(submission.id)}
                        disabled={loading === submission.id}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#1F2A2E] hover:bg-[#0F1C22] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading === submission.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Eye className="w-4 h-4" />
                            Mark Reviewed
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleQuickReject(submission.id, 'Thank you for your submission, but we decided to proceed with another candidate.')}
                        disabled={loading === submission.id}
                        className="flex-1 px-3 py-2 text-sm bg-[#1F2A2E]/10 text-[#64748B] rounded-lg hover:bg-[#1F2A2E]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Quick Reject
                      </button>
                      <button
                        onClick={() => handleReject(submission.id)}
                        disabled={loading === submission.id}
                        className="flex-1 px-3 py-2 text-sm bg-[#FF3B3B]/10 text-[#FF3B3B] rounded-lg hover:bg-[#FF3B3B]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X className="w-3 h-3 inline mr-1" />
                        Reject
                      </button>
                    </div>
                  </div>
                )}

                {submission.status === 'won' && submission.feedback && (
                  <div className="mt-4 p-3 bg-[#14B8A6]/10 rounded-lg border border-[#14B8A6]/20">
                    <p className="text-sm text-[#14B8A6]"><strong>Feedback:</strong> {submission.feedback}</p>
                  </div>
                )}

                {submission.status === 'rejected' && submission.feedback && (
                  <div className="mt-4 p-3 bg-[#1F2A2E]/10 rounded-lg">
                    <p className="text-sm text-[#64748B]"><strong>Feedback:</strong> {submission.feedback}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Winner Confirmation Modal */}
      <AnimatePresence>
        {showWinnerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4"
            >
              <h3 className="text-xl font-semibold mb-4 text-[#1F2A2E]">Confirm Winner Selection</h3>
              
              {/* Submission Summary */}
              {rankedSubmissions.find(s => s.id === showWinnerModal) && (
                <div className="mb-4 p-4 bg-[#F8F4ED] rounded-lg border border-[#1F2A2E]/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-[#1F2A2E]">
                      {rankedSubmissions.find(s => s.id === showWinnerModal)?.builder_username || 'Anonymous'}
                    </span>
                    <div className="flex items-center gap-1 px-3 py-1 bg-[#FF3B3B]/10 text-[#FF3B3B] rounded-full font-semibold">
                      <Star className="w-4 h-4 fill-[#FF3B3B]" />
                      {rankedSubmissions.find(s => s.id === showWinnerModal)?.final_score?.toFixed(0) || 'N/A'}/100
                    </div>
                  </div>
                  <p className="text-sm text-[#64748B] mb-2 line-clamp-2">
                    {rankedSubmissions.find(s => s.id === showWinnerModal)?.description}
                  </p>
                  {rankedSubmissions.find(s => s.id === showWinnerModal)?.ai_feedback && (
                    <p className="text-xs text-[#64748B] italic">
                      "{typeof rankedSubmissions.find(s => s.id === showWinnerModal)?.ai_feedback === 'string' 
                        ? rankedSubmissions.find(s => s.id === showWinnerModal)?.ai_feedback 
                        : rankedSubmissions.find(s => s.id === showWinnerModal)?.ai_feedback.feedback}"
                    </p>
                  )}
                </div>
              )}

              <p className="text-[#64748B] mb-4">
                Are you sure you want to select this submission as the winner? This will:
              </p>
              <ul className="text-sm text-[#64748B] mb-4 list-disc list-inside">
                <li>Mark the submission as "Won"</li>
                <li>Reject all other submissions</li>
                <li>Close the bounty</li>
                <li>Update the builder's completed bounties count</li>
              </ul>
              <textarea
                value={winnerFeedback}
                onChange={(e) => setWinnerFeedback(e.target.value)}
                placeholder="Optional: Provide feedback for the winner..."
                rows={3}
                className="w-full px-4 py-3 bg-[#F8F4ED] border border-[#1F2A2E]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3B3B] focus:border-transparent text-[#1F2A2E] text-sm mb-4"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowWinnerModal(null);
                    setWinnerFeedback('');
                  }}
                  className="flex-1 px-4 py-2 bg-[#1F2A2E]/10 text-[#1F2A2E] rounded-lg font-medium hover:bg-[#1F2A2E]/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSelectWinner}
                  disabled={loading === showWinnerModal}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#14B8A6] hover:bg-[#0D9488] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading === showWinnerModal ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Trophy className="w-4 h-4" />
                      Confirm Winner
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Message */}
      <AnimatePresence>
        {showSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 z-50"
          >
            <div className="bg-[#14B8A6] text-white px-6 py-4 rounded-2xl shadow-lg flex items-center gap-3">
              <Trophy className="w-6 h-6" />
              <div>
                <p className="font-semibold">Winner Selected!</p>
                <p className="text-sm opacity-90">Bounty is now closed.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
