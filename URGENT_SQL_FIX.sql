-- COPY THIS EXACT SQL AND RUN IT IN SUPABASE DASHBOARD SQL EDITOR
-- This will fix the auto-verification issue

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