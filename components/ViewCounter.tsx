'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function ViewCounter({ schemeId }: { schemeId: string }) {
  useEffect(() => {
    if (!schemeId) return;

    const incrementView = async () => {
      try {
        await supabase.rpc('increment_view_count', { scheme_id: schemeId });
      } catch (err) {
        console.warn('View counter increment failed:', err);
      }
    };

    incrementView();
  }, [schemeId]);

  return null;
}
