import { User, Project, Milestone, ProgressUpdate, Announcement, LedgerEntry, Role } from '../types';

export const adminApi = {
  // Staff & Admin Management
  getAdmins: async (): Promise<User[]> => {
    const res = await fetch('/api/admin/users');
    if (!res.ok) throw new Error('Failed to fetch admins');
    return res.json();
  },

  createAdmin: async (data: { name: string; email: string; role: Role; password: string }): Promise<User> => {
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create admin');
    }
    return res.json();
  },

  updateAdmin: async (id: number, data: { name?: string; email?: string; role?: Role; password?: string }): Promise<{ message: string }> => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update admin');
    }
    return res.json();
  },

  deleteAdmin: async (id: number): Promise<{ message: string }> => {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete admin');
    }
    return res.json();
  },

  // Projects
  getProjects: async (): Promise<Project[]> => {
    const res = await fetch('/api/admin/projects');
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },

  createProject: async (data: Partial<Project>): Promise<Project> => {
    const res = await fetch('/api/admin/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create project');
    }
    return res.json();
  },

  updateCctv: async (projectId: number, cctvUrl: string): Promise<void> => {
    const res = await fetch(`/api/admin/projects/${projectId}/cctv`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cctv_url: cctvUrl }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update CCTV');
    }
  },

  // Investors
  getInvestors: async (): Promise<User[]> => {
    const res = await fetch('/api/admin/investors');
    if (!res.ok) throw new Error('Failed to fetch investors');
    return res.json();
  },

  createInvestor: async (data: { name: string; email: string; phone: string; password: string }): Promise<User> => {
    const res = await fetch('/api/admin/investors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create investor');
    }
    return res.json();
  },

  deleteInvestor: async (id: number): Promise<void> => {
    const res = await fetch(`/api/admin/investors/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete investor');
    }
  },

  // Assignments & Ledger
  getAssignments: async (): Promise<any[]> => {
    const res = await fetch('/api/admin/investor-projects');
    if (!res.ok) throw new Error('Failed to fetch assignments');
    return res.json();
  },

  assignInvestor: async (data: {
    userId: number;
    projectId: number;
    contribution: string;
    investmentAmount: number;
    allottedSqft: number;
    marketPricePerSqft: number;
    priceAtInvestment?: number;
    investmentDate?: string;
  }): Promise<void> => {
    const res = await fetch('/api/admin/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: data.userId,
        project_id: data.projectId,
        contribution: data.contribution,
        investment_amount: data.investmentAmount,
        allotted_sqft: data.allottedSqft,
        market_price_per_sqft: data.marketPricePerSqft,
        price_at_investment: data.priceAtInvestment || data.marketPricePerSqft,
        investment_date: data.investmentDate,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to assign project');
    }
  },

  getLedger: async (): Promise<LedgerEntry[]> => {
    const res = await fetch('/api/admin/ledger');
    if (!res.ok) throw new Error('Failed to fetch ledger');
    return res.json();
  },

  addSubInvestment: async (data: {
    userId: number;
    projectId: number;
    addCapital: number;
    addSqft: number;
    currentPrice: number;
    notes?: string;
    transactionDate: string;
  }): Promise<void> => {
    const res = await fetch('/api/admin/ledger/sub-investment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: data.userId,
        project_id: data.projectId,
        investment_amount: data.addCapital,
        allotted_sqft: data.addSqft,
        price_at_investment: data.currentPrice,
        market_price_per_sqft: data.currentPrice,
        note: data.notes,
        transaction_date: data.transactionDate,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add sub-investment');
    }
  },

  // Analytics
  getAnalytics: async (): Promise<{ totalFundsRaised: number; totalAllottedSqft: number; activeProjectsCount: number }> => {
    const res = await fetch('/api/admin/analytics');
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },

  // File Uploads
  uploadFile: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload file');
    return res.json();
  },
};
