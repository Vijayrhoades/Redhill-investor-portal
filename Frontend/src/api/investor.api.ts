import { Project, Milestone, ProgressUpdate, Announcement, Query } from '../types';

export const investorApi = {
  getProjects: async (): Promise<Project[]> => {
    const res = await fetch('/api/investor/projects');
    if (!res.ok) throw new Error('Failed to fetch investor projects');
    return res.json();
  },

  getProjectDetail: async (id: number | string): Promise<{
    project: Project;
    milestones: Milestone[];
    updates: ProgressUpdate[];
    announcements: Announcement[];
  }> => {
    const res = await fetch(`/api/investor/projects/${id}`);
    if (!res.ok) throw new Error('Failed to fetch project detail');
    return res.json();
  },

  getQueries: async (projectId: number | string): Promise<Query[]> => {
    const res = await fetch(`/api/investor/queries/${projectId}`);
    if (!res.ok) throw new Error('Failed to fetch queries');
    return res.json();
  },

  sendQuery: async (data: { project_id: number; message: string; user_id?: number }): Promise<Query> => {
    const res = await fetch('/api/queries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to send query');
    }
    return res.json();
  },
};
