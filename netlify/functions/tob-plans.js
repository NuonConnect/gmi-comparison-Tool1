// Netlify Function for TOB Plans Cloud Storage
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
      name: 'gmi-tob-plans',
      consistency: 'strong'
    });

    const BLOB_KEY = 'all-tob-plans';

    if (req.method === 'GET') {
      console.log('GET request - Fetching TOB plans');
      
      const data = await store.get(BLOB_KEY, { type: 'json' });
      const tobPlans = data || [];
      
      console.log(`Retrieved ${tobPlans.length} TOB plans`);
      return new Response(JSON.stringify(tobPlans), { status: 200, headers });
    }

    if (req.method === 'POST') {
      console.log('POST request - Saving TOB plans');
      
      const tobPlans = await req.json();
      
      if (!Array.isArray(tobPlans)) {
        return new Response(
          JSON.stringify({ error: 'Invalid data format' }), 
          { status: 400, headers }
        );
      }

      await store.setJSON(BLOB_KEY, tobPlans);
      
      console.log(`Saved ${tobPlans.length} TOB plans`);
      return new Response(
        JSON.stringify({ success: true, count: tobPlans.length }), 
        { status: 200, headers }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }), 
      { status: 405, headers }
    );

  } catch (error) {
    console.error('TOB Plans API Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }), 
      { status: 500, headers }
    );
  }
};

export const config = {
  path: "/api/tob-plans"
};