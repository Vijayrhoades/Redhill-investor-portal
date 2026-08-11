import React from 'react';
import { Hammer, ShieldCheck, CheckCircle2, PauseCircle } from 'lucide-react';

interface StatusChipProps {
  status: string;
  className?: string;
}

export default function StatusChip({ status, className = '' }: StatusChipProps) {
  const normalized = status.toLowerCase();
  
  let bg = 'bg-gray-500/10';
  let text = 'text-gray-400';
  let border = 'border-gray-500/20';
  let Icon = PauseCircle;

  if (normalized.includes('construction')) {
    bg = 'bg-amber-500/10';
    text = 'text-amber-400';
    border = 'border-amber-500/20';
    Icon = Hammer;
  } else if (normalized.includes('approval') || normalized.includes('planning')) {
    bg = 'bg-blue-500/10';
    text = 'text-blue-400';
    border = 'border-blue-500/20';
    Icon = ShieldCheck;
  } else if (normalized.includes('complete') || normalized.includes('delivered')) {
    bg = 'bg-emerald-500/10';
    text = 'text-emerald-400';
    border = 'border-emerald-500/20';
    Icon = CheckCircle2;
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${bg} ${text} ${border} ${className}`}>
      <Icon className="w-3 h-3" />
      {status}
    </div>
  );
}
