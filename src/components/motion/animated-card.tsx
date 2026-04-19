'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  onClick?: () => void;
  href?: string;
}

export default function AnimatedCard({ children, className = '', delay = 0, onClick, href }: AnimatedCardProps) {
  const card = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ 
        scale: 1.02, 
        y: -4,
        boxShadow: '0 20px 40px -12px rgba(31, 42, 46, 0.15)'
      }}
      whileTap={{ scale: 0.98 }}
      className={`bg-white rounded-2xl border border-[#1F2A2E]/10 shadow-sm transition-all ${className}`}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );

  if (href) {
    return (
      <motion.a
        href={href}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
        whileHover={{ 
          scale: 1.02, 
          y: -4,
          boxShadow: '0 20px 40px -12px rgba(31, 42, 46, 0.15)'
        }}
        whileTap={{ scale: 0.98 }}
        className={`bg-white rounded-2xl border border-[#1F2A2E]/10 shadow-sm transition-all block ${className}`}
      >
        {children}
      </motion.a>
    );
  }

  return card;
}
