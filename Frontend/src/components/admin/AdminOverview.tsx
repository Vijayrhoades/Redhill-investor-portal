import React from 'react';
import { Building2, Users, Bell, BookOpen, Shield, Hammer, IndianRupee, TrendingUp } from 'lucide-react';
import { Project, User } from '../../types';
import { ROLE_CONFIG } from '../../constants/roles';
import { formatCurrency } from '../../utils/formatters';

interface AdminOverviewProps {
  user: User;
  projects: Project[];
  investors: User[];
  unansweredCount: number;
  analytics?: {
    totalFundsRaised?: number;
    totalAllottedSqft?: number;
    activeProjectsCount?: number;
    activeProjects?: number;
  };
  setActiveView: (view: 'overview' | 'investors' | 'projects' | 'queries' | 'admins' | 'ledger') => void;
}

export default function AdminOverview({
  user,
  projects,
  investors,
  unansweredCount,
  analytics,
  setActiveView
}: AdminOverviewProps) {
  const isSuperAdmin = user.role === 'super_admin' || user.role === 'senior_admin';
  const isSiteManager = user.role === 'site_manager';
  const isFinancialOfficer = user.role === 'financial_officer';
  const isMarketingManager = user.role === 'marketing_manager';
  const isSupportAgent = user.role === 'support_agent';

  const roleMeta = ROLE_CONFIG[user.role] || ROLE_CONFIG.super_admin;
  const RoleIcon = roleMeta.icon;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-redhill-gray via-[#1c2030] to-redhill-gray p-6 sm:p-8 rounded-3xl border border-white/[0.08] shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${roleMeta.bg} ${roleMeta.color} border ${roleMeta.border}`}>
              <RoleIcon className="w-3.5 h-3.5" />
              {roleMeta.badge}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-serif">Welcome, {user.name}</h1>
          <p className="text-gray-400 mt-1 text-sm">{roleMeta.desc}</p>
        </div>
      </div>

      {/* Dynamic KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {!isSupportAgent && (
          <button
            onClick={() => setActiveView('projects')}
            className="bg-redhill-gray p-6 rounded-2xl border border-white/[0.06] shadow-lg text-left cursor-pointer hover:shadow-xl hover:scale-[1.02] hover:border-blue-500/30 transition-all duration-200"
          >
            <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Projects</p>
            <p className="text-3xl font-bold text-white mt-1">{projects.length}</p>
          </button>
        )}

        {(isSuperAdmin || isFinancialOfficer) && (
          <button
            onClick={() => setActiveView('investors')}
            className="bg-redhill-gray p-6 rounded-2xl border border-white/[0.06] shadow-lg text-left cursor-pointer hover:shadow-xl hover:scale-[1.02] hover:border-emerald-500/30 transition-all duration-200"
          >
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Investors</p>
            <p className="text-3xl font-bold text-white mt-1">{investors.length}</p>
          </button>
        )}

        {(isSuperAdmin || isFinancialOfficer) && (
          <button
            onClick={() => setActiveView('ledger')}
            className="bg-redhill-gray p-6 rounded-2xl border border-white/[0.06] shadow-lg text-left cursor-pointer hover:shadow-xl hover:scale-[1.02] hover:border-purple-500/30 transition-all duration-200"
          >
            <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center mb-4">
              <IndianRupee className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Capital Raised</p>
            <p className="text-2xl font-bold text-white mt-1">
              {formatCurrency(analytics?.totalFundsRaised || 43000000)}
            </p>
          </button>
        )}

        <button
          onClick={() => setActiveView('queries')}
          className="bg-redhill-gray p-6 rounded-2xl border border-white/[0.06] shadow-lg text-left cursor-pointer hover:shadow-xl hover:scale-[1.02] hover:border-redhill-red/30 transition-all duration-200"
        >
          <div className="w-12 h-12 bg-redhill-red/10 text-redhill-red rounded-xl flex items-center justify-center mb-4">
            <Bell className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Unanswered Inquiries</p>
          <p className="text-3xl font-bold text-white mt-1">{unansweredCount}</p>
        </button>
      </div>

      {/* Preview Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {!isSupportAgent && (
          <div className="bg-redhill-gray rounded-2xl border border-white/[0.06] shadow-lg overflow-hidden">
            <div className="p-6 border-b border-white/[0.06] flex justify-between items-center bg-black/10">
              <h2 className="font-bold text-white font-serif">Active Projects Overview</h2>
              <button onClick={() => setActiveView('projects')} className="text-sm text-redhill-red font-bold hover:underline cursor-pointer">View All</button>
            </div>
            <div className="divide-y divide-white/[0.05]">
              {projects.slice(0, 4).map(p => (
                <div key={p.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/5 border border-white/10">
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
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      {p.status}
                    </span>
                    <p className="text-xs font-bold text-white mt-1.5">{p.completion_percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(isSuperAdmin || isFinancialOfficer) && (
          <div className="bg-redhill-gray rounded-2xl border border-white/[0.06] shadow-lg overflow-hidden">
            <div className="p-6 border-b border-white/[0.06] flex justify-between items-center bg-black/10">
              <h2 className="font-bold text-white font-serif">Recent Investors</h2>
              <button onClick={() => setActiveView('investors')} className="text-sm text-redhill-red font-bold hover:underline cursor-pointer">View All</button>
            </div>
            <div className="divide-y divide-white/[0.05]">
              {investors.slice(0, 4).map(i => (
                <div key={i.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-gray-300">
                      {i.name ? i.name.charAt(0).toUpperCase() : 'I'}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">{i.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{i.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 font-mono">
                    ID: {i.login_id || 'N/A'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
