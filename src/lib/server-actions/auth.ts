'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { privy } from '@/lib/privy';
import { UserRole } from '@/lib/supabase';
import { createProfileSchema, CreateProfileInput } from '@/lib/validations/auth';

interface CreateUserData {
  wallet_address: string;
  role: UserRole;
  username?: string;
  telegram?: string;
  bio?: string;
  skills?: string[];
  github?: string;
  portfolio?: string;
  cv?: string;
  linkedin?: string;
  x?: string;
  name?: string;
  description?: string;
  website?: string;
}

export async function createUser(data: CreateUserData) {
  try {
    // Validate input using Zod
    const validationResult = createProfileSchema.safeParse(data);
    if (!validationResult.success) {
      return { 
        success: false, 
        error: validationResult.error.issues[0].message 
      };
    }

    const validatedData = validationResult.data;

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('wallet_address', validatedData.wallet_address)
      .single();

    if (existingUser) {
      // Update existing user
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .update({
          role: validatedData.role,
          username: validatedData.username,
          telegram: validatedData.telegram,
          bio: validatedData.bio,
          skills: validatedData.skills || [],
          github: validatedData.github,
          portfolio: validatedData.portfolio,
          cv: validatedData.cv,
          linkedin: validatedData.linkedin,
          x: validatedData.x,
          name: validatedData.name,
          description: validatedData.description,
          website: validatedData.website,
        })
        .eq('wallet_address', validatedData.wallet_address)
        .select()
        .single();

      if (error) throw error;
      return { success: true, user };
    }

    // Create new user
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({
        wallet_address: validatedData.wallet_address,
        role: validatedData.role,
        username: validatedData.username,
        telegram: validatedData.telegram,
        bio: validatedData.bio,
        skills: validatedData.skills || [],
        github: validatedData.github,
        portfolio: validatedData.portfolio,
        cv: validatedData.cv,
        linkedin: validatedData.linkedin,
        x: validatedData.x,
        name: validatedData.name,
        description: validatedData.description,
        website: validatedData.website,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, user };
  } catch (error) {
    console.error('Error creating/updating user:', error);
    return { success: false, error: 'Failed to create user' };
  }
}

export async function getUserByWalletAddress(walletAddress: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (error) throw error;

    return { success: true, user: data };
  } catch (error) {
    console.error('Error fetching user:', error);
    return { success: false, error: 'Failed to fetch user' };
  }
}

export async function updateUser(userId: string, data: Partial<CreateUserData>) {
  try {
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, user };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error: 'Failed to update user' };
  }
}
