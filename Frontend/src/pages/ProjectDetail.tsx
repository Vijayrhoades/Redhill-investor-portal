import { useState, useEffect, useRef, FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Building2, MapPin, Calendar, CheckCircle2, Clock, AlertCircle,
  FileText, Image as ImageIcon, Video, Bell, ChevronLeft,
  Download, ExternalLink, LogOut, MessageCircle, Send, ChevronUp, ChevronRight, IndianRupee
} from 'lucide-react';
import { User, Project, Milestone, ProgressUpdate, Announcement, Query } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Layout from '../components/Layout';
import Skeleton from '../components/Skeleton';
import StatusChip from '../components/StatusChip';
import { formatCurrency, formatDate } from '../utils/formatters';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ProjectDetailProps {
  user: User;
  onLogout: () => void;
}

export default function ProjectDetail({ user, onLogout }: ProjectDetailProps) {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'progress' | 'docs' | 'media' | 'queries' | 'ledger'>('progress');
  const [newMessage, setNewMessage] = useState('');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data, isLoading: loading } = useQuery<{
    project: Project;
    milestones: Milestone[];
    updates: ProgressUpdate[];
    announcements: Announcement[];
    queries: Query[];
  }>({
    queryKey: ['project', id],
    queryFn: async () => {
      const res = await fetch(`/api/investor/projects/${id}`);
      if (!res.ok) throw new Error('Failed to fetch project details');
      return res.json();
    },
    enabled: !!id,
  });

  const { data: payments = [], isLoading: loadingPayments } = useQuery<any[]>({
    queryKey: ['project-payments', id],
    queryFn: async () => {
      const res = await fetch(`/api/investor/payments/${id}`);
      if (!res.ok) throw new Error('Failed to fetch payments');
      return res.json();
    },
    enabled: !!id,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await fetch('/api/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: id, message }),
      });
      if (!res.ok) throw new Error('Failed to send message');
      return res.json();
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
    onError: (err) => {
      console.error(err);
    }
  });

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (activeTab === 'queries') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTab, data?.queries]);

  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(newMessage);
  };

  const sending = sendMessageMutation.isPending;

  if (loading) {
    return (
      <Layout user={user} onLogout={onLogout}>
        <div className="pb-20">
        <div className="relative py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Skeleton type="text" className="w-1/3 mb-4" />
            <Skeleton type="text" className="w-2/3 h-12 mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2">
                <Skeleton type="image" className="h-64 rounded-2xl" />
              </div>
              <div>
                <Skeleton type="image" className="h-64 rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!data) return <div className="text-center py-20 text-white">Project not found</div>;

  const { project, milestones, updates, announcements, queries } = data;

  const docMilestones = milestones.filter(m => m.category === 'documentation');
  const approvalMilestones = milestones.filter(m => m.category === 'approval');
  const constructionMilestones = milestones.filter(m => m.category === 'construction');

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      case 'in_progress':
        return (
          <span className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
            <Clock className="w-3 h-3" /> In Progress
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-gray-400 bg-white/[0.05] border border-white/[0.05] px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
            <AlertCircle className="w-3 h-3" /> Pending
          </span>
        );
    }
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="text-gray-100 pb-20">
        
      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Link 
            to={['admin', 'super_admin', 'site_manager', 'support_agent'].includes(user.role) ? '/admin' : '/dashboard'} 
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-white font-medium truncate max-w-[200px] sm:max-w-xs">{project.name}</span>
        </div>
      </div>

      {/* Hero Header */}
      <div className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={project.image_url || 'https://picsum.photos/seed/project/1920/1080'}
            alt=""
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/fallback/1920/1080';
            }}
            className="w-full h-full object-cover opacity-20 blur-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-redhill-dark via-redhill-gray/90 to-redhill-dark" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-redhill-red/5 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 text-redhill-red font-bold uppercase tracking-[0.2em] text-[10px] mb-4">
                <span className="w-8 h-[2px] bg-redhill-red" />
                Infrastructure Project Details
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold mb-4 font-serif text-white">{project.name}</h1>
              <div className="flex flex-wrap items-center gap-6 text-gray-400">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-redhill-red" />
                  {project.location}
                </div>
                {project.investment_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    Started: {formatDate(project.investment_date)}
                  </div>
                )}
                {updates.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    Last Updated: {formatDate(updates[updates.length - 1].created_at)}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-redhill-gray/90 backdrop-blur-xl rounded-2xl p-8 border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <div className="mb-6">
                <div className="flex justify-between items-end mb-2.5">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Overall Completion</span>
                  <span className="text-3xl font-bold text-white tracking-tight">{project.completion_percentage}%</span>
                </div>
                <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${project.completion_percentage}%` }}
                    className="bg-gradient-to-r from-redhill-red to-amber-500 h-full rounded-full shadow-[0_0_15px_rgba(227,30,36,0.4)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3">
                  <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-2">Status</p>
                  <StatusChip status={project.status} />
                </div>
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3">
                  <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-1">Investment</p>
                  <p className="text-sm font-bold text-white">
                    {project.investment_amount ? formatCurrency(project.investment_amount) : (project.contribution || 'N/A')}
                  </p>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3">
                  <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-1">Allotted Area</p>
                  <p className="text-sm font-bold text-white">
                    {project.allotted_sqft ? `${project.allotted_sqft.toLocaleString('en-IN')} sqft` : 'N/A'}
                  </p>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3">
                  <p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-1">Buy Rate</p>
                  <p className="text-sm font-bold text-white">
                    {project.price_at_investment ? `₹${project.price_at_investment.toLocaleString('en-IN')}/sqft` : 'N/A'}
                  </p>
                </div>
              </div>

              {project.market_price_per_sqft && project.allotted_sqft ? (
                <div className="mt-3 bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 border border-emerald-500/15 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-emerald-400 font-bold mb-0.5">Current Market Rate</p>
                      <p className="text-lg font-bold text-emerald-400">₹{project.market_price_per_sqft.toLocaleString('en-IN')}/sqft</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] uppercase tracking-widest text-emerald-400/80 font-bold mb-0.5">Valuation</p>
                      <p className="text-lg font-bold text-emerald-400">{formatCurrency(project.allotted_sqft * project.market_price_per_sqft)}</p>
                    </div>
                  </div>
                  
                  {project.investment_amount > 0 && (
                    <div className="flex justify-between items-center pt-3 border-t border-emerald-500/20">
                      <span className="text-xs text-emerald-500/80 font-medium">Total Return</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${project.allotted_sqft * project.market_price_per_sqft >= project.investment_amount ? 'text-emerald-400' : 'text-red-400'}`}>
                          {project.allotted_sqft * project.market_price_per_sqft >= project.investment_amount ? '+' : ''}{formatCurrency((project.allotted_sqft * project.market_price_per_sqft) - project.investment_amount)}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${project.allotted_sqft * project.market_price_per_sqft >= project.investment_amount ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {project.allotted_sqft * project.market_price_per_sqft >= project.investment_amount ? '+' : ''}{((((project.allotted_sqft * project.market_price_per_sqft) - project.investment_amount) / project.investment_amount) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-[#121217]/90 backdrop-blur-md border-b border-white/[0.05] sticky top-20 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            {[
              { id: 'progress', label: 'Project Progress', icon: Clock, count: milestones.length },
              { id: 'docs', label: 'Documents & Approvals', icon: FileText, count: docMilestones.length + approvalMilestones.length },
              { id: 'ledger', label: 'Ledger & Invoices', icon: IndianRupee, count: payments.length },
              { id: 'media', label: 'Media Feed', icon: ImageIcon, count: updates.length },
              { id: 'queries', label: 'Queries & Help', icon: MessageCircle, count: queries.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 py-5 border-b-2 transition-all font-bold text-sm cursor-pointer",
                  activeTab === tab.id
                    ? "border-redhill-red text-redhill-red"
                    : "border-transparent text-gray-400 hover:text-white"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span className={cn(
                    "ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                    activeTab === tab.id
                      ? "bg-redhill-red/20 text-redhill-red"
                      : "bg-white/10 text-gray-400"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <AnimatePresence mode="wait">
          {activeTab === 'progress' && (
            <motion.div
              key="progress"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-12"
            >
              {/* Construction Milestones */}
              <section>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3 font-serif">
                    <Building2 className="text-redhill-red w-6 h-6" />
                    Construction Milestones
                  </h2>
                </div>

                <div className="space-y-4">
                  {constructionMilestones.map((m, idx) => (
                    <div key={m.id} className="bg-redhill-gray rounded-xl p-6 border border-white/[0.06] shadow-lg hover:border-white/[0.1] transition-all">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm",
                            m.status === 'completed' ? "bg-emerald-500/10 text-emerald-400" :
                              m.status === 'in_progress' ? "bg-amber-500/10 text-amber-400" : "bg-white/5 text-gray-500"
                          )}>
                            {idx + 1}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-white font-serif">{m.name}</h3>
                            <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-400">
                              {m.status === 'completed' ? (
                                <span className="flex items-center gap-1 text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                                  <CheckCircle2 className="w-3 h-3" /> Completed
                                </span>
                              ) : (
                                <>
                                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-redhill-red/70" /> Start: {m.start_date || 'TBA'}</span>
                                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-500/70" /> Expected: {m.expected_completion || 'TBA'}</span>
                                </>
                              )}
                              {m.actual_completion && (
                                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                                  <CheckCircle2 className="w-3 h-3" /> Actual: {m.actual_completion}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-3 w-full md:w-64">
                          <div className="flex justify-between w-full text-sm mb-1">
                            <StatusBadge status={m.status} />
                            <span className="font-bold text-white">{m.completion_percentage}%</span>
                          </div>
                          <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${m.completion_percentage}%` }}
                              className={cn(
                                "h-full rounded-full shadow-[0_0_10px_rgba(227,30,36,0.3)]",
                                m.status === 'completed' ? "bg-emerald-500" : "bg-redhill-red"
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Announcements */}
              <section className="bg-redhill-gray rounded-2xl p-8 border border-white/[0.06] shadow-xl">
                <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3 font-serif">
                  <Bell className="text-redhill-red" />
                  Latest Announcements
                </h2>
                <div className="space-y-6">
                  {announcements.length > 0 ? announcements.map(a => (
                    <div key={a.id} className="border-l-4 border-redhill-red pl-6 py-2 relative bg-white/[0.01] rounded-r-xl p-4">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                        {new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      <h3 className="font-bold text-lg text-white mb-2 font-serif">{a.title}</h3>
                      <p className="text-gray-300 text-sm leading-relaxed">{a.content}</p>
                    </div>
                  )) : (
                    <p className="text-gray-500 italic text-sm">No announcements at this time.</p>
                  )}
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'docs' && (
            <motion.div
              key="docs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-10"
            >
              {/* Documentation Stage */}
              <section className="bg-redhill-gray rounded-2xl p-8 border border-white/[0.06] shadow-xl">
                <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-3 font-serif">
                  <FileText className="text-redhill-red" />
                  Documentation Stage
                </h2>
                <div className="space-y-4">
                  {docMilestones.map(m => (
                    <div key={m.id} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                          m.status === 'completed' ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-gray-500"
                        )}>
                          {m.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                        </div>
                        <span className="font-bold text-white text-sm font-serif">{m.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={m.status} />
                        {m.doc_url && (
                          <a
                            href={m.doc_url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-redhill-red hover:text-white text-gray-300 rounded-lg transition-all text-xs font-bold border border-white/[0.05]"
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Approval Stage */}
              <section className="bg-redhill-gray rounded-2xl p-8 border border-white/[0.06] shadow-xl">
                <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-3 font-serif">
                  <CheckCircle2 className="text-redhill-red" />
                  Approval Stage
                </h2>
                <div className="space-y-4">
                  {approvalMilestones.map(m => (
                    <div key={m.id} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                          m.status === 'completed' ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-gray-500"
                        )}>
                          {m.status === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                        </div>
                        <span className="font-bold text-white text-sm font-serif">{m.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={m.status} />
                        {m.doc_url && (
                          <a
                            href={m.doc_url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-redhill-red hover:text-white text-gray-300 rounded-lg transition-all text-xs font-bold border border-white/[0.05]"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View Plan
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'media' && (
            <motion.div
              key="media"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-12"
            >
              {/* Live Camera Section */}
              <section className="bg-redhill-gray rounded-2xl overflow-hidden shadow-2xl border border-white/[0.08]">
                <div className="p-6 border-b border-white/[0.06] flex items-center justify-between bg-gradient-to-r from-redhill-gray to-redhill-dark">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Video className="text-redhill-red w-6 h-6" />
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-duration-1000"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight font-serif">Live Site Camera</h2>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">System Online</span>
                    </div>
                    <div className="text-xs font-mono text-gray-500 italic">CAM-01 / NW-SECTOR</div>
                  </div>
                </div>

                <div className="relative aspect-video bg-black group">
                  {project.cctv_url ? (
                    <video
                      src={project.cctv_url}
                      autoPlay
                      muted
                      loop
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-4">
                      <Video className="w-16 h-16 opacity-20" />
                      <p className="text-sm font-medium">Camera Feed Temporarily Unavailable</p>
                    </div>
                  )}

                  {/* Overlay Controls */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-redhill-red font-bold uppercase tracking-[0.2em] text-[10px] mb-1">Live Feed</p>
                        <h3 className="text-white font-bold text-lg font-serif">Main Construction Yard</h3>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 rounded-lg text-xs font-bold text-white transition-all cursor-pointer">HD</button>
                        <button className="px-4 py-2 bg-redhill-red hover:bg-redhill-red/90 rounded-lg text-xs font-bold text-white transition-all shadow-lg shadow-red-600/20 cursor-pointer">Expand View</button>
                      </div>
                    </div>
                  </div>

                  {/* Scanline Effect */}
                  <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,118,0.02))] bg-[length:100%_2px,3px_100%] z-10 opacity-20" />
                </div>
              </section>

              {/* Gallery Section */}
              <section>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3 font-serif">
                    <ImageIcon className="text-redhill-red" />
                    Project Media
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {updates.map((update, idx) => (
                    <motion.div
                      key={update.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group bg-redhill-gray rounded-2xl overflow-hidden border border-white/[0.06] shadow-lg hover:border-white/[0.12] transition-all"
                    >
                      <div className="relative aspect-video overflow-hidden bg-white/[0.02]">
                        {update.type === 'video' ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="w-12 h-12 text-white/20" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-12 h-12 bg-redhill-red rounded-full flex items-center justify-center text-white">
                                <Video className="w-6 h-6" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={update.url || 'https://picsum.photos/seed/update/1920/1080'}
                            alt={update.caption}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/fallback/1920/1080';
                            }}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        )}
                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-widest border border-white/10">
                          {new Date(update.date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                      <div className="p-5">
                        <p className="text-sm text-gray-300 font-medium leading-relaxed">{update.caption}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'queries' && (
            <motion.div
              key="queries"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl mx-auto h-[600px] flex flex-col bg-redhill-gray rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/[0.06] bg-black/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-redhill-red to-amber-600 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg shadow-redhill-red/20">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-white text-sm font-serif">Redhill Support desk</h2>
                    <p className="text-xs text-emerald-400 font-bold flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                      Active Thread
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-redhill-dark/40">
                {queries.length > 0 ? queries.map((q) => (
                  <div
                    key={q.id}
                    className={cn(
                      "flex flex-col w-full",
                      q.sender_role === 'investor' ? "items-end" : "items-start"
                    )}
                  >
                    <div className={cn(
                      "px-4.5 py-3 max-w-[80%] text-sm shadow-lg leading-relaxed transition-all duration-300",
                      q.sender_role === 'investor'
                        ? "bg-redhill-red text-white rounded-2xl rounded-tr-none shadow-redhill-red/10"
                        : "bg-[#1E1E28] text-gray-200 border border-white/[0.06] rounded-2xl rounded-tl-none"
                    )}>
                      {q.message}
                    </div>
                    <span className="text-[9px] text-gray-500 mt-1.5 font-bold uppercase tracking-wider mx-1">
                      {q.sender_role === 'investor' ? 'You' : 'Redhill Support'} • {new Date(q.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-10">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                      <MessageCircle className="w-8 h-8 text-gray-600" />
                    </div>
                    <h3 className="font-bold text-white mb-1 font-serif">No queries yet</h3>
                    <p className="text-sm text-gray-500">Ask any questions about the project development or allotment here.</p>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-4 bg-black/40 border-t border-white/[0.06] flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your question here..."
                  className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:bg-white/[0.05] focus:border-redhill-red/40 focus:ring-2 focus:ring-redhill-red/10 transition-all"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="bg-redhill-red text-white p-3.5 rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-red-600/20 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </motion.div>
          )}

          {activeTab === 'ledger' && (
            <motion.div
              key="ledger"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-redhill-gray rounded-2xl border border-white/5 overflow-hidden">
                <div className="p-6 border-b border-white/5 bg-black/20 flex items-center justify-between">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <IndianRupee className="w-5 h-5 text-redhill-red" />
                    Payment Ledger
                  </h3>
                </div>
                <div className="divide-y divide-white/5">
                  {payments.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                      <IndianRupee className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                      <p>No payments or invoices recorded yet.</p>
                    </div>
                  ) : (
                    payments.map((payment: any) => (
                      <div key={payment.id} className="p-6 flex items-start justify-between hover:bg-white/[0.02] transition-colors">
                        <div className="flex gap-4">
                          <div className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                            payment.type === 'invoice' ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"
                          )}>
                            {payment.type === 'invoice' ? <FileText className="w-6 h-6" /> : <IndianRupee className="w-6 h-6" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h4 className="font-bold text-white capitalize">{payment.type}</h4>
                              <StatusChip status={payment.status === 'paid' ? 'completed' : 'pending'} />
                            </div>
                            <p className="text-sm text-gray-400 max-w-md">{payment.description}</p>
                            <p className="text-xs text-gray-500 mt-2">{formatDate(payment.date)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-white">{formatCurrency(payment.amount)}</p>
                          {payment.file_url && (
                            <a 
                              href={payment.file_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-redhill-red hover:text-red-400 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Download {payment.type === 'invoice' ? 'Invoice' : 'Receipt'}
                            </a>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Back to Top Button */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-8 right-8 z-40 w-12 h-12 bg-redhill-gray/90 backdrop-blur-xl border border-white/[0.1] rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:border-redhill-red/40 shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-colors cursor-pointer"
            title="Back to top"
          >
            <ChevronUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
      </div>
    </Layout>
  );
}

function TrendingUpIndicator() {
  return (
    <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    </div>
  );
}
