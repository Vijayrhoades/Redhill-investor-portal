import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center p-12 text-center border border-white/[0.05] border-dashed rounded-2xl bg-white/[0.01] ${className}`}
    >
      <div className="w-16 h-16 bg-white/[0.03] rounded-2xl flex items-center justify-center mb-6 border border-white/[0.05]">
        <Icon className="w-8 h-8 text-gray-500" />
      </div>
      <h3 className="text-xl font-bold text-white mb-2 font-serif">{title}</h3>
      <p className="text-sm text-gray-400 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.1] text-white rounded-xl text-sm font-bold transition-colors cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}
