// utils/supabaseDescriptions.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Function untuk cek apakah buku sudah ada deskripsi AI
export const getAIDescriptionFromDB = async (bookId) => {
  try {
    const { data, error } = await supabase
      .from('books')
      .select('deskripsi_buku, deskripsi_source, deskripsi_confidence')
      .eq('id', bookId)
      .eq('deskripsi_source', 'ai-enhanced')
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching AI description from DB:', error);
    return null;
  }
};

// Function untuk save deskripsi ke database
export const saveAIDescriptionToDatabase = async (bookId, description, confidence = 0.95) => {
  try {
    const { data, error } = await supabase
      .from('books')
      .update({
        deskripsi_buku: description,
        deskripsi_source: 'ai-enhanced',
        deskripsi_confidence: confidence,
        deskripsi_updated_at: new Date().toISOString()
      })
      .eq('id', bookId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving AI description to DB:', error);
    throw error;
  }
};