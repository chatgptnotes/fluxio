/**
 * Setup script to initialize the user management system
 * This creates the necessary tables and seeds the superadmin user
 *
 * Run with: npx tsx scripts/setup-users.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dzmiisuxwruoeklbkyzc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupUserManagement() {
  console.log('Setting up user management system...\n');

  try {
    // Check if superadmin user exists
    console.log('1. Checking for existing superadmin user...');
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'buzzlightyear_42')
      .single();

    if (existingUser) {
      console.log('   Superadmin user already exists.');

      // Update password hash if not set
      if (!existingUser.password_hash) {
        console.log('   Updating password hash...');
        const passwordHash = await bcrypt.hash('Lightyear@123', 12);

        await supabase
          .from('users')
          .update({
            password_hash: passwordHash,
            is_superadmin: true,
            permissions: { all: true, canCreateUsers: true, canManagePermissions: true, canAccessAllPipelines: true }
          })
          .eq('id', existingUser.id);

        console.log('   Password hash updated.');
      }
    } else {
      console.log('   Creating superadmin user...');

      // Hash the password
      const passwordHash = await bcrypt.hash('Lightyear@123', 12);

      // Insert superadmin user
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          username: 'buzzlightyear_42',
          email: 'superadmin@flownexus.com',
          full_name: 'Super Administrator',
          role: 'admin',
          is_superadmin: true,
          password_hash: passwordHash,
          permissions: { all: true, canCreateUsers: true, canManagePermissions: true, canAccessAllPipelines: true },
          is_active: true
        })
        .select()
        .single();

      if (insertError) {
        console.error('   Error creating superadmin:', insertError.message);

        // Try updating existing user by email
        if (insertError.message.includes('duplicate')) {
          console.log('   User exists by email, updating...');
          const { error: updateError } = await supabase
            .from('users')
            .update({
              username: 'buzzlightyear_42',
              is_superadmin: true,
              password_hash: passwordHash,
              permissions: { all: true, canCreateUsers: true, canManagePermissions: true, canAccessAllPipelines: true }
            })
            .eq('email', 'superadmin@flownexus.com');

          if (updateError) {
            console.error('   Failed to update user:', updateError.message);
          } else {
            console.log('   User updated successfully.');
          }
        }
      } else {
        console.log('   Superadmin user created successfully!');
        console.log('   User ID:', newUser?.id);
      }
    }

    console.log('\n2. Verifying user columns exist...');
    // Check if new columns exist by querying the user
    const { data: verifyUser, error: verifyError } = await supabase
      .from('users')
      .select('id, username, email, role, is_superadmin, permissions, password_hash')
      .eq('username', 'buzzlightyear_42')
      .single();

    if (verifyError) {
      console.log('   Some columns may be missing. Please run the migration SQL in Supabase dashboard.');
      console.log('   Migration file: supabase/migrations/20260201000000_user_management.sql');
    } else {
      console.log('   User verified:', {
        id: verifyUser.id,
        username: verifyUser.username,
        email: verifyUser.email,
        role: verifyUser.role,
        is_superadmin: verifyUser.is_superadmin,
        has_password: !!verifyUser.password_hash
      });
    }

    console.log('\n=================================');
    console.log('Setup complete!');
    console.log('=================================');
    console.log('\nYou can now log in with:');
    console.log('  Username: buzzlightyear_42');
    console.log('  Password: Lightyear@123');
    console.log('\nTest at: http://localhost:3005/login');

  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
}

setupUserManagement();
