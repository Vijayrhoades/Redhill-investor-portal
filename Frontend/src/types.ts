export type Role = 'super_admin' | 'senior_admin' | 'site_manager' | 'support_agent' | 'financial_officer' | 'marketing_manager' | 'admin' | 'investor';

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
  start_date?: string;
  expected_completion?: string;
  actual_completion?: string;
  completion_percentage: number;
  doc_url?: string;
  target_days?: number;
  current_day?: number;
  notes?: string;
  last_updated_at?: string;
}

export interface ProgressUpdate {
  id: number;
  project_id: number;
  type: 'photo' | 'video';
  url: string;
  caption: string;
  date: string;
  milestone_id?: number;
  day_number?: number;
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
  investor_name?: string;
  investor_email?: string;
  project_name?: string;
  last_sender_role?: string;
}

export interface NotificationLog {
  id: number;
  project_id: number;
  project_name?: string;
  project_location?: string;
  milestone_id?: number;
  milestone_name?: string;
  milestone_category?: string;
  user_id?: number;
  user_name?: string;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  type: string;
  content_html: string;
  status: string;
  created_at: string;
}

export interface ProjectWithAudience {
  project: Project;
  milestones: Milestone[];
  investors: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    contribution?: string;
    allotted_sqft?: number;
  }[];
  totalInvestors: number;
}

export interface LedgerEntry {
  id: number;
  project_id: number;
  project_name?: string;
  user_id?: number;
  investor_id?: number;
  investor_name?: string;
  investor_login_id?: string;
  transaction_type: 'initial_assignment' | 'sub_investment' | 'adjustment' | string;
  investment_amount: number;
  contribution?: string;
  allotted_sqft?: number;
  price_at_investment: number;
  market_price_per_sqft?: number;
  note?: string;
  transaction_date?: string;
  created_at?: string;
}

