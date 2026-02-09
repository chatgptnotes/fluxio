#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
config({ path: join(__dirname, '../.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('\n===========================================')
console.log('FlowNexus - Create Test User')
console.log('===========================================\n')

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials in .env file\n')
  process.exit(1)
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function createTestUser() {
  const testEmail = 'test@flownexus.dev'
  const testPassword = 'test123456'
  const testName = 'Test User'

  console.log('📧 Creating test user account...')
  console.log(`   Email: ${testEmail}`)
  console.log(`   Password: ${testPassword}`)
  console.log(`   Name: ${testName}\n`)

  try {
    // Check if user already exists
    const { data: existingUsers, error: searchError } =
      await supabase.auth.admin.listUsers()

    if (!searchError && existingUsers) {
      const userExists = existingUsers.users.find(
        (u) => u.email === testEmail
      )

      if (userExists) {
        console.log('ℹ️  Test user already exists!')
        console.log(`   User ID: ${userExists.id}`)
        console.log(`   Created: ${new Date(userExists.created_at).toLocaleString()}\n`)
        console.log('✅ You can now log in with:')
        console.log(`   Email: ${testEmail}`)
        console.log(`   Password: ${testPassword}\n`)
        console.log('===========================================\n')
        return
      }
    }

    // Create new user
    const { data, error } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: testName,
      },
    })

    if (error) {
      console.error('❌ Error creating user:', error.message)
      console.error('\nPlease try manually:')
      console.error('1. Go to http://localhost:3000/signup')
      console.error('2. Click "Fill Dev Credentials" button')
      console.error('3. Check the terms checkbox')
      console.error('4. Click "Create account"\n')
      process.exit(1)
    }

    if (data.user) {
      console.log('✅ Test user created successfully!\n')
      console.log('User Details:')
      console.log(`   ID: ${data.user.id}`)
      console.log(`   Email: ${data.user.email}`)
      console.log(`   Name: ${data.user.user_metadata.full_name}`)
      console.log(`   Email Confirmed: Yes\n`)

      console.log('🎉 You can now log in with:')
      console.log(`   Email: ${testEmail}`)
      console.log(`   Password: ${testPassword}\n`)

      console.log('💡 Quick Login:')
      console.log('   1. Go to http://localhost:3000/login')
      console.log('   2. Click "Fill Dev Credentials" button')
      console.log('   3. Click "Sign in"\n')
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err.message)
    console.error('\nPlease create the account manually at:')
    console.error('http://localhost:3000/signup\n')
    process.exit(1)
  }

  console.log('===========================================\n')
}

createTestUser()
