import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '../../types';
import { Search, Users, Plus, UserPlus, Trash2, Copy, Check } from 'lucide-react';
import EmptyState from '../EmptyState';
import { useToast } from '../Toast';
import ConfirmDialog from '../ConfirmDialog';

export default function InvestorManager() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: investors = [] } = useQuery<User[]>({ queryKey: ['admin-investors'] });
  const { data: assignments = [] } = useQuery<any[]>({ queryKey: ['admin-investor-projects'] });

  const [investorSearch, setInvestorSearch] = useState('');
  const [investorPage, setInvestorPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const deleteInvestorMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/investors/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-investors'] });
      queryClient.invalidateQueries({ queryKey: ['admin-investor-projects'] });
      showToast('Investor deleted successfully', 'success');
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    },
    onError: () => {
      showToast('Failed to delete investor', 'error');
    }
  });

  const copyToClipboard = useCallback(async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      showToast(`Copied "${text}" to clipboard`, 'info');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showToast('Failed to copy to clipboard', 'error');
    }
  }, [showToast]);

  const filteredInvestors = investors.filter((i: User) => 
    (i.name?.toLowerCase().includes(investorSearch.toLowerCase()) || '') ||
    (i.email?.toLowerCase().includes(investorSearch.toLowerCase()) || '') ||
    (i.login_id?.toLowerCase().includes(investorSearch.toLowerCase()) || '')
  );

  const paginatedInvestors = filteredInvestors.slice((investorPage - 1) * 10, investorPage * 10);
  const investorTotalPages = Math.max(1, Math.ceil(filteredInvestors.length / 10));

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white font-serif">Investor Accounts</h1>
          <p className="text-gray-400 mt-1">Manage investor access, project assignments, and financial data.</p>
        </div>
        <div className="flex gap-4">
          <button className="bg-white/[0.03] border border-white/[0.08] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-white/5 transition-all cursor-pointer">
            <Plus className="w-5 h-5" />
            Assign to Project
          </button>
          <button className="bg-redhill-red text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-redhill-red/20 hover:bg-red-700 transition-all cursor-pointer">
            <UserPlus className="w-5 h-5" />
            Add Investor
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search investors by name, email, or login ID..."
            value={investorSearch}
            onChange={(e) => { setInvestorSearch(e.target.value); setInvestorPage(1); }}
            className="w-full pl-12 pr-4 py-3 bg-redhill-gray border border-white/[0.06] rounded-xl outline-none text-white focus:bg-white/[0.02] focus:border-redhill-red/40 transition-all"
          />
        </div>
      </div>

      {filteredInvestors.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No investors found"
          description={investorSearch ? `No investors match "${investorSearch}"` : "Get started by adding your first investor."}
          actionLabel={investorSearch ? "Clear Search" : "Add Investor"}
          onAction={investorSearch ? () => setInvestorSearch('') : () => {}}
        />
      ) : (
        <div className="bg-redhill-gray rounded-2xl border border-white/[0.06] shadow-lg overflow-hidden">
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#252A35] border-b border-white/[0.06]">
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Investor</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Login ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Contact</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Projects</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {paginatedInvestors.map(i => {
                  const investorAssignments = assignments.filter((a: any) => a.user_id === i.id);
                  return (
                    <tr key={i.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-sm font-bold text-gray-400">
                            {i.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-white">{i.name}</p>
                            <p className="text-xs text-gray-500">{i.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <code className="bg-white/5 px-2 py-1 rounded text-red-400 font-bold text-xs">{i.login_id || 'N/A'}</code>
                          {i.login_id && (
                            <button
                              onClick={() => copyToClipboard(i.login_id!, `login-${i.id}`)}
                              className="p-1 text-gray-600 hover:text-gray-300 transition-colors cursor-pointer"
                              title="Copy Login ID"
                            >
                              {copiedId === `login-${i.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-300">{i.phone || 'No phone'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-white/5 text-gray-400 px-2 py-1 rounded text-[10px] font-bold uppercase">{investorAssignments.length} {investorAssignments.length === 1 ? 'Project' : 'Projects'}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            className="p-2 text-gray-500 hover:text-redhill-red transition-colors cursor-pointer"
                            onClick={() => setConfirmDialog({
                              isOpen: true,
                              title: `Delete ${i.name}?`,
                              message: `This will permanently remove the investor "${i.name}" and all their project assignments, investment records, and query history.`,
                              onConfirm: () => deleteInvestorMutation.mutate(i.id)
                            })}
                            title="Delete Investor"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {investorTotalPages > 1 && (
            <div className="p-4 border-t border-white/[0.06] flex items-center justify-between text-sm">
              <span className="text-gray-400">Showing {paginatedInvestors.length} of {filteredInvestors.length} investors</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setInvestorPage(p => Math.max(1, p - 1))}
                  disabled={investorPage === 1}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white"
                >
                  Prev
                </button>
                <button
                  onClick={() => setInvestorPage(p => Math.min(investorTotalPages, p + 1))}
                  disabled={investorPage === investorTotalPages}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />
    </div>
  );
}
