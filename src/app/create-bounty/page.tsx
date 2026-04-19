'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { createBounty } from '@/lib/server-actions/bounties';
import { Industry } from '@/lib/supabase';
import { Plus, Loader2, DollarSign, Calendar, Tag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MotionButton from '@/components/motion/motion-button';
import FadeIn from '@/components/motion/fade-in';

const INDUSTRIES: Industry[] = ['AI', 'Web3', 'Crypto', 'Robotics', 'DeFi', 'Gaming', 'Infrastructure', 'Other'];

export default function CreateBountyPage() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reward: '',
    deadline: '',
    required_skills: '',
    industry: '' as Industry | '',
  });

  if (!isAuthenticated || !user || (user.role !== 'organization' && user.role !== 'hiring_manager')) {
    return (
      <div className="min-h-screen bg-[#F8F4ED] flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-[#64748B] text-lg mb-4">
            {isAuthenticated ? 'Only organizations can post bounties' : 'Please connect your wallet first'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-[#FF3B3B] hover:bg-[#E53333] text-white rounded-lg font-medium transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim() || !formData.reward || !formData.deadline) {
      setError('Please fill in all required fields');
      return;
    }

    const reward = parseFloat(formData.reward);
    if (isNaN(reward) || reward <= 0) {
      setError('Please enter a valid reward amount');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const skillsArray = formData.required_skills.split(',').map(s => s.trim()).filter(s => s);

      const result = await createBounty({
        title: formData.title,
        description: formData.description,
        reward,
        deadline: new Date(formData.deadline).toISOString(),
        created_by: user.id,
        required_skills: skillsArray.length > 0 ? skillsArray : [],
        industry: formData.industry as Industry || undefined,
      });

      if (result.success) {
        router.push(`/bounty/${result.bounty.id}`);
      } else {
        setError(result.error || 'Failed to create bounty');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F4ED]">
      {/* Header */}
      <FadeIn>
        <div className="bg-white border-b border-[#1F2A2E]/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold mb-2 text-[#1F2A2E]">Create Bounty</h1>
            <p className="text-[#64748B]">
              Post a real-world task and find skilled builders to complete it
            </p>
          </div>
        </div>
      </FadeIn>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <FadeIn delay={0.1}>
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 border border-[#1F2A2E]/10 shadow-sm">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 bg-[#FF3B3B]/10 border border-[#FF3B3B]/20 rounded-lg text-[#FF3B3B]"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-6">
              <FadeIn delay={0.2}>
                <div>
                  <label className="block text-sm font-medium mb-2 text-[#1F2A2E]">Bounty Title *</label>
                  <motion.input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-[#F8F4ED] border border-[#1F2A2E]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3B3B] focus:border-transparent text-[#1F2A2E]"
                    placeholder="e.g., Build a DeFi dashboard with real-time price charts"
                    whileFocus={{ scale: 1.01 }}
                  />
                </div>
              </FadeIn>

              <FadeIn delay={0.3}>
                <div>
                  <label className="block text-sm font-medium mb-2 text-[#1F2A2E]">Description *</label>
                  <motion.textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={6}
                    required
                    className="w-full px-4 py-3 bg-[#F8F4ED] border border-[#1F2A2E]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3B3B] focus:border-transparent text-[#1F2A2E]"
                    placeholder="Describe the task in detail, including requirements, deliverables, and any specific guidelines..."
                    whileFocus={{ scale: 1.01 }}
                  />
                </div>
              </FadeIn>

              <FadeIn delay={0.4}>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#1F2A2E]">Reward (USD) *</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                      <motion.input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.reward}
                        onChange={(e) => setFormData({ ...formData, reward: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-[#F8F4ED] border border-[#1F2A2E]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3B3B] focus:border-transparent text-[#1F2A2E]"
                        placeholder="1000"
                        whileFocus={{ scale: 1.01 }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#1F2A2E]">Deadline *</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                      <motion.input
                        type="date"
                        required
                        value={formData.deadline}
                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full pl-10 pr-4 py-3 bg-[#F8F4ED] border border-[#1F2A2E]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3B3B] focus:border-transparent text-[#1F2A2E]"
                        whileFocus={{ scale: 1.01 }}
                      />
                    </div>
                  </div>
                </div>
              </FadeIn>

              <FadeIn delay={0.5}>
                <div>
                  <label className="block text-sm font-medium mb-2 text-[#1F2A2E]">Industry</label>
                  <motion.select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value as Industry })}
                    className="w-full px-4 py-3 bg-[#F8F4ED] border border-[#1F2A2E]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3B3B] focus:border-transparent text-[#1F2A2E]"
                    whileFocus={{ scale: 1.01 }}
                  >
                    <option value="">Select industry (optional)</option>
                    {INDUSTRIES.map((industry) => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </motion.select>
                </div>
              </FadeIn>

              <FadeIn delay={0.6}>
                <div>
                  <label className="block text-sm font-medium mb-2 text-[#1F2A2E]">Required Skills (comma-separated)</label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                    <motion.input
                      type="text"
                      value={formData.required_skills}
                      onChange={(e) => setFormData({ ...formData, required_skills: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-[#F8F4ED] border border-[#1F2A2E]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3B3B] focus:border-transparent text-[#1F2A2E]"
                      placeholder="React, TypeScript, Solidity..."
                      whileFocus={{ scale: 1.01 }}
                    />
                  </div>
                  <p className="text-sm text-[#64748B] mt-2">
                    Separate skills with commas. This helps match with the right builders.
                  </p>
                </div>
              </FadeIn>

              <FadeIn delay={0.7}>
                <MotionButton
                  type="submit"
                  disabled={loading}
                  loading={loading}
                  variant="primary"
                  size="lg"
                  className="w-full"
                >
                  <Plus className="w-5 h-5" />
                  Create Bounty
                </MotionButton>
              </FadeIn>
            </div>
          </form>
        </FadeIn>
      </div>
    </div>
  );
}
