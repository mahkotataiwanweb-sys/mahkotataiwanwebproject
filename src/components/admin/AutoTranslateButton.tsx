'use client';

import { useState } from 'react';
import { Globe } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  sourceText: string;
  onTranslated: (translations: { id: string; zh: string }) => void;
  sourceLang?: string;
}

export default function AutoTranslateButton({ sourceText, onTranslated, sourceLang = 'en' }: Props) {
  const [loading, setLoading] = useState(false);

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      toast.error('Enter English text first');
      return;
    }

    setLoading(true);
    try {
      const [idRes, zhRes] = await Promise.all([
        fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: sourceText, from: sourceLang, to: 'id' }),
        }),
        fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: sourceText, from: sourceLang, to: 'zh-TW' }),
        }),
      ]);

      const idData = await idRes.json();
      const zhData = await zhRes.json();

      onTranslated({ id: idData.translated, zh: zhData.translated });
      toast.success('Auto-translated!');
    } catch {
      toast.error('Translation failed');
    }

    setLoading(false);
  };

  return (
    <button
      type="button"
      onClick={handleTranslate}
      disabled={loading || !sourceText.trim()}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-navy bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
      title="Auto-translate from English to Indonesian & Chinese"
    >
      <Globe className="w-3.5 h-3.5" />
      {loading ? 'Translating...' : 'Auto Translate'}
    </button>
  );
}
