// Database utilities using Netlify Blobs API
// This replaces supabaseDb.js

// Save a new comparison
export const saveComparison = async (comparisonData) => {
  try {
    // Get existing comparisons
    const response = await fetch('/api/comparisons');
    let comparisons = [];
    if (response.ok) {
      comparisons = await response.json();
    }

    // Create new comparison
    const newComparison = {
      id: Date.now().toString(),
      ...comparisonData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Add to list
    comparisons.push(newComparison);

    // Save back
    const saveResponse = await fetch('/api/comparisons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comparisons)
    });

    if (saveResponse.ok) {
      return { success: true, data: newComparison };
    } else {
      return { success: false, error: 'Failed to save' };
    }
  } catch (error) {
    console.error('Save comparison error:', error);
    return { success: false, error: error.message };
  }
};

// Update an existing comparison
export const updateComparison = async (id, comparisonData) => {
  try {
    const response = await fetch('/api/comparisons');
    let comparisons = [];
    if (response.ok) {
      comparisons = await response.json();
    }

    // Find and update
    const index = comparisons.findIndex(c => c.id === id);
    if (index === -1) {
      return { success: false, error: 'Comparison not found' };
    }

    comparisons[index] = {
      ...comparisons[index],
      ...comparisonData,
      updated_at: new Date().toISOString()
    };

    // Save back
    const saveResponse = await fetch('/api/comparisons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comparisons)
    });

    if (saveResponse.ok) {
      return { success: true, data: comparisons[index] };
    } else {
      return { success: false, error: 'Failed to update' };
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

// Delete a comparison
export const deleteComparison = async (id) => {
  try {
    const response = await fetch('/api/comparisons');
    let comparisons = [];
    if (response.ok) {
      comparisons = await response.json();
    }

    // Filter out the deleted comparison
    const filtered = comparisons.filter(c => c.id !== id);

    // Save back
    const saveResponse = await fetch('/api/comparisons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(filtered)
    });

    if (saveResponse.ok) {
      return { success: true };
    } else {
      return { success: false, error: 'Failed to delete' };
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