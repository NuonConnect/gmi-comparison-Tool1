import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Data directory
const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper functions
const readJsonFile = (filename) => {
  const filePath = path.join(DATA_DIR, filename);
  if (fs.existsSync(filePath)) {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  }
  return [];
};

const writeJsonFile = (filename, data) => {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// ============================================
// COMPARISONS API
// ============================================

// GET all comparisons
app.get('/api/comparisons', (req, res) => {
  try {
    const comparisons = readJsonFile('comparisons.json');
    res.json(comparisons);
  } catch (error) {
    console.error('Error reading comparisons:', error);
    res.status(500).json({ error: 'Failed to read comparisons' });
  }
});

// POST save comparisons
app.post('/api/comparisons', (req, res) => {
  try {
    const body = req.body;

    // Granular operations (upsert / delete) do the read-modify-write on the
    // server. Node is single-threaded and these handlers are synchronous, so
    // concurrent saves no longer clobber each other's comparison.
    if (body && !Array.isArray(body) && body.action) {
      let comparisons = readJsonFile('comparisons.json');
      if (!Array.isArray(comparisons)) comparisons = [];

      if (body.action === 'upsert') {
        const incoming = body.comparison;
        if (!incoming || incoming.id == null) {
          return res.status(400).json({ error: 'upsert requires a comparison with an id' });
        }
        const idx = comparisons.findIndex(c => String(c.id) === String(incoming.id));
        if (idx === -1) {
          comparisons.push(incoming);
        } else {
          comparisons[idx] = { ...comparisons[idx], ...incoming };
        }
        writeJsonFile('comparisons.json', comparisons);
        const saved = idx === -1 ? incoming : comparisons[idx];
        return res.json({ success: true, data: saved, count: comparisons.length });
      }

      if (body.action === 'delete') {
        if (body.id == null) {
          return res.status(400).json({ error: 'delete requires an id' });
        }
        const filtered = comparisons.filter(c => String(c.id) !== String(body.id));
        writeJsonFile('comparisons.json', filtered);
        return res.json({ success: true, count: filtered.length });
      }

      return res.status(400).json({ error: 'Unknown action: ' + body.action });
    }

    // Legacy contract: full array overwrite.
    if (!Array.isArray(body)) {
      return res.status(400).json({ error: 'Invalid data format. Expected an array or an action.' });
    }
    writeJsonFile('comparisons.json', body);
    res.json({ success: true, count: body.length });
  } catch (error) {
    console.error('Error saving comparisons:', error);
    res.status(500).json({ error: 'Failed to save comparisons' });
  }
});

// DELETE a comparison
app.delete('/api/comparisons', (req, res) => {
  try {
    const { id } = req.query;
    const comparisons = readJsonFile('comparisons.json');
    const filtered = comparisons.filter(item => item.id !== parseInt(id) && item.id !== id);
    writeJsonFile('comparisons.json', filtered);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting comparison:', error);
    res.status(500).json({ error: 'Failed to delete comparison' });
  }
});

// ============================================
// CUSTOM COMPANIES API
// ============================================

// GET all custom companies
app.get('/api/custom-companies', (req, res) => {
  try {
    const companies = readJsonFile('custom-companies.json');
    res.json(companies);
  } catch (error) {
    console.error('Error reading custom companies:', error);
    res.status(500).json({ error: 'Failed to read custom companies' });
  }
});

// POST save custom companies
app.post('/api/custom-companies', (req, res) => {
  try {
    const companies = req.body;
    writeJsonFile('custom-companies.json', companies);
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving custom companies:', error);
    res.status(500).json({ error: 'Failed to save custom companies' });
  }
});

// DELETE a custom company
app.delete('/api/custom-companies', (req, res) => {
  try {
    const { id } = req.query;
    const companies = readJsonFile('custom-companies.json');
    const filtered = companies.filter(item => item.id !== parseInt(id) && item.id !== id);
    writeJsonFile('custom-companies.json', filtered);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting custom company:', error);
    res.status(500).json({ error: 'Failed to delete custom company' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ GMI API Server running on http://localhost:${PORT}`);
  console.log(`📁 Data stored in: ${DATA_DIR}`);
});