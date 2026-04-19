'use client';

import { useState, useEffect } from 'react';
import { getBounties } from '@/lib/server-actions/bounties';
import { Trophy, Clock, DollarSign, Building2, Search, Filter, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Industry } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedCard from '@/components/motion/animated-card';
import FadeIn from '@/components/motion/fade-in';

const INDUSTRIES: Industry[] = ['AI', 'Web3', 'Crypto', 'Robotics', 'DeFi', 'Gaming', 'Infrastructure', 'Other'];

export default function BountiesPage() {
  const [bounties, setBounties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | ''>('');
  const [sortBy, setSortBy] = useState<'latest' | 'highest'>('latest');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadBounties();
  }, []);

  const loadBounties = async () => {
    setLoading(true);
    const result = await getBounties({ status: 'open' });
    if (result.success) {
      setBounties(result.bounties);
    } else {
      setError(result.error || 'Failed to load bounties');
    }
    setLoading(false);
  };

  const filteredAndSortedBounties = bounties
    .filter((bounty) => {
      const matchesSearch =
        searchQuery === '' ||
        bounty.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bounty.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bounty.required_skills.some((skill: string) => skill.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesIndustry = selectedIndustry === '' || bounty.industry === selectedIndustry;
      return matchesSearch && matchesIndustry;
    })
    .sort((a, b) => {
      if (sortBy === 'latest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else {
        return b.reward - a.reward;
      }
    });

  return (
    <div className="min-h-screen bg-[#F8F4ED]">
      {/* Header */}
      <FadeIn>
        <div className="bg-white border-b border-[#1F2A2E]/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-4xl font-bold mb-4 text-[#1F2A2E]">Open Bounties</h1>
            <p className="text-[#64748B] text-lg">
              Find real-world tasks and prove your skills
            </p>
          </div>
        </div>
      </FadeIn>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search and Filters */}
        <FadeIn delay={0.1}>
          <div className="mb-8 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
                <motion.input
                  type="text"
                  placeholder="Search bounties by title, description, or skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-[#1F2A2E]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3B3B] focus:border-transparent text-[#1F2A2E]"
                  whileFocus={{ scale: 1.01 }}
                />
              </div>
              <motion.button
                onClick={() => setShowFilters(!showFilters)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-3 bg-white border border-[#1F2A2E]/10 rounded-lg hover:border-[#FF3B3B]/50 transition-colors text-[#1F2A2E]"
              >
                <Filter className="w-5 h-5" />
                Filters
              </motion.button>
              <motion.select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'latest' | 'highest')}
                className="px-4 py-3 bg-white border border-[#1F2A2E]/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3B3B] focus:border-transparent text-[#1F2A2E]"
                whileFocus={{ scale: 1.01 }}
              >
                <option value="latest">Latest</option>
                <option value="highest">Highest Paying</option>
              </motion.select>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="p-4 bg-white rounded-lg border border-[#1F2A2E]/10"
                >
                  <label className="block text-sm font-medium mb-2 text-[#1F2A2E]">Industry</label>
                  <div className="flex flex-wrap gap-2">
                    {INDUSTRIES.map((industry, index) => (
                      <motion.button
                        key={industry}
                        onClick={() => setSelectedIndustry(industry === selectedIndustry ? '' : industry)}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                          selectedIndustry === industry
                            ? 'bg-[#FF3B3B] text-white border-[#FF3B3B]'
                            : 'bg-[#F8F4ED] text-[#1F2A2E] border-[#1F2A2E]/10 hover:border-[#FF3B3B]/50'
                        }`}
                      >
                        {industry}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </FadeIn>

        {loading ? (
          <div className="text-center py-12">
            <motion.div 
              className="w-8 h-8 border-4 border-[#FF3B3B] border-t-transparent rounded-full mx-auto mb-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <p className="text-[#64748B]">Loading bounties...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-[#FF3B3B]">{error}</p>
          </div>
        ) : filteredAndSortedBounties.length === 0 ? (
          <FadeIn>
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-[#1F2A2E]/20 mx-auto mb-4" />
              <p className="text-[#64748B] text-lg">No bounties found</p>
              <p className="text-[#64748B] mt-2">Try adjusting your search or filters</p>
            </div>
          </FadeIn>
        ) : (
          <motion.div 
            layout
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence mode="popLayout">
              {filteredAndSortedBounties.map((bounty, index) => (
                <AnimatedCard
                  key={bounty.id}
                  href={`/bounty/${bounty.id}`}
                  delay={index * 0.05}
                  className="p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    {bounty.industry && (
                      <span className="px-3 py-1 bg-[#14B8A6]/10 text-[#14B8A6] text-xs font-medium rounded-full border border-[#14B8A6]/20">
                        {bounty.industry}
                      </span>
                    )}
                    <motion.div 
                      className="flex items-center gap-1 text-[#FF3B3B] font-bold"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <DollarSign className="w-5 h-5" />
                      <span>{bounty.reward.toLocaleString()}</span>
                    </motion.div>
                  </div>

                  <h3 className="text-xl font-semibold mb-3 line-clamp-2 text-[#1F2A2E]">{bounty.title}</h3>
                  
                  <p className="text-[#64748B] text-sm mb-4 line-clamp-3">
                    {bounty.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {bounty.required_skills.slice(0, 3).map((skill: string) => (
                      <motion.span
                        key={skill}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="px-2 py-1 bg-[#F8F4ED] text-[#1F2A2E] text-xs rounded-md border border-[#1F2A2E]/10"
                      >
                        {skill}
                      </motion.span>
                    ))}
                    {bounty.required_skills.length > 3 && (
                      <span className="px-2 py-1 bg-[#F8F4ED] text-[#1F2A2E] text-xs rounded-md border border-[#1F2A2E]/10">
                        +{bounty.required_skills.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-[#64748B] pt-4 border-t border-[#1F2A2E]/10">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      <span className="truncate max-w-[120px]">
                        {bounty.organization_name || 'Anonymous'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDistanceToNow(new Date(bounty.deadline), { addSuffix: true })}</span>
                    </div>
                  </div>
                </AnimatedCard>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
