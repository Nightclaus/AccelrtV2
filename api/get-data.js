// root/api/get-data.js
import admin from 'firebase-admin';

// --- Firebase Admin SDK Initialization ---
// This ensures SDK is initialized only once per function instance.
if (!admin.apps.length) {
  try {
    const serviceAccountBase64 = process.env.FIRESTORE_SERVICE_ACCOUNT_BASE64;
    if (!serviceAccountBase64) {
      throw new Error('FIRESTORE_SERVICE_ACCOUNT_BASE64 environment variable is not set for get-data function.');
    }
    const serviceAccountString = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
    const serviceAccount = JSON.parse(serviceAccountString);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin SDK initialized successfully for get-data.');
  } catch (error) {
    console.error('Firebase Admin SDK (get-data) initialization error:', error);
    throw new Error(`Firebase Admin SDK (get-data) initialization failed: ${error.message}`);
  }
}

const db = admin.firestore();
const COLLECTION_NAME = 'document_data';
const DOCUMENT_ID = 'active';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*'); // Adjust for production
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key'); 

  // Set Cache-Control headers to prevent/minimize caching if content updates frequently
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const apiKey = req.headers['X-API-KEY'];
  if (apiKey !== process.env.UPDATE_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }


  try {
    const docRef = db.collection(COLLECTION_NAME).doc(DOCUMENT_ID);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      console.log(`Document '${DOCUMENT_ID}' not found in '${COLLECTION_NAME}'.`);
      return res.status(404).json({ error: 'Content document not found.' });
    }

    const data = docSnap.data();

    // Send the JSON data from Firestore as response
    res.status(200).json(data);

  } catch (error) {
    console.error('Error fetching data from Firestore:', error);
     if (error.message.startsWith('Firebase Admin SDK (get-data) initialization failed')) {
        return res.status(500).json({ error: 'Server configuration error for get-data.', details: error.message });
    }
    res.status(500).json({ error: 'Failed to load content data from Firestore.', details: error.message });
  }
}