import React, { useState } from 'react';
import { User, Project } from '../../../types';
import { PlusCircle, X } from 'lucide-react';

interface AssignProjectModalProps {
  isOpen: boolean;
  investors: User[];
  projects: Project[];
  onClose: () => void;
  onSubmit: (data: {
    userId: string;
    projectId: string;
    contribution: string;
    investmentAmount: string;
    allottedSqft: string;
    marketPricePerSqft: string;
  }) => Promise<void>;
}

export default function AssignProjectModal({
  isOpen,
  investors,
  projects,
  onClose,
  onSubmit
}: AssignProjectModalProps) {
  const [userId, setUserId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [contribution, setContribution] = useState('');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [allottedSqft, setAllottedSqft] = useState('');
  const [marketPricePerSqft, setMarketPricePerSqft] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        userId,
        projectId,
        contribution,
        investmentAmount,
        allottedSqft,
        marketPricePerSqft
      });
      setUserId('');
      setProjectId('');
      setContribution('');
      setInvestmentAmount('');
      setAllottedSqft('');
      setMarketPricePerSqft('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-redhill-gray border border-white/[0.08] rounded-2xl w-full max-w-lg p-8 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white font-serif flex items-center gap-2">
            <PlusCircle className="w-6 h-6 text-redhill-red" />
            Assign Project to Investor
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-1">Select Investor</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 transition-all"
              required
            >
              <option value="" disabled className="bg-redhill-gray">Choose an investor...</option>
              {investors.map((inv) => (
                <option key={inv.id} value={inv.id} className="bg-redhill-gray">{inv.name} ({inv.email})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-400 mb-1">Select Project</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 transition-all"
              required
            >
              <option value="" disabled className="bg-redhill-gray">Choose a project...</option>
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id} className="bg-redhill-gray">{proj.name} - {proj.location}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-1">Investment Amount (₹)</label>
              <input
                type="number"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 transition-all"
                placeholder="e.g. 25000000"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-1">Allotted Sqft</label>
              <input
                type="number"
                value={allottedSqft}
                onChange={(e) => setAllottedSqft(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 transition-all"
                placeholder="e.g. 1200"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-1">Current Market Price/Sqft</label>
              <input
                type="number"
                value={marketPricePerSqft}
                onChange={(e) => setMarketPricePerSqft(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 transition-all"
                placeholder="e.g. 15000"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-1">Display Label</label>
              <input
                type="text"
                value={contribution}
                onChange={(e) => setContribution(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 transition-all"
                placeholder="e.g. ₹2.5 Cr (Unit 402)"
              />
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl font-bold transition-all text-gray-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-redhill-red hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-redhill-red/25 cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Assigning...' : 'Assign Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
