// Supabase Database Helper Functions
// Location: src/utils/supabaseDb.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============ COMPARISONS ============

// Save a comparison
export const saveComparison = async (comparison, user) => {
  const { data, error } = await supabase
    .from('comparisons')
    .insert({
      user_id: user?.id,
      user_email: user?.email,
      created_by: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Unknown',
      company_name: comparison.companyName || comparison.companyInfo?.companyName,
      reference_number: comparison.referenceNumber,
      plans: comparison.plans,
      company_info: comparison.companyInfo,
      advisor_comment: comparison.advisorComment,
      highlighted_plan_id: comparison.highlightedPlanId,
      highlighted_items: comparison.highlightedItems,
      custom_fields: comparison.customFields,
      html_content: comparison.htmlContent,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update a comparison
export const updateComparison = async (id, comparison, user) => {
  const { data, error } = await supabase
    .from('comparisons')
    .update({
      company_name: comparison.companyName || comparison.companyInfo?.companyName,
      reference_number: comparison.referenceNumber,
      plans: comparison.plans,
      company_info: comparison.companyInfo,
      advisor_comment: comparison.advisorComment,
      highlighted_plan_id: comparison.highlightedPlanId,
      highlighted_items: comparison.highlightedItems,
      custom_fields: comparison.customFields,
      html_content: comparison.htmlContent,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Get all comparisons (for admin)
export const getAllComparisons = async () => {
  const { data, error } = await supabase
    .from('comparisons')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  // Transform to match expected format
  return (data || []).map(row => ({
    id: row.id,
    date: row.created_at,
    companyName: row.company_name,
    referenceNumber: row.reference_number,
    plans: row.plans,
    companyInfo: row.company_info,
    advisorComment: row.advisor_comment,
    highlightedPlanId: row.highlighted_plan_id,
    highlightedItems: row.highlighted_items,
    customFields: row.custom_fields,
    htmlContent: row.html_content,
    createdBy: row.created_by,
    createdByEmail: row.user_email,
    updatedAt: row.updated_at,
  }));
};

// Get comparisons for a specific user
export const getUserComparisons = async (userId) => {
  const { data, error } = await supabase
    .from('comparisons')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return (data || []).map(row => ({
    id: row.id,
    date: row.created_at,
    companyName: row.company_name,
    referenceNumber: row.reference_number,
    plans: row.plans,
    companyInfo: row.company_info,
    advisorComment: row.advisor_comment,
    highlightedPlanId: row.highlighted_plan_id,
    highlightedItems: row.highlighted_items,
    customFields: row.custom_fields,
    htmlContent: row.html_content,
    createdBy: row.created_by,
    createdByEmail: row.user_email,
  }));
};

// Delete a comparison
export const deleteComparison = async (id) => {
  const { error } = await supabase
    .from('comparisons')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};

// ============ ACTIVITY LOGS ============

// Log an activity
export const logActivity = async (user, action, details = {}) => {
  const { data, error } = await supabase
    .from('activity_logs')
    .insert({
      user_id: user?.id,
      user_email: user?.email,
      user_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Unknown',
      action,
      details,
    })
    .select()
    .single();

  if (error) {
    console.error('Error logging activity:', error);
    return null;
  }
  return data;
};

// Get all activity logs (for admin)
export const getAllActivityLogs = async () => {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(100);

  if (error) throw error;
  
  return (data || []).map(row => ({
    id: row.id,
    userId: row.user_id,
    email: row.user_email,
    userName: row.user_name,
    action: row.action,
    details: row.details,
    timestamp: row.timestamp,
  }));
};

// ============ TOB TEMPLATES ============

// Note: For TOB templates, we'll create a separate table if needed
// For now, we can store them in localStorage or create another table

export default supabase;