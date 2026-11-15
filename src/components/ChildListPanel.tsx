import {
  Search,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  ChevronRight,
  Plus,
} from 'lucide-react';
import type { ChildRecord, Language, RiskAssessment, RiskLevel } from '../types.ts';
import { UI_TEXT } from '../i18n/translations.ts';

interface ChildWithAssessment {
  child: ChildRecord;
  assessment: RiskAssessment;
}

interface ChildListPanelProps {
  items: ChildWithAssessment[];
  selectedChildId: string;
  onSelectChild: (id: string) => void;
  onOpenAddChild: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  riskFilter: 'all' | RiskLevel;
  onRiskFilterChange: (filter: 'all' | RiskLevel) => void;
  counts: { all: number; high: number; rising: number; normal: number };
  language: Language;
}

export function ChildListPanel({
  items,
  selectedChildId,
  onSelectChild,
  onOpenAddChild,
  searchQuery,
  onSearchChange,
  riskFilter,
  onRiskFilterChange,
  counts,
  language,
}: ChildListPanelProps) {
  const t = UI_TEXT[language];
  const pick = (hi: string, bho: string, en: string) =>
    language === 'bho' ? bho : language === 'hi' ? hi : en;

  const filters: { id: 'all' | RiskLevel; label: string; count: number }[] = [
    { id: 'all', label: t.filterAll, count: counts.all },
    { id: 'high', label: t.filterHigh, count: counts.high },
    { id: 'rising', label: t.filterRising, count: counts.rising },
    { id: 'normal', label: t.filterNormal, count: counts.normal },
  ];

  return (
    <section className="bg-white rounded-2xl border border-[#DCE4DB] overflow-hidden">
      {/* Search + Segmented Risk Filter */}
      <div className="p-4 border-b border-[#DCE4DB] space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#647B71] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t.searchPlaceholder}
            aria-label={t.searchPlaceholder}
            className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl bg-[#F8FAF7] border border-[#DCE4DB] text-sm text-[#12372A] placeholder:text-[#647B71] focus:outline-none focus:border-[#0F766E]"
          />
        </div>

        <div className="grid grid-cols-4 gap-1 p-1 bg-[#F1F5EF] rounded-xl">
          {filters.map((f) => {
            const active = riskFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onRiskFilterChange(f.id)}
                className={`min-h-[38px] px-1.5 sm:px-2 py-1.5 rounded-lg text-[11px] sm:text-xs font-medium transition-colors whitespace-nowrap truncate ${
                  active
                    ? 'bg-white text-[#12372A] font-semibold shadow-xs'
                    : 'text-[#435C51] hover:text-[#12372A]'
                }`}
              >
                {f.label} <span className="tabular-nums opacity-75">({f.count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Child List Rows */}
      {counts.all === 0 ? (
        <div className="p-8 text-center space-y-3">
          <p className="text-sm text-[#435C51]">
            {pick(
              'सूची में अभी कोई बच्चा दर्ज नहीं है।',
              'सूची में अभी कवनो लइका दर्ज नइखे।',
              'No children in your list yet.'
            )}
          </p>
          <button
            type="button"
            onClick={onOpenAddChild}
            className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl bg-[#0F766E] hover:bg-[#0D625B] text-white text-sm font-semibold transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addChildBtn.replace('+ ', '')}</span>
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center space-y-3">
          <p className="text-sm text-[#435C51]">{t.emptyFilterTitle}</p>
          <button
            type="button"
            onClick={() => {
              onSearchChange('');
              onRiskFilterChange('all');
            }}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#F1F5EF] hover:bg-[#E5ECE2] text-[#12372A] text-sm font-medium transition-colors"
          >
            {t.emptyFilterReset}
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-[#E9EFE8]">
          {items.map(({ child, assessment }) => {
            const isSelected = child.id === selectedChildId;
            const isDevanagari = language === 'hi' || language === 'bho';
            const childName = isDevanagari ? child.nameHi : child.nameEn;
            const motherName = isDevanagari ? child.motherNameHi : child.motherNameEn;
            const genderLabel = child.gender === 'girl' ? t.girl : t.boy;

            const riskConfig =
              assessment.level === 'high'
                ? {
                    icon: AlertTriangle,
                    iconBg: 'bg-[#FEF2F2] text-[#B91C1C]',
                    textColor: 'text-[#B91C1C]',
                    label:
                      language === 'bho'
                        ? 'बेसी खतरा'
                        : language === 'hi'
                        ? 'उच्च जोखिम'
                        : 'High Risk',
                  }
                : assessment.level === 'rising'
                ? {
                    icon: TrendingUp,
                    iconBg: 'bg-[#FFFBEB] text-[#B45309]',
                    textColor: 'text-[#B45309]',
                    label:
                      language === 'bho'
                        ? 'बढ़त खतरा'
                        : language === 'hi'
                        ? 'बढ़ता जोखिम'
                        : 'Rising Watch',
                  }
                : {
                    icon: CheckCircle2,
                    iconBg: 'bg-[#F0FDF4] text-[#15803D]',
                    textColor: 'text-[#15803D]',
                    label:
                      language === 'bho'
                        ? 'स्वस्थ'
                        : language === 'hi'
                        ? 'स्वस्थ'
                        : 'Normal',
                  };

            const RiskIcon = riskConfig.icon;

            return (
              <li key={child.id}>
                <button
                  type="button"
                  onClick={() => onSelectChild(child.id)}
                  className={`w-full text-left px-4 py-3.5 min-h-[68px] flex items-center gap-3.5 transition-colors focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#0F766E] ${
                    isSelected ? 'bg-[#EEF6F3]' : 'bg-white hover:bg-[#F8FAF7]'
                  }`}
                >
                  {/* Semantic Risk Icon Circle */}
                  <span
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${riskConfig.iconBg}`}
                    aria-hidden="true"
                  >
                    <RiskIcon className="w-5 h-5" />
                  </span>

                  {/* Middle Content: Clean unboxed typography with separators */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[15px] font-semibold text-[#12372A] truncate">
                        {childName}
                      </span>
                      <span className={`text-xs font-semibold whitespace-nowrap shrink-0 ${riskConfig.textColor}`}>
                        {riskConfig.label}
                      </span>
                    </div>

                    <p className="text-xs text-[#435C51] mt-0.5 truncate">
                      <span>{t.motherLabel}: {motherName}</span>
                      <span aria-hidden="true"> · </span>
                      <span className="tabular-nums">
                        {child.ageMonths} {t.monthsUnit}
                      </span>
                      <span aria-hidden="true"> · </span>
                      <span>{genderLabel}</span>
                    </p>

                    <p className="text-xs text-[#647B71] mt-1 font-mono-tabular truncate">
                      MUAC {child.muacMm}mm · {child.weightKg}kg · {child.attendanceDays}/{child.totalDays}d
                    </p>
                  </div>

                  <ChevronRight
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isSelected ? 'text-[#0F766E] translate-x-0.5' : 'text-[#94A89D]'
                    }`}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
