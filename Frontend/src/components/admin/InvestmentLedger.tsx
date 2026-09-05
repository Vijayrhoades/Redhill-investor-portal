import React, { useState } from 'react';
import { LedgerEntry, Project } from '../../types';
import { BookOpen, Search, X, TrendingUp, Filter } from 'lucide-react';
import { formatCurrency, formatDate, formatRelativeTime } from '../../utils/formatters';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InvestmentLedgerProps {
  ledgerEntries: LedgerEntry[];
  projects: Project[];
}

export default function InvestmentLedger({
  ledgerEntries,
  projects
}: InvestmentLedgerProps) {
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerProjectFilter, setLedgerProjectFilter] = useState('all');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState('all');

  const filteredEntries = ledgerEntries.filter(e => {
    const matchesSearch = !ledgerSearch || 
      (e.investor_name?.toLowerCase().includes(ledgerSearch.toLowerCase()) || false) ||
      (e.investor_login_id?.toLowerCase().includes(ledgerSearch.toLowerCase()) || false) ||
      (e.project_name?.toLowerCase().includes(ledgerSearch.toLowerCase()) || false) ||
      (e.note?.toLowerCase().includes(ledgerSearch.toLowerCase()) || false);

    const matchesProject = ledgerProjectFilter === 'all' || e.project_id === Number(ledgerProjectFilter);
    const matchesType = ledgerTypeFilter === 'all' || e.transaction_type === ledgerTypeFilter;

    return matchesSearch && matchesProject && matchesType;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-redhill-red" />
            <h1 className="text-3xl font-bold text-white font-serif">Investment Ledger System</h1>
          </div>
          <p className="text-gray-400 mt-1">Audit log of all investor assignments, sub-investments, and capital upgrades.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-redhill-gray rounded-2xl border border-white/[0.06] p-6 space-y-4 shadow-lg">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={ledgerSearch}
              onChange={(e) => setLedgerSearch(e.target.value)}
              placeholder="Search ledger by investor name, ID, project, or notes..."
              className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:bg-white/[0.05] focus:border-redhill-red/40"
            />
            {ledgerSearch && (
              <button onClick={() => setLedgerSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={ledgerProjectFilter}
              onChange={(e) => setLedgerProjectFilter(e.target.value)}
              className="bg-white/[0.03] border border-white/[0.08] text-gray-300 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-redhill-red/40"
            >
              <option value="all" className="bg-redhill-gray">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-redhill-gray">{p.name}</option>
              ))}
            </select>

            <select
              value={ledgerTypeFilter}
              onChange={(e) => setLedgerTypeFilter(e.target.value)}
              className="bg-white/[0.03] border border-white/[0.08] text-gray-300 text-sm rounded-xl px-4 py-2.5 outline-none focus:border-redhill-red/40"
            >
              <option value="all" className="bg-redhill-gray">All Types</option>
              <option value="initial_assignment" className="bg-redhill-gray">Initial Assignment</option>
              <option value="sub_investment" className="bg-redhill-gray">Sub-Investment</option>
              <option value="adjustment" className="bg-redhill-gray">Adjustment</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-black/20 border-b border-white/[0.06] text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Investor</th>
                <th className="px-5 py-3">Project</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Capital Amount</th>
                <th className="px-5 py-3">Allotted Sqft</th>
                <th className="px-5 py-3">Inv / Market Rate</th>
                <th className="px-5 py-3">Remarks / Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05] text-sm">
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <p className="font-bold text-white text-xs">{formatDate(entry.transaction_date)}</p>
                    <p className="text-[10px] text-gray-500">{formatRelativeTime(entry.created_at)}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="font-bold text-white">{entry.investor_name}</p>
                    <p className="text-xs text-gray-400 font-mono">ID: {entry.investor_login_id || 'N/A'}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-medium text-gray-200">{entry.project_name}</span>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {entry.transaction_type === 'initial_assignment' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        Initial Assignment
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <TrendingUp className="w-3 h-3" /> Sub-Investment
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <p className="font-bold text-emerald-400">+{formatCurrency(entry.investment_amount)}</p>
                    {entry.contribution && <p className="text-[11px] text-gray-400">{entry.contribution}</p>}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <p className="font-bold text-white">+{entry.allotted_sqft?.toLocaleString('en-IN') || 0} sqft</p>
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-xs">
                    <p className="text-gray-300">Inv: {formatCurrency(entry.price_at_investment)}/sqft</p>
                    <p className="text-emerald-400 font-medium">Mkt: {formatCurrency(entry.market_price_per_sqft)}/sqft</p>
                  </td>
                  <td className="px-5 py-3.5 max-w-xs">
                    <p className="text-xs text-gray-300 truncate" title={entry.note}>{entry.note || 'No notes'}</p>
                  </td>
                </tr>
              ))}
              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-500">
                    <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm font-bold">No ledger transactions found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
