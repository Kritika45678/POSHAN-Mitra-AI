import { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Volume2,
  Square,
  Sparkles,
  Check,
  Calendar,
  Package,
  Scale,
  Home,
  Phone,
  Minus,
  Plus,
  Loader2,
  MessageCircleHeart,
  LineChart as LineChartIcon,
  FileDown,
  Trash2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type {
  AiAnalysisResult,
  ChildRecord,
  HouseholdFlag,
  IllnessFlag,
  Language,
  RationStatus,
  RiskAssessment,
  WorkerProfile,
} from '../types.ts';
import { UI_TEXT } from '../i18n/translations.ts';
import { downloadChildPdfReport } from '../utils/pdfReport.ts';

interface ChildDetailWorkspaceProps {
  child: ChildRecord;
  assessment: RiskAssessment;
  workerProfile: WorkerProfile | null;
  onUpdateChild: (updated: ChildRecord) => void;
  onMarkActionDone: (childId: string, actionText: string) => void;
  onRequestDeleteChild: (child: ChildRecord) => void;
  language: Language;
}

type ChartMetricMode = 'both' | 'weight' | 'height';

export function ChildDetailWorkspace({
  child,
  assessment,
  workerProfile,
  onUpdateChild,
  onMarkActionDone,
  onRequestDeleteChild,
  language,
}: ChildDetailWorkspaceProps) {
  const t = UI_TEXT[language];
  const isDevanagari = language === 'hi' || language === 'bho';
  const pick = (hi: string, bho: string, en: string) =>
    language === 'bho' ? bho : language === 'hi' ? hi : en;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiAnalysisResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [chartMetric, setChartMetric] = useState<ChartMetricMode>('both');
  const [pdfDownloading, setPdfDownloading] = useState(false);

  // Reset AI insight & speech when switching child or language
  useEffect(() => {
    setAiResult(null);
    setAiError(null);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, [child.id, language]);

  const growthChartData = useMemo(() => {
    const base =
      child.growthHistory && child.growthHistory.length > 0
        ? child.growthHistory
        : [
            {
              monthHi: language === 'bho' ? 'पाछिला' : 'पिछला',
              monthEn: 'Prev',
              weightKg: child.prevWeightKg,
              heightCm: Number(((child.heightCm ?? 78) - 0.5).toFixed(1)),
            },
            {
              monthHi: language === 'bho' ? 'अभी' : 'वर्तमान',
              monthEn: 'Now',
              weightKg: child.weightKg,
              heightCm: child.heightCm ?? 78,
            },
          ];

    return base.map((pt, idx) => ({
      label: isDevanagari ? pt.monthHi : pt.monthEn,
      weightKg: idx === base.length - 1 ? child.weightKg : pt.weightKg,
      heightCm: idx === base.length - 1 ? (child.heightCm ?? pt.heightCm) : pt.heightCm,
    }));
  }, [child.growthHistory, child.weightKg, child.prevWeightKg, child.heightCm, isDevanagari, language]);

  const netWeightDelta = useMemo(() => {
    if (growthChartData.length < 2) return 0;
    return Number(
      (
        growthChartData[growthChartData.length - 1].weightKg - growthChartData[0].weightKg
      ).toFixed(1)
    );
  }, [growthChartData]);

  const netHeightDelta = useMemo(() => {
    if (growthChartData.length < 2) return 0;
    return Number(
      (
        growthChartData[growthChartData.length - 1].heightCm - growthChartData[0].heightCm
      ).toFixed(1)
    );
  }, [growthChartData]);

  const handleLogCurrentMeasurement = () => {
    const nowLabelHi = new Date().toLocaleDateString('hi-IN', {
      day: '2-digit',
      month: 'short',
    });
    const nowLabelEn = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    });
    const existing = child.growthHistory ?? [];
    const nextHistory = [
      ...existing.slice(-7),
      {
        monthHi: nowLabelHi,
        monthEn: nowLabelEn,
        weightKg: child.weightKg,
        heightCm: child.heightCm,
      },
    ];
    onUpdateChild({
      ...child,
      prevWeightKg: child.weightKg,
      growthHistory: nextHistory,
    });
  };

  const childName = isDevanagari ? child.nameHi : child.nameEn;
  const motherName = isDevanagari ? child.motherNameHi : child.motherNameEn;
  const genderLabel = child.gender === 'girl' ? t.girl : t.boy;

  const primaryActionText =
    aiResult?.oneClearAction ??
    pick(assessment.oneClearActionHi, assessment.oneClearActionBho, assessment.oneClearActionEn);
  const urgencyText =
    aiResult?.urgencyLabel ??
    pick(assessment.urgencyHi, assessment.urgencyBho, assessment.urgencyEn);
  const counselingText =
    aiResult?.motherCounselingScript ??
    pick(assessment.counselingHintHi, assessment.counselingHintBho, assessment.counselingHintEn);

  const weightDiff = Number((child.weightKg - child.prevWeightKg).toFixed(2));
  const attendancePct =
    child.totalDays > 0 ? Math.round((child.attendanceDays / child.totalDays) * 100) : 0;

  const riskTheme =
    assessment.level === 'high'
      ? {
          surface: 'bg-[#FEF2F2] border-[#FECACA]',
          headerText: 'text-[#B91C1C]',
          badgeText: t.highRiskLabel,
          icon: AlertTriangle,
          buttonBg: 'bg-[#B91C1C] hover:bg-[#991B1B] text-white',
        }
      : assessment.level === 'rising'
      ? {
          surface: 'bg-[#FFFBEB] border-[#FDE68A]',
          headerText: 'text-[#B45309]',
          badgeText: t.risingRiskLabel,
          icon: TrendingUp,
          buttonBg: 'bg-[#B45309] hover:bg-[#92400E] text-white',
        }
      : {
          surface: 'bg-[#F0FDF4] border-[#BBF7D0]',
          headerText: 'text-[#15803D]',
          badgeText: t.normalRiskLabel,
          icon: CheckCircle2,
          buttonBg: 'bg-[#0F766E] hover:bg-[#0D625B] text-white',
        };

  const RiskIcon = riskTheme.icon;

  const handleToggleSpeak = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`${primaryActionText}. ${counselingText}`);
    utterance.lang = isDevanagari ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.92;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleAskGemini = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const response = await fetch('/api/analyze-child', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName,
          ageMonths: child.ageMonths,
          gender: child.gender,
          motherName,
          weightKg: child.weightKg,
          prevWeightKg: child.prevWeightKg,
          muacMm: child.muacMm,
          attendanceDays: child.attendanceDays,
          totalDays: child.totalDays,
          rationStatus: child.rationStatus,
          recentIllness: child.recentIllness,
          householdFactors: child.householdFactors,
          immunizationUpToDate: child.immunizationUpToDate,
          riskLevel: assessment.level,
          language,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || t.aiErrorFallback);
      }
      setAiResult(data as AiAnalysisResult);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : t.aiErrorFallback);
    } finally {
      setAiLoading(false);
    }
  };

  const toggleIllness = (flag: IllnessFlag) => {
    const exists = child.recentIllness.includes(flag);
    const next = exists
      ? child.recentIllness.filter((f) => f !== flag)
      : [...child.recentIllness, flag];
    onUpdateChild({ ...child, recentIllness: next });
  };

  const toggleHousehold = (flag: HouseholdFlag) => {
    const exists = child.householdFactors.includes(flag);
    const next = exists
      ? child.householdFactors.filter((f) => f !== flag)
      : [...child.householdFactors, flag];
    onUpdateChild({ ...child, householdFactors: next });
  };

  const muacZoneText =
    child.muacMm < 115
      ? pick('लाल ज़ोन (<115mm)', 'लाल पट्टी (<115mm)', 'Red (<115mm)')
      : child.muacMm < 125
      ? pick('पीला ज़ोन (115–124mm)', 'पीला पट्टी (115–124mm)', 'Amber (115–124mm)')
      : pick('हरा ज़ोन (≥125mm)', 'हरियर पट्टी (≥125mm)', 'Green (≥125mm)');

  const todayDone = Boolean(child.lastActionDoneAt);

  return (
    <div className="space-y-6 min-w-0">
      {/* Child Identity Strip */}
      <div className="bg-white rounded-2xl border border-[#DCE4DB] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold text-[#12372A] tracking-tight">
              {childName}
            </h2>
            <span className="text-sm text-[#435C51]">
              {child.ageMonths} {t.monthsUnit} · {genderLabel}
            </span>
          </div>
          <p className="text-sm text-[#435C51] mt-1">
            {t.motherLabel}: <strong className="font-semibold text-[#12372A]">{motherName}</strong>
            <span aria-hidden="true"> · </span>
            <span>{child.ward}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={pdfDownloading}
            onClick={async () => {
              setPdfDownloading(true);
              try {
                await downloadChildPdfReport(child, assessment, workerProfile, language);
              } finally {
                setPdfDownloading(false);
              }
            }}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-[#0F766E] hover:bg-[#0D625B] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 disabled:opacity-60"
          >
            {pdfDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
            <span>{pick('PDF रिपोर्ट', 'PDF रपट', 'PDF Report')}</span>
          </button>

          <a
            href={`tel:${child.phone}`}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-[#F1F5EF] hover:bg-[#E4ECE1] text-[#12372A] text-sm font-medium transition-colors whitespace-nowrap shrink-0"
          >
            <Phone className="w-4 h-4 text-[#0F766E]" />
            <span className="font-mono-tabular">{child.phone}</span>
          </a>

          <button
            type="button"
            onClick={() => onRequestDeleteChild(child)}
            aria-label={pick('बच्चे को सूची से हटाएं', 'लइका के सूची से हटाईं', 'Delete Child')}
            title={pick('बच्चे को सूची से हटाएं', 'लइका के सूची से हटाईं', 'Delete Child')}
            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 py-2 rounded-xl bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] text-[#B91C1C] text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">{pick('हटाएं', 'हटाईं', 'Delete')}</span>
          </button>
        </div>
      </div>

      {/* FOCAL ANCHOR: ONE CLEAR FOLLOW-UP ACTION */}
      <section
        aria-label={t.oneClearActionTitle}
        className={`rounded-2xl border p-5 sm:p-6 transition-colors ${riskTheme.surface}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-black/10">
          <div className={`flex items-center gap-2 text-sm font-bold ${riskTheme.headerText}`}>
            <RiskIcon className="w-5 h-5 shrink-0" />
            <span>{riskTheme.badgeText}</span>
          </div>
          <span className="text-xs font-semibold text-[#12372A] tabular-nums">
            {urgencyText}
          </span>
        </div>

        <div className="mt-4">
          <p className="text-xs font-semibold text-[#435C51] mb-1.5">
            {t.oneClearActionTitle}
          </p>
          <p className="text-lg sm:text-xl font-bold text-[#12372A] leading-snug text-balance">
            {primaryActionText}
          </p>
        </div>

        {/* Connected Scattered Signal Reasons */}
        {(aiResult?.whyFlagged?.length || assessment.reasons.length > 0) && (
          <div className="mt-4 pt-4 border-t border-black/10">
            <p className="text-xs font-semibold text-[#435C51] mb-2">{t.aiWhyHeading}</p>
            <ul className="space-y-1.5 text-sm text-[#12372A]">
              {aiResult?.whyFlagged
                ? aiResult.whyFlagged.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span aria-hidden="true" className="text-[#435C51] font-bold">
                        ·
                      </span>
                      <span>{reason}</span>
                    </li>
                  ))
                : assessment.reasons.slice(0, 4).map((r, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span aria-hidden="true" className="text-[#435C51] font-bold">
                        ·
                      </span>
                      <span>{pick(r.labelHi, r.labelBho, r.labelEn)}</span>
                    </li>
                  ))}
            </ul>
          </div>
        )}

        {aiError && (
          <p className="mt-3 text-xs font-medium text-[#B45309] bg-white/75 px-3 py-2 rounded-lg border border-[#FDE68A]">
            {t.aiErrorFallback} ({aiError})
          </p>
        )}

        {/* Primary Action Buttons */}
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onMarkActionDone(child.id, primaryActionText)}
            className={`inline-flex items-center justify-center gap-2 min-h-[48px] px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] whitespace-nowrap ${
              todayDone
                ? 'bg-[#15803D] text-white'
                : riskTheme.buttonBg
            }`}
          >
            <Check className="w-4 h-4 shrink-0" />
            <span>{todayDone ? t.doneLogged : t.markDoneBtn}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleSpeak}
            className="inline-flex items-center justify-center gap-2 min-h-[48px] px-4 py-2.5 rounded-xl bg-white/90 hover:bg-white border border-black/10 text-[#12372A] text-sm font-semibold transition-colors whitespace-nowrap"
          >
            {isSpeaking ? (
              <>
                <Square className="w-4 h-4 fill-current text-[#B91C1C]" />
                <span>{t.stopAudio}</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-[#0F766E]" />
                <span>{t.listenAction}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleAskGemini}
            disabled={aiLoading}
            className="inline-flex items-center justify-center gap-2 min-h-[48px] px-4 py-2.5 rounded-xl bg-white/90 hover:bg-white border border-black/10 text-[#0F766E] text-sm font-semibold transition-colors whitespace-nowrap disabled:opacity-60"
          >
            {aiLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t.askingAi}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{t.askAiBtn}</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* Mother Counseling Script */}
      <section className="bg-white rounded-2xl border border-[#DCE4DB] p-4 sm:p-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#0F766E] mb-1.5">
          <MessageCircleHeart className="w-4 h-4" />
          <span>{t.counselingTitle}</span>
        </div>
        <p className="text-[15px] text-[#12372A] leading-relaxed">{counselingText}</p>
      </section>

      {/* UNIFIED 4 SCATTERED SIGNALS WORKSPACE */}
      <section className="space-y-3">
        <h3 className="text-sm font-bold text-[#12372A] px-1">{t.signalsHeading}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Signal 1: Attendance */}
          <div className="bg-white rounded-2xl border border-[#DCE4DB] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#12372A]">
                <Calendar className="w-4 h-4 text-[#0F766E]" />
                <span>{t.signalAttendance}</span>
              </div>
              <span className="text-sm font-bold font-mono-tabular text-[#12372A]">
                {child.attendanceDays}/{child.totalDays} ({attendancePct}%)
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-xs text-[#435C51]">{t.daysLabel}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Decrease attendance"
                  onClick={() =>
                    onUpdateChild({
                      ...child,
                      attendanceDays: Math.max(0, child.attendanceDays - 1),
                      recentAbsenceStreak:
                        child.attendanceDays <= 12 ? child.recentAbsenceStreak + 1 : 0,
                    })
                  }
                  className="w-11 h-11 rounded-xl bg-[#F1F5EF] hover:bg-[#E4ECE1] flex items-center justify-center text-[#12372A]"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-mono-tabular font-semibold text-base">
                  {child.attendanceDays}
                </span>
                <button
                  type="button"
                  aria-label="Increase attendance"
                  onClick={() =>
                    onUpdateChild({
                      ...child,
                      attendanceDays: Math.min(child.totalDays, child.attendanceDays + 1),
                      recentAbsenceStreak: Math.max(0, child.recentAbsenceStreak - 2),
                    })
                  }
                  className="w-11 h-11 rounded-xl bg-[#F1F5EF] hover:bg-[#E4ECE1] flex items-center justify-center text-[#12372A]"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Signal 2: Ration / THR Uptake */}
          <div className="bg-white rounded-2xl border border-[#DCE4DB] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#12372A]">
                <Package className="w-4 h-4 text-[#D97706]" />
                <span>{t.signalRation}</span>
              </div>
              <span className="text-xs font-semibold text-[#435C51]">
                {child.rationStatus === 'collected'
                  ? t.rationCollected
                  : child.rationStatus === 'partial'
                  ? t.rationPartial
                  : t.rationMissed}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F1F5EF] rounded-xl">
              {(['collected', 'partial', 'missed'] as RationStatus[]).map((status) => {
                const active = child.rationStatus === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => onUpdateChild({ ...child, rationStatus: status })}
                    className={`min-h-[42px] px-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-white text-[#12372A] font-semibold shadow-xs'
                        : 'text-[#435C51] hover:text-[#12372A]'
                    }`}
                  >
                    {status === 'collected'
                      ? t.rationCollected
                      : status === 'partial'
                      ? t.rationPartial
                      : t.rationMissed}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Signal 3: Health & Growth (MUAC + Weight + Height) */}
          <div className="bg-white rounded-2xl border border-[#DCE4DB] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#12372A]">
                <Scale className="w-4 h-4 text-[#0F766E]" />
                <span>{t.signalHealth}</span>
              </div>
              <span className="text-xs font-semibold text-[#435C51]">{muacZoneText}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="bg-[#F8FAF7] rounded-xl p-2.5 border border-[#E5ECE2]">
                <p className="text-[11px] text-[#435C51]">{t.muacLabel}</p>
                <div className="flex items-center justify-between mt-1">
                  <button
                    type="button"
                    aria-label="Decrease MUAC"
                    onClick={() =>
                      onUpdateChild({ ...child, muacMm: Math.max(85, child.muacMm - 2) })
                    }
                    className="w-9 h-9 rounded-lg bg-white border border-[#DCE4DB] flex items-center justify-center text-[#12372A]"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono-tabular font-bold text-sm text-[#12372A]">
                    {child.muacMm}mm
                  </span>
                  <button
                    type="button"
                    aria-label="Increase MUAC"
                    onClick={() =>
                      onUpdateChild({ ...child, muacMm: Math.min(180, child.muacMm + 2) })
                    }
                    className="w-9 h-9 rounded-lg bg-white border border-[#DCE4DB] flex items-center justify-center text-[#12372A]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="bg-[#F8FAF7] rounded-xl p-2.5 border border-[#E5ECE2]">
                <p className="text-[11px] text-[#435C51]">
                  {t.weightLabel} ({weightDiff >= 0 ? `+${weightDiff}` : weightDiff}kg)
                </p>
                <div className="flex items-center justify-between mt-1">
                  <button
                    type="button"
                    aria-label="Decrease Weight"
                    onClick={() =>
                      onUpdateChild({
                        ...child,
                        weightKg: Number(Math.max(3, child.weightKg - 0.1).toFixed(1)),
                      })
                    }
                    className="w-9 h-9 rounded-lg bg-white border border-[#DCE4DB] flex items-center justify-center text-[#12372A]"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono-tabular font-bold text-sm text-[#12372A]">
                    {child.weightKg}kg
                  </span>
                  <button
                    type="button"
                    aria-label="Increase Weight"
                    onClick={() =>
                      onUpdateChild({
                        ...child,
                        weightKg: Number((child.weightKg + 0.1).toFixed(1)),
                      })
                    }
                    className="w-9 h-9 rounded-lg bg-white border border-[#DCE4DB] flex items-center justify-center text-[#12372A]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="bg-[#F8FAF7] rounded-xl p-2.5 border border-[#E5ECE2]">
                <p className="text-[11px] text-[#435C51]">
                  {pick('लंबाई (Height)', 'लंबाई (cm)', 'Height (cm)')}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <button
                    type="button"
                    aria-label="Decrease Height"
                    onClick={() =>
                      onUpdateChild({
                        ...child,
                        heightCm: Number(Math.max(45, (child.heightCm ?? 78) - 0.5).toFixed(1)),
                      })
                    }
                    className="w-9 h-9 rounded-lg bg-white border border-[#DCE4DB] flex items-center justify-center text-[#12372A]"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono-tabular font-bold text-sm text-[#12372A]">
                    {child.heightCm ?? 78}cm
                  </span>
                  <button
                    type="button"
                    aria-label="Increase Height"
                    onClick={() =>
                      onUpdateChild({
                        ...child,
                        heightCm: Number(Math.min(130, (child.heightCm ?? 78) + 0.5).toFixed(1)),
                      })
                    }
                    className="w-9 h-9 rounded-lg bg-white border border-[#DCE4DB] flex items-center justify-center text-[#12372A]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Signal 4: Illness & Household Context */}
          <div className="bg-white rounded-2xl border border-[#DCE4DB] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#12372A]">
                <Home className="w-4 h-4 text-[#0F766E]" />
                <span>{t.signalHousehold}</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  onUpdateChild({ ...child, immunizationUpToDate: !child.immunizationUpToDate })
                }
                className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                  child.immunizationUpToDate
                    ? 'bg-[#F0FDF4] text-[#15803D]'
                    : 'bg-[#FFFBEB] text-[#B45309]'
                }`}
              >
                {t.immunizationLabel}: {child.immunizationUpToDate ? t.upToDate : t.dueNow}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { key: 'diarrhea', label: t.illnessDiarrhea, type: 'illness' },
                  { key: 'fever', label: t.illnessFever, type: 'illness' },
                  { key: 'food_shortage', label: t.houseFood, type: 'house' },
                  { key: 'migration', label: t.houseMigration, type: 'house' },
                ] as const
              ).map((item) => {
                const active =
                  item.type === 'illness'
                    ? child.recentIllness.includes(item.key)
                    : child.householdFactors.includes(item.key);
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() =>
                      item.type === 'illness'
                        ? toggleIllness(item.key)
                        : toggleHousehold(item.key)
                    }
                    className={`min-h-[42px] px-3 py-2 rounded-xl border text-xs font-medium text-left transition-colors ${
                      active
                        ? 'bg-[#FEF2F2] border-[#FECACA] text-[#B91C1C] font-semibold'
                        : 'bg-[#F8FAF7] border-[#DCE4DB] text-[#435C51] hover:text-[#12372A]'
                    }`}
                  >
                    {active ? '✓ ' : ''}
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Nutritional Growth Trends Chart (Recharts) */}
      <section className="bg-white rounded-2xl border border-[#DCE4DB] p-4 sm:p-5 space-y-4 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-[#12372A]">
              <LineChartIcon className="w-4 h-4 text-[#0F766E]" />
              <span>
                {pick(
                  'वजन व लंबाई विकास ग्राफ (Growth Trend)',
                  'वजन आ लंबाई बढ़त के ग्राफ (Growth Trend)',
                  'Nutritional Growth Trends'
                )}
              </span>
            </div>
            <p className="text-xs text-[#435C51] mt-1 font-mono-tabular">
              {pick('वजन बदलाव:', 'वजन बदलल:', 'Weight:')}{' '}
              <strong
                className={
                  netWeightDelta < 0
                    ? 'text-[#B91C1C]'
                    : netWeightDelta === 0
                    ? 'text-[#B45309]'
                    : 'text-[#15803D]'
                }
              >
                {netWeightDelta >= 0 ? `+${netWeightDelta}` : netWeightDelta} kg
              </strong>
              <span aria-hidden="true"> · </span>
              {pick('लंबाई बढ़ोतरी:', 'लंबाई बढ़ल:', 'Height:')}{' '}
              <strong className="text-[#D97706]">
                {netHeightDelta >= 0 ? `+${netHeightDelta}` : netHeightDelta} cm
              </strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center p-1 bg-[#F1F5EF] rounded-xl">
              {(
                [
                  { id: 'both', hi: 'दोनों', bho: 'दूनो', en: 'Both' },
                  { id: 'weight', hi: 'वजन', bho: 'वजन', en: 'Weight' },
                  { id: 'height', hi: 'लंबाई', bho: 'लंबाई', en: 'Height' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setChartMetric(opt.id)}
                  className={`min-h-[34px] px-3 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    chartMetric === opt.id
                      ? 'bg-white text-[#12372A] font-semibold shadow-xs'
                      : 'text-[#435C51] hover:text-[#12372A]'
                  }`}
                >
                  {pick(opt.hi, opt.bho, opt.en)}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleLogCurrentMeasurement}
              className="min-h-[38px] px-3 rounded-xl bg-[#F1F5EF] hover:bg-[#E4ECE1] text-[#0F766E] text-xs font-semibold transition-colors whitespace-nowrap"
            >
              {pick('+ नया माप दर्ज करें', '+ नया नाप जोड़ीं', '+ Log Point')}
            </button>
          </div>
        </div>

        <div className="h-[220px] sm:h-[250px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={growthChartData}
              margin={{ top: 8, right: 8, left: -14, bottom: 0 }}
            >
              <CartesianGrid stroke="#E9EFE8" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#435C51', fontSize: 11 }}
                axisLine={{ stroke: '#DCE4DB' }}
                tickLine={false}
              />
              {(chartMetric === 'both' || chartMetric === 'weight') && (
                <YAxis
                  yAxisId="weight"
                  domain={['dataMin - 0.5', 'dataMax + 0.5']}
                  tick={{ fill: '#0F766E', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}kg`}
                />
              )}
              {(chartMetric === 'both' || chartMetric === 'height') && (
                <YAxis
                  yAxisId="height"
                  orientation={chartMetric === 'both' ? 'right' : 'left'}
                  domain={['dataMin - 2', 'dataMax + 2']}
                  tick={{ fill: '#B45309', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}cm`}
                />
              )}
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#DCE4DB',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: '#12372A',
                  boxShadow: '0 4px 12px rgba(18, 55, 42, 0.08)',
                }}
                formatter={(value, name) => {
                  if (name === 'weightKg') {
                    return [`${value} kg`, pick('वजन (Weight)', 'वजन', 'Weight')];
                  }
                  return [`${value} cm`, pick('लंबाई (Height)', 'लंबाई', 'Height')];
                }}
              />
              {(chartMetric === 'both' || chartMetric === 'weight') && (
                <Line
                  yAxisId="weight"
                  type="monotone"
                  dataKey="weightKg"
                  name="weightKg"
                  stroke="#0F766E"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#0F766E', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                  activeDot={{ r: 6, fill: '#0F766E' }}
                />
              )}
              {(chartMetric === 'both' || chartMetric === 'height') && (
                <Line
                  yAxisId="height"
                  type="monotone"
                  dataKey="heightCm"
                  name="heightCm"
                  stroke="#D97706"
                  strokeWidth={2.2}
                  strokeDasharray="5 3"
                  dot={{ r: 3.5, fill: '#D97706', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                  activeDot={{ r: 5.5, fill: '#D97706' }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center gap-5 text-xs text-[#435C51] pt-1 border-t border-[#E9EFE8]">
          {(chartMetric === 'both' || chartMetric === 'weight') && (
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-0.5 bg-[#0F766E] inline-block" aria-hidden="true" />
              <span>{pick('वजन (किग्रा)', 'वजन (किलो)', 'Weight (kg)')}</span>
            </span>
          )}
          {(chartMetric === 'both' || chartMetric === 'height') && (
            <span className="inline-flex items-center gap-2">
              <span
                className="w-4 h-0.5 border-t-2 border-dashed border-[#D97706] inline-block"
                aria-hidden="true"
              />
              <span>{pick('लंबाई (सेमी)', 'लंबाई (सेमी)', 'Height (cm)')}</span>
            </span>
          )}
        </div>
      </section>

      {/* Follow-Up History Log */}
      <section className="bg-white rounded-2xl border border-[#DCE4DB] p-4 sm:p-5">
        <h3 className="text-sm font-bold text-[#12372A] mb-3">{t.historyTitle}</h3>
        {child.followUpHistory.length === 0 ? (
          <p className="text-sm text-[#647B71]">{t.noHistory}</p>
        ) : (
          <ul className="divide-y divide-[#E9EFE8]">
            {child.followUpHistory.map((entry) => (
              <li key={entry.id} className="py-2.5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[#12372A]">{entry.actionTaken}</p>
                  {entry.workerNote && (
                    <p className="text-xs text-[#435C51] mt-0.5">{entry.workerNote}</p>
                  )}
                </div>
                <span className="text-xs font-mono-tabular text-[#647B71] whitespace-nowrap shrink-0">
                  {entry.date}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
