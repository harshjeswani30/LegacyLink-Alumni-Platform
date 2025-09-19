-- Create RPC function to check auth.users table
-- This allows us to query the auth.users table from the client
CREATE OR REPLACE FUNCTION get_auth_users_by_email(email_param TEXT)
RETURNS TABLE(
  id UUID,
  email TEXT,
  email_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email::TEXT,
    au.email_confirmed_at,
    au.created_at
  FROM auth.users au
  WHERE LOWER(au.email) = LOWER(email_param);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_auth_users_by_email(TEXT) TO authenticated;

-- Create function to sync missing profiles
CREATE OR REPLACE FUNCTION sync_missing_profiles()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  action TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH auth_users_without_profiles AS (
    SELECT 
      au.id,
      au.email,
      au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    WHERE p.id IS NULL
      AND au.email_confirmed_at IS NOT NULL
  )
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    verified
  )
  SELECT 
    awp.id,
    awp.email,
    COALESCE(
      awp.raw_user_meta_data->>'full_name',
      SPLIT_PART(awp.email, '@', 1)
    ) as full_name,
    COALESCE(
      awp.raw_user_meta_data->>'role',
      'alumni'
    ) as role,
    false as verified
  FROM auth_users_without_profiles awp
  RETURNING 
    id as user_id,
    email,
    'created' as action;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION sync_missing_profiles() TO authenticated;

-- Create function to get comprehensive user info
CREATE OR REPLACE FUNCTION get_user_comprehensive_info(email_param TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'auth_user', (
      SELECT json_build_object(
        'id', au.id,
        'email', au.email,
        'email_confirmed_at', au.email_confirmed_at,
        'created_at', au.created_at,
        'last_sign_in_at', au.last_sign_in_at,
        'user_metadata', au.raw_user_meta_data
      )
      FROM auth.users au
      WHERE LOWER(au.email) = LOWER(email_param)
      LIMIT 1
    ),
    'profile', (
      SELECT json_build_object(
        'id', p.id,
        'email', p.email,
        'full_name', p.full_name,
        'role', p.role,
        'verified', p.verified,
        'created_at', p.created_at,
        'university_id', p.university_id
      )
      FROM public.profiles p
      WHERE LOWER(p.email) = LOWER(email_param)
      LIMIT 1
    ),
    'university', (
      SELECT json_build_object(
        'id', u.id,
        'name', u.name,
        'domain', u.domain
      )
      FROM public.universities u
      INNER JOIN public.profiles p ON u.id = p.university_id
      WHERE LOWER(p.email) = LOWER(email_param)
      LIMIT 1
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_comprehensive_info(TEXT) TO authenticated;