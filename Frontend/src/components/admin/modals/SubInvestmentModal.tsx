import React, { useState, useEffect } from 'react';
import { TrendingUp, X } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatters';

interface SubInvestmentModalProps {
  isOpen: boolean;
  assignment: any | null;
  onClose: () => void;
  onSubmit: (data: {
    userId: number;
    projectId: number;
    addCapital: number;
    addSqft: number;
    currentPrice: number;
    notes: string;
    transactionDate: string;
  }) => Promise<void>;
}

export default function SubInvestmentModal({
  isOpen,
  assignment,
  onClose,
  onSubmit
}: SubInvestmentModalProps) {
  const [subInvAmount, setSubInvAmount] = useState('');
  const [subInvSqft, setSubInvSqft] = useState('');
  const [subInvPrice, setSubInvPrice] = useState('');
  const [subInvDate, setSubInvDate] = useState(new Date().toISOString().split('T')[0]);
  const [subInvNotes, setSubInvNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (assignment) {
      setSubInvPrice(String(assignment.market_price_per_sqft || assignment.price_at_investment || ''));
      setSubInvAmount('');
      setSubInvSqft('');
      setSubInvNotes('');
    }
  }, [assignment]);

  if (!isOpen || !assignment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        userId: assignment.user_id,
        projectId: assignment.project_id,
        addCapital: Number(subInvAmount),
        addSqft: Number(subInvSqft),
        currentPrice: Number(subInvPrice),
        notes: subInvNotes,
        transactionDate: subInvDate
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-redhill-gray border border-white/[0.08] rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Add Sub-Investment</h3>
              <p className="text-xs text-gray-400">
                {assignment.investor_name} &bull; {assignment.project_name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current State Summary */}
        <div className="bg-black/20 rounded-xl p-4 border border-white/[0.04] grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-gray-400">Current Capital:</p>
            <p className="font-bold text-white text-sm mt-0.5">{formatCurrency(assignment.investment_amount || 0)}</p>
          </div>
          <div>
            <p className="text-gray-400">Current Sqft:</p>
            <p className="font-bold text-white text-sm mt-0.5">{assignment.allotted_sqft?.toLocaleString('en-IN') || 0} sqft</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Additional Capital (₹)
              </label>
              <input
                type="number"
                required
                min="1"
                value={subInvAmount}
                onChange={(e) => setSubInvAmount(e.target.value)}
                placeholder="e.g. 5000000"
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:bg-white/[0.05] focus:border-emerald-500/40"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Additional Allotted Sqft
              </label>
              <input
                type="number"
                required
                min="1"
                value={subInvSqft}
                onChange={(e) => setSubInvSqft(e.target.value)}
                placeholder="e.g. 500"
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:bg-white/[0.05] focus:border-emerald-500/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Current Market Price / Sqft (₹)
              </label>
              <input
                type="number"
                required
                min="1"
                value={subInvPrice}
                onChange={(e) => setSubInvPrice(e.target.value)}
                placeholder="e.g. 15000"
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:bg-white/[0.05] focus:border-emerald-500/40"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Transaction Date
              </label>
              <input
                type="date"
                required
                value={subInvDate}
                onChange={(e) => setSubInvDate(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:bg-white/[0.05] focus:border-emerald-500/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">
              Remarks / Transaction Notes
            </label>
            <textarea
              rows={2}
              value={subInvNotes}
              onChange={(e) => setSubInvNotes(e.target.value)}
              placeholder="e.g. Upgraded unit tranche B, Cheque #884920"
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:bg-white/[0.05] focus:border-emerald-500/40 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-gray-300 font-bold hover:bg-white/5 transition-all text-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-lg shadow-emerald-600/20 text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add to Ledger'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
