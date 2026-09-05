import React, { useState } from 'react';
import { IndianRupee, X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    type: 'receipt' | 'invoice';
    amount: string;
    date: string;
    notes: string;
    file: File | null;
  }) => Promise<void>;
}

export default function RecordPaymentModal({
  isOpen,
  onClose,
  onSubmit
}: RecordPaymentModalProps) {
  const [payType, setPayType] = useState<'receipt' | 'invoice'>('receipt');
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payNotes, setPayNotes] = useState('');
  const [payFile, setPayFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        type: payType,
        amount: payAmount,
        date: payDate,
        notes: payNotes,
        file: payFile
      });
      setPayAmount('');
      setPayNotes('');
      setPayFile(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1b23] rounded-2xl max-w-md w-full border border-white/10 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-emerald-400" />
            Record Payment / Invoice
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPayType('invoice')}
                className={cn(
                  "flex-1 py-2 text-sm font-bold rounded-lg border transition-colors cursor-pointer",
                  payType === 'invoice'
                    ? "bg-amber-500/20 border-amber-500 text-amber-500"
                    : "bg-white/5 border-transparent text-gray-400"
                )}
              >
                Invoice
              </button>
              <button
                type="button"
                onClick={() => setPayType('receipt')}
                className={cn(
                  "flex-1 py-2 text-sm font-bold rounded-lg border transition-colors cursor-pointer",
                  payType === 'receipt'
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-500"
                    : "bg-white/5 border-transparent text-gray-400"
                )}
              >
                Receipt
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Amount (₹)</label>
              <input
                type="number"
                required
                value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-emerald-500/50"
                placeholder="e.g. 50000"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Date</label>
              <input
                type="date"
                required
                value={payDate}
                onChange={e => setPayDate(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Notes / Reference</label>
            <input
              type="text"
              value={payNotes}
              onChange={e => setPayNotes(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-emerald-500/50"
              placeholder="e.g. NEFT Reference #12345"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Attach Document (PDF/Image)</label>
            <input
              type="file"
              onChange={e => setPayFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20"
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-bold rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Record Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
