# Fix Auto-Verification Issue

## Problem
New users are being automatically verified when they confirm their email, instead of requiring admin approval. This happens because the `handle_new_user()` function sets `verified` based on email confirmation status.

## Root Cause
In the `handle_new_user()` function, this line:
```sql
COALESCE(NEW.email_confirmed_at IS NOT NULL, false)
```

This automatically verifies users when their email is confirmed, bypassing admin approval.

## Solution

### Step 1: Update the Database Function
Go to your Supabase dashboard → SQL Editor and run this SQL:

```sql
-- Fix automatic verification issue
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Extract metadata from the new user
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        university_id,
        verified  -- This should ALWAYS be false for new users
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'alumni'),
        (NEW.raw_user_meta_data->>'university_id')::uuid,
        false  -- NEVER auto-verify - require admin approval
    );
    
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- Remove any email confirmation trigger that might auto-verify
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
```

### Step 2: (Optional) Unverify Recently Auto-Verified Users
If you want to unverify users who were recently auto-verified:

```sql
-- Check which users were auto-verified in the last 7 days
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.verified,
    p.created_at
FROM profiles p
WHERE p.verified = true 
  AND p.role IN ('alumni', 'student')
  AND p.created_at > NOW() - INTERVAL '7 days'
ORDER BY p.created_at DESC;

-- If you want to unverify them (run this after checking the above):
-- UPDATE profiles 
-- SET verified = false 
-- WHERE verified = true 
--   AND role IN ('alumni', 'student')
--   AND created_at > NOW() - INTERVAL '7 days';
```

## Verification Workflow After Fix
1. User signs up → Profile created with `verified = false`
2. User confirms email → Still `verified = false` 
3. User appears in admin verification queue
4. Admin manually verifies → `verified = true`

## Files Created
- `scripts/011_fix_auto_verification.sql` - The SQL fix
- `app/api/admin/fix-auto-verification/route.ts` - API endpoint for diagnosis
- `fix_auto_verification.js` - Browser console script with instructions