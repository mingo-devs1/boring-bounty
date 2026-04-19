'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { getSubmissionsByUser } from '@/lib/server-actions/submissions';
import { Trophy, Clock, DollarSign, Star, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import FadeIn from '@/components/motion/fade-in';
import AnimatedCard from '@/components/motion/animated-card';

function AnimatedCounter({ value }: { value: number }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="text-3xl font-bold text-[#1F2A2E]"
    >
      {value}
    </motion.span>
  );
}

export default function BuilderDashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'builder') {
      router.push('/');
      return;
    }

    loadSubmissions();
  }, [isAuthenticated, user, router]);

  const loadSubmissions = async () => {
    if (!user) return;
    
    setLoading(true);
    const result = await getSubmissionsByUser(user.id);
    if (result.success) {
      setSubmissions(result.submissions);
    } else {
      setError(result.error || 'Failed to load submissions');
    }
    setLoading(false);
  };

  const stats = {
    total: submissions.length,
    won: submissions.filter((s) => s.status === 'won').length,
    pending: submissions.filter((s) => s.status === 'pending').length,
    rejected: submissions.filter((s) => s.status === 'rejected').length,
    averageRating: user?.rating || 0,
    completedBounties: user?.completed_bounties || 0,
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F8F4ED]">
      {/* Header */}
      <FadeIn>
        <div className="bg-white border-b border-[#1F2A2E]/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-4xl font-bold mb-2 text-[#1F2A2E]">Builder Dashboard</h1>
            <p className="text-[#64748B] text-lg">
              Track your submissions and progress
            </p>
          </div>
        </div>
      </FadeIn>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="text-center py-12">
            <motion.div 
              className="w-8 h-8 border-4 border-[#FF3B3B] border-t-transparent rounded-full mx-auto mb-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p className="text-[#64748B]">Loading dashboard...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-[#FF3B3B]">{error}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Cards */}
            <FadeIn delay={0.1}>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div 
                  className="bg-white rounded-2xl p-6 border border-[#1F2A2E]/10 shadow-sm"
                  whileHover={{ scale: 1.02, y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#64748B] text-sm">Total Submissions</span>
                    <Trophy className="w-5 h-5 text-[#FF3B3B]" />
                  </div>
                  <AnimatedCounter value={stats.total} />
                </motion.div>

                <motion.div 
                  className="bg-white rounded-2xl p-6 border border-[#1F2A2E]/10 shadow-sm"
                  whileHover={{ scale: 1.02, y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#64748B] text-sm">Won</span>
                    <Star className="w-5 h-5 text-[#14B8A6]" />
                  </div>
                  <AnimatedCounter value={stats.won} />
                </motion.div>

                <motion.div 
                  className="bg-white rounded-2xl p-6 border border-[#1F2A2E]/10 shadow-sm"
                  whileHover={{ scale: 1.02, y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#64748B] text-sm">Pending</span>
                    <Clock className="w-5 h-5 text-[#64748B]" />
                  </div>
                  <AnimatedCounter value={stats.pending} />
                </motion.div>

                <motion.div 
                  className="bg-white rounded-2xl p-6 border border-[#1F2A2E]/10 shadow-sm"
                  whileHover={{ scale: 1.02, y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#64748B] text-sm">Rating</span>
                    <Star className="w-5 h-5 text-[#FF3B3B] fill-[#FF3B3B]" />
                  </div>
                  <motion.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-3xl font-bold text-[#FF3B3B]"
                  >
                    {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'}
                  </motion.span>
                </motion.div>
              </div>
            </FadeIn>

            {/* Submissions List */}
            <FadeIn delay={0.2}>
              <div className="bg-white rounded-2xl p-8 border border-[#1F2A2E]/10 shadow-sm">
                <h2 className="text-2xl font-semibold mb-6 text-[#1F2A2E]">Your Submissions</h2>
                
                {submissions.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="w-16 h-16 text-[#1F2A2E]/20 mx-auto mb-4" />
                    <p className="text-[#64748B] text-lg">No submissions yet</p>
                    <p className="text-[#64748B] mt-2">
                      <Link href="/bounties" className="text-[#FF3B3B] hover:underline font-medium">
                        Browse bounties to get started
                      </Link>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {submissions.map((submission, index) => (
                      <AnimatedCard
                        key={submission.id}
                        href={`/bounty/${submission.bounty_id}`}
                        delay={index * 0.05}
                        className="p-6"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-[#1F2A2E] mb-1">
                              {submission.bounty_title || 'Unknown Bounty'}
                            </h3>
                            <p className="text-[#64748B] text-sm line-clamp-2 mb-2">
                              {submission.description}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-[#64748B]">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: true })}
                              </span>
                              {submission.score && (
                                <span className="flex items-center gap-1">
                                  <Star className="w-4 h-4" />
                                  Score: {submission.score}
                                </span>
                              )}
                            </div>
                          </div>
                          <span
                            className={`px-3 py-1 text-sm font-medium rounded-full ml-4 ${
                              submission.status === 'won'
                                ? 'bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/20'
                                : submission.status === 'accepted'
                                ? 'bg-[#FF3B3B]/10 text-[#FF3B3B] border border-[#FF3B3B]/20'
                                : submission.status === 'rejected'
                                ? 'bg-[#1F2A2E]/10 text-[#64748B]'
                                : 'bg-[#F8F4ED] text-[#1F2A2E] border border-[#1F2A2E]/10'
                            }`}
                          >
                            {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                          </span>
                        </div>
                        {submission.github_link && (
                          <a
                            href={submission.github_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-[#FF3B3B] hover:underline"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View GitHub
                          </a>
                        )}
                      </AnimatedCard>
                    ))}
                  </div>
                )}
              </div>
            </FadeIn>
          </div>
        )}
      </div>
    </div>
  );
}
