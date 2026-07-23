// Netlify Function for Custom Companies Cloud Storage
// Uses Netlify Blobs for persistent storage across all users

import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    // Initialize the blob store
    const store = getStore({
      name: 'gmi-custom-companies',
      siteID: context.site.id,
      token: context.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_BLOBS_TOKEN
    });

    const BLOB_KEY = 'all-custom-companies';

    if (req.method === 'GET') {
      // Fetch all custom companies from cloud
      try {
        const data = await store.get(BLOB_KEY, { type: 'json' });
        return new Response(JSON.stringify(data || []), { status: 200, headers });
      } catch (error) {
        // Return empty array if no data exists yet
        return new Response(JSON.stringify([]), { status: 200, headers });
      }
    }

    if (req.method === 'POST') {
      // Save custom companies to cloud
      const companies = await req.json();
      
      // Validate data
      if (!Array.isArray(companies)) {
        return new Response(
          JSON.stringify({ error: 'Invalid data format. Expected an array.' }),
          { status: 400, headers }
        );
      }

      // Save to blob storage
      await store.setJSON(BLOB_KEY, companies);

      return new Response(
        JSON.stringify({ success: true, count: companies.length }),
        { status: 200, headers }
      );
    }

    // Method not allowed
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers }
    );

  } catch (error) {
    console.error('Custom Companies API Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers }
    );
  }
};

export const config = {
  path: "/api/custom-companies"
};