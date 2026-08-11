import React from 'react';
import { motion } from 'motion/react';

interface SkeletonProps {
  className?: string;
  type?: 'card' | 'row' | 'stat' | 'text' | 'image';
}

export default function Skeleton({ className = '', type = 'text' }: SkeletonProps) {
  const baseClasses = 'bg-white/[0.04] relative overflow-hidden rounded-xl';
  
  const typeClasses = {
    card: 'h-64 w-full rounded-2xl',
    row: 'h-16 w-full rounded-xl',
    stat: 'h-32 w-full rounded-2xl',
    text: 'h-4 w-full rounded',
    image: 'h-40 w-full rounded-t-2xl rounded-b-none',
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]} ${className}`}>
      <motion.div
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.03] to-transparent"
        animate={{
          translateX: ['-100%', '200%']
        }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: 'linear'
        }}
      />
    </div>
  );
}
