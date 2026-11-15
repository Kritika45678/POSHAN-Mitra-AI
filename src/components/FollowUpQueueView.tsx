import { AlertTriangle, TrendingUp, Check, Volume2, ArrowRight } from 'lucide-react';
import type { ChildRecord, Language, RiskAssessment } from '../types.ts';

interface FollowUpItem {
  child: ChildRecord;
  assessment: RiskAssessment;
}

interface FollowUpQueueViewProps {
  items: FollowUpItem[];
  onOpenChild: (childId: string) => void;
  onMarkDone: (childId: string, actionText: string) => void;
  language: Language;
}

export function FollowUpQueueView({
  items,
  onOpenChild,
  onMarkDone,
  language,
}: FollowUpQueueViewProps) {
  const isDevanagari = language === 'hi' || language === 'bho';
  const pick = (hi: string, bho: string, en: string) =>
    language === 'bho' ? bho : language === 'hi' ? hi : en;

  const priorityItems = items
    .filter((i) => i.assessment.level !== 'normal')
    .sort((a, b) => b.assessment.score - a.assessment.score);

  const speakAction = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = isDevanagari ? 'hi-IN' : 'en-IN';
    u.rate = 0.92;
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-[#DCE4DB] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#12372A]">
            {pick('आज के प्राथमिकता फॉलो-अप', 'आज के जरूरी भेंट आ काम', "Today's Priority Follow-Ups")}
          </h2>
          <p className="text-sm text-[#435C51] mt-1">
            {pick(
              'गंभीरता के क्रम में — सबसे पहले लाल (SAM) और फिर पीले (MAM) जोखिम वाले बच्चे।',
              'जरूरत के हिसाब से — सबसे पहिले लाल (SAM) आ ओकरा बाद पीला (MAM) खतरा वाला लइका।',
              'Sorted by urgency — Red (SAM) alerts first, followed by Amber (MAM) early watches.'
            )}
          </p>
        </div>
        <div className="text-sm font-semibold text-[#0F766E] font-mono-tabular whitespace-nowrap">
          {priorityItems.filter((i) => !i.child.lastActionDoneAt).length}{' '}
          {pick('बाकी', 'बाकी बा', 'pending')}
        </div>
      </div>

      {priorityItems.length === 0 ? (
        <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl p-8 text-center">
          <p className="text-base font-bold text-[#15803D]">
            {pick(
              'बहुत बढ़िया! सभी बच्चे वर्तमान में सुरक्षित स्थिति में हैं।',
              'बहुत बढ़िया! अभी सभे लइका सुरक्षित आ ठीक बाड़े।',
              'All children are currently in the healthy zone.'
            )}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {priorityItems.map(({ child, assessment }) => {
            const isHigh = assessment.level === 'high';
            const childName = isDevanagari ? child.nameHi : child.nameEn;
            const motherName = isDevanagari ? child.motherNameHi : child.motherNameEn;
            const actionText = pick(
              assessment.oneClearActionHi,
              assessment.oneClearActionBho,
              assessment.oneClearActionEn
            );
            const urgency = pick(assessment.urgencyHi, assessment.urgencyBho, assessment.urgencyEn);
            const done = Boolean(child.lastActionDoneAt);

            return (
              <article
                key={child.id}
                className={`rounded-2xl border p-5 flex flex-col justify-between gap-4 ${
                  isHigh
                    ? 'bg-[#FEF2F2] border-[#FECACA]'
                    : 'bg-[#FFFBEB] border-[#FDE68A]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`flex items-center gap-1.5 text-xs font-bold ${
                        isHigh ? 'text-[#B91C1C]' : 'text-[#B45309]'
                      }`}
                    >
                      {isHigh ? (
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                      ) : (
                        <TrendingUp className="w-4 h-4 shrink-0" />
                      )}
                      <span>
                        {isHigh
                          ? pick('उच्च जोखिम · SAM', 'बेसी खतरा · SAM', 'High Risk · SAM')
                          : pick('बढ़ता जोखिम · MAM', 'बढ़त खतरा · MAM', 'Rising Risk · MAM')}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-[#12372A]">{urgency}</span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-[#12372A]">
                      {childName} ·{' '}
                      <span className="font-normal text-sm text-[#435C51]">
                        {pick('माँ', 'माई', 'Mother')}: {motherName} ({child.ward})
                      </span>
                    </h3>
                    <p className="text-xs font-mono-tabular text-[#435C51] mt-1">
                      MUAC {child.muacMm}mm · {child.weightKg}kg ·{' '}
                      {child.attendanceDays}/{child.totalDays}d
                    </p>
                  </div>

                  <p className="text-[15px] font-semibold text-[#12372A] leading-snug bg-white/75 p-3.5 rounded-xl border border-black/5">
                    {actionText}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onMarkDone(child.id, actionText)}
                    className={`inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
                      done
                        ? 'bg-[#15803D] text-white'
                        : isHigh
                        ? 'bg-[#B91C1C] hover:bg-[#991B1B] text-white'
                        : 'bg-[#B45309] hover:bg-[#92400E] text-white'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {done
                        ? pick('पूर्ण दर्ज', 'पूरा दर्ज भइल', 'Done')
                        : pick('पूर्ण करें', 'पूरा करीं', 'Mark Done')}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => speakAction(actionText)}
                    className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-white/90 hover:bg-white border border-black/10 text-[#12372A] text-xs sm:text-sm font-semibold"
                  >
                    <Volume2 className="w-4 h-4 text-[#0F766E]" />
                    <span>{pick('सुनें', 'सुनीं', 'Listen')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenChild(child.id)}
                    className="ml-auto inline-flex items-center gap-1 min-h-[44px] px-3 text-xs sm:text-sm font-semibold text-[#0F766E] hover:underline"
                  >
                    <span>{pick('पूरा विवरण', 'पूरा हाल देखीं', 'Open Profile')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
