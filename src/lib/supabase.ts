import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export const savePass = async (twitterUsername: string, imageData: string) => {
  const { error } = await supabase
    .from('passes')
    .insert([
      {
        twitter_username: twitterUsername,
        image_data: imageData,
        date_submitted: new Date().toISOString(),
      },
    ]);

  if (error) throw error;
  return true;
};