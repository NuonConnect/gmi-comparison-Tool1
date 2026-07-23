// Netlify Function for TOB Templates Storage
// Location: netlify/functions/tob-templates.js
import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    const store = getStore({
      name: 'gmi-tob-templates',
      consistency: 'strong'
    });
    
    const BLOB_KEY = 'all-tob-templates';

    if (req.method === 'GET') {
      try {
        const data = await store.get(BLOB_KEY, { type: 'json' });
        return new Response(JSON.stringify(data || []), { status: 200, headers });
      } catch (error) {
        return new Response(JSON.stringify([]), { status: 200, headers });
      }
    }

    if (req.method === 'POST') {
      const templates = await req.json();
      
      if (!Array.isArray(templates)) {
        return new Response(JSON.stringify({ error: 'Invalid data format' }), { status: 400, headers });
      }

      await store.setJSON(BLOB_KEY, templates);
      return new Response(JSON.stringify({ success: true, count: templates.length }), { status: 200, headers });
    }

    if (req.method === 'DELETE') {
      const { id } = await req.json();
      
      let templates = [];
      try {
        templates = await store.get(BLOB_KEY, { type: 'json' }) || [];
      } catch (e) {
        templates = [];
      }

      const updatedTemplates = templates.filter(t => t.id !== id);
      await store.setJSON(BLOB_KEY, updatedTemplates);
      
      return new Response(JSON.stringify({ success: true }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });

  } catch (error) {
    console.error('TOB Templates Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers });
  }
};

export const config = {
  path: "/api/tob-templates"
};