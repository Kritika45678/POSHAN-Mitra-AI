import { useState } from 'react';
import { AlertTriangle, TrendingUp, CheckCircle2, Volume2 } from 'lucide-react';
import type { ChildRecord, Language, RationStatus } from '../types.ts';
import { assessChildRisk } from '../utils/riskEngine.ts';

interface QuickRiskCheckViewProps {
  language: Language;
}

export function QuickRiskCheckView({ language }: QuickRiskCheckViewProps) {
  const isDevanagari = language === 'hi' || language === 'bho';
  const pick = (hi: string, bho: string, en: string) =>
    language === 'bho' ? bho : language === 'hi' ? hi : en;

  const [childName, setChildName] = useState('');
  const [muacMm, setMuacMm] = useState(121);
  const [weightDrop, setWeightDrop] = useState<'gained' | 'same' | 'dropped'>('same');
  const [attendanceDays, setAttendanceDays] = useState(10);
  const [rationStatus, setRationStatus] = useState<RationStatus>('missed');
  const [hasDiarrhea, setHasDiarrhea] = useState(false);

  const syntheticChild: ChildRecord = {
    id: 'quick-check',
    nameHi: childName.trim() || (language === 'bho' ? 'ई लइका' : 'यह बच्चा'),
    nameEn: childName.trim() || 'This child',
    motherNameHi: language === 'bho' ? 'माई' : 'माता जी',
    motherNameEn: 'Mother',
    ward: language === 'bho' ? 'तुरंत जांच' : 'त्वरित जांच',
    ageMonths: 20,
    gender: 'girl',
    phone: '',
    attendanceDays,
    totalDays: 24,
    recentAbsenceStreak: attendanceDays < 12 ? 7 : 0,
    rationStatus,
    weightKg: weightDrop === 'dropped' ? 8.0 : weightDrop === 'same' ? 8.3 : 8.6,
    prevWeightKg: 8.3,
    heightCm: 78.0,
    muacMm,
    growthHistory: [],
    recentIllness: hasDiarrhea ? ['diarrhea'] : [],
    immunizationUpToDate: true,
    householdFactors: [],
    followUpHistory: [],
  };

  const assessment = assessChildRisk(syntheticChild);
  const actionText = pick(
    assessment.oneClearActionHi,
    assessment.oneClearActionBho,
    assessment.oneClearActionEn
  );

  const speak = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(actionText);
    u.lang = isDevanagari ? 'hi-IN' : 'en-IN';
    u.rate = 0.92;
    window.speechSynthesis.speak(u);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-7 bg-white rounded-2xl border border-[#DCE4DB] p-5 sm:p-6 space-y-5 min-w-0">
        <div>
          <h2 className="text-xl font-bold text-[#12372A]">
            {pick('30-सेकंड त्वरित जोखिम जांच', '30-सेकंड में तुरंत खतरा जांच', '30-Second Quick Risk Check')}
          </h2>
          <p className="text-sm text-[#435C51] mt-1">
            {pick(
              'गृह भेंट के दौरान 4 छोटे संकेत चुनें और तुरंत जानें कि बच्चा खतरे की ओर तो नहीं बढ़ रहा।',
              'घर भेंट के समय ई 4 गो छोट संकेत चुनीं आ तुरंत जानीं कि लइका कुपोषण के ओर त नइखे बढ़त।',
              'Select 4 quick field signals during a home visit to immediately spot early SAM/MAM drift.'
            )}
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#435C51] mb-1.5">
            {pick('बच्चे का नाम (वैकल्पिक)', 'लइका के नाम (मन हो त लिखीं)', 'Child Name (optional)')}
          </label>
          <input
            type="text"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            placeholder={pick('जैसे: सोनम', 'जइसे: सोनम', 'e.g. Sonam')}
            className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF7] border border-[#DCE4DB] text-sm text-[#12372A] focus:outline-none focus:border-[#0F766E]"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-[#435C51]">
              {pick('1. MUAC टेप माप (mm)', '1. MUAC फीता के नाप (mm)', '1. MUAC Tape Reading (mm)')}
            </label>
            <span className="font-mono-tabular text-sm font-bold text-[#12372A]">{muacMm} mm</span>
          </div>
          <input
            type="range"
            min={100}
            max={145}
            value={muacMm}
            onChange={(e) => setMuacMm(Number(e.target.value))}
            className="w-full accent-[#0F766E] h-2 cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-[#647B71] mt-1 gap-1">
            <span>&lt;115mm ({pick('लाल · SAM', 'लाल · SAM', 'Red')})</span>
            <span>115–124mm ({pick('पीला · MAM', 'पीला · MAM', 'Amber')})</span>
            <span>≥125mm ({pick('हरा · सुरक्षित', 'हरियर · ठीक', 'Green')})</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#435C51] mb-1.5">
            {pick('2. पिछले महीने से वजन की स्थिति', '2. पाछिला महीना से वजन के हाल', '2. Weight Trend vs Last Month')}
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F1F5EF] rounded-xl">
            {(
              [
                { id: 'gained', hi: 'वजन बढ़ा', bho: 'वजन बढ़ल', en: 'Gained' },
                { id: 'same', hi: 'स्थिर रहा', bho: 'ओतने बा', en: 'No Gain' },
                { id: 'dropped', hi: 'वजन घटा', bho: 'वजन घटल', en: 'Dropped' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setWeightDrop(opt.id)}
                className={`min-h-[42px] rounded-lg text-xs font-medium transition-colors ${
                  weightDrop === opt.id
                    ? 'bg-white text-[#12372A] font-semibold shadow-xs'
                    : 'text-[#435C51]'
                }`}
              >
                {pick(opt.hi, opt.bho, opt.en)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#435C51]">
                {pick('3. केंद्र उपस्थिति (24 दिन में)', '3. केंद्र पर आइल (24 दिन में)', '3. Attendance (of 24 days)')}
              </label>
              <span className="font-mono-tabular text-sm font-bold text-[#12372A]">
                {attendanceDays}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={24}
              value={attendanceDays}
              onChange={(e) => setAttendanceDays(Number(e.target.value))}
              className="w-full accent-[#0F766E] h-2 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#435C51] mb-1.5">
              {pick('4. राशन (THR) उठाया?', '4. राशन (THR) उठल?', '4. Take-Home Ration?')}
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 bg-[#F1F5EF] rounded-xl">
              {(['collected', 'partial', 'missed'] as RationStatus[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRationStatus(r)}
                  className={`min-h-[38px] rounded-lg text-xs font-medium ${
                    rationStatus === r
                      ? 'bg-white text-[#12372A] font-semibold shadow-xs'
                      : 'text-[#435C51]'
                  }`}
                >
                  {r === 'collected'
                    ? pick('हाँ', 'हाँ', 'Yes')
                    : r === 'partial'
                    ? pick('आंशिक', 'थोड़ा', 'Part')
                    : pick('नहीं', 'ना', 'No')}
                </button>
              ))}
            </div>
          </div>
        </div>

        <label className="flex items-center gap-3 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#F8FAF7] border border-[#DCE4DB] cursor-pointer">
          <input
            type="checkbox"
            checked={hasDiarrhea}
            onChange={(e) => setHasDiarrhea(e.target.checked)}
            className="w-5 h-5 accent-[#0F766E] rounded"
          />
          <span className="text-sm font-medium text-[#12372A]">
            {pick(
              'पिछले 7 दिन में दस्त या तेज बुखार रहा है',
              'पाछिला 7 दिन में दस्त भा तेज बोखार भइल बा',
              'Diarrhea or high fever in last 7 days'
            )}
          </span>
        </label>
      </div>

      {/* Live Result Panel */}
      <div className="lg:col-span-5 min-w-0">
        <div
          className={`rounded-2xl border p-6 space-y-4 ${
            assessment.level === 'high'
              ? 'bg-[#FEF2F2] border-[#FECACA]'
              : assessment.level === 'rising'
              ? 'bg-[#FFFBEB] border-[#FDE68A]'
              : 'bg-[#F0FDF4] border-[#BBF7D0]'
          }`}
        >
          <div
            className={`flex items-center gap-2 text-sm font-bold ${
              assessment.level === 'high'
                ? 'text-[#B91C1C]'
                : assessment.level === 'rising'
                ? 'text-[#B45309]'
                : 'text-[#15803D]'
            }`}
          >
            {assessment.level === 'high' ? (
              <AlertTriangle className="w-5 h-5" />
            ) : assessment.level === 'rising' ? (
              <TrendingUp className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
            <span>
              {assessment.level === 'high'
                ? pick('उच्च जोखिम · SAM संकेत', 'बेसी खतरा · SAM लछन', 'High Risk · SAM Alert')
                : assessment.level === 'rising'
                ? pick('बढ़ता जोखिम · MAM निगरानी', 'बढ़त खतरा · MAM निगरानी', 'Rising Risk · MAM Watch')
                : pick('सामान्य · स्वस्थ विकास', 'ठीक बा · बढ़िया बढ़त', 'Normal · Healthy')}
            </span>
          </div>

          <div>
            <p className="text-xs font-semibold text-[#435C51] mb-1">
              {pick('आपका अगला एक कदम:', 'रउआ खातिर अगला एक साफ काम:', 'Your One Clear Next Step:')}
            </p>
            <p className="text-lg font-bold text-[#12372A] leading-snug">{actionText}</p>
          </div>

          {assessment.reasons.length > 0 && (
            <ul className="space-y-1.5 pt-3 border-t border-black/10 text-sm text-[#12372A]">
              {assessment.reasons.map((r, i) => (
                <li key={i}>· {pick(r.labelHi, r.labelBho, r.labelEn)}</li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={speak}
            className="w-full min-h-[48px] rounded-xl bg-white hover:bg-[#F8FAF7] border border-black/10 text-[#12372A] text-sm font-semibold inline-flex items-center justify-center gap-2"
          >
            <Volume2 className="w-4 h-4 text-[#0F766E]" />
            <span>
              {pick('निर्देश सुनें (हिन्दी में)', 'सलाह सुनीं (भोजपुरी में)', 'Listen to Instruction')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
