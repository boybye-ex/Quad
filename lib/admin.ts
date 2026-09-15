import { supabase } from './supabase';

export interface AdminStats {
  total_users: number;
  verified_users: number;
  suspended_users: number;
  total_listings: number;
  active_listings: number;
  hidden_listings: number;
  total_reports: number;
  pending_reports: number;
  resolved_reports: number;
  total_conversations: number;
  total_messages: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  is_verified: boolean;
  is_suspended: boolean;
  campus_id: string | null;
  campus_name: string | null;
  created_at: string;
  listing_count: number;
}

export interface AdminListing {
  id: string;
  title: string;
  price: number;
  status: string;
  seller_id: string;
  seller_name: string;
  seller_email: string;
  campus_name: string | null;
  category_name: string | null;
  created_at: string;
  report_count: number;
}

export interface AdminReport {
  id: string;
  reporter_id: string;
  reporter_name: string;
  reporter_email: string;
  target_type: 'listing' | 'user' | 'message';
  target_id: string;
  target_title: string;
  reason: string;
  description: string | null;
  status: 'pending' | 'resolved' | 'dismissed';
  resolved_by: string | null;
  resolver_name: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
}

export type ReportReason =
  | 'spam'
  | 'inappropriate'
  | 'scam'
  | 'harassment'
  | 'fake_listing'
  | 'prohibited_item'
  | 'other';

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'scam', label: 'Scam or fraud' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'fake_listing', label: 'Fake listing' },
  { value: 'prohibited_item', label: 'Prohibited item' },
  { value: 'other', label: 'Other' },
];

export async function getAdminStats(): Promise<AdminStats | null> {
  const { data, error } = await supabase.rpc('get_admin_stats');

  if (error) {
    console.error('Error fetching admin stats:', error);
    return null;
  }

  return data as AdminStats;
}

export async function getAdminUsers(
  limit = 50,
  offset = 0,
  status?: 'verified' | 'unverified' | 'suspended'
): Promise<AdminUser[]> {
  const { data, error } = await supabase.rpc('admin_get_users', {
    p_limit: limit,
    p_offset: offset,
    p_status: status || null,
  });

  if (error) {
    console.error('Error fetching admin users:', error);
    return [];
  }

  return data as AdminUser[];
}

export async function getAdminListings(
  limit = 50,
  offset = 0,
  status?: 'active' | 'hidden' | 'deleted'
): Promise<AdminListing[]> {
  const { data, error } = await supabase.rpc('admin_get_listings', {
    p_limit: limit,
    p_offset: offset,
    p_status: status || null,
  });

  if (error) {
    console.error('Error fetching admin listings:', error);
    return [];
  }

  return data as AdminListing[];
}

export async function getAdminReports(
  limit = 50,
  offset = 0,
  status?: 'pending' | 'resolved' | 'dismissed'
): Promise<AdminReport[]> {
  const { data, error } = await supabase.rpc('admin_get_reports', {
    p_limit: limit,
    p_offset: offset,
    p_status: status || null,
  });

  if (error) {
    console.error('Error fetching admin reports:', error);
    return [];
  }

  return data as AdminReport[];
}

export async function verifyUser(
  userId: string,
  verified: boolean
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.rpc('admin_verify_user', {
    p_user_id: userId,
    p_verified: verified,
  });

  if (error) {
    console.error('Error verifying user:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function suspendUser(
  userId: string,
  suspended: boolean
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.rpc('admin_suspend_user', {
    p_user_id: userId,
    p_suspended: suspended,
  });

  if (error) {
    console.error('Error suspending user:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function updateListingStatus(
  listingId: string,
  status: 'active' | 'hidden' | 'deleted'
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.rpc('admin_update_listing_status', {
    p_listing_id: listingId,
    p_status: status,
  });

  if (error) {
    console.error('Error updating listing status:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function resolveReport(
  reportId: string,
  status: 'resolved' | 'dismissed',
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.rpc('admin_resolve_report', {
    p_report_id: reportId,
    p_status: status,
    p_notes: notes || null,
  });

  if (error) {
    console.error('Error resolving report:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function createReport(
  targetType: 'listing' | 'user' | 'message',
  targetId: string,
  reason: ReportReason,
  description?: string
): Promise<{ reportId: string | null; error?: string }> {
  const { data, error } = await supabase.rpc('create_report', {
    p_target_type: targetType,
    p_target_id: targetId,
    p_reason: reason,
    p_description: description || null,
  });

  if (error) {
    console.error('Error creating report:', error);
    return { reportId: null, error: error.message };
  }

  return { reportId: data as string };
}

export async function checkIsAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return false;
  }

  return data.role === 'admin';
}
