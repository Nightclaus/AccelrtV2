// your-project-name/api/get-data.js
import path from 'path';
import fs from 'fs/promises';

export default async function handler(req, res) {
  const jsonFilePath = path.join(process.cwd(), 'content.json');
  try {
    // Read the JSON file
    const jsonData = await fs.readFile(jsonFilePath, 'utf-8');
    const data = JSON.parse(jsonData);

    // Set CORS headers to allow requests from any origin (adjust for production)
    res.setHeader('Access-Control-Allow-Origin', '*'); // Or specify your frontend domain
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Send the JSON data as response
    res.status(200).json(data);
  } catch (error) {
    console.error('Error reading or parsing content.json:', error);
    res.status(500).json({ error: 'Failed to load content data.' });
  }
}