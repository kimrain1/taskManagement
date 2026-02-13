import { db, clients, sessions } from './index.js';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

/**
 * Client Repository - Handles all database operations for client credentials
 */

// Create a new client
export async function createClient({ email, password, firstName, lastName }) {
  const hashedPassword = hashPassword(password);
  
  const result = await db.insert(clients).values({
    email,
    password: hashedPassword,
    firstName,
    lastName,
  }).returning();
  
  return result[0];
}

// Get client by email
export async function getClientByEmail(email) {
  const result = await db.select().from(clients).where(eq(clients.email, email));
  return result[0] || null;
}

// Get client by ID
export async function getClientById(id) {
  const result = await db.select().from(clients).where(eq(clients.id, id));
  return result[0] || null;
}

// Verify client credentials
export async function verifyClient(email, password) {
  const client = await getClientByEmail(email);
  
  if (!client) {
    return { success: false, message: 'Client not found' };
  }
  
  if (!client.isActive) {
    return { success: false, message: 'Account is deactivated' };
  }
  
  const hashedPassword = hashPassword(password);
  
  if (client.password !== hashedPassword) {
    return { success: false, message: 'Invalid password' };
  }
  
  // Update last login time
  await db.update(clients)
    .set({ lastLoginAt: new Date() })
    .where(eq(clients.id, client.id));
  
  return { success: true, client };
}

// Update client information
export async function updateClient(id, updates) {
  const updateData = { ...updates, updatedAt: new Date() };
  
  if (updates.password) {
    updateData.password = hashPassword(updates.password);
  }
  
  const result = await db.update(clients)
    .set(updateData)
    .where(eq(clients.id, id))
    .returning();
  
  return result[0];
}

// Delete client
export async function deleteClient(id) {
  await db.delete(clients).where(eq(clients.id, id));
}

// Deactivate client account
export async function deactivateClient(id) {
  const result = await db.update(clients)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(clients.id, id))
    .returning();
  
  return result[0];
}

// Activate client account
export async function activateClient(id) {
  const result = await db.update(clients)
    .set({ isActive: true, updatedAt: new Date() })
    .where(eq(clients.id, id))
    .returning();
  
  return result[0];
}

// Get all clients
export async function getAllClients() {
  return await db.select().from(clients);
}

// Session management
export async function createSession(clientId, expiresAt = null) {
  const sessionToken = generateSessionToken();
  const expiration = expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days default
  
  const result = await db.insert(sessions).values({
    clientId,
    sessionToken,
    expiresAt: expiration,
  }).returning();
  
  return result[0];
}

export async function getSession(sessionToken) {
  const result = await db.select()
    .from(sessions)
    .where(eq(sessions.sessionToken, sessionToken));
  
  const session = result[0];
  
  if (!session) {
    return null;
  }
  
  // Check if session is expired
  if (new Date() > session.expiresAt) {
    await deleteSession(sessionToken);
    return null;
  }
  
  return session;
}

export async function deleteSession(sessionToken) {
  await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));
}

export async function deleteAllClientSessions(clientId) {
  await db.delete(sessions).where(eq(sessions.clientId, clientId));
}

// Helper functions
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}
