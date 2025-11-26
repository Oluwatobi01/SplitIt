
import { supabase } from './supabase';

export const signUpWithEmail = async (email: string, password: string, name: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      }
    }
  });

  if (error) {
    console.error("Signup Auth Error:", JSON.stringify(error));
    throw error;
  }

  // If user already exists but confirmed, data.user might be returned with empty identities or specific flags
  if (data.user && data.user.identities && data.user.identities.length === 0) {
      throw new Error("User already registered. Please login.");
  }

  if (data.user) {
    // Create or Update profile
    // We use upsert to handle cases where a profile might partially exist or previous attempt failed
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: data.user.id,
      name: name,
      handle: `@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      img: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0df2b9&color=10221e`,
      email: email
    }, { onConflict: 'id' });

    if (profileError) {
       // Check for missing table error during signup too
       if (profileError.code === '42P01' || profileError.code === 'PGRST205') {
           throw new Error('DB_SETUP_REQUIRED');
       }
      console.error('Error creating profile:', JSON.stringify(profileError));
    }
  }

  return data;
};

export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error("Login Error:", JSON.stringify(error));
    throw error;
  }
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUserProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    // PGRST205: Relation does not exist (Table missing in Supabase)
    // 42P01: Undefined table (Postgres standard error)
    if (error.code === 'PGRST205' || error.code === '42P01') {
        throw new Error('DB_SETUP_REQUIRED');
    }

    // If profile not found (e.g., deleted or signup glitch), try to heal it
    if (error.code === 'PGRST116') { // PGRST116 is JSON code for "The result contains 0 rows"
        console.warn("Profile missing, attempting to create default profile...");
        return await createDefaultProfile(user);
    }
    console.error("Error fetching profile", JSON.stringify(error));
    return null;
  }
  
  return profile;
};

// Helper to create a profile if it's missing during session load
const createDefaultProfile = async (user: any) => {
    const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
    
    const newProfile = {
        id: user.id,
        name: name,
        handle: `@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        img: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0df2b9&color=10221e`,
        email: user.email
    };

    const { data, error } = await supabase
        .from('profiles')
        .upsert(newProfile)
        .select()
        .single();

    if (error) {
        if (error.code === 'PGRST205' || error.code === '42P01') {
            throw new Error('DB_SETUP_REQUIRED');
        }
        console.error("Failed to auto-create profile:", JSON.stringify(error));
        return null;
    }
    return data;
};
