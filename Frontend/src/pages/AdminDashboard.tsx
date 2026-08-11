import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, Project, Milestone, MilestoneCategory, MilestoneStatus, Query } from '../types';
import {
  Users, Building2, Plus, Settings, LogOut,
  LayoutDashboard, CheckCircle2, Clock, AlertCircle,
  Image as ImageIcon, Video, Bell, Save, Trash2, UserPlus, MapPin,
  MessageCircle, Send, ArrowLeft, Pencil, Copy, Check, ExternalLink, Eye, EyeOff,
  Search, MoreHorizontal, ChevronDown, ChevronUp, Wallet, MoreVertical, Hammer,
  Upload, Link as LinkIcon, X, FileVideo
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Logo from '../components/Logo';
import { useToast } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import StatusChip from '../components/StatusChip';
import { formatCurrency, formatDate, formatRelativeTime } from '../utils/formatters';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const { showToast } = useToast();
  const [activeView, setActiveView] = useState<'overview' | 'investors' | 'projects' | 'queries'>('overview');
  const [selectedThread, setSelectedThread] = useState<Query | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const { data: investors = [], isLoading: loadingInvestors, refetch: refetchInvestors } = useQuery<User[]>({
    queryKey: ['admin-investors'],
    queryFn: async () => {
      const res = await fetch('/api/admin/investors');
      return res.json();
    }
  });

  const { data: projects = [], isLoading: loadingProjects, refetch: refetchProjects } = useQuery<Project[]>({
    queryKey: ['admin-projects'],
    queryFn: async () => {
      const res = await fetch('/api/admin/projects');
      return res.json();
    }
  });

  const { data: threads = [], refetch: refetchThreads } = useQuery<Query[]>({
    queryKey: ['admin-queries'],
    queryFn: async () => {
      const res = await fetch('/api/admin/queries');
      return res.json();
    }
  });

  const { data: assignments = [], refetch: refetchAssignments } = useQuery<any[]>({
    queryKey: ['admin-investor-projects'],
    queryFn: async () => {
      const res = await fetch('/api/admin/investor-projects');
      return res.json();
    }
  });

  const { data: threadMessages = [], refetch: refetchThreadMessages } = useQuery<Query[]>({
    queryKey: ['admin-thread', selectedThread?.user_id, selectedThread?.project_id],
    queryFn: async () => {
      if (!selectedThread) return [];
      const res = await fetch(`/api/admin/queries/${selectedThread.user_id}/${selectedThread.project_id}`);
      return res.json();
    },
    enabled: !!selectedThread,
    refetchInterval: 5000,
  });

  const loading = loadingInvestors || loadingProjects;

  // fetchData acts as a refetch wrapper now to support the legacy calls
  const fetchData = () => {
    refetchInvestors();
    refetchProjects();
    refetchAssignments();
    refetchThreads();
  };

  // Form states
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showInvestorModal, setShowInvestorModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showCctvModal, setShowCctvModal] = useState(false);
  const [showEditInvestmentModal, setShowEditInvestmentModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<any | null>(null);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Copy to clipboard state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Show password in investor creation
  const [showInvPassword, setShowInvPassword] = useState(false);

  // Auto-focus refs for modals
  const projectNameRef = useRef<HTMLInputElement>(null);
  const investorNameRef = useRef<HTMLInputElement>(null);
  const assignInvestorRef = useRef<HTMLSelectElement>(null);
  const milestoneNameRef = useRef<HTMLInputElement>(null);
  const updateUrlRef = useRef<HTMLInputElement>(null);
  const cctvUrlRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Edit investment form state
  const [editContribution, setEditContribution] = useState('');
  const [editInvestmentAmt, setEditInvestmentAmt] = useState('');
  const [editSqft, setEditSqft] = useState('');
  const [editMarketPrice, setEditMarketPrice] = useState('');
  const [editPriceAtInvestment, setEditPriceAtInvestment] = useState('');
  const [editInvestmentDate, setEditInvestmentDate] = useState('');

  // New Project form state
  const [pName, setPName] = useState('');
  const [pLocation, setPLocation] = useState('');
  const [pValue, setPValue] = useState('');
  const [pStatus, setPStatus] = useState('Construction');
  const [pImg, setPImg] = useState('https://picsum.photos/seed/newproject/1920/1080');

  // New Investor form state
  const [invName, setInvName] = useState('');
  const [invEmail, setInvEmail] = useState('');
  const [invPhone, setInvPhone] = useState('');
  const [invPassword, setInvPassword] = useState('investor123');

  // Assignment form state
  const [assignUserId, setAssignUserId] = useState('');
  const [assignProjectId, setAssignProjectId] = useState('');
  const [assignContribution, setAssignContribution] = useState('');
  const [assignInvestmentAmt, setAssignInvestmentAmt] = useState('');
  const [assignSqft, setAssignSqft] = useState('');
  const [assignMarketPrice, setAssignMarketPrice] = useState('');

  // Milestone form state
  const [mCategory, setMCategory] = useState<MilestoneCategory>('documentation');
  const [mName, setMName] = useState('');
  const [mStatus, setMStatus] = useState<MilestoneStatus>('pending');
  const [mDocUrl, setMDocUrl] = useState('');

  // Update form state
  const [updateType, setUpdateType] = useState<'photo' | 'video'>('photo');
  const [updateUrl, setUpdateUrl] = useState('');
  const [updateCaption, setUpdateCaption] = useState('');
  const [updateDate, setUpdateDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CCTV form state
  const [cctvUrl, setCctvUrl] = useState('');
  // Edit Project form state (#40)
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [editPId, setEditPId] = useState<number | null>(null);
  const [editPName, setEditPName] = useState('');
  const [editPLocation, setEditPLocation] = useState('');
  const [editPStatus, setEditPStatus] = useState('');
  const [editPCompletion, setEditPCompletion] = useState(0);

  // Search, Sort, Pagination state (#4, #5)
  const [investorSearch, setInvestorSearch] = useState('');
  const [investorSortField, setInvestorSortField] = useState<'name' | 'email' | 'projects'>('name');
  const [investorSortDir, setInvestorSortDir] = useState<'asc' | 'desc'>('asc');
  const [investorPage, setInvestorPage] = useState(1);
  
  const [assignmentSearch, setAssignmentSearch] = useState('');
  const [assignmentProjectFilter, setAssignmentProjectFilter] = useState('');
  const [assignmentSortField, setAssignmentSortField] = useState<'investor' | 'amount' | 'date'>('date');
  const [assignmentSortDir, setAssignmentSortDir] = useState<'asc' | 'desc'>('desc');
  const [assignmentPage, setAssignmentPage] = useState(1);

  // Form Validation states (#7)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Escape key to close modals (#22)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showEditInvestmentModal) setShowEditInvestmentModal(false);
        else if (showCctvModal) setShowCctvModal(false);
        else if (showMilestoneModal) setShowMilestoneModal(false);
        else if (showUpdateModal) setShowUpdateModal(false);
        else if (showAssignModal) setShowAssignModal(false);
        else if (showInvestorModal) setShowInvestorModal(false);
        else if (showProjectModal) setShowProjectModal(false);
        else if (showEditProjectModal) setShowEditProjectModal(false);
        else if (confirmDialog.isOpen) setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showProjectModal, showInvestorModal, showAssignModal, showUpdateModal, showMilestoneModal, showCctvModal, showEditInvestmentModal, showEditProjectModal, confirmDialog.isOpen]);

  // Auto-focus first input when modals open (#38)
  useEffect(() => { if (showProjectModal) setTimeout(() => projectNameRef.current?.focus(), 100); }, [showProjectModal]);
  useEffect(() => { if (showInvestorModal) setTimeout(() => investorNameRef.current?.focus(), 100); }, [showInvestorModal]);
  useEffect(() => { if (showAssignModal) setTimeout(() => assignInvestorRef.current?.focus(), 100); }, [showAssignModal]);
  useEffect(() => { if (showMilestoneModal) setTimeout(() => milestoneNameRef.current?.focus(), 100); }, [showMilestoneModal]);
  useEffect(() => { if (showUpdateModal) setTimeout(() => updateUrlRef.current?.focus(), 100); }, [showUpdateModal]);
  useEffect(() => { if (showCctvModal) setTimeout(() => cctvUrlRef.current?.focus(), 100); }, [showCctvModal]);

  // Copy to clipboard helper (#21)
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

  // Unanswered query count for sidebar badge (#12)
  const unansweredCount = threads.filter((t: any) => t.last_sender_role === 'investor').length;





  // Auto-scroll chat to bottom when messages update (#27)
  useEffect(() => {
    if (threadMessages.length > 0) {
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [threadMessages]);

  // Form Validation helper (#7)
  const validateField = (field: string, value: string, type: 'email' | 'phone' | 'number' | 'text' = 'text') => {
    let error = '';
    if (!value) error = 'This field is required';
    else if (type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Invalid email format';
    else if (type === 'phone' && !/^\d{10}$/.test(value.replace(/\D/g, ''))) error = 'Phone must be 10 digits';
    else if (type === 'number' && isNaN(Number(value))) error = 'Must be a valid number';
    
    setFormErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: pName,
        location: pLocation,
        total_value: pValue,
        status: pStatus,
        image_url: pImg
      })
    });

    if (res.ok) {
      await fetchData();
      setShowProjectModal(false);
      setPName('');
      setPLocation('');
      setPValue('');
      showToast('Project created successfully!', 'success');
    } else {
      showToast('Failed to create project', 'error');
    }
  };

  const handleEditProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editPId) return;
    const res = await fetch(`/api/admin/projects/${editPId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editPName,
        location: editPLocation,
        status: editPStatus,
        completion_percentage: editPCompletion
      })
    });
    if (res.ok) {
      await fetchData();
      setShowEditProjectModal(false);
      showToast('Project updated successfully!', 'success');
    } else {
      showToast('Failed to update project', 'error');
    }
  };

  const handleCreateInvestor = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/investors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: invName,
        email: invEmail,
        phone: invPhone,
        password: invPassword
      })
    });

    if (res.ok) {
      const newInv = await res.json();
      refetchInvestors();
      setShowInvestorModal(false);
      setInvName('');
      setInvEmail('');
      setInvPhone('');
      showToast(`Investor "${newInv.name}" created — Login ID: ${newInv.login_id}`, 'success');
    } else {
      const data = await res.json();
      showToast(`Error: ${data.error}`, 'error');
    }
  };

  const handleAssignInvestor = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: parseInt(assignUserId),
        project_id: parseInt(assignProjectId),
        contribution: assignContribution,
        investment_amount: parseFloat(assignInvestmentAmt) || 0,
        allotted_sqft: parseFloat(assignSqft) || 0,
        market_price_per_sqft: parseFloat(assignMarketPrice) || 0
      })
    });

    if (res.ok) {
      setShowAssignModal(false);
      setAssignContribution('');
      setAssignInvestmentAmt('');
      setAssignSqft('');
      setAssignMarketPrice('');
      fetchAssignments();
      showToast('Investor assigned to project successfully!', 'success');
    } else {
      const data = await res.json();
      showToast(`Error: ${data.error}`, 'error');
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    const res = await fetch('/api/admin/milestones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: selectedProject.id,
        category: mCategory,
        name: mName,
        status: mStatus,
        doc_url: mDocUrl,
        completion_percentage: mStatus === 'completed' ? 100 : (mStatus === 'in_progress' ? 50 : 0)
      })
    });

    if (res.ok) {
      await fetchData();
      setShowMilestoneModal(false);
      setMName('');
      setMDocUrl('');
      showToast('Milestone added successfully!', 'success');
    } else {
      showToast('Failed to add milestone', 'error');
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    // Auto-detect type from mimetype
    if (file.type.startsWith('video/')) {
      setUpdateType('video');
    } else {
      setUpdateType('photo');
    }
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setFilePreviewUrl(previewUrl);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
      handleFileSelect(file);
    } else {
      showToast('Only image and video files are allowed', 'error');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setFilePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    let finalUrl = updateUrl;

    // If in file mode, upload the file first
    if (uploadMode === 'file') {
      if (!selectedFile) {
        showToast('Please select a file to upload', 'error');
        return;
      }
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (!uploadRes.ok) {
          const err = await uploadRes.json();
          showToast(err.error || 'Upload failed', 'error');
          setUploading(false);
          return;
        }
        const uploadData = await uploadRes.json();
        finalUrl = uploadData.url;
      } catch {
        showToast('Upload failed. Please try again.', 'error');
        setUploading(false);
        return;
      }
    } else {
      if (!updateUrl.trim()) {
        showToast('Please enter a media URL', 'error');
        return;
      }
    }

    const res = await fetch('/api/admin/updates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: selectedProject.id,
        type: updateType,
        url: finalUrl,
        caption: updateCaption,
        date: updateDate
      })
    });

    setUploading(false);
    if (res.ok) {
      await fetchData();
      setShowUpdateModal(false);
      setUpdateUrl('');
      setUpdateCaption('');
      clearSelectedFile();
      showToast('Progress update added successfully!', 'success');
    } else {
      showToast('Failed to add progress update', 'error');
    }
  };

  const handleUpdateCctv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    const res = await fetch(`/api/admin/projects/${selectedProject.id}/cctv`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cctv_url: cctvUrl })
    });

    if (res.ok) {
      await fetchData();
      setShowCctvModal(false);
      setCctvUrl('');
      showToast('CCTV feed updated successfully!', 'success');
    } else {
      showToast('Failed to update CCTV feed', 'error');
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedThread || sendingReply) return;

    setSendingReply(true);
    try {
      const res = await fetch('/api/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedThread.project_id,
          user_id: selectedThread.user_id,
          message: replyMessage,
        })
      });
      if (res.ok) {
        setReplyMessage('');
        refetchThreadMessages();
        refetchThreads();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingReply(false);
    }
  };

  const handleLogout = () => {
    onLogout();
  };

  const handleDeleteInvestor = (id: number, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: `Delete ${name}?`,
      message: `This will permanently remove the investor "${name}" and all their project assignments, investment records, and query history.`,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`/api/admin/investors/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
          });
          if (res.ok) {
            setInvestors(prev => prev.filter(i => i.id !== id));
            fetchAssignments();
            showToast(`${name} has been deleted successfully.`, 'success');
          } else {
            const data = await res.json();
            showToast(`Error: ${data.error}`, 'error');
          }
        } catch (err) {
          console.error(err);
          showToast('An error occurred while deleting the investor.', 'error');
        }
      }
    });
  };

  const openEditInvestment = (assignment: any) => {
    setEditingAssignment(assignment);
    setEditContribution(assignment.contribution || '');
    setEditInvestmentAmt(String(assignment.investment_amount || ''));
    setEditSqft(String(assignment.allotted_sqft || ''));
    setEditMarketPrice(String(assignment.market_price_per_sqft || ''));
    setEditPriceAtInvestment(String(assignment.price_at_investment || ''));
    setEditInvestmentDate(assignment.investment_date || '');
    setShowEditInvestmentModal(true);
  };

  const handleEditInvestment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAssignment) return;

    const res = await fetch(`/api/admin/investor-project/${editingAssignment.user_id}/${editingAssignment.project_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contribution: editContribution,
        investment_amount: parseFloat(editInvestmentAmt) || 0,
        allotted_sqft: parseFloat(editSqft) || 0,
        market_price_per_sqft: parseFloat(editMarketPrice) || 0,
        price_at_investment: parseFloat(editPriceAtInvestment) || 0,
        investment_date: editInvestmentDate || null,
      })
    });

    if (res.ok) {
      setShowEditInvestmentModal(false);
      setEditingAssignment(null);
      fetchAssignments();
      showToast('Investment details updated successfully!', 'success');
    } else {
      const data = await res.json();
      showToast(`Error: ${data.error}`, 'error');
    }
  };

  // --- Computed Lists for Search, Sort, Pagination ---
  const filteredInvestors = investors
    .filter(i => 
      (i.name?.toLowerCase().includes(investorSearch.toLowerCase()) || '') ||
      (i.email?.toLowerCase().includes(investorSearch.toLowerCase()) || '') ||
      (i.login_id?.toLowerCase().includes(investorSearch.toLowerCase()) || '')
    )
    .sort((a, b) => {
      let valA: any = a[investorSortField as keyof User];
      let valB: any = b[investorSortField as keyof User];
      if (investorSortField === 'projects') {
        valA = assignments.filter(assign => assign.user_id === a.id).length;
        valB = assignments.filter(assign => assign.user_id === b.id).length;
      }
      if (valA < valB) return investorSortDir === 'asc' ? -1 : 1;
      if (valA > valB) return investorSortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const paginatedInvestors = filteredInvestors.slice((investorPage - 1) * 10, investorPage * 10);
  const investorTotalPages = Math.max(1, Math.ceil(filteredInvestors.length / 10));

  const filteredAssignments = assignments
    .filter(a => 
      (a.investor_name?.toLowerCase().includes(assignmentSearch.toLowerCase()) || '') &&
      (assignmentProjectFilter ? a.project_id === Number(assignmentProjectFilter) : true)
    )
    .sort((a, b) => {
      let valA: any = a.investment_date;
      let valB: any = b.investment_date;
      if (assignmentSortField === 'investor') {
        valA = a.investor_name;
        valB = b.investor_name;
      } else if (assignmentSortField === 'amount') {
        valA = a.investment_amount;
        valB = b.investment_amount;
      }
      if (valA < valB) return assignmentSortDir === 'asc' ? -1 : 1;
      if (valA > valB) return assignmentSortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const paginatedAssignments = filteredAssignments.slice((assignmentPage - 1) * 10, assignmentPage * 10);
  const assignmentTotalPages = Math.max(1, Math.ceil(filteredAssignments.length / 10));

  return (
    <div className="min-h-screen bg-redhill-dark flex text-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-[#171A21] border-r border-white/[0.05] text-white flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-white/[0.05]">
          <Logo light />
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'projects', label: 'Projects', icon: Building2 },
            { id: 'investors', label: 'Investors', icon: Users },
            { id: 'queries', label: 'Investor Queries', icon: MessageCircle },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as any)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm",
                activeView === item.id
                  ? "bg-redhill-red text-white shadow-lg shadow-redhill-red/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.id === 'queries' && unansweredCount > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unansweredCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-3 mb-4">
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{user.name}</p>
              <p className="text-[10px] text-gray-500 uppercase font-bold">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-redhill-red hover:bg-red-500/5 transition-all text-sm font-medium"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-auto">
        {activeView === 'overview' && (
          <div className="space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-bold text-white font-serif">Admin Dashboard</h1>
                <p className="text-gray-400 mt-1">Welcome back. Here's what's happening with Redhill projects.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button
                onClick={() => setActiveView('projects')}
                className="bg-redhill-gray p-6 rounded-2xl border border-white/[0.06] shadow-lg text-left cursor-pointer hover:shadow-xl hover:scale-[1.02] hover:border-blue-500/30 transition-all duration-200"
              >
                <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center mb-4">
                  <Building2 className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-gray-400">Active Projects</p>
                <p className="text-3xl font-bold text-white mt-1">{projects.length}</p>
              </button>
              <button
                onClick={() => setActiveView('investors')}
                className="bg-redhill-gray p-6 rounded-2xl border border-white/[0.06] shadow-lg text-left cursor-pointer hover:shadow-xl hover:scale-[1.02] hover:border-emerald-500/30 transition-all duration-200"
              >
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-gray-400">Total Investors</p>
                <p className="text-3xl font-bold text-white mt-1">{investors.length}</p>
              </button>
              <button
                onClick={() => setActiveView('queries')}
                className="bg-redhill-gray p-6 rounded-2xl border border-white/[0.06] shadow-lg text-left cursor-pointer hover:shadow-xl hover:scale-[1.02] hover:border-redhill-red/30 transition-all duration-200"
              >
                <div className="w-12 h-12 bg-redhill-red/10 text-redhill-red rounded-xl flex items-center justify-center mb-4">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-gray-400">Unanswered Queries</p>
                <p className="text-3xl font-bold text-white mt-1">{threads.filter((t: any) => t.last_sender_role === 'investor').length}</p>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-redhill-gray rounded-2xl border border-white/[0.06] shadow-lg overflow-hidden">
                <div className="p-6 border-b border-white/[0.06] flex justify-between items-center bg-black/10">
                  <h2 className="font-bold text-white font-serif">Recent Projects</h2>
                  <button onClick={() => setActiveView('projects')} className="text-sm text-redhill-red font-bold hover:underline cursor-pointer">View All</button>
                </div>
                <div className="divide-y divide-white/[0.05]">
                  {projects.slice(0, 5).map(p => (
                    <div key={p.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5">
                          <img
                            src={p.image_url || 'https://picsum.photos/seed/thumb/200/200'}
                            alt=""
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/fallback/200/200';
                            }}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-white">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.location}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-white">{p.completion_percentage}%</p>
                        <div className="w-20 bg-white/5 h-1 rounded-full mt-1 overflow-hidden">
                          <div className="bg-redhill-red h-full rounded-full" style={{ width: `${p.completion_percentage}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-redhill-gray rounded-2xl border border-white/[0.06] shadow-lg overflow-hidden">
                <div className="p-6 border-b border-white/[0.06] flex justify-between items-center bg-black/10">
                  <h2 className="font-bold text-white font-serif">New Investors</h2>
                  <button onClick={() => setActiveView('investors')} className="text-sm text-redhill-red font-bold hover:underline cursor-pointer">View All</button>
                </div>
                <div className="divide-y divide-white/[0.05]">
                  {investors.slice(0, 5).map(i => (
                    <div key={i.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-gray-400">
                          {i.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-white">{i.name}</p>
                          <p className="text-xs text-gray-400">{i.email}</p>
                        </div>
                      </div>
                      <button className="p-2 text-gray-500 hover:text-white cursor-pointer">
                        <Settings className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'projects' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white font-serif">Project Management</h1>
                <p className="text-gray-400 mt-1">Create and manage Redhill infrastructure projects.</p>
              </div>
              <button
                onClick={() => setShowProjectModal(true)}
                className="bg-redhill-red text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-redhill-red/20 hover:bg-red-700 transition-all cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                New Project
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {projects.map(p => (
                <div key={p.id} className="bg-redhill-gray rounded-2xl border border-white/[0.06] shadow-lg overflow-hidden flex flex-col hover:border-white/10 transition-all">
                  <div className="h-40 relative">
                    <img
                      src={p.image_url || 'https://picsum.photos/seed/project/800/600'}
                      alt=""
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/fallback/800/600';
                      }}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 shadow-lg shadow-black/20 rounded-full bg-black/40 backdrop-blur">
                      <StatusChip status={p.status} />
                    </div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col relative">
                    <div className="flex justify-between items-start gap-4 mb-1">
                      <h3 className="text-lg font-bold text-white font-serif leading-tight">{p.name}</h3>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditPId(p.id);
                            setEditPName(p.name);
                            setEditPLocation(p.location);
                            setEditPStatus(p.status);
                            setEditPCompletion(p.completion_percentage);
                            setShowEditProjectModal(true);
                          }}
                          className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors flex-shrink-0 cursor-pointer"
                          title="Edit Project"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmDialog({
                            isOpen: true,
                            title: 'Delete Project',
                            message: `Are you sure you want to delete ${p.name}? This will remove all associated milestones, CCTV feeds, and progress updates. This action cannot be undone.`,
                            onConfirm: async () => {
                              const res = await fetch(`/api/admin/projects/${p.id}`, { method: 'DELETE' });
                              if (res.ok) {
                                fetchData();
                                showToast('Project deleted successfully', 'success');
                              } else showToast('Failed to delete project', 'error');
                            }
                          })}
                          className="p-1.5 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors flex-shrink-0 cursor-pointer"
                          title="Delete Project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          to={`/project/${p.id}`}
                          target="_blank"
                          className="p-1.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors flex-shrink-0"
                          title="Preview as Investor"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-gray-400 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-redhill-red shrink-0" /> <span className="truncate">{p.location}</span>
                      </p>
                      <span className="text-[10px] font-bold bg-white/5 px-2 py-1 rounded text-gray-400 shrink-0 flex items-center gap-1">
                        <Users className="w-3 h-3" /> {assignments.filter(a => a.project_id === p.id).length}
                      </span>
                    </div>

                    <div className="mt-auto space-y-4">
                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span className="text-gray-400">Progress</span>
                          <span className="text-white">{p.completion_percentage}%</span>
                        </div>
                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-redhill-red to-amber-500 h-full rounded-full" style={{ width: `${p.completion_percentage}%` }} />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => { setSelectedProject(p); setShowMilestoneModal(true); }}
                          className="flex-1 bg-white/[0.03] text-gray-300 py-2 rounded-lg text-xs font-bold border border-white/[0.05] hover:bg-white/[0.06] transition-colors cursor-pointer"
                        >
                          Manage Milestones
                        </button>
                        <button
                          onClick={() => { setSelectedProject(p); setShowUpdateModal(true); }}
                          className="flex-1 bg-white/[0.03] text-gray-300 py-2 rounded-lg text-xs font-bold border border-white/[0.05] hover:bg-white/[0.06] transition-colors cursor-pointer"
                        >
                          Upload Progress
                        </button>
                      </div>
                      <button
                        onClick={() => { setSelectedProject(p); setCctvUrl(p.cctv_url || ''); setShowCctvModal(true); }}
                        className="w-full bg-redhill-red/10 text-red-400 py-2 rounded-lg text-xs font-bold border border-red-500/10 hover:bg-redhill-red/20 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Video className="w-3 h-3" /> Manage CCTV
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === 'investors' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white font-serif">Investor Accounts</h1>
                <p className="text-gray-400 mt-1">Manage investor access, project assignments, and financial data.</p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="bg-white/[0.03] border border-white/[0.08] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-white/5 transition-all cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  Assign to Project
                </button>
                <button
                  onClick={() => setShowInvestorModal(true)}
                  className="bg-redhill-red text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-redhill-red/20 hover:bg-red-700 transition-all cursor-pointer"
                >
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
                onAction={investorSearch ? () => setInvestorSearch('') : () => setShowInvestorModal(true)}
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
                    const investorAssignments = assignments.filter(a => a.user_id === i.id);
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
                          <button className="p-2 text-gray-500 hover:text-redhill-red transition-colors cursor-pointer" onClick={() => handleDeleteInvestor(i.id, i.name)} title="Delete Investor"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  )})}
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
                      className="px-3 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setInvestorPage(p => Math.min(investorTotalPages, p + 1))}
                      disabled={investorPage === investorTotalPages}
                      className="px-3 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
            )}

            {/* Investor-Project Assignments Table */}
            {assignments.length > 0 && (
              <div className="bg-redhill-gray rounded-2xl border border-white/[0.06] shadow-lg overflow-hidden">
                <div className="p-6 border-b border-white/[0.06] bg-black/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-bold text-white text-lg font-serif">Investment Details</h2>
                    <p className="text-sm text-gray-400 mt-1">Edit financial data for each investor-project assignment.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      value={assignmentProjectFilter}
                      onChange={(e) => { setAssignmentProjectFilter(e.target.value); setAssignmentPage(1); }}
                      className="px-4 py-2 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-sm text-white"
                    >
                      <option value="">All Projects</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Search investor..."
                        value={assignmentSearch}
                        onChange={(e) => { setAssignmentSearch(e.target.value); setAssignmentPage(1); }}
                        className="w-full pl-9 pr-4 py-2 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-sm text-white focus:bg-white/[0.05]"
                      />
                    </div>
                  </div>
                </div>

                {filteredAssignments.length === 0 ? (
                  <EmptyState
                    icon={Wallet}
                    title="No investments found"
                    description="Try adjusting your search or filter criteria."
                  />
                ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-black/5 border-b border-white/[0.06]">
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest cursor-pointer hover:text-white" onClick={() => { setAssignmentSortField('investor'); setAssignmentSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>Investor {assignmentSortField === 'investor' && (assignmentSortDir === 'asc' ? '↑' : '↓')}</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Project</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest cursor-pointer hover:text-white" onClick={() => { setAssignmentSortField('amount'); setAssignmentSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>Investment {assignmentSortField === 'amount' && (assignmentSortDir === 'asc' ? '↑' : '↓')}</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Allotted Sqft</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rate at Investment</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Current Rate</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest cursor-pointer hover:text-white" onClick={() => { setAssignmentSortField('date'); setAssignmentSortDir(d => d === 'asc' ? 'desc' : 'asc'); }}>Inv. Date {assignmentSortField === 'date' && (assignmentSortDir === 'asc' ? '↑' : '↓')}</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Edit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05]">
                      {paginatedAssignments.map((a: any) => (
                        <tr key={`${a.user_id}-${a.project_id}`} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3">
                            <p className="font-bold text-sm text-white">{a.investor_name}</p>
                            <p className="text-[10px] text-gray-500">{a.investor_email}</p>
                          </td>
                          <td className="px-5 py-3">
                            <p className="text-sm font-medium text-gray-300">{a.project_name}</p>
                          </td>
                          <td className="px-5 py-3">
                            <p className="text-sm font-bold text-white">{a.contribution || formatCurrency(a.investment_amount)}</p>
                          </td>
                          <td className="px-5 py-3">
                            <p className="text-sm text-gray-300">{a.allotted_sqft?.toLocaleString('en-IN') || 0} sqft</p>
                          </td>
                          <td className="px-5 py-3">
                            <p className="text-sm text-gray-300">{formatCurrency(a.price_at_investment)}/sqft</p>
                          </td>
                          <td className="px-5 py-3">
                            <p className="text-sm font-bold text-emerald-400">{formatCurrency(a.market_price_per_sqft)}/sqft</p>
                          </td>
                          <td className="px-5 py-3">
                            <p className="text-xs text-gray-500">{a.investment_date ? formatDate(a.investment_date) : 'N/A'}</p>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => openEditInvestment(a)}
                              className="p-2 text-gray-500 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-white/10"
                              title="Edit Investment"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {assignmentTotalPages > 1 && (
                <div className="p-4 border-t border-white/[0.06] flex items-center justify-between text-sm">
                  <span className="text-gray-400">Showing {paginatedAssignments.length} of {filteredAssignments.length} investments</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setAssignmentPage(p => Math.max(1, p - 1))}
                      disabled={assignmentPage === 1}
                      className="px-3 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setAssignmentPage(p => Math.min(assignmentTotalPages, p + 1))}
                      disabled={assignmentPage === assignmentTotalPages}
                      className="px-3 py-1 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
              </div>
            )}
          </div>
        )}

        {activeView === 'queries' && (
          <div className="h-full flex flex-col space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white font-serif">Investor Queries</h1>
                <p className="text-gray-400 mt-1">Answer investor questions and provide support.</p>
              </div>
            </div>

            <div className="flex-1 min-h-0 flex gap-6">
              {/* Thread List */}
              <div className="w-1/3 bg-redhill-gray rounded-2xl border border-white/[0.06] shadow-lg overflow-hidden flex flex-col">
                <div className="p-4 border-b border-white/[0.06] bg-black/10">
                  <h2 className="font-bold text-white font-serif">Conversations</h2>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-white/[0.05]">
                  {threads.length > 0 ? threads.map((t: any) => (
                    <button
                      key={`${t.user_id}-${t.project_id}`}
                      onClick={() => setSelectedThread(t)}
                      className={cn(
                        "w-full p-4 text-left hover:bg-white/[0.02] transition-colors flex flex-col gap-1 cursor-pointer",
                        selectedThread?.user_id === t.user_id && selectedThread?.project_id === t.project_id && "bg-redhill-red/10 border-r-4 border-redhill-red shadow-inner"
                      )}
                    >
                      <div className="flex justify-between items-center text-ellipsis">
                        <span className="font-bold text-sm text-white truncate">{t.userName}</span>
                        <span className="text-[10px] text-gray-500 font-medium whitespace-nowrap">
                          {new Date(t.lastMessage).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="text-xs text-redhill-red font-bold uppercase tracking-wider">{t.projectName}</span>
                    </button>
                  )) : (
                    <div className="p-10 text-center text-gray-500">
                      <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">No conversations yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Area */}
              <div className="flex-1 bg-redhill-gray rounded-2xl border border-white/[0.06] shadow-lg overflow-hidden flex flex-col">
                {selectedThread ? (
                  <>
                    <div className="p-4 border-b border-white/[0.06] bg-black/10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center font-bold text-gray-400">
                          {selectedThread.userName?.charAt(0)}
                        </div>
                        <div>
                          <h2 className="font-bold text-white">{selectedThread.userName}</h2>
                          <p className="text-xs text-redhill-red font-bold uppercase tracking-wider">{selectedThread.projectName}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-redhill-dark/40">
                      {threadMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex flex-col w-full",
                            msg.sender_role === 'admin' ? "items-end" : "items-start"
                          )}
                        >
                          <div className={cn(
                            "px-4 py-2.5 max-w-[85%] text-sm shadow-md transition-all duration-300 leading-relaxed",
                            msg.sender_role === 'admin'
                              ? "bg-redhill-red text-white rounded-2xl rounded-tr-none shadow-redhill-red/10"
                              : "bg-redhill-dark/80 text-gray-200 border border-white/[0.06] rounded-2xl rounded-tl-none"
                          )}>
                            {msg.message}
                          </div>
                          <span className="text-[10px] text-gray-500 mt-1.5 font-bold uppercase tracking-wider mx-1">
                            {msg.sender_role === 'admin' ? 'Support (You)' : 'Investor'} • {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleReply} className="p-4 border-t border-white/[0.06] bg-black/10 flex gap-3">
                      <input
                        type="text"
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Type your reply..."
                        className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:bg-white/[0.05] focus:border-redhill-red/40 focus:ring-2 focus:ring-redhill-red/10 transition-all"
                      />
                      <button
                        type="submit"
                        disabled={!replyMessage.trim() || sendingReply}
                        className="bg-redhill-red text-white p-3.5 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all shadow-lg shadow-redhill-red/20 cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-10 text-gray-500">
                    <MessageCircle className="w-16 h-16 mb-4 opacity-10" />
                    <h3 className="text-lg font-bold text-white mb-1 font-serif">Select a conversation</h3>
                    <p className="max-w-xs mx-auto text-sm">Click on a conversation from the list to view messages and reply.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals (Simplified for now) */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowProjectModal(false)} />
          <div className="relative bg-redhill-gray border border-white/[0.08] rounded-2xl w-full max-w-lg p-8 shadow-2xl text-white">
            <h2 className="text-2xl font-bold text-white mb-6 font-serif">Create New Project</h2>
            <form className="space-y-4" onSubmit={handleCreateProject}>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">Project Name</label>
                <input
                  type="text"
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 focus:ring-2 focus:ring-redhill-red/10 transition-all"
                  placeholder="e.g. Redhill Heights"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">Location</label>
                <input
                  type="text"
                  value={pLocation}
                  onChange={(e) => setPLocation(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 focus:ring-2 focus:ring-redhill-red/10 transition-all"
                  placeholder="e.g. Bangalore, KA"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Total Value</label>
                  <input
                    type="text"
                    value={pValue}
                    onChange={(e) => setPValue(e.target.value)}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 focus:ring-2 focus:ring-redhill-red/10 transition-all"
                    placeholder="e.g. ₹150 Cr"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Initial Status</label>
                  <select
                    value={pStatus}
                    onChange={(e) => setPStatus(e.target.value)}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 focus:ring-2 focus:ring-redhill-red/10 transition-all"
                  >
                    <option value="Construction" className="bg-redhill-gray">Construction</option>
                    <option value="Approval" className="bg-redhill-gray">Approval</option>
                    <option value="Completed" className="bg-redhill-gray">Completed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">Image URL</label>
                <input
                  type="text"
                  value={pImg}
                  onChange={(e) => setPImg(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 focus:ring-2 focus:ring-redhill-red/10 transition-all"
                  placeholder="https://..."
                />
              </div>
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setShowProjectModal(false)} className="flex-1 py-3 font-bold text-gray-400 hover:bg-white/5 rounded-xl transition-all cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 bg-redhill-red text-white py-3 font-bold rounded-xl shadow-lg shadow-redhill-red/20 hover:bg-red-700 transition-all cursor-pointer">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Update Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowUpdateModal(false); clearSelectedFile(); }} />
          <div className="relative bg-redhill-gray border border-white/[0.08] rounded-2xl w-full max-w-lg p-8 shadow-2xl text-white">
            <h2 className="text-2xl font-bold text-white mb-2 font-serif">Upload Progress</h2>
            <p className="text-gray-400 mb-6 text-sm">Adding update for: <span className="font-bold text-redhill-red">{selectedProject?.name}</span></p>

            <form className="space-y-4" onSubmit={handleAddUpdate}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Type</label>
                  <select
                    value={updateType}
                    onChange={(e) => setUpdateType(e.target.value as any)}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 focus:ring-2 focus:ring-redhill-red/10 transition-all"
                  >
                    <option value="photo" className="bg-redhill-gray">Photo</option>
                    <option value="video" className="bg-redhill-gray">Video</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={updateDate}
                    onChange={(e) => setUpdateDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 focus:ring-2 focus:ring-redhill-red/10 transition-all"
                  />
                </div>
              </div>

              {/* Upload Mode Toggle */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="block text-sm font-bold text-gray-400">Media</label>
                  <div className="flex bg-white/[0.03] border border-white/[0.06] rounded-lg p-0.5 ml-auto">
                    <button
                      type="button"
                      onClick={() => setUploadMode('file')}
                      className={cn(
                        'px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer',
                        uploadMode === 'file' ? 'bg-redhill-red text-white shadow-sm' : 'text-gray-400 hover:text-white'
                      )}
                    >
                      <Upload className="w-3 h-3" /> Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadMode('url')}
                      className={cn(
                        'px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer',
                        uploadMode === 'url' ? 'bg-redhill-red text-white shadow-sm' : 'text-gray-400 hover:text-white'
                      )}
                    >
                      <LinkIcon className="w-3 h-3" /> Paste URL
                    </button>
                  </div>
                </div>

                {uploadMode === 'file' ? (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                    {!selectedFile ? (
                      <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={handleFileDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
                          isDragOver
                            ? 'border-redhill-red bg-redhill-red/10'
                            : 'border-white/[0.1] hover:border-white/20 hover:bg-white/[0.02]'
                        )}
                      >
                        <Upload className={cn('w-8 h-8 mx-auto mb-3', isDragOver ? 'text-redhill-red' : 'text-gray-500')} />
                        <p className="text-sm font-bold text-gray-300">
                          {isDragOver ? 'Drop your file here' : 'Click to select or drag & drop'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Photos & videos up to 50MB</p>
                      </div>
                    ) : (
                      <div className="border border-white/[0.08] rounded-xl overflow-hidden bg-white/[0.02]">
                        {selectedFile.type.startsWith('image/') && filePreviewUrl ? (
                          <div className="relative">
                            <img src={filePreviewUrl} alt="Preview" className="w-full h-40 object-cover" />
                            <button
                              type="button"
                              onClick={clearSelectedFile}
                              className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full transition-colors cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="relative p-4 flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-redhill-red/10 flex items-center justify-center shrink-0">
                              <FileVideo className="w-6 h-6 text-redhill-red" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-white truncate">{selectedFile.name}</p>
                              <p className="text-xs text-gray-400">{(selectedFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                            </div>
                            <button
                              type="button"
                              onClick={clearSelectedFile}
                              className="bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white p-1.5 rounded-full transition-colors cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    ref={updateUrlRef}
                    value={updateUrl}
                    onChange={(e) => setUpdateUrl(e.target.value)}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 focus:ring-2 focus:ring-redhill-red/10 transition-all"
                    placeholder="https://images.unsplash.com/..."
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">Caption</label>
                <textarea
                  value={updateCaption}
                  onChange={(e) => setUpdateCaption(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 focus:ring-2 focus:ring-redhill-red/10 transition-all min-h-[100px]"
                  placeholder="Describe the progress..."
                  required
                />
              </div>
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => { setShowUpdateModal(false); clearSelectedFile(); }} className="flex-1 py-3 font-bold text-gray-400 hover:bg-white/5 rounded-xl transition-all cursor-pointer">Cancel</button>
                <button
                  type="submit"
                  disabled={uploading}
                  className={cn(
                    'flex-1 bg-redhill-red text-white py-3 font-bold rounded-xl shadow-lg shadow-redhill-red/20 hover:bg-red-700 transition-all cursor-pointer flex items-center justify-center gap-2',
                    uploading && 'opacity-60 cursor-not-allowed'
                  )}
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Uploading…
                    </>
                  ) : 'Post Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Milestone Modal */}
      {showMilestoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMilestoneModal(false)} />
          <div className="relative bg-redhill-gray border border-white/[0.08] rounded-2xl w-full max-w-lg p-8 shadow-2xl text-white">
            <h2 className="text-2xl font-bold text-white mb-2 font-serif">Manage Milestones</h2>
            <p className="text-gray-400 mb-6 text-sm">Adding milestone for: <span className="font-bold text-redhill-red">{selectedProject?.name}</span></p>

            <form className="space-y-4" onSubmit={handleAddMilestone}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Category</label>
                  <select
                    value={mCategory}
                    onChange={(e) => setMCategory(e.target.value as any)}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 focus:ring-2 focus:ring-redhill-red/10 transition-all"
                  >
                    <option value="documentation" className="bg-redhill-gray">Documentation</option>
                    <option value="approval" className="bg-redhill-gray">Approval</option>
                    <option value="construction" className="bg-redhill-gray">Construction</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Status</label>
                  <select
                    value={mStatus}
                    onChange={(e) => setMStatus(e.target.value as any)}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 focus:ring-2 focus:ring-redhill-red/10 transition-all"
                  >
                    <option value="pending" className="bg-redhill-gray">Pending</option>
                    <option value="in_progress" className="bg-redhill-gray">In Progress</option>
                    <option value="completed" className="bg-redhill-gray">Completed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">Milestone Name</label>
                <input
                  type="text"
                  value={mName}
                  onChange={(e) => setMName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 focus:ring-2 focus:ring-redhill-red/10 transition-all"
                  placeholder="e.g. Land Conversion, Slab Work..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">Document/Approval URL (Optional)</label>
                <input
                  type="text"
                  value={mDocUrl}
                  onChange={(e) => setMDocUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 focus:ring-2 focus:ring-redhill-red/10 transition-all"
                  placeholder="https://..."
                />
                <p className="text-[10px] text-gray-500 mt-1 italic">This URL will be available for investors to download/view.</p>
              </div>
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setShowMilestoneModal(false)} className="flex-1 py-3 font-bold text-gray-400 hover:bg-white/5 rounded-xl transition-all cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 bg-redhill-red text-white py-3 font-bold rounded-xl shadow-lg shadow-redhill-red/20 hover:bg-red-700 transition-all cursor-pointer">Add Milestone</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Investor Modal */}
      {showInvestorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowInvestorModal(false)} />
          <div className="relative bg-redhill-gray border border-white/[0.08] rounded-2xl w-full max-w-lg p-8 shadow-2xl text-white">
            <h2 className="text-2xl font-bold text-white mb-6 font-serif">Add New Investor</h2>
            <form className="space-y-4" onSubmit={handleCreateInvestor}>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={invName}
                  onChange={(e) => setInvName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 focus:ring-2 focus:ring-redhill-red/10 transition-all"
                  placeholder="e.g. Vijay Kumar"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">Email Address</label>
                <input
                  type="email"
                  value={invEmail}
                  onChange={(e) => setInvEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 focus:ring-2 focus:ring-redhill-red/10 transition-all"
                  placeholder="vijay@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={invPhone}
                  onChange={(e) => setInvPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 focus:ring-2 focus:ring-redhill-red/10 transition-all"
                  placeholder="e.g. 8123515091"
                  required
                />
                <p className="text-[10px] text-gray-500 mt-1">Login ID will be generated automatically (e.g. vj091)</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">Initial Password</label>
                <div className="relative">
                  <input
                    type={showInvPassword ? "text" : "password"}
                    value={invPassword}
                    onChange={(e) => setInvPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-10 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 focus:ring-2 focus:ring-redhill-red/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowInvPassword(!showInvPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors cursor-pointer p-1"
                    tabIndex={-1}
                  >
                    {showInvPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setShowInvestorModal(false)} className="flex-1 py-3 font-bold text-gray-400 hover:bg-white/5 rounded-xl transition-all cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 bg-redhill-red text-white py-3 font-bold rounded-xl shadow-lg shadow-redhill-red/20 hover:bg-red-700 transition-all cursor-pointer">Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAssignModal(false)} />
          <div className="relative bg-redhill-gray border border-white/[0.08] rounded-2xl w-full max-w-lg p-8 shadow-2xl text-white">
            <h2 className="text-2xl font-bold text-white mb-6 font-serif">Assign Investor to Project</h2>
            <form className="space-y-4" onSubmit={handleAssignInvestor}>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">Select Investor</label>
                <select
                  value={assignUserId}
                  onChange={(e) => setAssignUserId(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 focus:ring-2 focus:ring-redhill-red/10 transition-all"
                  required
                >
                  <option value="" className="bg-redhill-gray">Choose an investor...</option>
                  {investors.map(i => (
                    <option key={i.id} value={i.id} className="bg-redhill-gray">{i.name} ({i.email})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">Select Project</label>
                <select
                  value={assignProjectId}
                  onChange={(e) => setAssignProjectId(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 focus:ring-2 focus:ring-redhill-red/10 transition-all"
                  required
                >
                  <option value="" className="bg-redhill-gray">Choose a project...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id} className="bg-redhill-gray">{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">Contribution Label</label>
                <input
                  type="text"
                  value={assignContribution}
                  onChange={(e) => setAssignContribution(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 focus:ring-2 focus:ring-redhill-red/10 transition-all"
                  placeholder="e.g. ₹2.5 Cr"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Investment (₹)</label>
                  <input
                    type="number"
                    value={assignInvestmentAmt}
                    onChange={(e) => setAssignInvestmentAmt(e.target.value)}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 focus:ring-2 focus:ring-redhill-red/10 transition-all"
                    placeholder="25000000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Allotted Sqft</label>
                  <input
                    type="number"
                    value={assignSqft}
                    onChange={(e) => setAssignSqft(e.target.value)}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 focus:ring-2 focus:ring-redhill-red/10 transition-all"
                    placeholder="1200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Market ₹/sqft</label>
                  <input
                    type="number"
                    value={assignMarketPrice}
                    onChange={(e) => setAssignMarketPrice(e.target.value)}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 focus:ring-2 focus:ring-redhill-red/10 transition-all"
                    placeholder="12500"
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setShowAssignModal(false)} className="flex-1 py-3 font-bold text-gray-400 hover:bg-white/5 rounded-xl transition-all cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 bg-redhill-red text-white py-3 font-bold rounded-xl shadow-lg shadow-redhill-red/20 hover:bg-red-700 transition-all cursor-pointer">Assign Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CCTV Modal */}
      {showCctvModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCctvModal(false)} />
          <div className="relative bg-redhill-gray border border-white/[0.08] rounded-2xl w-full max-w-lg p-8 shadow-2xl text-white">
            <h2 className="text-2xl font-bold text-white mb-2 font-serif">Manage CCTV Feed</h2>
            <p className="text-gray-400 mb-6 text-sm">Update live camera URL for: <span className="font-bold text-redhill-red">{selectedProject?.name}</span></p>

            <form className="space-y-4" onSubmit={handleUpdateCctv}>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">CCTV Stream URL</label>
                <input
                  type="text"
                  value={cctvUrl}
                  onChange={(e) => setCctvUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 focus:ring-2 focus:ring-redhill-red/10 transition-all"
                  placeholder="https://..."
                  required
                />
                <p className="text-[10px] text-gray-500 mt-2">Provide a direct MP4, HLS, or stream link. This will be visible to all investors assigned to this project.</p>
              </div>
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setShowCctvModal(false)} className="flex-1 py-3 font-bold text-gray-400 hover:bg-white/5 rounded-xl transition-all cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 bg-redhill-red text-white py-3 font-bold rounded-xl shadow-lg shadow-redhill-red/20 hover:bg-red-700 transition-all cursor-pointer">Update Feed</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEditProjectModal(false)} />
          <div className="relative bg-redhill-gray border border-white/[0.08] rounded-2xl w-full max-w-lg p-8 shadow-2xl text-white">
            <h2 className="text-2xl font-bold text-white mb-6 font-serif">Edit Project</h2>
            <form onSubmit={handleEditProject} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">Project Name</label>
                <input
                  type="text"
                  value={editPName}
                  onChange={(e) => setEditPName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 focus:ring-2 focus:ring-redhill-red/10 transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">Location</label>
                <input
                  type="text"
                  value={editPLocation}
                  onChange={(e) => setEditPLocation(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 focus:ring-2 focus:ring-redhill-red/10 transition-all"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Status</label>
                  <select
                    value={editPStatus}
                    onChange={(e) => setEditPStatus(e.target.value)}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05]"
                  >
                    <option value="Planning & Approval" className="bg-redhill-gray">Planning & Approval</option>
                    <option value="Under Construction" className="bg-redhill-gray">Under Construction</option>
                    <option value="Completed" className="bg-redhill-gray">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Completion %</label>
                  <input
                    type="number"
                    value={editPCompletion}
                    onChange={(e) => setEditPCompletion(Number(e.target.value))}
                    min="0"
                    max="100"
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 focus:ring-2 focus:ring-redhill-red/10 transition-all"
                    required
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setShowEditProjectModal(false)} className="flex-1 py-3 font-bold text-gray-400 hover:bg-white/5 rounded-xl transition-all cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 bg-redhill-red text-white py-3 font-bold rounded-xl shadow-lg shadow-redhill-red/20 hover:bg-red-700 transition-all cursor-pointer">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Investment Modal */}
      {/* Edit Investment Modal */}
      {showEditInvestmentModal && editingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEditInvestmentModal(false)} />
          <div className="relative bg-redhill-gray border border-white/[0.08] rounded-2xl w-full max-w-lg p-8 shadow-2xl text-white">
            <h2 className="text-2xl font-bold text-white mb-2 font-serif">Edit Investment Details</h2>
            <p className="text-gray-400 mb-6 text-sm">
              <span className="font-bold text-white">{editingAssignment.investor_name}</span> → <span className="font-bold text-redhill-red">{editingAssignment.project_name}</span>
            </p>

            <form className="space-y-4" onSubmit={handleEditInvestment}>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">Contribution Label</label>
                <input
                  type="text"
                  value={editContribution}
                  onChange={(e) => setEditContribution(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 focus:ring-2 focus:ring-redhill-red/10 transition-all"
                  placeholder="e.g. ₹2.5 Cr"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Investment Amount (₹)</label>
                  <input
                    type="number"
                    value={editInvestmentAmt}
                    onChange={(e) => setEditInvestmentAmt(e.target.value)}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 focus:ring-2 focus:ring-redhill-red/10 transition-all"
                    placeholder="25000000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Allotted Sqft</label>
                  <input
                    type="number"
                    value={editSqft}
                    onChange={(e) => setEditSqft(e.target.value)}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 focus:ring-2 focus:ring-redhill-red/10 transition-all"
                    placeholder="1200"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Rate at Investment (₹/sqft)</label>
                  <input
                    type="number"
                    value={editPriceAtInvestment}
                    onChange={(e) => setEditPriceAtInvestment(e.target.value)}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 focus:ring-2 focus:ring-redhill-red/10 transition-all"
                    placeholder="12000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-1">Current Market Rate (₹/sqft)</label>
                  <input
                    type="number"
                    value={editMarketPrice}
                    onChange={(e) => setEditMarketPrice(e.target.value)}
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 focus:ring-2 focus:ring-redhill-red/10 transition-all"
                    placeholder="15000"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">Investment Date</label>
                <input
                  type="date"
                  value={editInvestmentDate}
                  onChange={(e) => setEditInvestmentDate(e.target.value)}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl outline-none text-white focus:bg-white/[0.05] focus:border-redhill-red/40 focus:ring-2 focus:ring-redhill-red/10 transition-all"
                />
              </div>
              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setShowEditInvestmentModal(false)} className="flex-1 py-3 font-bold text-gray-400 hover:bg-white/5 rounded-xl transition-all cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 bg-redhill-red text-white py-3 font-bold rounded-xl shadow-lg shadow-redhill-red/20 hover:bg-red-700 transition-all cursor-pointer">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
