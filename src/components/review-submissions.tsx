'use client';

import { useState } from 'react';
import { selectWinner, rejectSubmission } from '@/lib/server-actions/submissions';
import { Trophy, Check, X, ExternalLink, MessageSquare, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ReviewSubmissionsProps {
  submissions: any[];
  bountyId: string;
  isCreator: boolean;
}

export default function ReviewSubmissions({ submissions, bountyId, isCreator }: ReviewSubmissionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ [key: string]: string }>({});
  const [showFeedback, setShowFeedback] = useState<{ [key: string]: boolean }>({});

  if (!isCreator || submissions.length === 0) {
    return null;
  }

  const handleSelectWinner = async (submissionId: string) => {
    setLoading(submissionId);
    const result = await selectWinner(submissionId, feedback[submissionId]);
    setLoading(null);
    
    if (!result.success) {
      alert(result.error || 'Failed to select winner');
    } else {
      window.location.reload();
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

  return (
    <div className="bg-white rounded-2xl p-8 border border-[#1F2A2E]/10 shadow-sm">
      <h2 className="text-2xl font-semibold mb-4 text-[#1F2A2E]">Review Submissions</h2>
      <div className="space-y-4">
        {submissions.map((submission) => (
          <div
            key={submission.id}
            className="p-6 bg-[#F8F4ED] rounded-xl border border-[#1F2A2E]/10"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
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
                        : submission.status === 'accepted'
                        ? 'bg-[#FF3B3B]/10 text-[#FF3B3B] border border-[#FF3B3B]/20'
                        : submission.status === 'rejected'
                        ? 'bg-[#1F2A2E]/10 text-[#64748B]'
                        : 'bg-[#1F2A2E]/10 text-[#64748B]'
                    }`}
                  >
                    {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                  </span>
                </div>
                <p className="text-[#64748B] text-sm mb-3 line-clamp-2">{submission.description}</p>
                <div className="flex flex-wrap gap-2 mb-3">
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
                  {submission.score && (
                    <span className="text-sm text-[#64748B]">Score: {submission.score}</span>
                  )}
                </div>
                <span className="text-xs text-[#64748B]">
                  Submitted {formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: true })}
                </span>
              </div>
            </div>

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
                    onClick={() => handleReject(submission.id)}
                    disabled={loading === submission.id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#1F2A2E] hover:bg-[#0F1C22] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading === submission.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <X className="w-4 h-4" />
                        Reject
                      </>
                    )}
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
        ))}
      </div>
    </div>
  );
}
