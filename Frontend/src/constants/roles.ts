import { Shield, Hammer, IndianRupee, TrendingUp, MessageCircle } from 'lucide-react';
import { Role } from '../types';

export interface RoleMetadata {
  label: string;
  badge: string;
  icon: any;
  color: string;
  bg: string;
  border: string;
  ring: string;
  tag: string;
  desc: string;
  permissions: string[];
}

export const ROLE_CONFIG: Record<string, RoleMetadata> = {
  super_admin: {
    label: 'Super Admin',
    badge: 'SUPER ADMIN',
    icon: Shield,
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/30',
    ring: 'ring-amber-500/50',
    tag: 'Full Master Access',
    desc: 'Unrestricted master access across all portal modules, security, staff management, and database records.',
    permissions: [
      'Manage Staff & Roles',
      'Full Financial & Ledger Access',
      'Create & Edit Projects',
      'Manage Investors & KYC',
      'Investor Queries Resolution'
    ]
  },
  senior_admin: {
    label: 'Senior Admin',
    badge: 'SENIOR ADMIN',
    icon: Shield,
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/30',
    ring: 'ring-amber-500/50',
    tag: 'Full Master Access',
    desc: 'Unrestricted master access across all portal modules, security, staff management, and database records.',
    permissions: [
      'Manage Staff & Roles',
      'Full Financial & Ledger Access',
      'Create & Edit Projects',
      'Manage Investors & KYC',
      'Investor Queries Resolution'
    ]
  },
  admin: {
    label: 'Admin',
    badge: 'ADMIN',
    icon: Shield,
    color: 'text-red-400',
    bg: 'bg-red-500/15',
    border: 'border-red-500/30',
    ring: 'ring-red-500/50',
    tag: 'Administrative Staff',
    desc: 'Administrative access for project coordination, inquiry responses, and investor management.',
    permissions: [
      'Project Coordination',
      'Investor Queries Resolution',
      'Site Progress Tracking'
    ]
  },
  site_manager: {
    label: 'Site Engineer',
    badge: 'SITE ENGINEER',
    icon: Hammer,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
    ring: 'ring-emerald-500/50',
    tag: 'Construction Lead',
    desc: 'Construction lifecycle lead. Manages milestones, photo/video site progress logs, and CCTV cameras.',
    permissions: [
      'Project Milestones & Phases',
      'Post Site Photo/Video Updates',
      'Configure Live CCTV Stream',
      'Respond to Technical Queries'
    ]
  },
  financial_officer: {
    label: 'Financial Officer',
    badge: 'FINANCIAL OFFICER',
    icon: IndianRupee,
    color: 'text-purple-400',
    bg: 'bg-purple-500/15',
    border: 'border-purple-500/30',
    ring: 'ring-purple-500/50',
    tag: 'Capital & Audit',
    desc: 'Capital management & auditing. Controls investment ledger, receipts, invoices, and investor allocations.',
    permissions: [
      'Investment Ledger & Sub-investments',
      'Record Payments & Invoices',
      'Investor Portfolio Allotment',
      'Financial Analytics Audit'
    ]
  },
  marketing_manager: {
    label: 'Marketing & Sales',
    badge: 'MARKETING & SALES',
    icon: TrendingUp,
    color: 'text-rose-400',
    bg: 'bg-rose-500/15',
    border: 'border-rose-500/30',
    ring: 'ring-rose-500/50',
    tag: 'Public Relations',
    desc: 'Public relations and project marketing. Manages project showroom, announcements, and investor inquiries.',
    permissions: [
      'Project Showcase Presentation',
      'Publish Announcements',
      'Investor Query Communications'
    ]
  },
  support_agent: {
    label: 'Support Agent',
    badge: 'SUPPORT AGENT',
    icon: MessageCircle,
    color: 'text-blue-400',
    bg: 'bg-blue-500/15',
    border: 'border-blue-500/30',
    ring: 'ring-blue-500/50',
    tag: 'Inquiry Resolution',
    desc: 'Investor relations and inquiry resolution. Focused on providing fast, accurate query support.',
    permissions: [
      'Live Investor Query Management',
      'Dedicated Support Inbox',
      'Response Dispatch'
    ]
  },
};

export const STAFF_ROLES: Role[] = ['super_admin', 'senior_admin', 'admin', 'site_manager', 'financial_officer', 'marketing_manager', 'support_agent'];
