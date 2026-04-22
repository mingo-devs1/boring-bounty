'use client';

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { Trophy, Users, Zap, CheckCircle, TrendingUp, Shield, Sparkles, ArrowRight, Wallet } from 'lucide-react';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import MotionButton from '@/components/motion/motion-button';
import FadeIn from '@/components/motion/fade-in';
import Navigation from '@/components/navigation';

export default function Home() {
  const { isAuthenticated, user, loading } = useAuth();
  const { login, authenticated, ready } = usePrivy();
  const router = useRouter();

  // Redirect to profile completion if authenticated via Privy but no profile exists
  useEffect(() => {
    if (ready && authenticated && !user && !loading) {
      router.push('/complete-profile');
    }
  }, [ready, authenticated, user, loading, router]);

  const handleGetStarted = async () => {
    if (isAuthenticated && user) {
      if (user.role === 'organization') {
        router.push('/create-bounty');
      } else {
        router.push('/bounties');
      }
    } else {
      await login();
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F4ED]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}>
      <Navigation />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="text-center max-w-4xl mx-auto">
          <FadeIn delay={0.1}>
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#14B8A6]/10 text-[#14B8A6] rounded-full text-sm font-medium mb-8 border border-[#14B8A6]/20"
              whileHover={{ scale: 1.05 }}
            >
              <Zap className="w-4 h-4" />
              Proof-of-Skill Hiring Platform
            </motion.div>
          </FadeIn>
          
          <FadeIn delay={0.2}>
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 tracking-tight text-[#1F2A2E]">
              Prove Your Skills.
              <br />
              <span className="text-[#FF3B3B]">Get Paid.</span>
            </h1>
          </FadeIn>
          
          <FadeIn delay={0.3}>
            <p className="text-xl text-[#64748B] mb-8 max-w-2xl mx-auto">
              A talent marketplace where organizations post real-world tasks and builders prove their skills by completing them. No resumes required—just results.
            </p>
          </FadeIn>
          
          <FadeIn delay={0.4}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <MotionButton
                onClick={handleGetStarted}
                variant="primary"
                size="lg"
              >
                {isAuthenticated ? (
                  <>
                    {user?.role === 'organization' ? 'Post a Bounty' : 'Browse Bounties'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    <Wallet className="w-5 h-5" />
                    Get Started
                  </>
                )}
              </MotionButton>
              <MotionButton
                href="/bounties"
                variant="outline"
                size="lg"
              >
                Explore Bounties
              </MotionButton>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <FadeIn delay={0.5}>
          <div className="flex flex-wrap justify-center items-center gap-8 text-[#64748B] text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#14B8A6]" />
              <span>Trusted by innovative teams</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#FF3B3B]" />
              <span>AI, Web3, Robotics</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#14B8A6]" />
              <span>Real-world impact</span>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <FadeIn delay={0.6}>
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4 text-[#1F2A2E]">How It Works</h2>
            <p className="text-[#64748B] text-lg">Simple, transparent, merit-based hiring</p>
          </div>
        </FadeIn>
        
        <div className="grid md:grid-cols-3 gap-8">
          <FadeIn delay={0.7}>
            <motion.div 
              className="p-8 bg-white rounded-2xl border border-[#1F2A2E]/10 shadow-sm hover:shadow-xl hover:border-[#FF3B3B]/30 transition-all"
              whileHover={{ scale: 1.02, y: -4 }}
            >
              <div className="w-12 h-12 bg-[#FF3B3B]/10 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-[#FF3B3B]" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-[#1F2A2E]">For Organizations</h3>
              <p className="text-[#64748B]">
                Post real-world bounties with clear requirements and rewards. Find talent through demonstrated skills, not CVs.
              </p>
            </motion.div>
          </FadeIn>
          
          <FadeIn delay={0.8}>
            <motion.div 
              className="p-8 bg-white rounded-2xl border border-[#1F2A2E]/10 shadow-sm hover:shadow-xl hover:border-[#FF3B3B]/30 transition-all"
              whileHover={{ scale: 1.02, y: -4 }}
            >
              <div className="w-12 h-12 bg-[#14B8A6]/10 rounded-xl flex items-center justify-center mb-6">
                <Trophy className="w-6 h-6 text-[#14B8A6]" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-[#1F2A2E]">For Builders</h3>
              <p className="text-[#64748B]">
                Browse bounties, submit your work, and get paid. Build your reputation through completed tasks and ratings.
              </p>
            </motion.div>
          </FadeIn>
          
          <FadeIn delay={0.9}>
            <motion.div 
              className="p-8 bg-white rounded-2xl border border-[#1F2A2E]/10 shadow-sm hover:shadow-xl hover:border-[#FF3B3B]/30 transition-all"
              whileHover={{ scale: 1.02, y: -4 }}
            >
              <div className="w-12 h-12 bg-[#FF3B3B]/10 rounded-xl flex items-center justify-center mb-6">
                <CheckCircle className="w-6 h-6 text-[#FF3B3B]" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-[#1F2A2E]">Fair & Transparent</h3>
              <p className="text-[#64748B]">
                Clear requirements, defined rewards, and transparent selection. Skills proven through execution.
              </p>
            </motion.div>
          </FadeIn>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <FadeIn delay={1.0}>
          <motion.div 
            className="bg-gradient-to-br from-[#0F1C22] to-[#1F2A2E] rounded-3xl p-12 text-center text-white shadow-2xl"
            whileHover={{ scale: 1.01 }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg text-[#F8F4ED]/80 mb-8 max-w-2xl mx-auto">
              Join thousands of builders and organizations already using Boring Bounty to hire and get hired based on proof of skill.
            </p>
            <MotionButton
              onClick={handleGetStarted}
              variant="primary"
              size="lg"
            >
              {isAuthenticated ? (
                user?.role === 'organization' ? 'Post Your First Bounty' : 'Start Completing Bounties'
              ) : (
                'Connect Wallet to Begin'
              )}
            </MotionButton>
          </motion.div>
        </FadeIn>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1F2A2E]/10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <ArrowRight className="w-6 h-6 text-[#FF3B3B]" />
              <span className="font-bold text-[#1F2A2E]">Boring Bounty</span>
            </div>
            <p className="text-[#64748B] text-sm">
              © 2026 Boring Bounty. Proof-of-Skill Hiring.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
