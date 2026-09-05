import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Query, User, Project } from '../../types';
import {
  MessageCircle, Send, ArrowLeft, Building2, User as UserIcon, Clock, CheckCircle2,
  Search, Shield, Hammer, IndianRupee, TrendingUp, Sparkles, Copy,
  Check, Filter, UserCheck, AlertCircle, RefreshCw, Plus, X
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatRelativeTime, formatDate } from '../../utils/formatters';
import { useToast } from '../Toast';
import Modal from '../Modal';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const QUICK_REPLIES = [
  "Hello! We are actively reviewing your project progress.",
  "Your allotment documentation and receipt are available in the ledger.",
  "The site engineer has posted new photo and video updates.",
  "Thank you for reaching out. We will get back to you shortly."
];

export default function AdminQueries() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'resolved'>('all');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeUserId, setComposeUserId] = useState<string>('');
  const [composeProjectId, setComposeProjectId] = useState<string>('');
  const [composeMsgText, setComposeMsgText] = useState<string>('');
  const lastMsgCountRef = useRef(0);

  const { data: threads = [], isLoading: loadingThreads, refetch: refetchThreads, isFetching } = useQuery<any[]>({
    queryKey: ['admin-queries'],
    queryFn: async () => {
      const res = await fetch('/api/admin/queries');
      if (!res.ok) throw new Error('Failed to fetch query threads');
      return res.json();
    },
    refetchInterval: 10000
  });

  const { data: investors = [] } = useQuery<User[]>({
    queryKey: ['admin-investors'],
    queryFn: async () => {
      const res = await fetch('/api/admin/investors');
      if (!res.ok) return [];
      return res.json();
    }
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['admin-projects'],
    queryFn: async () => {
      const res = await fetch('/api/admin/projects');
      if (!res.ok) return [];
      return res.json();
    }
  });

  // Filter threads by search and status
  const filteredThreads = useMemo(() => {
    return threads.filter((t: any) => {
      const name = (t.investor_name || t.userName || '').toLowerCase();
      const proj = (t.project_name || t.projectName || '').toLowerCase();
      const msg = (t.message || '').toLowerCase();
      const email = (t.investor_email || '').toLowerCase();
      const q = searchQuery.toLowerCase();

      const matchesSearch = !searchQuery || name.includes(q) || proj.includes(q) || msg.includes(q) || email.includes(q);
      const isUnread = t.last_sender_role === 'investor';
      const matchesStatus = filterStatus === 'all' || (filterStatus === 'unread' ? isUnread : !isUnread);

      return matchesSearch && matchesStatus;
    });
  }, [threads, searchQuery, filterStatus]);

  // Derive selected thread
  const selectedThread = useMemo(() => {
    if (selectedUserId && selectedProjectId) {
      return threads.find((t: any) => t.user_id === selectedUserId && t.project_id === selectedProjectId) || null;
    }
    return filteredThreads[0] || null;
  }, [threads, selectedUserId, selectedProjectId, filteredThreads]);

  // Set initial selected thread once on load
  useEffect(() => {
    if (!selectedUserId && filteredThreads.length > 0) {
      setSelectedUserId(filteredThreads[0].user_id);
      setSelectedProjectId(filteredThreads[0].project_id);
    }
  }, [filteredThreads, selectedUserId]);

  const { data: threadMessages = [], isLoading: loadingMessages } = useQuery<Query[]>({
    queryKey: ['admin-thread', selectedThread?.user_id, selectedThread?.project_id],
    queryFn: async () => {
      if (!selectedThread) return [];
      const res = await fetch(`/api/admin/queries/${selectedThread.user_id}/${selectedThread.project_id}`);
      return res.json();
    },
    enabled: !!selectedThread,
    refetchInterval: 8000,
  });

  // Scroll to bottom only when messages grow or active thread changes
  useEffect(() => {
    if (threadMessages.length > lastMsgCountRef.current || selectedThread) {
      chatEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
    lastMsgCountRef.current = threadMessages.length;
  }, [threadMessages.length, selectedThread?.user_id, selectedThread?.project_id]);

  const replyMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!selectedThread) return;
      const res = await fetch('/api/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedThread.project_id,
          user_id: selectedThread.user_id,
          message: message.trim(),
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to send reply');
      }
      return res.json();
    },
    onSuccess: () => {
      setReplyMessage('');
      queryClient.invalidateQueries({ queryKey: ['admin-thread', selectedThread?.user_id, selectedThread?.project_id] });
      queryClient.invalidateQueries({ queryKey: ['admin-queries'] });
      showToast('Reply sent successfully', 'success');
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to send reply. Please try again.', 'error');
    }
  });

  const composeMutation = useMutation({
    mutationFn: async (data: { user_id: number; project_id: number; message: string }) => {
      const res = await fetch('/api/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to send message');
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      setShowComposeModal(false);
      setComposeMsgText('');
      setSelectedUserId(variables.user_id);
      setSelectedProjectId(variables.project_id);
      queryClient.invalidateQueries({ queryKey: ['admin-queries'] });
      queryClient.invalidateQueries({ queryKey: ['admin-thread', variables.user_id, variables.project_id] });
      showToast('Message sent to investor successfully', 'success');
    },
    onError: (err: any) => {
      showToast(err.message || 'Failed to initiate conversation.', 'error');
    }
  });

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || replyMutation.isPending) return;
    replyMutation.mutate(replyMessage.trim());
  };

  const handleComposeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeUserId || !composeProjectId || !composeMsgText.trim()) {
      showToast('Please fill out all fields', 'warning');
      return;
    }
    composeMutation.mutate({
      user_id: Number(composeUserId),
      project_id: Number(composeProjectId),
      message: composeMsgText.trim()
    });
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    showToast('Investor email copied to clipboard', 'info');
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const getRoleBadgeInfo = (role: string) => {
    switch (role) {
      case 'super_admin':
      case 'senior_admin':
        return { label: 'SUPER ADMIN', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
      case 'site_manager':
        return { label: 'SITE ENGINEER', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
      case 'financial_officer':
        return { label: 'FINANCE LEAD', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
      case 'marketing_manager':
        return { label: 'MARKETING', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
      case 'support_agent':
        return { label: 'SUPPORT AGENT', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
      case 'investor':
        return { label: 'INVESTOR', bg: 'bg-white/10 text-gray-300 border-white/15' };
      default:
        return { label: 'STAFF', bg: 'bg-red-500/20 text-red-300 border-red-500/30' };
    }
  };

  const unreadCount = threads.filter((t: any) => t.last_sender_role === 'investor').length;

  return (
    <div className="space-y-6 flex-1 flex flex-col min-h-[680px]">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-redhill-red/15 border border-redhill-red/30 flex items-center justify-center text-redhill-red shadow-lg shadow-redhill-red/10">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white font-serif">Investor Queries & Helpdesk</h1>
              <p className="text-gray-400 text-xs sm:text-sm mt-0.5">Real-time support messenger and inquiry resolution center.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowComposeModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-redhill-red to-red-700 hover:from-red-600 hover:to-red-800 text-white text-xs font-bold rounded-xl shadow-lg shadow-redhill-red/20 transition-all cursor-pointer"
            title="Start New Conversation"
          >
            <Plus className="w-4 h-4" />
            <span>New Message</span>
          </button>
          <button
            onClick={() => refetchThreads()}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 text-xs font-semibold rounded-xl border border-white/[0.08] transition-all cursor-pointer"
            title="Refresh Threads"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin text-redhill-red")} />
            <span>Sync</span>
          </button>
          <div className="px-3.5 py-1.5 bg-redhill-red/15 border border-redhill-red/30 rounded-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-redhill-red animate-pulse" />
            <span className="text-xs font-bold text-red-300">
              {unreadCount} {unreadCount === 1 ? 'Pending Inquiry' : 'Pending Inquiries'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 bg-[#1A1D27] rounded-3xl border border-white/[0.08] shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-0">
        {/* Left Side: Threads List */}
        <div className={cn(
          "w-full lg:w-[380px] xl:w-[420px] border-r border-white/[0.08] flex flex-col bg-[#161822] shrink-0",
          selectedThread ? "hidden lg:flex" : "flex"
        )}>
          {/* Search & Filter bar */}
          <div className="p-4 border-b border-white/[0.08] space-y-3 bg-black/20">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search investor, project, or message..."
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:bg-white/[0.06] focus:border-redhill-red/40 transition-all"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5">
              {[
                { key: 'all', label: `All (${threads.length})` },
                { key: 'unread', label: `Needs Reply (${unreadCount})` },
                { key: 'resolved', label: 'Resolved' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setFilterStatus(tab.key as any)}
                  className={cn(
                    "flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center cursor-pointer border",
                    filterStatus === tab.key
                      ? "bg-redhill-red text-white border-redhill-red/50 shadow-md shadow-redhill-red/20"
                      : "bg-white/[0.02] text-gray-400 border-white/[0.06] hover:bg-white/[0.05] hover:text-white"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Thread Cards List */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
            {filteredThreads.map((t: any) => {
              const isSelected = selectedThread?.user_id === t.user_id && selectedThread?.project_id === t.project_id;
              const isUnread = t.last_sender_role === 'investor';
              const investorName = t.investor_name || t.userName || 'Investor';
              const projectName = t.project_name || t.projectName || 'Project';
              const lastMsgText = t.message || 'No messages yet';

              return (
                <button
                  key={`${t.user_id}-${t.project_id}`}
                  onClick={() => {
                    setSelectedUserId(t.user_id);
                    setSelectedProjectId(t.project_id);
                  }}
                  className={cn(
                    "w-full text-left p-4.5 transition-all relative cursor-pointer block group",
                    isSelected
                      ? "bg-white/[0.08] border-l-4 border-redhill-red shadow-inner"
                      : "hover:bg-white/[0.03]"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border",
                        isUnread
                          ? "bg-redhill-red text-white border-red-400"
                          : "bg-white/10 text-gray-300 border-white/15"
                      )}>
                        {investorName.charAt(0).toUpperCase()}
                      </div>
                      <p className="font-bold text-sm text-white truncate group-hover:text-redhill-red transition-colors">
                        {investorName}
                      </p>
                    </div>

                    <span className="text-[10px] text-gray-500 whitespace-nowrap font-mono shrink-0">
                      {formatRelativeTime(t.created_at || t.lastMessage)}
                    </span>
                  </div>

                  <div className="pl-10.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400 bg-redhill-red/10 border border-redhill-red/20 px-2 py-0.5 rounded-md truncate max-w-[200px]">
                        <Building2 className="w-3 h-3 shrink-0" />
                        <span className="truncate">{projectName}</span>
                      </span>
                    </div>

                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-2 font-normal">
                      {lastMsgText}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                        isUnread
                          ? "bg-red-500/20 text-red-300 border-red-500/30 animate-pulse"
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      )}>
                        {isUnread ? 'Needs Reply' : 'Resolved'}
                      </span>

                      {t.investor_email && (
                        <span className="text-[10px] text-gray-500 font-mono truncate max-w-[130px]">
                          {t.investor_email}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}

            {filteredThreads.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-20 text-gray-400" />
                <p className="font-bold text-sm text-gray-300">No inquiry threads found</p>
                <p className="text-xs text-gray-500 mt-1">Try adjusting your search or status filter.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Chat Window */}
        <div className={cn(
          "flex-1 flex flex-col bg-[#12141C] min-w-0",
          !selectedThread ? "hidden lg:flex items-center justify-center" : "flex"
        )}>
          {!selectedThread ? (
            <div className="text-center p-12 max-w-md mx-auto">
              <div className="w-20 h-20 bg-white/[0.03] border border-white/[0.08] rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-2xl">
                <MessageCircle className="w-10 h-10 text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-white font-serif">Select an Inquiry Thread</h3>
              <p className="text-gray-400 text-xs sm:text-sm mt-2 leading-relaxed">
                Choose a conversation from the left sidebar to view the discussion history and reply directly to the investor.
              </p>
            </div>
          ) : (
            <>
              {/* Chat Top Header */}
              <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-[#171A24] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <button
                    onClick={() => {
                      setSelectedUserId(null);
                      setSelectedProjectId(null);
                    }}
                    className="lg:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 cursor-pointer shrink-0"
                    title="Back to Threads"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-redhill-red to-red-700 text-white font-bold text-base flex items-center justify-center shadow-lg shadow-redhill-red/20 shrink-0 border border-white/10">
                    {(selectedThread.investor_name || selectedThread.userName || 'I').charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-white text-base truncate font-serif">
                        {selectedThread.investor_name || selectedThread.userName}
                      </h2>
                      <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Verified Investor
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5 truncate">
                      <span className="font-bold text-redhill-red flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {selectedThread.project_name || selectedThread.projectName}
                      </span>
                      {selectedThread.investor_email && (
                        <>
                          <span className="text-gray-600">&bull;</span>
                          <button
                            onClick={() => handleCopyEmail(selectedThread.investor_email)}
                            className="font-mono text-gray-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                            title="Click to copy email"
                          >
                            <span>{selectedThread.investor_email}</span>
                            {copiedEmail ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-gray-500" />}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span className="text-xs text-gray-500 hidden sm:inline-block font-mono">
                    Thread ID: #{selectedThread.user_id}-{selectedThread.project_id}
                  </span>
                </div>
              </div>

              {/* Chat Message Stream */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gradient-to-b from-[#10121A] to-[#141620]">
                {threadMessages.length === 0 && !loadingMessages && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-gray-500">
                    <MessageCircle className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm font-bold text-gray-400">No messages found in this discussion</p>
                    <p className="text-xs text-gray-600 mt-1">Send a reply below to initiate communication.</p>
                  </div>
                )}

                {threadMessages.map((msg: Query) => {
                  const isStaff = msg.sender_role !== 'investor';
                  const badge = getRoleBadgeInfo(msg.sender_role);

                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex flex-col w-full group",
                        isStaff ? "items-end" : "items-start"
                      )}
                    >
                      {/* Sender Info Tag */}
                      <div className={cn(
                        "flex items-center gap-2 mb-1 px-1",
                        isStaff ? "flex-row-reverse" : "flex-row"
                      )}>
                        <span className={cn(
                          "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border shadow-sm",
                          badge.bg
                        )}>
                          {badge.label}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {formatRelativeTime(msg.created_at)}
                        </span>
                      </div>

                      {/* Message Bubble */}
                      <div className={cn(
                        "p-4 max-w-[85%] sm:max-w-[75%] text-sm leading-relaxed shadow-xl break-words whitespace-pre-wrap transition-all",
                        isStaff
                          ? "bg-gradient-to-br from-redhill-red to-[#B7151A] text-white rounded-3xl rounded-tr-none shadow-redhill-red/15 border border-red-500/30"
                          : "bg-[#202534] text-gray-100 border border-white/[0.08] rounded-3xl rounded-tl-none shadow-black/40"
                      )}>
                        <p className="text-[13px] sm:text-sm font-normal text-white">{msg.message}</p>
                      </div>

                      {/* Exact time on hover */}
                      <span className="text-[9px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity mt-1 px-2 font-mono">
                        {formatDate(msg.created_at)}
                      </span>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Quick Reply Chips */}
              <div className="px-4 py-2 bg-[#171A24] border-t border-white/[0.06] flex items-center gap-2 overflow-x-auto pb-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest shrink-0 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Quick:
                </span>
                {QUICK_REPLIES.map((text, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setReplyMessage(text)}
                    className="px-3 py-1 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg text-xs text-gray-300 hover:text-white whitespace-nowrap transition-all cursor-pointer text-left"
                  >
                    {text}
                  </button>
                ))}
              </div>

              {/* Reply Input Box */}
              <form onSubmit={handleReply} className="p-4 bg-[#151722] border-t border-white/[0.08] flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={replyMessage}
                    onChange={e => setReplyMessage(e.target.value)}
                    placeholder="Type your official reply to the investor..."
                    disabled={replyMutation.isPending}
                    className="w-full bg-white/[0.04] border border-white/[0.1] rounded-2xl px-5 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:bg-white/[0.06] focus:border-redhill-red/50 focus:ring-2 focus:ring-redhill-red/20 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={replyMutation.isPending || !replyMessage.trim()}
                  className="bg-gradient-to-r from-redhill-red to-red-700 hover:from-red-600 hover:to-red-800 disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-3.5 rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-redhill-red/20 cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {replyMutation.isPending ? 'Sending...' : 'Send Reply'}
                  </span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Compose New Message Modal */}
      <Modal
        isOpen={showComposeModal}
        onClose={() => setShowComposeModal(false)}
        title="Start New Investor Conversation"
      >
        <form onSubmit={handleComposeSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Select Investor
            </label>
            <select
              value={composeUserId}
              onChange={e => setComposeUserId(e.target.value)}
              required
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-redhill-red/50"
            >
              <option value="" disabled className="bg-[#1a1d28] text-gray-400">
                Choose an investor...
              </option>
              {investors.map(inv => (
                <option key={inv.id} value={inv.id} className="bg-[#1a1d28] text-white">
                  {inv.name} ({inv.email}) {inv.login_id ? `[${inv.login_id}]` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Select Project
            </label>
            <select
              value={composeProjectId}
              onChange={e => setComposeProjectId(e.target.value)}
              required
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-redhill-red/50"
            >
              <option value="" disabled className="bg-[#1a1d28] text-gray-400">
                Choose a project...
              </option>
              {projects.map(proj => (
                <option key={proj.id} value={proj.id} className="bg-[#1a1d28] text-white">
                  {proj.name} ({proj.location})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Message Content
            </label>
            <textarea
              value={composeMsgText}
              onChange={e => setComposeMsgText(e.target.value)}
              placeholder="Type your official announcement or inquiry message..."
              rows={4}
              required
              className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl p-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-redhill-red/50 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={() => setShowComposeModal(false)}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={composeMutation.isPending || !composeUserId || !composeProjectId || !composeMsgText.trim()}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-redhill-red to-red-700 hover:from-red-600 hover:to-red-800 disabled:opacity-40 transition-all flex items-center gap-2 shadow-lg shadow-redhill-red/20 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{composeMutation.isPending ? 'Sending...' : 'Send Message'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
