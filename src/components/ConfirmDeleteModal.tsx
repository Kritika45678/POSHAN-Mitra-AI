import { useEffect } from 'react';
import { Trash2, X, Loader2 } from 'lucide-react';
import type { ChildRecord, Language } from '../types.ts';

interface ConfirmDeleteModalProps {
  child: ChildRecord | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  language: Language;
}

export function ConfirmDeleteModal({
  child,
  isDeleting,
  onCancel,
  onConfirm,
  language,
}: ConfirmDeleteModalProps) {
  useEffect(() => {
    if (!child) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [child, isDeleting, onCancel]);

  if (!child) return null;

  const isDevanagari = language === 'hi' || language === 'bho';
  const pick = (hi: string, bho: string, en: string) =>
    language === 'bho' ? bho : language === 'hi' ? hi : en;

  const childName = isDevanagari ? child.nameHi : child.nameEn;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#12372A]/45 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
    >
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl border border-[#DCE4DB] shadow-xl p-5 sm:p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-[#FEF2F2] text-[#B91C1C] flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </span>
            <div>
              <h2 id="confirm-delete-title" className="text-base sm:text-lg font-bold text-[#12372A]">
                {pick(
                  `"${childName}" को सूची से हटाएं?`,
                  `"${childName}" के सूची से हटाईं?`,
                  `Delete "${childName}"?`
                )}
              </h2>
            </div>
          </div>

          <button
            type="button"
            disabled={isDeleting}
            onClick={onCancel}
            aria-label={pick('बंद करें', 'बंद करीं', 'Close')}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-[#435C51] hover:bg-[#F1F5EF] disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-[#435C51] leading-relaxed">
          {pick(
            'इस बच्चे का पूरा विवरण, विकास ग्राफ और फॉलो-अप रिकॉर्ड Firestore डेटाबेस से हमेशा के लिए हट जाएगा।',
            'एह लइका के पूरा हाल, बढ़त के ग्राफ आ भेंट के हिसाब Firestore डेटाबेस से हमेशा खातिर हट जाई।',
            'This child record, growth history, and follow-up log will be permanently removed from Firestore.'
          )}
        </p>

        <div className="pt-2 flex gap-3">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onCancel}
            className="flex-1 min-h-[46px] rounded-xl bg-[#F1F5EF] hover:bg-[#E5ECE2] text-[#12372A] text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {pick('रद्द करें', 'रद्द करीं', 'Cancel')}
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="flex-1 min-h-[46px] rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{pick('हटाया जा रहा है...', 'हटावल जात बा...', 'Deleting...')}</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>{pick('हटाएं', 'हटाईं', 'Delete Child')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
