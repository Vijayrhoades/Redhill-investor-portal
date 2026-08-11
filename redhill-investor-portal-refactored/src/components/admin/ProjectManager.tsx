import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Project, MilestoneCategory, MilestoneStatus } from '../../types';
import { Plus, Pencil, Trash2, ExternalLink, MapPin, Users, Video } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusChip from '../StatusChip';
import { useToast } from '../Toast';
import ConfirmDialog from '../ConfirmDialog';

export default function ProjectManager() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: projects = [] } = useQuery<Project[]>({ queryKey: ['admin-projects'] });
  const { data: assignments = [] } = useQuery<any[]>({ queryKey: ['admin-investor-projects'] });

  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const deleteProjectMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/projects/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
      showToast('Project deleted successfully', 'success');
      setConfirmDialog({ ...confirmDialog, isOpen: false });
    },
    onError: () => {
      showToast('Failed to delete project', 'error');
    }
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white font-serif">Project Management</h1>
          <p className="text-gray-400 mt-1">Create and manage Redhill infrastructure projects.</p>
        </div>
        <button
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
                      onConfirm: () => deleteProjectMutation.mutate(p.id)
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
                  <Users className="w-3 h-3" /> {assignments.filter((a: any) => a.project_id === p.id).length}
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
                  <button className="flex-1 bg-white/[0.03] text-gray-300 py-2 rounded-lg text-xs font-bold border border-white/[0.05] hover:bg-white/[0.06] transition-colors cursor-pointer">
                    Manage Milestones
                  </button>
                  <button className="flex-1 bg-white/[0.03] text-gray-300 py-2 rounded-lg text-xs font-bold border border-white/[0.05] hover:bg-white/[0.06] transition-colors cursor-pointer">
                    Upload Progress
                  </button>
                </div>
                <button className="w-full bg-redhill-red/10 text-red-400 py-2 rounded-lg text-xs font-bold border border-red-500/10 hover:bg-redhill-red/20 transition-colors flex items-center justify-center gap-2 cursor-pointer">
                  <Video className="w-3 h-3" /> Manage CCTV
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

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
