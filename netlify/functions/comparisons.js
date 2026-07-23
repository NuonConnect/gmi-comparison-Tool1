// Netlify Function for GMI Comparisons Cloud Storage
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
    // Initialize the blob store - simplified syntax
    const store = getStore({
      name: 'gmi-comparisons',
      consistency: 'strong'
    });
    
    const BLOB_KEY = 'all-comparisons';

    if (req.method === 'GET') {
      console.log('GET request - Fetching comparisons');
      
      try {
        const data = await store.get(BLOB_KEY, { type: 'json' });
        console.log('Fetched comparisons:', data ? data.length : 0);
        return new Response(JSON.stringify(data || []), { status: 200, headers });
      } catch (error) {
        console.log('No existing data, returning empty array');
        return new Response(JSON.stringify([]), { status: 200, headers });
      }
    }

    if (req.method === 'POST') {
      const body = await req.json();

      // Granular operations (upsert / delete) do the read-modify-write on the
      // SERVER so two clients saving at the same time can no longer clobber each
      // other's comparison (the old contract had the client send the whole array).
      if (body && !Array.isArray(body) && body.action) {
        let comparisons = [];
        try {
          comparisons = (await store.get(BLOB_KEY, { type: 'json' })) || [];
        } catch (e) {
          comparisons = [];
        }
        if (!Array.isArray(comparisons)) comparisons = [];

        if (body.action === 'upsert') {
          const incoming = body.comparison;
          if (!incoming || incoming.id == null) {
            return new Response(
              JSON.stringify({ error: 'upsert requires a comparison with an id' }),
              { status: 400, headers }
            );
          }
          const idx = comparisons.findIndex(c => String(c.id) === String(incoming.id));
          if (idx === -1) {
            comparisons.push(incoming);
          } else {
            // Merge so callers can send only changed fields (matches updateComparison).
            comparisons[idx] = { ...comparisons[idx], ...incoming };
          }
          await store.setJSON(BLOB_KEY, comparisons);
          const saved = idx === -1 ? incoming : comparisons[idx];
          return new Response(
            JSON.stringify({ success: true, data: saved, count: comparisons.length }),
            { status: 200, headers }
          );
        }

        if (body.action === 'delete') {
          if (body.id == null) {
            return new Response(
              JSON.stringify({ error: 'delete requires an id' }),
              { status: 400, headers }
            );
          }
          const filtered = comparisons.filter(c => String(c.id) !== String(body.id));
          await store.setJSON(BLOB_KEY, filtered);
          return new Response(
            JSON.stringify({ success: true, count: filtered.length }),
            { status: 200, headers }
          );
        }

        return new Response(
          JSON.stringify({ error: 'Unknown action: ' + body.action }),
          { status: 400, headers }
        );
      }

      // Legacy contract: client sends the full array, server overwrites.
      const comparisons = body;
      if (!Array.isArray(comparisons)) {
        return new Response(
          JSON.stringify({ error: 'Invalid data format. Expected an array or an action.' }),
          { status: 400, headers }
        );
      }

      console.log('Saving', comparisons.length, 'comparisons (full array)');
      await store.setJSON(BLOB_KEY, comparisons);

      return new Response(
        JSON.stringify({ success: true, count: comparisons.length }),
        { status: 200, headers }
      );
    }

    // Method not allowed
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers }
    );

  } catch (error) {
    console.error('Comparisons API Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers }
    );
  }
};

export const config = {
  path: "/api/comparisons"
};