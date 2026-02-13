/**
 * Example usage of the Drizzle database for client credentials
 * 
 * This file demonstrates how to use the client repository functions
 * to manage client login credentials.
 */

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
} from './clientRepository.js';

async function main() {
  console.log('=== Drizzle Database Client Credentials Demo ===\n');

  // 1. Create a new client
  console.log('1. Creating a new client...');
  const newClient = await createClient({
    email: 'john.doe@example.com',
    password: 'securePassword123',
    firstName: 'John',
    lastName: 'Doe',
  });
  console.log('Created client:', newClient);
  console.log();

  // 2. Get client by email
  console.log('2. Getting client by email...');
  const foundClient = await getClientByEmail('john.doe@example.com');
  console.log('Found client:', foundClient);
  console.log();

  // 3. Verify client credentials
  console.log('3. Verifying client credentials...');
  const validLogin = await verifyClient('john.doe@example.com', 'securePassword123');
  console.log('Valid login:', validLogin.success);
  
  const invalidLogin = await verifyClient('john.doe@example.com', 'wrongPassword');
  console.log('Invalid login:', invalidLogin.success, '-', invalidLogin.message);
  console.log();

  // 4. Create a session
  console.log('4. Creating a session...');
  const session = await createSession(newClient.id);
  console.log('Created session:', session);
  console.log();

  // 5. Get session
  console.log('5. Getting session...');
  const foundSession = await getSession(session.sessionToken);
  console.log('Found session:', foundSession);
  console.log();

  // 6. Update client
  console.log('6. Updating client...');
  const updatedClient = await updateClient(newClient.id, {
    firstName: 'Johnny',
    lastName: 'Doe-Smith',
  });
  console.log('Updated client:', updatedClient);
  console.log();

  // 7. Get all clients
  console.log('7. Getting all clients...');
  const allClients = await getAllClients();
  console.log('All clients:', allClients);
  console.log();

  // 8. Deactivate client
  console.log('8. Deactivating client...');
  const deactivatedClient = await deactivateClient(newClient.id);
  console.log('Deactivated client:', deactivatedClient);
  console.log();

  // 9. Try to login with deactivated account
  console.log('9. Trying to login with deactivated account...');
  const deactivatedLogin = await verifyClient('john.doe@example.com', 'securePassword123');
  console.log('Deactivated login:', deactivatedLogin.success, '-', deactivatedLogin.message);
  console.log();

  // 10. Activate client
  console.log('10. Activating client...');
  const activatedClient = await activateClient(newClient.id);
  console.log('Activated client:', activatedClient);
  console.log();

  // 11. Delete session
  console.log('11. Deleting session...');
  await deleteSession(session.sessionToken);
  const deletedSession = await getSession(session.sessionToken);
  console.log('Session after deletion:', deletedSession);
  console.log();

  // 12. Delete client (cleanup)
  console.log('12. Deleting client (cleanup)...');
  await deleteClient(newClient.id);
  console.log('Client deleted successfully');
  console.log();

  console.log('=== Demo Complete ===');
}

main().catch(console.error);
