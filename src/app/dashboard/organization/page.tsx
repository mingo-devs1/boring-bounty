'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { getBountiesByCreator } from '@/lib/server-actions/bounties';
import { Trophy, Clock, DollarSign, Star, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import FadeIn from '@/components/motion/fade-in';
import AnimatedCard from '@/components/motion/animated-card';
import MotionButton from '@/components/motion/motion-button';

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

export default function OrganizationDashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [bounties, setBounties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !user || (user.role !== 'organization' && user.role !== 'hiring_manager')) {
      router.push('/');
      return;
    }

    loadBounties();
  }, [isAuthenticated, user, router]);

  const loadBounties = async () => {
    if (!user) return;
    
    setLoading(true);
    const result = await getBountiesByCreator(user.id);
    if (result.success) {
      setBounties(result.bounties);
    } else {
      setError(result.error || 'Failed to load bounties');
    }
    setLoading(false);
  };

  const stats = {
    total: bounties.length,
    open: bounties.filter((b) => b.status === 'open').length,
    closed: bounties.filter((b) => b.status === 'closed').length,
    totalReward: bounties.reduce((sum, b) => sum + b.reward, 0),
    averageRating: user?.rating || 0,
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2 text-[#1F2A2E]">Organization Dashboard</h1>
                <p className="text-[#64748B] text-lg">
                  Manage your bounties and review submissions
                </p>
              </div>
              <MotionButton
                href="/create-bounty"
                variant="primary"
                size="lg"
              >
                <Plus className="w-5 h-5" />
                Create Bounty
              </MotionButton>
            </div>
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
                    <span className="text-[#64748B] text-sm">Total Bounties</span>
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
                    <span className="text-[#64748B] text-sm">Open</span>
                    <Clock className="w-5 h-5 text-[#14B8A6]" />
                  </div>
                  <AnimatedCounter value={stats.open} />
                </motion.div>

                <motion.div 
                  className="bg-white rounded-2xl p-6 border border-[#1F2A2E]/10 shadow-sm"
                  whileHover={{ scale: 1.02, y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#64748B] text-sm">Closed</span>
                    <Star className="w-5 h-5 text-[#64748B]" />
                  </div>
                  <AnimatedCounter value={stats.closed} />
                </motion.div>

                <motion.div 
                  className="bg-white rounded-2xl p-6 border border-[#1F2A2E]/10 shadow-sm"
                  whileHover={{ scale: 1.02, y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#64748B] text-sm">Total Reward Pool</span>
                    <DollarSign className="w-5 h-5 text-[#FF3B3B]" />
                  </div>
                  <motion.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-3xl font-bold text-[#FF3B3B]"
                  >
                    ${stats.totalReward.toLocaleString()}
                  </motion.span>
                </motion.div>
              </div>
            </FadeIn>

            {/* Bounties List */}
            <FadeIn delay={0.2}>
              <div className="bg-white rounded-2xl p-8 border border-[#1F2A2E]/10 shadow-sm">
                <h2 className="text-2xl font-semibold mb-6 text-[#1F2A2E]">Your Bounties</h2>
                
                {bounties.length === 0 ? (
                  <div className="text-center py-12">
                    <Trophy className="w-16 h-16 text-[#1F2A2E]/20 mx-auto mb-4" />
                    <p className="text-[#64748B] text-lg">No bounties yet</p>
                    <p className="text-[#64748B] mt-2">
                      <Link href="/create-bounty" className="text-[#FF3B3B] hover:underline font-medium">
                        Create your first bounty to get started
                      </Link>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bounties.map((bounty, index) => (
                      <AnimatedCard
                        key={bounty.id}
                        href={`/bounty/${bounty.id}`}
                        delay={index * 0.05}
                        className="p-6"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg text-[#1F2A2E]">{bounty.title}</h3>
                              <motion.span
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: index * 0.05 + 0.2 }}
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  bounty.status === 'open'
                                    ? 'bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/20'
                                    : 'bg-[#1F2A2E]/10 text-[#64748B]'
                                }`}
                              >
                                {bounty.status.charAt(0).toUpperCase() + bounty.status.slice(1)}
                              </motion.span>
                            </div>
                            <p className="text-[#64748B] text-sm line-clamp-2 mb-3">
                              {bounty.description}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-[#64748B]">
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4 text-[#FF3B3B]" />
                                ${bounty.reward.toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatDistanceToNow(new Date(bounty.deadline), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </div>
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
