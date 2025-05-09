const { db } = require('../config');
const { doc, getDoc, updateDoc } = require('firebase/firestore');

/**
 * Script to promote a user to admin role
 * Run this script with: node setupAdmin.js <userId>
 */

async function promoteToAdmin(userId) {
  if (!userId) {
    console.error('Error: User ID is required');
    console.log('Usage: node setupAdmin.js <userId>');
    process.exit(1);
  }

  try {
    // Verify user exists
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.error(`Error: User with ID ${userId} does not exist`);
      process.exit(1);
    }

    const userData = userSnap.data();
    console.log(`Found user: ${userData.name} (${userData.email})`);

    // Update user role
    await updateDoc(userRef, {
      role: 'admin',
      updatedAt: new Date().toISOString()
    });

    console.log(`✅ Successfully promoted ${userData.name} to admin role`);
    console.log('This user can now access the admin dashboard at /admin');
  } catch (error) {
    console.error('Error promoting user to admin:', error);
    process.exit(1);
  }
}

// Get userId from command line args
const userId = process.argv[2];
promoteToAdmin(userId);
