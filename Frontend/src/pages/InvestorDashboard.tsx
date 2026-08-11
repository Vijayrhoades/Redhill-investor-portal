import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, Project } from '../types';
import { Link } from 'react-router-dom';
import {
  LogOut, MapPin, TrendingUp, ChevronRight,
  IndianRupee, Maximize, BarChart3, Wallet, LayoutDashboard, Calendar,
  Sparkles, Building2, Phone, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from '../components/Logo';

interface InvestorDashboardProps {
  user: User;
  onLogout: () => void;
}

import Skeleton from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import StatusChip from '../components/StatusChip';
import { formatCurrency, formatDate } from '../utils/formatters';

function formatNumber(n: number): string {
  return n.toLocaleString('en-IN');
}

export default function InvestorDashboard({ user, onLogout }: InvestorDashboardProps) {
  const [showAdSidebar, setShowAdSidebar] = useState(true);

  const { data: projects = [], isLoading: loadingProjects } = useQuery<Project[]>({
    queryKey: ['investor-projects'],
    queryFn: async () => {
      const res = await fetch('/api/investor/projects');
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  });

  const { data: newProjects = [] } = useQuery<Project[]>({
    queryKey: ['investor-new-projects'],
    queryFn: async () => {
      const res = await fetch('/api/investor/new-projects');
      if (!res.ok) throw new Error('Failed to fetch new projects');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  });

  const loading = loadingProjects;

  const totalInvestment = projects.reduce((sum, p) => sum + (p.investment_amount || 0), 0);
  const totalSqft = projects.reduce((sum, p) => sum + (p.allotted_sqft || 0), 0);
  const totalMarketValue = projects.reduce((sum, p) => sum + ((p.allotted_sqft || 0) * (p.market_price_per_sqft || 0)), 0);
  const avgCompletion = projects.length > 0
    ? Math.round(projects.reduce((sum, p) => sum + p.completion_percentage, 0) / projects.length)
    : 0;

  const hasAds = newProjects.length > 0 && showAdSidebar;

  return (
    <div className="min-h-screen bg-redhill-dark">
      {/* Header */}
      <header className="bg-redhill-gray/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo light />
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-white">{user.name}</p>
              <p className="text-xs text-gray-500 font-medium">Investor Account</p>
            </div>
            <button 
              onClick={onLogout}
              className="p-2.5 text-gray-500 hover:text-redhill-red hover:bg-white/5 rounded-xl transition-all"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-redhill-dark via-redhill-dark/95 to-redhill-dark" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-redhill-red/5 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px]" />
        
        <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center gap-2 text-redhill-red font-bold uppercase tracking-[0.2em] text-[10px] mb-3">
              <span className="w-8 h-[2px] bg-redhill-red" />
              Portfolio Overview
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2">
              {(() => {
                const hour = new Date().getHours();
                const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
                return <>{greeting}, </>;
              })()}
              <span className="bg-gradient-to-r from-redhill-red to-amber-500 bg-clip-text text-transparent">{user.name.split(' ')[0]}</span>
            </h1>
            <p className="text-gray-500 text-lg max-w-xl">Track your infrastructure investments, property values, and project progress in real-time.</p>
          </motion.div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 -mt-2 pb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Investment', value: formatCurrency(totalInvestment), icon: Wallet, gradient: 'from-redhill-red/20 to-rose-600/10', iconBg: 'bg-redhill-red/20', iconColor: 'text-redhill-red', border: 'border-redhill-red/10', delay: 0 },
            { label: 'Allotted Area', value: `${formatNumber(totalSqft)} sqft`, icon: Maximize, gradient: 'from-blue-500/20 to-cyan-500/10', iconBg: 'bg-blue-500/20', iconColor: 'text-blue-400', border: 'border-blue-500/10', delay: 0.1 },
            { label: 'Current Market Value', value: formatCurrency(totalMarketValue), icon: BarChart3, gradient: 'from-emerald-500/20 to-teal-500/10', iconBg: 'bg-emerald-500/20', iconColor: 'text-emerald-400', border: 'border-emerald-500/10', delay: 0.2 },
            { label: 'Avg. Completion', value: `${avgCompletion}%`, icon: TrendingUp, gradient: 'from-amber-500/20 to-orange-500/10', iconBg: 'bg-amber-500/20', iconColor: 'text-amber-400', border: 'border-amber-500/10', delay: 0.3 },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: stat.delay, duration: 0.5 }}
              className={`bg-gradient-to-br ${stat.gradient} backdrop-blur-xl rounded-2xl p-6 border ${stat.border} hover:scale-[1.02] transition-transform duration-300 cursor-default`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 ${stat.iconBg} rounded-xl flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
              </div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500 font-bold mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-white tracking-tight">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Gain indicator */}
        {totalMarketValue > totalInvestment && totalInvestment > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-5 py-3"
          >
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <p className="text-sm text-emerald-400 font-semibold">
              Portfolio appreciation: <span className="text-emerald-300 font-bold">{formatCurrency(totalMarketValue - totalInvestment)}</span>
              <span className="text-emerald-500 ml-2">
                (+{((totalMarketValue - totalInvestment) / totalInvestment * 100).toFixed(1)}%)
              </span>
            </p>
          </motion.div>
        )}
      </div>

      {/* Main Content with Sidebar */}
      <div className={`max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 ${hasAds ? 'flex gap-8' : ''}`}>
        {/* Projects Section */}
        <main className={hasAds ? 'flex-1 min-w-0' : 'w-full'}>
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">My Projects</h2>
              <p className="text-gray-500 mt-1 text-sm">Your active infrastructure investments</p>
            </div>
            <div className="text-sm text-gray-600 font-medium bg-white/5 px-4 py-2 rounded-xl border border-white/5">
              {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
            </div>
          </div>

          {loading ? (
            <div className={`grid grid-cols-1 ${hasAds ? 'xl:grid-cols-2' : 'lg:grid-cols-2'} gap-6`}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-redhill-gray rounded-2xl overflow-hidden border border-white/5 h-[480px]">
                  <Skeleton type="image" />
                  <div className="p-6 space-y-4">
                    <Skeleton type="text" className="w-1/2" />
                    <Skeleton type="text" className="w-1/3" />
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <Skeleton type="row" />
                      <Skeleton type="row" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <EmptyState
              icon={LayoutDashboard}
              title="No Projects Assigned"
              description="You haven't been assigned to any projects yet. Please contact the administrator."
            />
          ) : (
            <div className={`grid grid-cols-1 ${hasAds ? 'xl:grid-cols-2' : 'lg:grid-cols-2'} gap-6`}>
              {projects.map((project, index) => {
                const marketValue = (project.allotted_sqft || 0) * (project.market_price_per_sqft || 0);
                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                  >
                    <Link 
                      to={`/project/${project.id}`}
                      className="group block bg-redhill-gray rounded-2xl overflow-hidden border border-white/5 hover:border-redhill-red/30 transition-all duration-500 hover:shadow-2xl hover:shadow-redhill-red/5"
                    >
                      <div className="relative h-52 overflow-hidden">
                        <img 
                          src={project.image_url || 'https://picsum.photos/seed/placeholder/1920/1080'} 
                          alt={project.name}
                          referrerPolicy="no-referrer"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/fallback/1920/1080'; }}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-redhill-gray via-transparent to-transparent" />
                        <div className="absolute top-4 right-4 shadow-lg shadow-black/20 rounded-full bg-black/40 backdrop-blur">
                          <StatusChip status={project.status} />
                        </div>
                        <div className="absolute bottom-4 left-6 right-6">
                          <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-redhill-red transition-colors duration-300 font-serif">{project.name}</h3>
                          <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <MapPin className="w-3.5 h-3.5 text-redhill-red" />
                            {project.location}
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-6 pt-4 space-y-5">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white/[0.03] rounded-xl p-3.5 border border-white/5">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <IndianRupee className="w-3 h-3 text-redhill-red" />
                              <span className="text-[9px] uppercase tracking-[0.12em] text-gray-500 font-bold">Investment</span>
                            </div>
                            <p className="text-base font-bold text-white">{project.investment_amount ? formatCurrency(project.investment_amount) : (project.contribution || 'N/A')}</p>
                          </div>
                          <div className="bg-white/[0.03] rounded-xl p-3.5 border border-white/5">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Maximize className="w-3 h-3 text-blue-400" />
                              <span className="text-[9px] uppercase tracking-[0.12em] text-gray-500 font-bold">Allotted</span>
                            </div>
                            <p className="text-base font-bold text-white">{project.allotted_sqft ? `${formatNumber(project.allotted_sqft)} sqft` : 'N/A'}</p>
                          </div>
                          <div className="bg-white/[0.03] rounded-xl p-3.5 border border-white/5">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <BarChart3 className="w-3 h-3 text-amber-400" />
                              <span className="text-[9px] uppercase tracking-[0.12em] text-gray-500 font-bold">Rate at Investment</span>
                            </div>
                            <p className="text-base font-bold text-white">{project.price_at_investment ? `₹${formatNumber(project.price_at_investment)}/sqft` : 'N/A'}</p>
                            {project.investment_date && (
                              <p className="text-[9px] text-gray-600 mt-1 flex items-center gap-1">
                                <Calendar className="w-2.5 h-2.5" />
                                {new Date(project.investment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            )}
                          </div>
                          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-xl p-3.5 border border-emerald-500/10">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <TrendingUp className="w-3 h-3 text-emerald-400" />
                              <span className="text-[9px] uppercase tracking-[0.12em] text-emerald-500/70 font-bold">Current Market Rate</span>
                            </div>
                            <p className="text-base font-bold text-emerald-400">{project.market_price_per_sqft ? `₹${formatNumber(project.market_price_per_sqft)}/sqft` : 'N/A'}</p>
                            <p className="text-[9px] text-emerald-600/60 mt-1 flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" />
                              {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        {marketValue > 0 && (
                          <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-emerald-500/5 rounded-xl p-4 border border-amber-500/15 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-amber-500/20 rounded-lg flex items-center justify-center">
                                  <Wallet className="w-4 h-4 text-amber-400" />
                                </div>
                                <div>
                                  <p className="text-[9px] uppercase tracking-[0.12em] text-gray-500 font-bold">Current Plot Value</p>
                                  <p className="text-[9px] text-gray-600 mt-0.5">
                                    ₹{formatNumber(project.market_price_per_sqft || 0)} × {formatNumber(project.allotted_sqft || 0)} sqft
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold text-amber-400">{formatCurrency(marketValue)}</p>
                              </div>
                            </div>
                            
                            {project.investment_amount > 0 && (
                              <div className="flex justify-between items-center pt-3 border-t border-white/5">
                                <span className="text-xs text-gray-400">Total Return</span>
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-bold ${marketValue >= project.investment_amount ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {marketValue >= project.investment_amount ? '+' : ''}{formatCurrency(marketValue - project.investment_amount)}
                                  </span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${marketValue >= project.investment_amount ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {marketValue >= project.investment_amount ? '+' : ''}{(((marketValue - project.investment_amount) / project.investment_amount) * 100).toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-500 font-medium text-xs">Project Completion</span>
                            <span className="text-white font-bold text-xs">{project.completion_percentage}%</span>
                          </div>
                          <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${project.completion_percentage}%` }}
                              transition={{ duration: 1, delay: 0.3 + index * 0.1 }}
                              className="bg-gradient-to-r from-redhill-red to-amber-500 h-full rounded-full shadow-[0_0_12px_rgba(227,30,36,0.4)]"
                            />
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-2">
                          <p className="text-[10px] uppercase tracking-[0.15em] text-gray-600 font-bold">View Full Details</p>
                          <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center group-hover:bg-redhill-red transition-all duration-300 border border-white/5 group-hover:border-redhill-red">
                            <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </main>

        {/* Advertisement Sidebar */}
        {hasAds && (
          <motion.aside
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="w-[340px] flex-shrink-0 hidden lg:block"
          >
            <div className="sticky top-24 space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-redhill-red rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">New Opportunities</h3>
                    <p className="text-[10px] text-gray-500">Latest projects by Redhill</p>
                  </div>
                </div>
                <button onClick={() => setShowAdSidebar(false)} className="p-1.5 text-gray-600 hover:text-gray-400 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Project Ad Cards */}
              {newProjects.map((project, idx) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + idx * 0.15, duration: 0.5 }}
                  className="group relative bg-redhill-gray rounded-2xl overflow-hidden border border-white/5 hover:border-amber-500/30 transition-all duration-500"
                >
                  {/* "NEW" ribbon */}
                  <div className="absolute top-3 left-3 z-10 bg-gradient-to-r from-amber-500 to-redhill-red px-2.5 py-1 rounded-full text-[9px] font-bold text-white uppercase tracking-widest flex items-center gap-1 shadow-lg shadow-amber-500/20">
                    <Sparkles className="w-2.5 h-2.5" />
                    New Launch
                  </div>

                  {/* Image */}
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={project.image_url || 'https://picsum.photos/seed/ad/800/600'}
                      alt={project.name}
                      referrerPolicy="no-referrer"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/fallback/800/600'; }}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-redhill-gray via-redhill-gray/40 to-transparent" />
                    
                    {/* Project info overlay */}
                    <div className="absolute bottom-3 left-4 right-4">
                      <h4 className="text-base font-bold text-white font-serif leading-tight">{project.name}</h4>
                      <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-1">
                        <MapPin className="w-3 h-3 text-amber-400" />
                        {project.location}
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Project Value</span>
                      </div>
                      <span className="text-sm font-bold text-white">{project.total_value || 'TBA'}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Status</span>
                      <span className="bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full text-[10px] font-bold border border-amber-500/20">
                        {project.status}
                      </span>
                    </div>

                    {/* Progress */}
                    {project.completion_percentage > 0 && (
                      <div>
                        <div className="flex justify-between text-[10px] mb-1.5">
                          <span className="text-gray-500 font-bold">Progress</span>
                          <span className="text-amber-400 font-bold">{project.completion_percentage}%</span>
                        </div>
                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${project.completion_percentage}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className="bg-gradient-to-r from-amber-500 to-redhill-red h-full rounded-full"
                          />
                        </div>
                      </div>
                    )}

                    {/* CTA */}
                    <button className="w-full mt-1 bg-gradient-to-r from-amber-500/10 to-redhill-red/10 hover:from-amber-500/20 hover:to-redhill-red/20 border border-amber-500/20 hover:border-amber-500/40 text-amber-400 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2">
                      <Phone className="w-3.5 h-3.5" />
                      Enquire Now
                    </button>
                  </div>
                </motion.div>
              ))}

              {/* Bottom promo */}
              <div className="bg-gradient-to-br from-redhill-gray/60 to-redhill-gray rounded-2xl p-5 border border-purple-500/10 text-center">
                <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Building2 className="w-5 h-5 text-purple-400" />
                </div>
                <p className="text-xs font-bold text-white mb-1">Interested in investing?</p>
                <p className="text-[10px] text-gray-500 leading-relaxed">Contact our investment team for exclusive opportunities and early-bird pricing.</p>
                <div className="mt-3 text-[10px] font-bold text-purple-400">invest@redhillinfra.com</div>
              </div>
            </div>
          </motion.aside>
        )}
      </div>
    </div>
  );
}
