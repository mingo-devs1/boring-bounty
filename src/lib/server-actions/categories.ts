import { supabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';

// Schema for creating a category
const createCategorySchema = z.object({
  bounty_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

// Schema for updating a category
const updateCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
});

// Schema for deleting a category
const deleteCategorySchema = z.object({
  id: z.string().uuid(),
});

/**
 * Create a new category for a bounty
 */
export async function createCategory(data: unknown) {
  try {
    const validationResult = createCategorySchema.safeParse(data);
    if (!validationResult.success) {
      return { 
        success: false, 
        error: validationResult.error.issues[0].message 
      };
    }

    const validatedData = validationResult.data;

    const { data: category, error } = await supabaseAdmin
      .from('categories')
      .insert({
        bounty_id: validatedData.bounty_id,
        name: validatedData.name,
        description: validatedData.description,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, category };
  } catch (error) {
    console.error('Error creating category:', error);
    return { success: false, error: 'Failed to create category' };
  }
}

/**
 * Update an existing category
 */
export async function updateCategory(data: unknown) {
  try {
    const validationResult = updateCategorySchema.safeParse(data);
    if (!validationResult.success) {
      return { 
        success: false, 
        error: validationResult.error.issues[0].message 
      };
    }

    const validatedData = validationResult.data;

    const { data: category, error } = await supabaseAdmin
      .from('categories')
      .update({
        name: validatedData.name,
        description: validatedData.description,
      })
      .eq('id', validatedData.id)
      .select()
      .single();

    if (error) throw error;

    return { success: true, category };
  } catch (error) {
    console.error('Error updating category:', error);
    return { success: false, error: 'Failed to update category' };
  }
}

/**
 * Delete a category
 */
export async function deleteCategory(data: unknown) {
  try {
    const validationResult = deleteCategorySchema.safeParse(data);
    if (!validationResult.success) {
      return { 
        success: false, 
        error: validationResult.error.issues[0].message 
      };
    }

    const validatedData = validationResult.data;

    const { error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', validatedData.id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting category:', error);
    return { success: false, error: 'Failed to delete category' };
  }
}

/**
 * Get categories for a bounty
 */
export async function getCategoriesByBounty(bountyId: string) {
  try {
    const { data: categories, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('bounty_id', bountyId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return { success: true, categories: categories || [] };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { success: false, error: 'Failed to fetch categories', categories: [] };
  }
}
