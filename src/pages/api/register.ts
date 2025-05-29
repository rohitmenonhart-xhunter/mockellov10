import { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient, ServerApiVersion } from 'mongodb';

// MongoDB connection URI (should be in environment variables in production)
const uri = process.env.MONGODB_URI || "";

// Define the request body type
interface RequestBody {
  name: string;
  email: string;
  educationLevel: string;
  interestedRoles: string[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const body = req.body as RequestBody;

    // Validate request body
    if (!body.name || !body.email || !body.educationLevel || !body.interestedRoles) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    // Connect to MongoDB
    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });

    await client.connect();
    const db = client.db('aesthetic-ai-aura');
    const usersCollection = db.collection('users');

    // Check if user already exists
    const existingUser = await usersCollection.findOne({ email: body.email });
    if (existingUser) {
      await client.close();
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Insert the new user
    const result = await usersCollection.insertOne({
      name: body.name,
      email: body.email,
      educationLevel: body.educationLevel,
      interestedRoles: body.interestedRoles,
      createdAt: new Date()
    });

    await client.close();

    // Return success response
    return res.status(201).json({ 
      success: true, 
      message: 'User registered successfully',
      userId: result.insertedId 
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
} 
