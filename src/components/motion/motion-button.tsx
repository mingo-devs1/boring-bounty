'use client';

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { ReactNode } from 'react';

interface MotionButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  href?: string;
}

export default function MotionButton({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  href,
}: MotionButtonProps) {
  const baseStyles = 'font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-2';
  
  const variants = {
    primary: 'bg-[#FF3B3B] hover:bg-[#E53333] text-white shadow-lg shadow-[#FF3B3B]/20',
    secondary: 'bg-[#1F2A2E] hover:bg-[#0F1C22] text-white shadow-lg shadow-[#1F2A2E]/20',
    outline: 'bg-transparent border-2 border-[#1F2A2E] text-[#1F2A2E] hover:bg-[#1F2A2E] hover:text-white',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const button = (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className} ${
        disabled || loading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
      {children}
    </motion.button>
  );

  if (href) {
    return (
      <motion.a
        href={href}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      >
        {children}
      </motion.a>
    );
  }

  return button;
}
