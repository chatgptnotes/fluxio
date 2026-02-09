# FlowNexus Test Credentials

## Development Test Account

### Login Credentials
- **Email:** test@flownexus.dev
- **Password:** test123456
- **Name:** Test User
- **User ID:** 40bce510-9034-4f67-9129-822f7b073d5f

### How to Use

#### Option 1: Dev Credentials Auto-Fill (Development Mode Only)
1. Ensure the app is running in development mode: `pnpm dev`
2. Navigate to http://localhost:3000/login
3. Look for the yellow button labeled "Fill Dev Credentials (test@flownexus.dev)"
4. Click the button to auto-fill the email and password fields
5. Click "Sign in"

#### Option 2: Manual Entry
1. Navigate to http://localhost:3000/login
2. Enter the credentials manually:
   - Email: test@flownexus.dev
   - Password: test123456
3. Click "Sign in"

### Features
- Email is auto-confirmed (no verification email needed)
- Works in both development and production environments
- Has full access to dashboard and profile features

### Creating Additional Test Users

To create the test user account in your Supabase database, run:

```bash
node scripts/create-test-user.mjs
```

This script:
- Checks if the test user already exists
- Creates the user if it doesn't exist
- Auto-confirms the email address
- Sets up user metadata with full name

### Troubleshooting

**"Invalid login credentials" error:**
- Ensure the test user has been created by running the setup script above
- Verify your Supabase environment variables are correctly configured in `.env`

**Dev credentials button not showing:**
- Verify you're running in development mode (`pnpm dev`, not `pnpm build`)
- Hard refresh the page (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
- Check browser console for any errors

**Can't access dashboard after login:**
- Check that middleware.ts is properly configured
- Verify Supabase session is being created successfully
- Check browser console and terminal for errors

### Security Note
The dev credentials auto-fill feature is only visible when `NODE_ENV === 'development'`. It will not appear in production builds, ensuring test credentials are not exposed to end users.

---

**Created:** January 9, 2026
**Last Updated:** January 9, 2026
**Version:** 1.0
