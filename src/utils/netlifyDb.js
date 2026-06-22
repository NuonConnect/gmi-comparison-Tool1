// Database utilities using Netlify Blobs API
// This replaces supabaseDb.js

// Save a new comparison.
// Uses a server-side upsert (no client-side read-modify-write) so concurrent
// saves from different users can no longer overwrite each other.
export const saveComparison = async (comparisonData, user) => {
  try {
    const newComparison = {
      id: Date.now().toString(),
      ...comparisonData,
      user_id: user?.id || null,
      user_email: user?.email || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const saveResponse = await fetch('/api/comparisons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upsert', comparison: newComparison })
    });

    if (saveResponse.ok) {
      return { success: true, data: newComparison };
    } else {
      return { success: false, error: 'Failed to save (HTTP ' + saveResponse.status + ')' };
    }
  } catch (error) {
    console.error('Save comparison error:', error);
    return { success: false, error: error.message };
  }
};

// Update an existing comparison.
// Server-side upsert merges the changed fields into the stored record, so only
// this comparison is touched (no whole-array overwrite, no lost updates).
export const updateComparison = async (id, comparisonData, user) => {
  try {
    const incoming = {
      id,
      ...comparisonData,
      updated_at: new Date().toISOString()
    };
    // Only override identity fields when we actually have them; otherwise the
    // server merge keeps the existing values.
    if (user?.id) incoming.user_id = user.id;
    if (user?.email) incoming.user_email = user.email;

    const saveResponse = await fetch('/api/comparisons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upsert', comparison: incoming })
    });

    if (saveResponse.ok) {
      const result = await saveResponse.json().catch(() => ({}));
      return { success: true, data: result.data || incoming };
    } else {
      return { success: false, error: 'Failed to update (HTTP ' + saveResponse.status + ')' };
    }
  } catch (error) {
    console.error('Update comparison error:', error);
    return { success: false, error: error.message };
  }
};

// Get comparisons for a specific user
export const getUserComparisons = async (userId) => {
  try {
    const response = await fetch('/api/comparisons');
    if (response.ok) {
      const comparisons = await response.json();
      // Filter by user if userId provided, otherwise return all
      if (userId) {
        return comparisons.filter(c => c.user_id === userId);
      }
      return comparisons;
    }
    return [];
  } catch (error) {
    console.error('Get user comparisons error:', error);
    return [];
  }
};

// Get all comparisons (for admin)
export const getAllComparisons = async () => {
  try {
    const response = await fetch('/api/comparisons');
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch (error) {
    console.error('Get all comparisons error:', error);
    return [];
  }
};

// Delete a comparison (server-side filter, no whole-array overwrite).
export const deleteComparison = async (id) => {
  try {
    const saveResponse = await fetch('/api/comparisons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id })
    });

    if (saveResponse.ok) {
      return { success: true };
    } else {
      return { success: false, error: 'Failed to delete (HTTP ' + saveResponse.status + ')' };
    }
  } catch (error) {
    console.error('Delete comparison error:', error);
    return { success: false, error: error.message };
  }
};

// Log activity
export const logActivity = async (activityData) => {
  try {
    // Get existing logs
    const response = await fetch('/api/activity-logs');
    let logs = [];
    if (response.ok) {
      logs = await response.json();
    }

    // Add new log
    const newLog = {
      id: Date.now().toString(),
      ...activityData,
      created_at: new Date().toISOString()
    };
    logs.push(newLog);

    // Keep only last 1000 logs
    if (logs.length > 1000) {
      logs = logs.slice(-1000);
    }

    // Save back
    await fetch('/api/activity-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logs)
    });

    return { success: true };
  } catch (error) {
    console.error('Log activity error:', error);
    return { success: false };
  }
};

// Get all activity logs (for admin)
export const getAllActivityLogs = async () => {
  try {
    const response = await fetch('/api/activity-logs');
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch (error) {
    console.error('Get activity logs error:', error);
    return [];
  }
};