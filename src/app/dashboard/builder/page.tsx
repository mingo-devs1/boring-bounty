'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { getSubmissionsByUser, editSubmission, getSubmissionsByBounty } from '@/lib/server-actions/submissions';
import { getCategoriesByBounty } from '@/lib/server-actions/categories';
import { Trophy, Clock, DollarSign, Star, ExternalLink, Loader2, Edit, X } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [editFormData, setEditFormData] = useState({
    github_link: '',
    demo_link: '',
    description: '',
  });

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

  const canEditSubmission = (submission: any) => {
    // Can edit if: not reviewed, status is pending, and bounty deadline not passed
    if (submission.reviewed_at) return false;
    if (submission.status !== 'pending') return false;
    if (!submission.bounty_deadline) return false;
    
    const deadline = new Date(submission.bounty_deadline);
    const now = new Date();
    return now < deadline;
  };

  const openEditModal = async (submission: any) => {
    setEditingSubmission(submission);
    setEditFormData({
      github_link: submission.github_link || '',
      demo_link: submission.demo_link || '',
      description: submission.description || '',
    });
    setEditError('');

    // Load categories for this bounty
    const categoriesResult = await getCategoriesByBounty(submission.bounty_id);
    if (categoriesResult.success) {
      setCategories(categoriesResult.categories);
      
      // Load selected categories for this submission
      const submissionsResult = await getSubmissionsByBounty(submission.bounty_id);
      if (submissionsResult.success) {
        const sub = submissionsResult.submissions.find((s: any) => s.id === submission.id);
        if (sub && sub.categories) {
          setSelectedCategoryIds(sub.categories.map((c: any) => c.id));
        } else {
          setSelectedCategoryIds([]);
        }
      }
    }

    setEditModalOpen(true);
  };

  const handleEditSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubmission || !user) return;

    setEditLoading(true);
    setEditError('');

    try {
      const result = await editSubmission({
        submission_id: editingSubmission.id,
        user_id: user.id,
        github_link: editFormData.github_link || undefined,
        demo_link: editFormData.demo_link || undefined,
        description: editFormData.description,
        category_ids: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
      });

      if (result.success) {
        setEditModalOpen(false);
        loadSubmissions();
      } else {
        setEditError(result.error || 'Failed to edit submission');
      }
    } catch (err) {
      setEditError('An error occurred. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryIds(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
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
                          <div className="flex items-center gap-2 ml-4">
                            {canEditSubmission(submission) && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  openEditModal(submission);
                                }}
                                className="p-2 bg-[#F8F4ED] hover:bg-[#FF3B3B] hover:text-white text-[#1F2A2E] rounded-lg transition-colors"
                                title="Edit submission"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            <span
                              className={`px-3 py-1 text-sm font-medium rounded-full ${
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

      {/* Edit Submission Modal */}
      <AnimatePresence>
        {editModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#1F2A2E]/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-[#1F2A2E]">Edit Submission</h2>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="p-2 hover:bg-[#F8F4ED] rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-[#64748B]" />
                </button>
              </div>

              {editError && (
                <div className="mb-4 p-3 bg-[#FF3B3B]/10 border border-[#FF3B3B]/20 rounded-lg text-[#FF3B3B] text-sm">
                  {editError}
                </div>
              )}

              <form onSubmit={handleEditSubmission} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-[#1F2A2E]">GitHub Link (optional)</label>
                  <input
                    type="url"
                    value={editFormData.github_link}
                    onChange={(e) => setEditFormData({ ...editFormData, github_link: e.target.value })}
                    className="w-full px-4 py-3 bg-[#F8F4ED] border border-[#1F2A2E]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3B3B] focus:border-transparent text-[#1F2A2E]"
                    placeholder="https://github.com/username/repo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-[#1F2A2E]">Demo Link (optional)</label>
                  <input
                    type="url"
                    value={editFormData.demo_link}
                    onChange={(e) => setEditFormData({ ...editFormData, demo_link: e.target.value })}
                    className="w-full px-4 py-3 bg-[#F8F4ED] border border-[#1F2A2E]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3B3B] focus:border-transparent text-[#1F2A2E]"
                    placeholder="https://your-demo.vercel.app"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-[#1F2A2E]">Description *</label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    rows={4}
                    required
                    className="w-full px-4 py-3 bg-[#F8F4ED] border border-[#1F2A2E]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3B3B] focus:border-transparent text-[#1F2A2E]"
                    placeholder="Describe your solution, approach, and any relevant details..."
                  />
                </div>

                {categories.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#1F2A2E]">Select Categories (optional)</label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => toggleCategory(category.id)}
                          className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                            selectedCategoryIds.includes(category.id)
                              ? 'bg-[#FF3B3B] border-[#FF3B3B] text-white'
                              : 'bg-[#F8F4ED] border-[#1F2A2E]/10 text-[#1F2A2E] hover:border-[#FF3B3B]/50'
                          }`}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {editingSubmission && editingSubmission.bounty_deadline && (
                  <p className="text-sm text-[#64748B]">
                    Deadline: {new Date(editingSubmission.bounty_deadline).toLocaleDateString()}
                  </p>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    className="flex-1 py-3 bg-[#F8F4ED] hover:bg-[#F8F4ED]/80 text-[#1F2A2E] rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="flex-1 py-3 bg-[#FF3B3B] hover:bg-[#E53333] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {editLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
