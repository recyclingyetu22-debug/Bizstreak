import { useCallback } from 'react';
import { useStore } from './store';
import { translate, TKey } from './i18n';

/** `const t = useT(); t('home.add')` — re-renders when the language changes. */
export function useT() {
  const { language } = useStore();
  return useCallback(
    (key: TKey, vars?: Record<string, string | number>) => translate(language, key, vars),
    [language],
  );
}
