/**
 * Backend API Server for TaskFlow Pro
 * Handles authentication using Drizzle ORM with SQLite
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  createClient,
  getClientByEmail,
  getClientById,
  verifyClient,
  updateClient,
  deleteClient,
  deactivateClient,
  activateClient,
  getAllClients,
  createSession,
  getSession,
  deleteSession,
  deleteAllClientSessions,
} from './db/clientRepository.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - Enable CORS for all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(rootDir, 'public')));

// ==================== Auth API Routes ====================

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, username } = req.body;

    // Check if email already exists
    const existingUser = await getClientByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    // Create client in database
    const client = await createClient({
      email,
      password,
      firstName: firstName || username,
      lastName: lastName || '',
    });

    // Create session
    const session = await createSession(client.id);

    res.json({
      success: true,
      message: 'Registration successful',
      user: {
        id: client.id,
        email: client.email,
        username: client.firstName,
        firstName: client.firstName,
        lastName: client.lastName,
        createdAt: client.createdAt,
      },
      sessionToken: session.sessionToken,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
    });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await verifyClient(email, password);

    if (!result.success) {
      return res.status(401).json({
        success: false,
        message: result.message,
      });
    }

    // Create session
    const session = await createSession(result.client.id);

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: result.client.id,
        email: result.client.email,
        username: result.client.firstName,
        firstName: result.client.firstName,
        lastName: result.client.lastName,
        createdAt: result.client.createdAt,
      },
      sessionToken: session.sessionToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
    });
  }
});

// Logout
app.post('/api/auth/logout', async (req, res) => {
  try {
    const { sessionToken } = req.body;

    if (sessionToken) {
      await deleteSession(sessionToken);
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
    });
  }
});

// Get current user (validate session)
app.get('/api/auth/me', async (req, res) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: 'No session token provided',
      });
    }

    const session = await getSession(sessionToken);

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session',
      });
    }

    const client = await getClientById(session.clientId);

    if (!client) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      user: {
        id: client.id,
        email: client.email,
        username: client.firstName,
        firstName: client.firstName,
        lastName: client.lastName,
        createdAt: client.createdAt,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user',
    });
  }
});

// Update user profile
app.put('/api/auth/profile', async (req, res) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');
    const { firstName, lastName, password } = req.body;

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: 'No session token provided',
      });
    }

    const session = await getSession(sessionToken);

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session',
      });
    }

    const updates = {};
    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (password) updates.password = password;

    const updatedClient = await updateClient(session.clientId, updates);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedClient.id,
        email: updatedClient.email,
        firstName: updatedClient.firstName,
        lastName: updatedClient.lastName,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
    });
  }
});

// Delete account
app.delete('/api/auth/account', async (req, res) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: 'No session token provided',
      });
    }

    const session = await getSession(sessionToken);

    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session',
      });
    }

    await deleteAllClientSessions(session.clientId);
    await deleteClient(session.clientId);

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account',
    });
  }
});

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(rootDir, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(rootDir, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(rootDir, 'public', 'register.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`\nAPI Endpoints:`);
  console.log(`  POST /api/auth/register - Register new user`);
  console.log(`  POST /api/auth/login    - Login user`);
  console.log(`  POST /api/auth/logout   - Logout user`);
  console.log(`  GET  /api/auth/me       - Get current user`);
  console.log(`  PUT  /api/auth/profile  - Update profile`);
  console.log(`  DELETE /api/auth/account - Delete account`);
});
