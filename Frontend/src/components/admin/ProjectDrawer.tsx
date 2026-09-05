import React, { useState, useRef, useEffect } from 'react';
import {
  X, CheckCircle2, Clock, AlertCircle, Hammer, Upload, Link as LinkIcon,
  Image as ImageIcon, Video, FileVideo, PlusCircle, Trash2, ChevronDown, ChevronUp,
  Save, ExternalLink, Eye
} from 'lucide-react';
import { Project, Milestone, MilestoneCategory, MilestoneStatus, ProgressUpdate } from '../../types';
import { useToast } from '../Toast';
import StatusChip from '../StatusChip';
import { formatDate } from '../../utils/formatters';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ProjectDrawerProps {
  project: Project | null;
  onClose: () => void;
  onRefreshProjects: () => void;
}

const MILESTONE_CATEGORIES: { value: MilestoneCategory; label: string; icon: React.ReactNode }[] = [
  { value: 'documentation', label: 'Documentation', icon: <Eye className="w-4 h-4" /> },
  { value: 'approval', label: 'Approval', icon: <CheckCircle2 className="w-4 h-4" /> },
  { value: 'construction', label: 'Construction', icon: <Hammer className="w-4 h-4" /> },
];

const MILESTONE_STATUS_OPTIONS: { value: MilestoneStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: 'bg-gray-500' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-amber-500' },
  { value: 'completed', label: 'Completed', color: 'bg-emerald-500' },
];

export default function ProjectDrawer({ project, onClose, onRefreshProjects }: ProjectDrawerProps) {
  const { showToast } = useToast();

  // Milestones & Updates state
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [updates, setUpdates] = useState<ProgressUpdate[]>([]);
  const [loading, setLoading] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState<'milestones' | 'updates' | 'cctv'>('milestones');

  // Milestone form state
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [mCategory, setMCategory] = useState<MilestoneCategory>('documentation');
  const [mName, setMName] = useState('');
  const [mStatus, setMStatus] = useState<MilestoneStatus>('pending');
  const [mStartDate, setMStartDate] = useState('');
  const [mExpectedCompletion, setMExpectedCompletion] = useState('');
  const [mPercentage, setMPercentage] = useState(0);
  const [mDocUrl, setMDocUrl] = useState('');
  const [mDocFile, setMDocFile] = useState<File | null>(null);
  const mDocFileRef = useRef<HTMLInputElement>(null);
  const [submittingMilestone, setSubmittingMilestone] = useState(false);

  // Update form state
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateType, setUpdateType] = useState<'photo' | 'video'>('photo');
  const [updateCaption, setUpdateCaption] = useState('');
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');
  const [updateUrl, setUpdateUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CCTV state
  const [cctvUrl, setCctvUrl] = useState('');
  const [savingCctv, setSavingCctv] = useState(false);

  // Milestone inline edit state
  const [editingMilestoneId, setEditingMilestoneId] = useState<number | null>(null);
  const [editMStatus, setEditMStatus] = useState<MilestoneStatus>('pending');
  const [editMPercentage, setEditMPercentage] = useState(0);

  // Fetch project details
  useEffect(() => {
    if (project) {
      fetchDetails(project.id);
      setCctvUrl(project.cctv_url || '');
    }
  }, [project?.id]);

  const fetchDetails = async (projectId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/investor/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setMilestones(data.milestones || []);
        setUpdates(data.updates || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Reset milestone form
  const resetMilestoneForm = () => {
    setMCategory('documentation');
    setMName('');
    setMStatus('pending');
    setMStartDate('');
    setMExpectedCompletion('');
    setMPercentage(0);
    setMDocUrl('');
    setMDocFile(null);
    setShowMilestoneForm(false);
  };

  // Reset update form
  const resetUpdateForm = () => {
    setUpdateType('photo');
    setUpdateCaption('');
    setUpdateUrl('');
    setUploadMode('url');
    setSelectedFile(null);
    setFilePreviewUrl(null);
    setShowUpdateForm(false);
  };

  // --- Handlers ---
  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !mName.trim()) return;

    setSubmittingMilestone(true);
    try {
      let docUrl = mDocUrl;

      // Upload doc file if provided
      if (mDocFile) {
        const formData = new FormData();
        formData.append('file', mDocFile);
        const uploadRes = await fetch('/api/admin/upload', { method: 'POST', body: formData });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          docUrl = uploadData.url;
        }
      }

      const res = await fetch('/api/admin/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          category: mCategory,
          name: mName,
          status: mStatus,
          start_date: mStartDate || null,
          expected_completion: mExpectedCompletion || null,
          actual_completion: mStatus === 'completed' ? new Date().toISOString().split('T')[0] : null,
          completion_percentage: mStatus === 'completed' ? 100 : mPercentage,
          doc_url: docUrl || null,
        }),
      });

      if (res.ok) {
        showToast('Milestone created successfully!', 'success');
        resetMilestoneForm();
        fetchDetails(project.id);
        onRefreshProjects();
      } else {
        const err = await res.json();
        showToast(`Error: ${err.error || 'Failed to create milestone'}`, 'error');
      }
    } catch {
      showToast('An error occurred while creating the milestone', 'error');
    } finally {
      setSubmittingMilestone(false);
    }
  };

  const handleUpdateMilestone = async (milestoneId: number) => {
    try {
      const res = await fetch(`/api/admin/milestones/${milestoneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editMStatus,
          actual_completion: editMStatus === 'completed' ? new Date().toISOString().split('T')[0] : null,
          completion_percentage: editMStatus === 'completed' ? 100 : editMPercentage,
        }),
      });

      if (res.ok) {
        showToast('Milestone updated successfully!', 'success');
        setEditingMilestoneId(null);
        if (project) fetchDetails(project.id);
        onRefreshProjects();
      } else {
        showToast('Failed to update milestone', 'error');
      }
    } catch {
      showToast('An error occurred', 'error');
    }
  };

  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;

    setUploading(true);
    try {
      let finalUrl = updateUrl;

      // Upload file if provided
      if (uploadMode === 'file' && selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const uploadRes = await fetch('/api/admin/upload', { method: 'POST', body: formData });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalUrl = uploadData.url;
        } else {
          showToast('File upload failed', 'error');
          setUploading(false);
          return;
        }
      }

      if (!finalUrl.trim()) {
        showToast('Please provide a URL or upload a file', 'error');
        setUploading(false);
        return;
      }

      const res = await fetch('/api/admin/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          type: updateType,
          url: finalUrl,
          caption: updateCaption || `${updateType === 'photo' ? 'Photo' : 'Video'} update`,
          date: new Date().toISOString().split('T')[0],
          milestone_id: null,
        }),
      });

      if (res.ok) {
        showToast(`${updateType === 'photo' ? 'Photo' : 'Video'} update added successfully!`, 'success');
        resetUpdateForm();
        fetchDetails(project.id);
      } else {
        const err = await res.json();
        showToast(`Error: ${err.error || 'Failed to add update'}`, 'error');
      }
    } catch {
      showToast('An error occurred while adding the update', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveCctv = async () => {
    if (!project) return;
    setSavingCctv(true);
    try {
      const res = await fetch(`/api/admin/projects/${project.id}/cctv`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cctv_url: cctvUrl }),
      });
      if (res.ok) {
        showToast('CCTV URL updated successfully!', 'success');
        onRefreshProjects();
      } else {
        showToast('Failed to update CCTV URL', 'error');
      }
    } catch {
      showToast('An error occurred', 'error');
    } finally {
      setSavingCctv(false);
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      setFilePreviewUrl(URL.createObjectURL(file));
    } else {
      setFilePreviewUrl(null);
    }
  };

  if (!project) return null;

  const statusIcon = (status: MilestoneStatus) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-amber-400" />;
      case 'pending': return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const groupedMilestones = MILESTONE_CATEGORIES.map(cat => ({
    ...cat,
    items: milestones.filter(m => m.category === cat.value),
  }));

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-3xl bg-[#12141C] border-l border-white/[0.08] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-white/[0.08] bg-[#171A24] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 bg-gradient-to-br from-redhill-red to-red-700 rounded-2xl flex items-center justify-center shadow-lg shadow-redhill-red/20 shrink-0">
              <Hammer className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-white font-serif truncate">{project.name}</h2>
              <p className="text-xs text-gray-400 truncate">{project.location} &bull; Manage milestones, media updates & CCTV</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="px-5 sm:px-6 pt-4 flex gap-1 shrink-0 bg-[#12141C]">
          {[
            { id: 'milestones' as const, label: 'Milestones', count: milestones.length },
            { id: 'updates' as const, label: 'Media Updates', count: updates.length },
            { id: 'cctv' as const, label: 'CCTV Feed' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer border-b-2",
                activeTab === tab.id
                  ? "bg-white/[0.06] text-white border-redhill-red"
                  : "text-gray-400 hover:text-white hover:bg-white/[0.03] border-transparent"
              )}
            >
              {tab.label}
              {'count' in tab && tab.count !== undefined && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-white/10 rounded text-[10px]">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-redhill-red" />
            </div>
          )}

          {/* MILESTONES TAB */}
          {!loading && activeTab === 'milestones' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-sm">Project Milestones</h3>
                <button
                  onClick={() => setShowMilestoneForm(!showMilestoneForm)}
                  className="px-4 py-2 bg-redhill-red hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-redhill-red/20"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Add Milestone
                </button>
              </div>

              {/* Add Milestone Form */}
              {showMilestoneForm && (
                <form onSubmit={handleAddMilestone} className="bg-[#1A1D27] rounded-2xl border border-white/[0.08] p-5 space-y-4">
                  <h4 className="text-white font-bold text-sm flex items-center gap-2">
                    <PlusCircle className="w-4 h-4 text-redhill-red" />
                    New Milestone
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Category */}
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Category</label>
                      <select
                        value={mCategory}
                        onChange={(e) => setMCategory(e.target.value as MilestoneCategory)}
                        className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-redhill-red/50 focus:ring-1 focus:ring-redhill-red/20"
                      >
                        {MILESTONE_CATEGORIES.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Status</label>
                      <select
                        value={mStatus}
                        onChange={(e) => setMStatus(e.target.value as MilestoneStatus)}
                        className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-redhill-red/50 focus:ring-1 focus:ring-redhill-red/20"
                      >
                        {MILESTONE_STATUS_OPTIONS.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Milestone Name *</label>
                    <input
                      type="text"
                      value={mName}
                      onChange={(e) => setMName(e.target.value)}
                      placeholder="e.g. Foundation Pouring Completed"
                      className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-redhill-red/50 focus:ring-1 focus:ring-redhill-red/20"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Start Date */}
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Start Date</label>
                      <input
                        type="date"
                        value={mStartDate}
                        onChange={(e) => setMStartDate(e.target.value)}
                        className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-redhill-red/50 focus:ring-1 focus:ring-redhill-red/20"
                      />
                    </div>

                    {/* Expected Completion */}
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Expected Completion</label>
                      <input
                        type="date"
                        value={mExpectedCompletion}
                        onChange={(e) => setMExpectedCompletion(e.target.value)}
                        className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-redhill-red/50 focus:ring-1 focus:ring-redhill-red/20"
                      />
                    </div>

                    {/* Completion % */}
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Completion %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={mPercentage}
                        onChange={(e) => setMPercentage(Number(e.target.value))}
                        className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-redhill-red/50 focus:ring-1 focus:ring-redhill-red/20"
                      />
                    </div>
                  </div>

                  {/* Document Upload */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Document (URL or File)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={mDocUrl}
                        onChange={(e) => setMDocUrl(e.target.value)}
                        placeholder="Document URL (optional)"
                        className="flex-1 bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-redhill-red/50 focus:ring-1 focus:ring-redhill-red/20"
                      />
                      <button
                        type="button"
                        onClick={() => mDocFileRef.current?.click()}
                        className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-gray-300 font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {mDocFile ? mDocFile.name.slice(0, 15) + '...' : 'Upload'}
                      </button>
                      <input
                        ref={mDocFileRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png,.jpeg"
                        onChange={(e) => setMDocFile(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={submittingMilestone || !mName.trim()}
                      className="px-6 py-2.5 bg-redhill-red hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs transition-all cursor-pointer shadow-lg shadow-redhill-red/20 flex items-center gap-2"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {submittingMilestone ? 'Creating...' : 'Create Milestone'}
                    </button>
                    <button
                      type="button"
                      onClick={resetMilestoneForm}
                      className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold transition-all cursor-pointer border border-white/10"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Milestone Groups */}
              {milestones.length === 0 && !showMilestoneForm && (
                <div className="text-center py-16">
                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/10">
                    <Hammer className="w-7 h-7 text-gray-400" />
                  </div>
                  <h4 className="text-white font-bold text-sm">No milestones yet</h4>
                  <p className="text-xs text-gray-400 mt-1">Add the first milestone to track project progress.</p>
                </div>
              )}

              {groupedMilestones.map(group => group.items.length > 0 && (
                <div key={group.value} className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    {group.icon}
                    <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">{group.label}</h4>
                    <span className="px-1.5 py-0.5 bg-white/10 text-gray-400 text-[10px] font-bold rounded">{group.items.length}</span>
                  </div>

                  {group.items.map(m => (
                    <div key={m.id} className="bg-[#1A1D27] rounded-xl border border-white/[0.06] p-4 hover:border-white/[0.12] transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          {statusIcon(m.status)}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-white truncate">{m.name}</p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                              <span className={cn(
                                "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider",
                                m.status === 'completed' ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                  : m.status === 'in_progress' ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                                  : "bg-gray-500/15 text-gray-400 border border-gray-500/30"
                              )}>
                                {m.status.replace('_', ' ')}
                              </span>
                              {m.start_date && <span className="text-[10px] text-gray-500">Start: {formatDate(m.start_date)}</span>}
                              {m.expected_completion && <span className="text-[10px] text-gray-500">Due: {formatDate(m.expected_completion)}</span>}
                              {m.actual_completion && <span className="text-[10px] text-emerald-400">Done: {formatDate(m.actual_completion)}</span>}
                            </div>
                            {/* Progress Bar */}
                            <div className="mt-2 flex items-center gap-2">
                              <div className="flex-1 bg-black/30 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all duration-500",
                                    m.status === 'completed' ? "bg-emerald-500" : "bg-redhill-red"
                                  )}
                                  style={{ width: `${m.completion_percentage}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-gray-400 w-8 text-right">{m.completion_percentage}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Edit / Doc Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {m.doc_url && (
                            <a
                              href={m.doc_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all"
                              title="View Document"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {editingMilestoneId === m.id ? (
                            <button
                              onClick={() => handleUpdateMilestone(m.id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                            >
                              Save
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingMilestoneId(m.id);
                                setEditMStatus(m.status);
                                setEditMPercentage(m.completion_percentage);
                              }}
                              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] font-bold rounded-lg border border-white/10 transition-all cursor-pointer"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Inline Edit Form */}
                      {editingMilestoneId === m.id && (
                        <div className="mt-3 pt-3 border-t border-white/[0.06] flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-2">
                            <label className="text-[10px] text-gray-400 font-bold">Status:</label>
                            <select
                              value={editMStatus}
                              onChange={(e) => setEditMStatus(e.target.value as MilestoneStatus)}
                              className="bg-white/[0.04] border border-white/[0.1] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-redhill-red/50"
                            >
                              {MILESTONE_STATUS_OPTIONS.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-[10px] text-gray-400 font-bold">Progress:</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={editMPercentage}
                              onChange={(e) => setEditMPercentage(Number(e.target.value))}
                              className="w-16 bg-white/[0.04] border border-white/[0.1] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-redhill-red/50"
                            />
                            <span className="text-[10px] text-gray-400">%</span>
                          </div>
                          <button
                            onClick={() => setEditingMilestoneId(null)}
                            className="text-[10px] text-gray-400 hover:text-white ml-auto cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* UPDATES TAB */}
          {!loading && activeTab === 'updates' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-sm">Media Updates (Photos & Videos)</h3>
                <button
                  onClick={() => setShowUpdateForm(!showUpdateForm)}
                  className="px-4 py-2 bg-redhill-red hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-redhill-red/20"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Add Update
                </button>
              </div>

              {/* Add Update Form */}
              {showUpdateForm && (
                <form onSubmit={handleAddUpdate} className="bg-[#1A1D27] rounded-2xl border border-white/[0.08] p-5 space-y-4">
                  <h4 className="text-white font-bold text-sm flex items-center gap-2">
                    <PlusCircle className="w-4 h-4 text-redhill-red" />
                    New Media Update
                  </h4>

                  {/* Type Toggle */}
                  <div className="flex gap-2">
                    {[
                      { value: 'photo' as const, label: 'Photo', icon: <ImageIcon className="w-3.5 h-3.5" /> },
                      { value: 'video' as const, label: 'Video', icon: <Video className="w-3.5 h-3.5" /> },
                    ].map(t => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setUpdateType(t.value)}
                        className={cn(
                          "flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-2",
                          updateType === t.value
                            ? "bg-redhill-red/15 text-red-300 border-red-500/30"
                            : "bg-white/[0.03] text-gray-400 border-white/[0.08] hover:bg-white/[0.06]"
                        )}
                      >
                        {t.icon} {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Upload Mode Toggle */}
                  <div className="flex gap-2">
                    {[
                      { value: 'url' as const, label: 'Paste URL', icon: <LinkIcon className="w-3.5 h-3.5" /> },
                      { value: 'file' as const, label: 'Upload File', icon: <Upload className="w-3.5 h-3.5" /> },
                    ].map(m => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => {
                          setUploadMode(m.value);
                          setSelectedFile(null);
                          setFilePreviewUrl(null);
                          setUpdateUrl('');
                        }}
                        className={cn(
                          "flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center justify-center gap-2",
                          uploadMode === m.value
                            ? "bg-white/[0.08] text-white border-white/20"
                            : "bg-white/[0.03] text-gray-400 border-white/[0.08] hover:bg-white/[0.06]"
                        )}
                      >
                        {m.icon} {m.label}
                      </button>
                    ))}
                  </div>

                  {/* URL input or file upload */}
                  {uploadMode === 'url' ? (
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
                        {updateType === 'photo' ? 'Image' : 'Video'} URL
                      </label>
                      <input
                        type="url"
                        value={updateUrl}
                        onChange={(e) => setUpdateUrl(e.target.value)}
                        placeholder={updateType === 'photo' ? 'https://example.com/photo.jpg' : 'https://youtube.com/watch?v=...'}
                        className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-redhill-red/50 focus:ring-1 focus:ring-redhill-red/20"
                      />
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer",
                        isDragOver
                          ? "border-redhill-red bg-redhill-red/5"
                          : "border-white/[0.1] hover:border-white/20 bg-white/[0.02]"
                      )}
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragOver(false);
                        const file = e.dataTransfer.files[0];
                        if (file) handleFileSelect(file);
                      }}
                    >
                      {selectedFile ? (
                        <div className="space-y-2">
                          {filePreviewUrl && (
                            <img src={filePreviewUrl} alt="Preview" className="w-32 h-32 object-cover rounded-xl mx-auto border border-white/10" />
                          )}
                          <p className="text-sm text-white font-bold">{selectedFile.name}</p>
                          <p className="text-[10px] text-gray-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                          <p className="text-sm text-gray-300 font-bold">Click or drag file here</p>
                          <p className="text-[10px] text-gray-500">Supports images, videos, and documents</p>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept={updateType === 'photo' ? 'image/*' : 'video/*'}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect(file);
                        }}
                      />
                    </div>
                  )}

                  {/* Caption */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Caption</label>
                    <input
                      type="text"
                      value={updateCaption}
                      onChange={(e) => setUpdateCaption(e.target.value)}
                      placeholder="Describe this update..."
                      className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-redhill-red/50 focus:ring-1 focus:ring-redhill-red/20"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={uploading}
                      className="px-6 py-2.5 bg-redhill-red hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs transition-all cursor-pointer shadow-lg shadow-redhill-red/20 flex items-center gap-2"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {uploading ? 'Uploading...' : 'Publish Update'}
                    </button>
                    <button
                      type="button"
                      onClick={resetUpdateForm}
                      className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-xs font-bold transition-all cursor-pointer border border-white/10"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Updates Grid */}
              {updates.length === 0 && !showUpdateForm && (
                <div className="text-center py-16">
                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/10">
                    <ImageIcon className="w-7 h-7 text-gray-400" />
                  </div>
                  <h4 className="text-white font-bold text-sm">No media updates yet</h4>
                  <p className="text-xs text-gray-400 mt-1">Add photos or videos to keep investors informed.</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {updates.map(u => (
                  <div key={u.id} className="bg-[#1A1D27] rounded-xl border border-white/[0.06] overflow-hidden hover:border-white/[0.12] transition-all group">
                    {u.type === 'photo' ? (
                      <div className="h-40 relative overflow-hidden">
                        <img
                          src={u.url}
                          alt={u.caption}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/update/400/300';
                          }}
                        />
                        <div className="absolute top-2 left-2">
                          <span className="px-2 py-0.5 bg-black/60 backdrop-blur text-white text-[10px] font-bold rounded-md flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" /> Photo
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-40 bg-black/40 flex items-center justify-center relative">
                        <Video className="w-12 h-12 text-gray-400" />
                        <div className="absolute top-2 left-2">
                          <span className="px-2 py-0.5 bg-black/60 backdrop-blur text-white text-[10px] font-bold rounded-md flex items-center gap-1">
                            <Video className="w-3 h-3" /> Video
                          </span>
                        </div>
                        <a
                          href={u.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-all"
                        >
                          <ExternalLink className="w-6 h-6 text-white" />
                        </a>
                      </div>
                    )}
                    <div className="p-3">
                      <p className="text-xs text-white font-bold truncate">{u.caption || 'Untitled'}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(u.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CCTV TAB */}
          {!loading && activeTab === 'cctv' && (
            <div className="space-y-5">
              <h3 className="text-white font-bold text-sm">Live CCTV Feed Configuration</h3>

              <div className="bg-[#1A1D27] rounded-2xl border border-white/[0.08] p-5 space-y-4">
                <p className="text-xs text-gray-400 leading-relaxed">
                  Configure the CCTV live feed URL for this project. This will be visible to all assigned investors on their project page. Supported formats: YouTube embed URLs, RTSP stream URLs, or any embeddable video URL.
                </p>

                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">CCTV Feed URL</label>
                  <input
                    type="url"
                    value={cctvUrl}
                    onChange={(e) => setCctvUrl(e.target.value)}
                    placeholder="https://www.youtube.com/embed/..."
                    className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-redhill-red/50 focus:ring-1 focus:ring-redhill-red/20"
                  />
                </div>

                {cctvUrl && (
                  <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-black">
                    <div className="aspect-video">
                      <iframe
                        src={cctvUrl}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="CCTV Preview"
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSaveCctv}
                  disabled={savingCctv}
                  className="px-6 py-2.5 bg-redhill-red hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs transition-all cursor-pointer shadow-lg shadow-redhill-red/20 flex items-center gap-2"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingCctv ? 'Saving...' : 'Save CCTV URL'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
