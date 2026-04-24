/**
 * Create ambassador admin via API (requires an existing admin to be logged in)
 * This is an alternative if direct DB access isn't working
 */
import axios from 'axios';

const API_URL = 'http://localhost:3000';

async function createViaAPI() {
  console.log('This script requires you to be logged in as an admin first.');
  console.log('Please provide admin credentials:\n');
  
  // For now, just show instructions
  console.log('To create an ambassador admin user:');
  console.log('1. Log in to your app as a regular admin');
  console.log('2. Go to the Users page');
  console.log('3. Register a new user with role "ambassador_admin"');
  console.log('\nOR\n');
  console.log('Make sure your backend is running and try:');
  console.log('  npm run seed:admin  (to create a regular admin first)');
  console.log('Then use that admin to create the ambassador admin via the UI');
}

createViaAPI();
