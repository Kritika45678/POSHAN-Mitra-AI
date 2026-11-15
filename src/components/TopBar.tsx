import { useEffect, useRef, useState } from 'react';
import {
  Plus,
  Sprout,
  Signal,
  SignalLow,
  WifiOff,
  CloudUpload,
  CheckCircle2,
} from 'lucide-react';
import type { Language, SyncInfo, TabId } from '../types.ts';
import { UI_TEXT } from '../i18n/translations.ts';
import emblemImg from '../assets/images/poshan_mitra_mark_1794631707133.jpg';

interface TopBarProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  onOpenAddChild: () => void;
  syncInfo: SyncInfo;
  language: Language;
}

const EMBLEM_SRC = emblemImg;

export function TopBar({
  activeTab,
  onSelectTab,
  onOpenAddChild,
  syncInfo,
  language,
}: TopBarProps) {
  const t = UI_TEXT[language];
  const pick = (hi: string, bho: string, en: string) =>
    language === 'bho' ? bho : language === 'hi' ? hi : en;

  const [imgFailed, setImgFailed] = useState(false);
  const [showSyncDetails, setShowSyncDetails] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!showSyncDetails) return;
    const handleOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowSyncDetails(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showSyncDetails]);

  const navItems: { id: TabId; label: string }[] = [
    { id: 'children', label: t.navChildren },
    { id: 'followups', label: t.navFollowUps },
    { id: 'risk-check', label: t.navRiskCheck },
    { id: 'guide', label: t.navGuide },
    { id: 'chat', label: t.navChat },
  ];

  const syncVisual =
    syncInfo.state === 'queued'
      ? {
          Icon: CloudUpload,
          SignalIcon: SignalLow,
          shortLabel: pick(
            `कतार (${syncInfo.pendingCount || 1})`,
            `कतार (${syncInfo.pendingCount || 1})`,
            `Queued (${syncInfo.pendingCount || 1})`
          ),
          fullTitle: pick(
            'ऑफ़लाइन · डेटा अपलोड कतार में है',
            'बिना नेटवर्क · डेटा भेजे खातिर कतार में बा',
            'Offline · Changes queued for upload'
          ),
          description: pick(
            'आपका बदला हुआ डेटा फोन में सुरक्षित है। इंटरनेट नेटवर्क आते ही यह अपने आप Firestore डेटाबेस में अपलोड हो जाएगा।',
            'रउआ जवन बदलले बानी, उ फोन में सुरक्षित बा। नेटवर्क अइला पर अपने आप Firestore डेटाबेस में चल जाई।',
            'Your edits are saved locally on this device and will upload automatically to Firestore once signal returns.'
          ),
          textClass: 'text-[#B45309]',
          bgClass: 'bg-[#FFFBEB] border-[#FDE68A] hover:bg-[#FEF3C7]',
        }
      : syncInfo.state === 'offline'
      ? {
          Icon: WifiOff,
          SignalIcon: WifiOff,
          shortLabel: pick('ऑफ़लाइन', 'बिना नेट', 'Offline'),
          fullTitle: pick(
            'ऑफ़लाइन मोड · स्थानीय डेटा चालू',
            'बिना नेटवर्क मोड · फोन में डेटा चालू बा',
            'Offline Mode · Local cache active'
          ),
          description: pick(
            'नेटवर्क उपलब्ध नहीं है, लेकिन आप पहले से सेव बच्चों की जानकारी देख और अपडेट कर सकती हैं।',
            'अभी नेटवर्क नइखे, बाकिर रउआ पहिले से सहेजल लइकन के हाल देख आ बदल सकेनी।',
            'No internet connection right now. You can keep viewing and updating records offline safely.'
          ),
          textClass: 'text-[#435C51]',
          bgClass: 'bg-[#F1F5EF] border-[#DCE4DB] hover:bg-[#E4ECE1]',
        }
      : syncInfo.state === 'syncing'
      ? {
          Icon: CloudUpload,
          SignalIcon: Signal,
          shortLabel: pick('सिंक...', 'भेजात बा...', 'Syncing...'),
          fullTitle: pick(
            'Firestore डेटाबेस में अपलोड हो रहा है',
            'Firestore डेटाबेस में डेटा भेजात बा',
            'Uploading changes to Firestore'
          ),
          description: pick(
            'स्थानीय बदलाव क्लाउड डेटाबेस के साथ सिंक किए जा रहे हैं।',
            'फोन के बदलल हाल क्लाउड डेटाबेस से जोड़ल जा रहल बा।',
            'Queued local updates are currently syncing with Firestore.'
          ),
          textClass: 'text-[#0F766E]',
          bgClass: 'bg-[#EEF6F3] border-[#0F766E]/30 hover:bg-[#E2F0EB]',
        }
      : {
          Icon: CheckCircle2,
          SignalIcon: Signal,
          shortLabel: pick('सिंक', 'जुड़ल बा', 'Synced'),
          fullTitle: pick(
            'Firestore डेटाबेस से सिंक है',
            'Firestore डेटाबेस से जुड़ल बा',
            'Synced with Firestore database'
          ),
          description: pick(
            'सभी बच्चों की जानकारी और फॉलो-अप रिकॉर्ड क्लाउड डेटाबेस में सुरक्षित हैं।',
            'सभे लइकन के हाल आ भेंट के हिसाब क्लाउड डेटाबेस में सुरक्षित बा।',
            'All child records and follow-up updates are safely synced with Firestore.'
          ),
          textClass: 'text-[#15803D]',
          bgClass: 'bg-[#F0FDF4] border-[#BBF7D0] hover:bg-[#DCFCE7]',
        };

  const ActiveSignalIcon = syncVisual.SignalIcon;
  const DetailIcon = syncVisual.Icon;

  return (
    <header className="sticky top-0 z-30 h-14 md:h-16 bg-white/95 backdrop-blur-md border-b border-[#DCE4DB]">
      <div className="max-w-7xl mx-auto h-full px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 lg:gap-6">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('children')}
          className="flex items-center gap-2 text-left whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#0F766E] rounded-lg min-h-[44px]"
        >
          {!imgFailed ? (
            <img
              src={EMBLEM_SRC}
              alt="Poshan Mitra Ai"
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover border border-[#DCE4DB] shrink-0"
            />
          ) : (
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#0F766E] text-white flex items-center justify-center shrink-0">
              <Sprout className="w-4 h-4" />
            </span>
          )}
          <span className="text-sm sm:text-lg font-bold tracking-tight text-[#12372A] whitespace-nowrap shrink-0">
            Poshan Mitra Ai
          </span>
        </button>

        {/* Zone 2: Single-Line Nav Links (Laptop/Desktop >= 1024px) */}
        <nav className="hidden lg:flex items-center gap-5 xl:gap-6" aria-label="Primary Navigation">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#0F766E] ${
                  isActive
                    ? 'text-[#0F766E] font-semibold'
                    : 'text-[#435C51] hover:text-[#12372A]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 right-0 bottom-0 h-0.5 bg-[#0F766E] rounded-full"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Offline/Firestore Sync Signal + Primary Action CTA */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0" ref={popoverRef}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSyncDetails((prev) => !prev)}
              aria-label={syncVisual.fullTitle}
              aria-expanded={showSyncDetails}
              title={syncVisual.fullTitle}
              className={`inline-flex items-center gap-1 sm:gap-1.5 min-h-[38px] sm:min-h-[40px] px-2 sm:px-3 py-1.5 rounded-xl border text-[11px] sm:text-xs font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#0F766E] ${syncVisual.bgClass} ${syncVisual.textClass}`}
            >
              <ActiveSignalIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="tabular-nums">{syncVisual.shortLabel}</span>
            </button>

            {showSyncDetails && (
              <div
                role="status"
                className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-24px)] bg-white rounded-2xl border border-[#DCE4DB] shadow-lg p-4 z-50 space-y-2.5 text-left"
              >
                <div className={`flex items-center gap-2 text-sm font-bold ${syncVisual.textClass}`}>
                  <DetailIcon className="w-4 h-4 shrink-0" />
                  <span>{syncVisual.fullTitle}</span>
                </div>
                <p className="text-xs text-[#435C51] leading-relaxed">
                  {syncVisual.description}
                </p>
                <div className="pt-2 border-t border-[#E9EFE8] flex items-center justify-between text-[11px] text-[#647B71] font-mono-tabular">
                  <span>
                    {pick('कतार में बदलाव:', 'कतार में बदलल:', 'Queued writes:')} {syncInfo.pendingCount}
                  </span>
                  {syncInfo.lastSyncedAt && (
                    <span>
                      {pick('अंतिम सिंक:', 'पाछिला सिंक:', 'Synced:')} {syncInfo.lastSyncedAt}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenAddChild}
            aria-label={t.addChildBtn}
            className="inline-flex items-center justify-center gap-1 sm:gap-1.5 min-h-[38px] sm:min-h-[40px] lg:min-h-[44px] px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-[#0F766E] hover:bg-[#0D625B] active:scale-[0.98] text-white text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E]"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="sm:hidden">{t.addChildShort}</span>
            <span className="hidden sm:inline">{t.addChildBtn.replace('+ ', '')}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
