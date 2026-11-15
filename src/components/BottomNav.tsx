import { Users, ClipboardCheck, MessageSquareHeart, BookOpen, User, Star,Activity} from 'lucide-react';
import type { Language, TabId } from '../types.ts';
import { UI_TEXT } from '../i18n/translations.ts';

interface BottomNavProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  pendingFollowUpCount: number;
  language: Language;
}

export function BottomNav({
  activeTab,
  onSelectTab,
  pendingFollowUpCount,
  language,
}: BottomNavProps) {
  const t = UI_TEXT[language];
  const pick = (hi: string, bho: string, en: string) =>
    language === 'bho' ? bho : language === 'hi' ? hi : en;

  const tabs: { id: TabId; label: string; icon: typeof Users; badge?: number }[] = [
    { id: 'children', label: pick('बच्चे', 'लइका', 'Children'), icon: Users },
    {
      id: 'followups',
      label: pick('फॉलो-अप', 'भेंट', 'Visits'),
      icon: ClipboardCheck,
      badge: pendingFollowUpCount,
    },
    {
      id: 'risk-check',
      label: pick('त्वरित जांच', 'तुरंत जांच', 'Quick Check'),
      icon: Activity,
    },
    { id: 'chat', label: pick('AI चैट', 'AI चैट', 'AI Chat'), icon: MessageSquareHeart },
    { id: 'guide', label: pick('पोषण', 'पोषण', 'Guide'), icon: BookOpen },
    { id: 'profile', label: pick('प्रोफ़ाइल', 'प्रोफ़ाइल', 'Profile'), icon: User },
    { id: 'feedback', label: pick('फीडबैक', 'फीडबैक', 'Feedback'), icon: Star },
  ];

  return (
    <nav
      aria-label={t.navChildren}
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 min-h-[60px] pb-[env(safe-area-inset-bottom)] bg-white/95 backdrop-blur-md border-t border-[#DCE4DB] grid grid-cols-7 items-center px-0.5"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className={`relative flex flex-col items-center justify-center min-h-[48px] py-1 rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-[#0F766E] ${
              isActive ? 'text-[#0F766E]' : 'text-[#647B71] hover:text-[#12372A]'
            }`}
          >
            <div className="relative">
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.4 : 1.8} />
              {typeof tab.badge === 'number' && tab.badge > 0 && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-md bg-[#D97706] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {tab.badge}
                </span>
              )}
            </div>
            <span
              className={`text-[10.5px] mt-0.5 whitespace-nowrap ${
                isActive ? 'font-semibold' : 'font-medium'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
