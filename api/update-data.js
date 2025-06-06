// root/api/update-data.js

import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const serviceAccountBase64 = process.env.FIRESTORE_SERVICE_ACCOUNT_BASE64;
    if (!serviceAccountBase64) {
      throw new Error('FIRESTORE_SERVICE_ACCOUNT_BASE64 environment variable is not set.');
    }
    const serviceAccountString = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
    const serviceAccount = JSON.parse(serviceAccountString);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error) {
    console.error('Firebase Ad min SDK initialization error:', error);
    throw new Error(`Firebase Admin SDK initialization failed: ${error.message}`);
  }
}

const db = admin.firestore();
const COLLECTION_NAME = 'document_data'; // Your Firestore collection name
const DOCUMENT_ID = 'active';          // The ID of the document to update/override

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*'); // Adjust for production
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key'); 

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.UPDATE_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const incomingData = req.body; // Vercel automatically parses JSON body

    const date = new Date();
    const options = { 
        timeZone: 'Australia/Sydney', 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
    };

    const parts = new Intl.DateTimeFormat('en-AU', options).formatToParts(date);

    // Extract components
    const getPart = (type) => parts.find(p => p.type === type)?.value || '00';

    const year = getPart('year');
    const month = getPart('month');
    const day = getPart('day');
    const hour = getPart('hour');
    const minute = getPart('minute');

    const formatted = `${year}-${month}-${day} ${hour}:${minute}`;

    // Correct: Assign an object, not a number
    incomingData["timestamp (automatic)"] = {
    "timestamp of last update":  Date.now(),
    "formatted timestamp (AEST)": formatted
    };

    if (!incomingData || typeof incomingData !== 'object' || Object.keys(incomingData).length === 0) {
      return res.status(400).json({ error: 'Invalid or empty JSON payload in request body.' });
    }

    const docRef = db.collection(COLLECTION_NAME).doc(DOCUMENT_ID);
    const changeLogs = db.collection("change_logs")
    const updateLog = changeLogs.doc();
    
    await updateLog.set(incomingData);
    await docRef.set(incomingData, { merge: false }); // Complete overide
    console.log(incomingData);

    res.status(200).json({ message: `Document '${DOCUMENT_ID}' in collection '${COLLECTION_NAME}' has been successfully set/overridden.` });

  } catch (error) {
    console.error('Error updating data in Firestore:', error);
    // Check if the error is due to SDK initialization failure from the top block
    if (error.message.startsWith('Firebase Admin SDK initialization failed')) {
        return res.status(500).json({ error: 'Server configuration error.', details: error.message });
    }
    res.status(500).json({ error: 'Failed to update data in Firestore.', details: error.message });
  }
}