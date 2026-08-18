export type Role = 'super_admin' | 'site_manager' | 'support_agent' | 'admin' | 'investor';

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  phone?: string;
  login_id?: string;
}

export interface Project {
  id: number;
  name: string;
  location: string;
  total_value: string;
  status: string;
  image_url: string;
  completion_percentage: number;
  contribution?: string;
  cctv_url?: string;
  investment_amount?: number;
  allotted_sqft?: number;
  market_price_per_sqft?: number;
  price_at_investment?: number;
  investment_date?: string;
}

export type MilestoneCategory = 'documentation' | 'approval' | 'construction';
export type MilestoneStatus = 'completed' | 'in_progress' | 'pending';

export interface Milestone {
  id: number;
  project_id: number;
  category: MilestoneCategory;
  name: string;
  status: MilestoneStatus;
  start_date: string;
  expected_completion: string;
  actual_completion: string;
  completion_percentage: number;
  doc_url?: string;
}

export interface ProgressUpdate {
  id: number;
  project_id: number;
  type: 'photo' | 'video';
  url: string;
  caption: string;
  date: string;
  milestone_id?: number;
  created_at?: string;
}

export interface Announcement {
  id: number;
  project_id: number;
  title: string;
  content: string;
  date: string;
}

export interface Query {
  id: number;
  user_id: number;
  project_id: number;
  message: string;
  sender_role: Role;
  created_at: string;
  userName?: string;
  projectName?: string;
}

export type LedgerTransactionType = 'initial_assignment' | 'sub_investment' | 'adjustment';

export interface LedgerEntry {
  id: number;
  user_id: number;
  project_id: number;
  transaction_type: LedgerTransactionType;
  investment_amount: number;
  allotted_sqft: number;
  price_at_investment: number;
  market_price_per_sqft: number;
  contribution?: string;
  note?: string;
  transaction_date: string;
  created_at: string;
  investor_name?: string;
  investor_email?: string;
  investor_login_id?: string;
  project_name?: string;
}
