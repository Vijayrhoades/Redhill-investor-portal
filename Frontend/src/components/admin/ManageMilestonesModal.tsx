import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Project, Milestone, MilestoneCategory, MilestoneStatus, ProjectWithAudience, NotificationLog } from '../../types';
import {
  X, CheckCircle2, Clock, AlertCircle, Plus, Sparkles, Send, Mail,
  Calendar, Layers, FileText, Check, Trash2, Pencil, ExternalLink,
  ChevronRight, Upload, Video, Image as ImageIcon, Users, ShieldCheck,
  CheckCircle, ArrowRight
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useToast } from '../Toast';
import EmailPreviewModal from './EmailPreviewModal';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ManageMilestonesModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export default function ManageMilestonesModal({
  project,
  isOpen,
  onClose,
  onRefresh,
}: ManageMilestonesModalProps) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'milestones' | 'daily' | 'history'>('milestones');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMilestoneId, setEditingMilestoneId] = useState<number | null>(null);

  // Add Milestone Form State
  const [newCat, setNewCat] = useState<MilestoneCategory>('construction');
  const [newName, setNewName] = useState('');
  const [newStatus, setNewStatus] = useState<MilestoneStatus>('in_progress');
  const [newTargetDays, setNewTargetDays] = useState<number>(25);
  const [newCurrentDay, setNewCurrentDay] = useState<number>(1);
  const [newPct, setNewPct] = useState<number>(0);
  const [newNotes, setNewNotes] = useState('');
  const [newDocUrl, setNewDocUrl] = useState('');
  const [newDocFile, setNewDocFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Daily Progress Log Form State
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<number | ''>('');
  const [dailyDayNumber, setDailyDayNumber] = useState<number>(25);
  const [dailyNotes, setDailyNotes] = useState('');
  const [dailyPct, setDailyPct] = useState<number>(100);
  const [dailyIsComplete, setDailyIsComplete] = useState(true);
  const [dailyMediaType, setDailyMediaType] = useState<'photo' | 'video'>('photo');
  const [dailyMediaUrl, setDailyMediaUrl] = useState('');
  const [dailyFile, setDailyFile] = useState<File | null>(null);
  const [isSubmittingDaily, setIsSubmittingDaily] = useState(false);

  // Preview Email State
  const [previewEmail, setPreviewEmail] = useState<NotificationLog | null>(null);

  // Fetch Milestones and Enrolled Investors Audience for this Project
  const {
    data: audienceData,
    isLoading: loadingAudience,
    refetch: refetchAudience,
  } = useQuery<ProjectWithAudience>({
    queryKey: ['project-milestones-audience', project.id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/projects/${project.id}/milestones-with-investors`);
      if (!res.ok) throw new Error('Failed to fetch project audience');
      return res.json();
    },
    enabled: isOpen,
  });

  // Fetch Project Email History
  const {
    data: projectEmails = [],
    refetch: refetchProjectEmails,
  } = useQuery<NotificationLog[]>({
    queryKey: ['project-notifications', project.id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/notifications?projectId=${project.id}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isOpen,
  });

  const milestones = audienceData?.milestones || [];
  const investors = audienceData?.investors || [];

  // Update Milestone Mutation
  const updateMilestoneMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Milestone> & { sendNotification?: boolean } }) => {
      const res = await fetch(`/api/admin/milestones/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update milestone');
      }
      return res.json();
    },
    onSuccess: (data) => {
      refetchAudience();
      refetchProjectEmails();
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
      if (onRefresh) onRefresh();

      if (data.notificationResult && data.notificationResult.notifiedRecipients?.length > 0) {
        showToast(
          `🎉 Milestone marked completed! Automated emails sent to ${data.notificationResult.notifiedRecipients.length} investor(s) of ${project.name}!`,
          'success'
        );
      } else {
        showToast('Milestone updated successfully', 'success');
      }
    },
    onError: (err: any) => {
      showToast(err.message || 'Error updating milestone', 'error');
    },
  });

  // Delete Milestone Mutation
  const deleteMilestoneMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/milestones/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete milestone');
      return res.json();
    },
    onSuccess: () => {
      refetchAudience();
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
      if (onRefresh) onRefresh();
      showToast('Milestone deleted', 'success');
    },
    onError: () => {
      showToast('Failed to delete milestone', 'error');
    },
  });

  // Handle Add Milestone Submit
  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      showToast('Please enter milestone name', 'error');
      return;
    }

    setIsUploading(true);
    let finalDoc = newDocUrl;
    if (newDocFile) {
      try {
        const formData = new FormData();
        formData.append('file', newDocFile);
        const upRes = await fetch('/api/admin/upload', { method: 'POST', body: formData });
        if (upRes.ok) {
          const upData = await upRes.json();
          finalDoc = upData.url;
        }
      } catch (err) {
        console.error('File upload error:', err);
      }
    }

    try {
      const res = await fetch('/api/admin/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          category: newCat,
          name: newName,
          status: newStatus,
          completion_percentage: newStatus === 'completed' ? 100 : newPct,
          target_days: newTargetDays,
          current_day: newCurrentDay,
          notes: newNotes,
          doc_url: finalDoc,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setShowAddForm(false);
        setNewName('');
        setNewNotes('');
        setNewDocUrl('');
        setNewDocFile(null);
        refetchAudience();
        refetchProjectEmails();
        queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
        if (onRefresh) onRefresh();

        if (data.notificationResult && data.notificationResult.notifiedRecipients?.length > 0) {
          showToast(
            `Milestone created & automated emails dispatched to ${data.notificationResult.notifiedRecipients.length} investor(s)!`,
            'success'
          );
        } else {
          showToast('Milestone created successfully!', 'success');
        }
      } else {
        showToast(data.error || 'Failed to create milestone', 'error');
      }
    } catch (err) {
      showToast('Error creating milestone', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle Daily Progress Submit
  const handleDailyProgressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dailyNotes.trim()) {
      showToast('Please enter progress notes for today', 'error');
      return;
    }

    setIsSubmittingDaily(true);
    let finalMedia = dailyMediaUrl;

    if (dailyFile) {
      try {
        const formData = new FormData();
        formData.append('file', dailyFile);
        const upRes = await fetch('/api/admin/upload', { method: 'POST', body: formData });
        if (upRes.ok) {
          const upData = await upRes.json();
          finalMedia = upData.url;
        }
      } catch (err) {
        console.error('Daily progress media upload error:', err);
      }
    }

    try {
      const res = await fetch(`/api/admin/milestones/${selectedMilestoneId || 0}/daily-progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          milestone_id: selectedMilestoneId ? Number(selectedMilestoneId) : undefined,
          day_number: dailyDayNumber,
          work_notes: dailyNotes,
          completion_percentage: dailyPct,
          is_completed: dailyIsComplete,
          media_type: dailyMediaType,
          media_url: finalMedia,
          date: new Date().toISOString().split('T')[0],
        }),
      });

      const data = await res.json();
      if (res.ok) {
        refetchAudience();
        refetchProjectEmails();
        queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
        if (onRefresh) onRefresh();

        if (data.notificationResult && data.notificationResult.notifiedRecipients?.length > 0) {
          showToast(
            `🚀 Day ${dailyDayNumber} progress logged! Milestone completed & automated emails dispatched to ${data.notificationResult.notifiedRecipients.length} investor(s)!`,
            'success'
          );
        } else {
          showToast(`Day ${dailyDayNumber} progress logged successfully!`, 'success');
        }

        setDailyNotes('');
        setDailyFile(null);
        setActiveTab('milestones');
      } else {
        showToast(data.error || 'Failed to log daily progress', 'error');
      }
    } catch (err) {
      showToast('Error logging daily progress', 'error');
    } finally {
      setIsSubmittingDaily(false);
    }
  };

  // Quick 1-Click Milestone Completion
  const handleQuickComplete = (m: Milestone) => {
    updateMilestoneMutation.mutate({
      id: m.id,
      updates: {
        status: 'completed',
        completion_percentage: 100,
        actual_completion: new Date().toISOString().split('T')[0],
        current_day: m.target_days || m.current_day,
        sendNotification: true,
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Main Container */}
      <div className="relative bg-[#11141a] border border-white/10 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden z-10 text-white animate-in fade-in zoom-in duration-200">
        
        {/* Header Banner */}
        <div className="p-6 border-b border-white/[0.08] bg-gradient-to-r from-redhill-gray to-[#151922] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-redhill-red/10 border border-red-500/20 flex items-center justify-center text-redhill-red shrink-0 mt-0.5">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-white font-serif">{project.name}</h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-gray-300 font-sans">
                  {project.location}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Manage construction milestones, daily progress updates, and automated investor notifications.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-right">
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Overall Progress</div>
              <div className="text-xl font-bold text-emerald-400 font-serif">
                {project.completion_percentage}%
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Targeted Audience Banner (Crucial Requirement Demonstration) */}
        <div className="px-6 py-3.5 bg-gradient-to-r from-red-950/40 via-redhill-gray to-black/40 border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-redhill-red/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white">Targeted Investor Audience: </span>
              <span className="text-xs text-red-300 font-semibold">
                {investors.length} Investor{investors.length === 1 ? '' : 's'} in this project
              </span>
              <span className="text-[11px] text-gray-400 ml-2 hidden md:inline">
                (Milestone completed emails are dispatched <strong>strictly</strong> to these investors)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto max-w-full">
            {loadingAudience ? (
              <span className="text-xs text-gray-400">Loading audience...</span>
            ) : investors.length === 0 ? (
              <span className="text-xs text-amber-400/80 italic">No investors assigned to this project yet.</span>
            ) : (
              investors.map((inv) => (
                <div
                  key={inv.id}
                  className="text-[11px] bg-white/5 hover:bg-white/10 border border-white/10 px-2.5 py-1 rounded-full text-gray-200 flex items-center gap-1.5 shrink-0 transition-colors"
                  title={`${inv.name} (${inv.email})`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <strong className="text-white">{inv.name}</strong>
                  <span className="text-gray-400">&lt;{inv.email}&gt;</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="px-6 border-b border-white/[0.08] flex items-center justify-between bg-black/20">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('milestones')}
              className={cn(
                'py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer',
                activeTab === 'milestones'
                  ? 'border-redhill-red text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              )}
            >
              <Layers className="w-4 h-4" />
              Project Milestones ({milestones.length})
            </button>
            <button
              onClick={() => setActiveTab('daily')}
              className={cn(
                'py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer',
                activeTab === 'daily'
                  ? 'border-redhill-red text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              )}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              Log Daily Construction Work
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={cn(
                'py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer',
                activeTab === 'history'
                  ? 'border-redhill-red text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              )}
            >
              <Mail className="w-4 h-4" />
              Dispatched Emails ({projectEmails.length})
            </button>
          </div>

          {activeTab === 'milestones' && !showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-redhill-red hover:bg-red-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-redhill-red/20 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Milestone
            </button>
          )}
        </div>

        {/* Tab Content Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: MILESTONES OVERVIEW & CONTROLS */}
          {activeTab === 'milestones' && (
            <div className="space-y-6">
              {/* Add Milestone Inline Form */}
              {showAddForm && (
                <div className="bg-redhill-gray/90 border border-white/10 rounded-xl p-5 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Plus className="w-4 h-4 text-redhill-red" /> Add New Project Milestone
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="text-gray-400 hover:text-white text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <form onSubmit={handleAddMilestone} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1">Category</label>
                        <select
                          value={newCat}
                          onChange={(e) => setNewCat(e.target.value as any)}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-redhill-red"
                        >
                          <option value="construction" className="bg-[#171a21]">Construction</option>
                          <option value="approval" className="bg-[#171a21]">Approval</option>
                          <option value="documentation" className="bg-[#171a21]">Documentation</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-gray-400 mb-1">Milestone Name</label>
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder="e.g. Pillar Work & Structural Columns (25-Day Cycle)"
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-redhill-red"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1">Target Cycle (Days)</label>
                        <input
                          type="number"
                          value={newTargetDays}
                          onChange={(e) => setNewTargetDays(parseInt(e.target.value) || 0)}
                          placeholder="25"
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-redhill-red"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1">Current Day</label>
                        <input
                          type="number"
                          value={newCurrentDay}
                          onChange={(e) => setNewCurrentDay(parseInt(e.target.value) || 0)}
                          placeholder="1"
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-redhill-red"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1">Status</label>
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value as any)}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-redhill-red"
                        >
                          <option value="pending" className="bg-[#171a21]">Pending</option>
                          <option value="in_progress" className="bg-[#171a21]">In Progress</option>
                          <option value="completed" className="bg-[#171a21]">Completed (Triggers Email)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1">Progress %</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={newPct}
                          onChange={(e) => setNewPct(parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-redhill-red"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-1">Description / Notes</label>
                      <input
                        type="text"
                        value={newNotes}
                        onChange={(e) => setNewNotes(e.target.value)}
                        placeholder="e.g. Pillar casting across Block A in progress"
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-redhill-red"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddForm(false)}
                        className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isUploading}
                        className="px-5 py-2 bg-redhill-red hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-all shadow-md cursor-pointer"
                      >
                        {isUploading ? 'Creating...' : 'Create Milestone'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Milestones List Cards */}
              <div className="space-y-4">
                {milestones.length === 0 ? (
                  <div className="text-center py-12 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <Layers className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-sm font-bold text-gray-300">No milestones yet for this project</p>
                    <p className="text-xs text-gray-500 mt-1">Add your first milestone or log daily construction progress.</p>
                  </div>
                ) : (
                  milestones.map((m) => {
                    const isCompleted = m.status === 'completed' || m.completion_percentage === 100;
                    const isEditing = editingMilestoneId === m.id;

                    return (
                      <div
                        key={m.id}
                        className={cn(
                          'p-5 rounded-2xl border transition-all flex flex-col gap-4',
                          isCompleted
                            ? 'bg-emerald-950/15 border-emerald-500/20'
                            : 'bg-white/[0.03] border-white/[0.08] hover:border-white/15'
                        )}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                                isCompleted
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              )}
                            >
                              {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                            </div>

                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-bold text-white text-base font-serif">{m.name}</h4>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400 uppercase tracking-wider font-semibold">
                                  {m.category}
                                </span>
                                {m.target_days ? (
                                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                                    Cycle: Day {m.current_day || 0} / {m.target_days} Days
                                  </span>
                                ) : null}
                              </div>

                              {m.notes && (
                                <p className="text-xs text-gray-400 mt-1 italic">
                                  &ldquo;{m.notes}&rdquo;
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Quick Action Buttons */}
                          <div className="flex items-center gap-2 shrink-0">
                            {!isCompleted && (
                              <button
                                onClick={() => handleQuickComplete(m)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-md shadow-emerald-900/30 cursor-pointer"
                                title="Complete milestone and trigger automated email to project investors"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Mark Completed & Email
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setSelectedMilestoneId(m.id);
                                setDailyDayNumber(m.target_days || 25);
                                setDailyNotes(m.notes || `Day ${m.target_days || 25}: Milestone target achieved.`);
                                setDailyPct(100);
                                setDailyIsComplete(true);
                                setActiveTab('daily');
                              }}
                              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-bold rounded-lg border border-white/10 transition-colors flex items-center gap-1 cursor-pointer"
                              title="Log daily construction work for this milestone"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                              Log Daily Work
                            </button>

                            <button
                              onClick={() => deleteMilestoneMutation.mutate(m.id)}
                              className="p-1.5 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                              title="Delete Milestone"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Progress Bar & Status Controls */}
                        <div className="bg-black/30 p-3 rounded-xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1 space-y-1.5">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-gray-400">Milestone Progress</span>
                              <span className={isCompleted ? 'text-emerald-400' : 'text-white'}>
                                {m.completion_percentage}%
                              </span>
                            </div>
                            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all duration-500',
                                  isCompleted
                                    ? 'bg-emerald-500'
                                    : 'bg-gradient-to-r from-redhill-red to-amber-500'
                                )}
                                style={{ width: `${m.completion_percentage}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 text-xs">
                            <span className="text-gray-400">Status:</span>
                            <select
                              value={m.status}
                              onChange={(e) => {
                                const newStatusVal = e.target.value as MilestoneStatus;
                                updateMilestoneMutation.mutate({
                                  id: m.id,
                                  updates: {
                                    status: newStatusVal,
                                    completion_percentage: newStatusVal === 'completed' ? 100 : m.completion_percentage,
                                    actual_completion: newStatusVal === 'completed' ? new Date().toISOString().split('T')[0] : m.actual_completion,
                                    sendNotification: newStatusVal === 'completed',
                                  },
                                });
                              }}
                              className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-bold border outline-none cursor-pointer',
                                isCompleted
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : 'bg-white/5 text-gray-300 border-white/10'
                              )}
                            >
                              <option value="pending" className="bg-[#171a21]">Pending</option>
                              <option value="in_progress" className="bg-[#171a21]">In Progress</option>
                              <option value="completed" className="bg-[#171a21]">Completed</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: LOG DAILY CONSTRUCTION WORK (THE USER'S EXACT 25-DAY SCENARIO) */}
          {activeTab === 'daily' && (
            <div className="max-w-2xl mx-auto bg-redhill-gray/80 border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white font-serif flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Log Daily Construction Work
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Update daily progress (e.g. Day 1 through Day 25 for Pillar work or approvals). When completed, automated emails are sent directly to this project&apos;s investors.
                </p>
              </div>

              <form onSubmit={handleDailyProgressSubmit} className="space-y-5">
                {/* Milestone Select */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    Select Milestone / Work Stream
                  </label>
                  <select
                    value={selectedMilestoneId}
                    onChange={(e) => {
                      const mId = e.target.value ? Number(e.target.value) : '';
                      setSelectedMilestoneId(mId);
                      const targetMilestone = milestones.find((m) => m.id === mId);
                      if (targetMilestone) {
                        setDailyDayNumber(targetMilestone.target_days || 25);
                        setDailyPct(targetMilestone.completion_percentage || 100);
                        if (targetMilestone.notes) setDailyNotes(targetMilestone.notes);
                      }
                    }}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-redhill-red transition-all"
                  >
                    <option value="" className="bg-[#171a21]">-- General Project Progress Update --</option>
                    {milestones.map((m) => (
                      <option key={m.id} value={m.id} className="bg-[#171a21]">
                        {m.name} ({m.category}) - Currently {m.completion_percentage}% [{m.status}]
                      </option>
                    ))}
                  </select>
                </div>

                {/* Day Number and Progress % Slider */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5">
                      Construction Cycle Day (e.g. Day 25)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        value={dailyDayNumber}
                        onChange={(e) => setDailyDayNumber(parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-redhill-red"
                        placeholder="25"
                        required
                      />
                      <span className="absolute right-4 top-2.5 text-xs text-gray-500 font-bold">Day</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1.5 flex justify-between">
                      <span>Milestone Progress</span>
                      <span className="text-emerald-400 font-bold">{dailyPct}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={dailyPct}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setDailyPct(val);
                        if (val === 100) setDailyIsComplete(true);
                      }}
                      className="w-full accent-redhill-red cursor-pointer mt-2"
                    />
                  </div>
                </div>

                {/* Daily Work Details */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    Today&apos;s Work Summary / Inspection Notes
                  </label>
                  <textarea
                    rows={3}
                    value={dailyNotes}
                    onChange={(e) => setDailyNotes(e.target.value)}
                    placeholder="e.g. Day 25: All structural columns and pillar work 100% completed. Concrete curing verified. Inspection passed."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-redhill-red transition-all"
                    required
                  />
                </div>

                {/* Optional Media Upload */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5">
                    Site Photo or Video (Optional)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => setDailyFile(e.target.files?.[0] || null)}
                      className="w-full text-xs text-gray-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={dailyMediaUrl}
                      onChange={(e) => setDailyMediaUrl(e.target.value)}
                      placeholder="Or paste media URL"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs outline-none focus:border-redhill-red"
                    />
                  </div>
                </div>

                {/* Milestone Completion & Automated Email Trigger Box */}
                <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="dailyIsComplete"
                    checked={dailyIsComplete}
                    onChange={(e) => setDailyIsComplete(e.target.checked)}
                    className="w-5 h-5 accent-emerald-500 rounded cursor-pointer mt-0.5"
                  />
                  <div>
                    <label htmlFor="dailyIsComplete" className="text-sm font-bold text-white cursor-pointer flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Mark Milestone as 100% Completed & Dispatch Automated Email
                    </label>
                    <p className="text-xs text-emerald-300/80 mt-1">
                      This will automatically find all {investors.length} registered investors in <strong>{project.name}</strong> and deliver the milestone completion email immediately.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('milestones')}
                    className="px-5 py-2.5 text-xs font-bold text-gray-400 hover:text-white rounded-xl transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingDaily}
                    className="px-6 py-3 bg-redhill-red hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-redhill-red/25 flex items-center gap-2 cursor-pointer"
                  >
                    {isSubmittingDaily ? (
                      'Logging Progress...'
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Log Day {dailyDayNumber} Progress & Send Email
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: PROJECT EMAIL HISTORY & AUDIT LOG */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-redhill-red" />
                  Automated Emails Dispatched for {project.name}
                </h3>
                <span className="text-xs text-gray-400">
                  {projectEmails.length} message{projectEmails.length === 1 ? '' : 's'} recorded
                </span>
              </div>

              {projectEmails.length === 0 ? (
                <div className="text-center py-12 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <Mail className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-sm font-bold text-gray-300">No automated emails sent yet</p>
                  <p className="text-xs text-gray-500 mt-1">
                    When you complete a milestone or log daily progress, emails sent to investors will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projectEmails.map((log) => (
                    <div
                      key={log.id}
                      className="bg-white/[0.03] border border-white/[0.08] hover:border-white/15 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{log.subject}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                            Sent
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-4">
                          <span>
                            To: <strong className="text-gray-200">{log.recipient_name}</strong> &lt;{log.recipient_email}&gt;
                          </span>
                          <span>
                            {new Date(log.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => setPreviewEmail(log)}
                        className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-200 rounded-lg border border-white/10 transition-colors flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        View Rendered Email
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-redhill-gray flex items-center justify-between">
          <div className="text-xs text-gray-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Targeted Dispatch: Emails are sent strictly to investors assigned to <strong>{project.name}</strong>.</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-white/10 hover:bg-white/15 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>

      {/* Rendered Email Preview Modal */}
      {previewEmail && (
        <EmailPreviewModal
          isOpen={!!previewEmail}
          onClose={() => setPreviewEmail(null)}
          subject={previewEmail.subject}
          recipientName={previewEmail.recipient_name}
          recipientEmail={previewEmail.recipient_email}
          projectName={project.name}
          milestoneName={previewEmail.milestone_name}
          htmlContent={previewEmail.content_html}
          sentAt={previewEmail.created_at}
        />
      )}
    </div>
  );
}
