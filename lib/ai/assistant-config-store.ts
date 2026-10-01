import { createServiceClient } from '@/lib/supabase/service';
import {
  ASSISTANT_CONFIG_KEY,
  DEFAULT_ASSISTANT_CONFIG,
  parseStoredAssistantConfig,
  type AssistantConfig,
} from '@/lib/ai/assistant-config';

/** Reads the assistant configuration from site_settings (defaults when unset or unreachable). */
export async function getAssistantConfig(): Promise<AssistantConfig> {
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', ASSISTANT_CONFIG_KEY)
      .maybeSingle();
    return parseStoredAssistantConfig(data?.value);
  } catch {
    return { ...DEFAULT_ASSISTANT_CONFIG };
  }
}
