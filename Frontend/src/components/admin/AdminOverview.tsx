import { useQuery } from '@tanstack/react-query';
import { Building2, Users, Bell, Settings } from 'lucide-react';
import { Project, User, Query } from '../../types';

interface AdminOverviewProps {
  setActiveView: (view: 'overview' | 'investors' | 'projects' | 'queries') => void;
}

export default function AdminOverview({ setActiveView }: AdminOverviewProps) {
  const { data: projects = [] } = useQuery<Project[]>({ queryKey: ['admin-projects'] });
  const { data: investors = [] } = useQuery<User[]>({ queryKey: ['admin-investors'] });
  const { data: threads = [] } = useQuery<Query[]>({ queryKey: ['admin-queries'] });

  const unansweredCount = threads.filter((t: any) => t.last_sender_role === 'investor').length;

  return (
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
          <p className="text-3xl font-bold text-white mt-1">{unansweredCount}</p>
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
                <button onClick={() => setActiveView('investors')} className="p-2 text-gray-500 hover:text-white cursor-pointer">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
