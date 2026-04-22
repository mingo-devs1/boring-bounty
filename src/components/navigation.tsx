'use client';

import { useAuth } from '@/contexts/auth-context';
import { usePrivy } from '@privy-io/react-auth';
import { Wallet, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import MotionButton from '@/components/motion/motion-button';
import NotificationsPanel from '@/components/notifications-panel';

export default function Navigation() {
  const { isAuthenticated, user, loading } = useAuth();
  const { login } = usePrivy();

  const handleGetStarted = async () => {
    if (isAuthenticated && user) {
      if (user.role === 'organization') {
        window.location.href = '/create-bounty';
      } else {
        window.location.href = '/bounties';
      }
    } else {
      await login();
    }
  };

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-50 border-b border-[#1F2A2E]/10 bg-[#0F1C22] backdrop-blur-lg"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <Link href="/">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <ArrowRight className="w-8 h-8 text-[#FF3B3B]" />
              </motion.div>
            </Link>
            <Link href="/" className="text-xl font-bold text-white">
              Boring Bounty
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/bounties" className="text-[#F8F4ED] hover:text-[#FF3B3B] transition-colors font-medium">
              Browse Bounties
            </Link>
            <Link href="/organizations" className="text-[#F8F4ED] hover:text-[#FF3B3B] transition-colors font-medium">
              Organizations
            </Link>
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-[#1F2A2E] animate-pulse" />
            ) : isAuthenticated ? (
              <>
                <NotificationsPanel />
                <Link
                  href={user?.role === 'organization' ? '/dashboard/organization' : '/dashboard/builder'}
                  className="px-4 py-2 bg-[#FF3B3B] hover:bg-[#E53333] text-white rounded-lg font-medium transition-colors"
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <MotionButton
                onClick={handleGetStarted}
                variant="primary"
                size="sm"
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </MotionButton>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
