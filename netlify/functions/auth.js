// Netlify Function for User Authentication
// Location: netlify/functions/auth.js
import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
  }

  try {
    const { action, username, password, role } = await req.json();
    
    const store = getStore({
      name: 'gmi-users',
      consistency: 'strong'
    });

    // Get existing users
    let users = [];
    try {
      users = await store.get('all-users', { type: 'json' }) || [];
    } catch (e) {
      users = [];
    }

    // Initialize with default admin if no users exist
    if (users.length === 0) {
      users = [
        { id: 1, username: 'admin', password: 'admin123', role: 'Administrator' },
        { id: 2, username: 'user', password: 'user123', role: 'User' }
      ];
      await store.setJSON('all-users', users);
    }

    if (action === 'login') {
      const user = users.find(u => u.username === username && u.password === password);
      
      if (user) {
        return new Response(JSON.stringify({
          success: true,
          user: { id: user.id, username: user.username, role: user.role }
        }), { status: 200, headers });
      } else {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid username or password'
        }), { status: 401, headers });
      }
    }

    if (action === 'register') {
      const exists = users.find(u => u.username === username);
      if (exists) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Username already exists'
        }), { status: 400, headers });
      }

      const newUser = {
        id: Date.now(),
        username,
        password,
        role: role || 'User'
      };
      
      users.push(newUser);
      await store.setJSON('all-users', users);

      return new Response(JSON.stringify({
        success: true,
        user: { id: newUser.id, username: newUser.username, role: newUser.role }
      }), { status: 200, headers });
    }

    if (action === 'list') {
      return new Response(JSON.stringify({
        success: true,
        users: users.map(u => ({ id: u.id, username: u.username, role: u.role }))
      }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers });

  } catch (error) {
    console.error('Auth Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers });
  }
};

export const config = {
  path: "/api/auth"
};