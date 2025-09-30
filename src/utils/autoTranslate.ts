import { supabase } from '@/integrations/supabase/client';

export async function autoTranslate(text: string, targetLang: 'en' | 'zh'): Promise<string> {
  if (!text || text.trim() === '') return text;
  
  try {
    const { data, error } = await supabase.functions.invoke('auto-translate', {
      body: { text, targetLang }
    });

    if (error) {
      console.error('Translation error:', error);
      return text;
    }

    return data.translatedText || text;
  } catch (error) {
    console.error('Translation failed:', error);
    return text;
  }
}
