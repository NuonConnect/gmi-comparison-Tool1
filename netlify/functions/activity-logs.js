// Netlify Function for Activity Logs Cloud Storage
// Uses Netlify Blobs for persistent storage across all users
import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    // Initialize the blob store
    const store = getStore({
      name: 'gmi-activity-logs',
      consistency: 'strong'
    });
    
    const BLOB_KEY = 'all-activity-logs';

    if (req.method === 'GET') {
      console.log('GET request - Fetching activity logs from blob store');
      
      try {
        const data = await store.get(BLOB_KEY, { type: 'json' });
        console.log('Fetched data:', data ? `${data.length} logs` : 'null');
        return new Response(JSON.stringify(data || []), { status: 200, headers });
      } catch (error) {
        console.log('No existing data, returning empty array');
        return new Response(JSON.stringify([]), { status: 200, headers });
      }
    }

    if (req.method === 'POST') {
      console.log('POST request - Saving activity log');
      
      const newLog = await req.json();
      
      // Get existing logs
      let existingLogs = [];
      try {
        existingLogs = await store.get(BLOB_KEY, { type: 'json' }) || [];
      } catch (error) {
        console.log('No existing logs found, starting fresh');
        existingLogs = [];
      }

      // If it's an array, replace all logs; if it's a single log, append it
      let updatedLogs;
      if (Array.isArray(newLog)) {
        updatedLogs = newLog;
      } else {
        // Add new log at the beginning
        updatedLogs = [newLog, ...existingLogs];
        // Keep only last 1000 logs
        updatedLogs = updatedLogs.slice(0, 1000);
      }

      console.log(`Saving ${updatedLogs.length} logs to blob store`);
      
      // Save to blob storage
      await store.setJSON(BLOB_KEY, updatedLogs);

      return new Response(
        JSON.stringify({ success: true, count: updatedLogs.length }),
        { status: 200, headers }
      );
    }

    // Method not allowed
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers }
    );

  } catch (error) {
    console.error('Activity Logs API Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers }
    );
  }
};

export const config = {
  path: "/api/activity-logs"
};