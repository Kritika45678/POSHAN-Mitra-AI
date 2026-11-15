import { useEffect, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import {
  ArrowLeft,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Users,
  FileDown,
  Loader2,
  User as UserIcon,
  Star,
} from 'lucide-react';
import { auth } from './lib/firebase.ts';
import {
  createChildInDb,
  deleteChildFromDb,
  loadOrCreateWorkerProfile,
  markChildActionDoneInDb,
  saveWorkerProfile,
  seedInitialChildren,
  subscribeToChildren,
  subscribeToSnapshotsInSync,
  updateChildSignalsInDb,
} from './services/firestoreService.ts';
import { UI_TEXT } from './i18n/translations.ts';
import type { ChildRecord, Language, RiskLevel, SyncInfo, TabId, WorkerProfile } from './types.ts';
import { assessChildRisk } from './utils/riskEngine.ts';
import { downloadCenterPdfReport } from './utils/pdfReport.ts';
import { TopBar } from './components/TopBar.tsx';
import { BottomNav } from './components/BottomNav.tsx';
import { ChildListPanel } from './components/ChildListPanel.tsx';
import { ChildDetailWorkspace } from './components/ChildDetailWorkspace.tsx';
import { FollowUpQueueView } from './components/FollowUpQueueView.tsx';
import { QuickRiskCheckView } from './components/QuickRiskCheckView.tsx';
import { NutritionGuideView } from './components/NutritionGuideView.tsx';
import { PoshanChatView } from './components/PoshanChatView.tsx';
import { ProfileView } from './components/ProfileView.tsx';
import { FeedbackView } from './components/FeedbackView.tsx';
import { LoginPage } from './components/LoginPage.tsx';
import { AddChildModal } from './components/AddChildModal.tsx';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal.tsx';

export default function App() {
  const [language, setLanguage] = useState<Language>('hi');
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null);

  const [activeTab, setActiveTab] = useState<TabId>('children');
  const [children, setChildren] = useState<ChildRecord[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [mobileShowDetail, setMobileShowDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | RiskLevel>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [childToDelete, setChildToDelete] = useState<ChildRecord | null>(null);
  const [isDeletingChild, setIsDeletingChild] = useState(false);
  const [centerPdfLoading, setCenterPdfLoading] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [pendingState, setPendingState] = useState({
    hasPendingWrites: false,
    pendingCount: 0,
    fromCache: false,
    lastSyncedAt: null as string | null,
  });

  const seededRef = useRef<string | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      if (!firebaseUser) {
        setWorkerProfile(null);
        setChildren([]);
        seededRef.current = null;
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setDataLoading(true);
    setDbError(null);

    loadOrCreateWorkerProfile(user)
      .then((profile) => {
        if (active) setWorkerProfile(profile);
      })
      .catch((err) => {
        if (active) setDbError(err instanceof Error ? err.message : String(err));
      });

    const unsubscribe = subscribeToChildren(
      user.uid,
      async (docs, meta) => {
        if (!active) return;
        const seedStorageKey = `poshan_seeded_${user.uid}`;
        const alreadySeededLocally =
          typeof window !== 'undefined' && window.localStorage.getItem(seedStorageKey) === '1';

        if (docs.length > 0) {
          seededRef.current = user.uid;
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(seedStorageKey, '1');
          }
        } else if (seededRef.current !== user.uid && !alreadySeededLocally && isOnline) {
          seededRef.current = user.uid;
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(seedStorageKey, '1');
          }
          try {
            await seedInitialChildren(user.uid);
          } catch (err) {
            if (active) setDbError(err instanceof Error ? err.message : String(err));
          }
          return;
        }
        setChildren(docs);
        setPendingState((prev) => ({
          hasPendingWrites: meta.hasPendingWrites,
          pendingCount: meta.pendingCount,
          fromCache: meta.fromCache,
          lastSyncedAt:
            !meta.hasPendingWrites && !meta.fromCache
              ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : prev.lastSyncedAt,
        }));
        setDataLoading(false);
      },
      (err) => {
        if (active) {
          setDbError(err.message);
          setDataLoading(false);
        }
      }
    );

    const unsubSync = subscribeToSnapshotsInSync(() => {
      if (!active) return;
      setPendingState((prev) => ({
        ...prev,
        hasPendingWrites: false,
        pendingCount: 0,
        lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }));
    });

    return () => {
      active = false;
      unsubscribe();
      unsubSync();
    };
  }, [user, isOnline]);

  const syncInfo: SyncInfo = useMemo(() => {
    const state = !isOnline
      ? pendingState.hasPendingWrites
        ? 'queued'
        : 'offline'
      : pendingState.hasPendingWrites
      ? 'syncing'
      : 'synced';
    return {
      state,
      pendingCount: pendingState.pendingCount,
      fromCache: pendingState.fromCache,
      lastSyncedAt: pendingState.lastSyncedAt,
    };
  }, [isOnline, pendingState]);

  const t = UI_TEXT[language];
  const isDevanagari = language === 'hi' || language === 'bho';
  const pick = (hi: string, bho: string, en: string) =>
    language === 'bho' ? bho : language === 'hi' ? hi : en;

  const assessedChildren = useMemo(() => {
    return children
      .map((child) => ({
        child,
        assessment: assessChildRisk(child),
      }))
      .sort((a, b) => b.assessment.score - a.assessment.score);
  }, [children]);

  const counts = useMemo(() => {
    let high = 0;
    let rising = 0;
    let normal = 0;
    for (const item of assessedChildren) {
      if (item.assessment.level === 'high') high += 1;
      else if (item.assessment.level === 'rising') rising += 1;
      else normal += 1;
    }
    return {
      all: assessedChildren.length,
      high,
      rising,
      normal,
    };
  }, [assessedChildren]);

  const filteredChildren = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return assessedChildren.filter(({ child, assessment }) => {
      if (riskFilter !== 'all' && assessment.level !== riskFilter) return false;
      if (!q) return true;
      return (
        child.nameHi.toLowerCase().includes(q) ||
        child.nameEn.toLowerCase().includes(q) ||
        child.motherNameHi.toLowerCase().includes(q) ||
        child.motherNameEn.toLowerCase().includes(q) ||
        child.ward.toLowerCase().includes(q)
      );
    });
  }, [assessedChildren, riskFilter, searchQuery]);

  const selectedEntry = useMemo(() => {
    if (assessedChildren.length === 0) return undefined;
    return (
      assessedChildren.find((item) => item.child.id === selectedChildId) ||
      assessedChildren[0]
    );
  }, [assessedChildren, selectedChildId]);

  const pendingFollowUpCount = useMemo(() => {
    return assessedChildren.filter(
      (item) => item.assessment.level !== 'normal' && !item.child.lastActionDoneAt
    ).length;
  }, [assessedChildren]);

  const handleUpdateChild = async (updated: ChildRecord) => {
    if (!user) return;
    setChildren((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    try {
      await updateChildSignalsInDb(user.uid, updated);
    } catch (err) {
      setDbError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleMarkActionDone = async (childId: string, actionText: string) => {
    if (!user) return;
    const target = children.find((c) => c.id === childId);
    if (!target) return;

    const todayLabel = new Date().toLocaleDateString(isDevanagari ? 'hi-IN' : 'en-IN', {
      day: '2-digit',
      month: 'short',
    });
    const timestamp = new Date().toISOString();
    const updatedHistory = [
      {
        id: `f-${Date.now()}`,
        date: todayLabel,
        actionTaken: actionText,
        workerNote: pick(
          'कार्यकर्ता द्वारा गृह भेंट / फॉलो-अप पूर्ण दर्ज',
          'आंगनवाड़ी दीदी द्वारा घर भेंट आ काम पूरा दर्ज भइल',
          'Follow-up marked complete by worker'
        ),
        completed: true,
      },
      ...target.followUpHistory,
    ];

    setChildren((prev) =>
      prev.map((c) =>
        c.id === childId
          ? { ...c, lastActionDoneAt: timestamp, followUpHistory: updatedHistory }
          : c
      )
    );

    try {
      await markChildActionDoneInDb(user.uid, childId, timestamp, updatedHistory);
    } catch (err) {
      setDbError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleAddChild = async (newChild: ChildRecord) => {
    if (!user) return;
    setChildren((prev) => [newChild, ...prev]);
    setSelectedChildId(newChild.id);
    setActiveTab('children');
    setMobileShowDetail(true);
    try {
      await createChildInDb(user.uid, newChild);
    } catch (err) {
      setDbError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleConfirmDeleteChild = async () => {
    if (!user || !childToDelete) return;
    const targetId = childToDelete.id;
    setIsDeletingChild(true);
    setDbError(null);

    try {
      await deleteChildFromDb(user.uid, targetId);
      setChildren((prev) => {
        const remaining = prev.filter((c) => c.id !== targetId);
        if (selectedChildId === targetId) {
          setSelectedChildId(remaining[0]?.id || '');
          setMobileShowDetail(false);
        }
        return remaining;
      });
      setChildToDelete(null);
    } catch (err) {
      setDbError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsDeletingChild(false);
    }
  };

  const handleSaveWorkerProfile = async (updated: WorkerProfile) => {
    if (!user) return;
    await saveWorkerProfile(user.uid, updated);
    setWorkerProfile(updated);
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const handleSelectChildFromList = (id: string) => {
    setSelectedChildId(id);
    setMobileShowDetail(true);
  };

  const handleOpenChildFromQueue = (id: string) => {
    setSelectedChildId(id);
    setActiveTab('children');
    setMobileShowDetail(true);
  };

  if (!authReady) {
    return (
      <div className="min-h-[100dvh] bg-[#F8FAF7] flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-semibold text-[#12372A]">
          <Loader2 className="w-5 h-5 animate-spin text-[#0F766E]" />
          <span>Poshan Mitra Ai...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage language={language} onLanguageChange={setLanguage} />;
  }

  return (
    <div className="min-h-[100dvh] bg-[#F8FAF7] text-[#12372A] flex flex-col overflow-x-hidden">
      <TopBar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'children') setMobileShowDetail(false);
        }}
        onOpenAddChild={() => setIsAddOpen(true)}
        syncInfo={syncInfo}
        language={language}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6 pb-24 lg:pb-10 space-y-5">
        {/* Workspace Toolbar: Center Context + Center PDF + Profile + Language Switcher */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-[#435C51] truncate">
              {workerProfile?.centerCode || t.centerBadge}
            </p>
            <h1 className="text-lg sm:text-2xl font-bold text-[#12372A] tracking-tight mt-0.5 text-balance">
              {pick(
                'बच्चों के बिखरे संकेत एक साथ — समय रहते पोषण सुरक्षा',
                'लइकन के छितराइल हाल एक साथे — समय रहते पोषण सुरक्षा',
                'Scattered Signals Unified — Early Malnutrition Protection'
              )}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={centerPdfLoading || assessedChildren.length === 0}
              onClick={async () => {
                setCenterPdfLoading(true);
                try {
                  await downloadCenterPdfReport(assessedChildren, workerProfile, language);
                } finally {
                  setCenterPdfLoading(false);
                }
              }}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-3 sm:px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F1F5EF] border border-[#DCE4DB] text-xs font-semibold text-[#12372A] transition-colors whitespace-nowrap disabled:opacity-50"
            >
              {centerPdfLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#0F766E]" />
              ) : (
                <FileDown className="w-4 h-4 text-[#0F766E]" />
              )}
              <span>{pick('केंद्र PDF रिपोर्ट', 'केंद्र PDF रपट', 'Center PDF')}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`inline-flex items-center gap-2 min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'bg-[#EEF6F3] border-[#0F766E] text-[#0F766E]'
                  : 'bg-white hover:bg-[#F1F5EF] border-[#DCE4DB] text-[#12372A]'
              }`}
            >
              {workerProfile?.photoUrl ? (
                <img
                  src={workerProfile.photoUrl}
                  alt={workerProfile.displayName}
                  referrerPolicy="no-referrer"
                  className="w-5 h-5 rounded-md object-cover"
                />
              ) : (
                <UserIcon className="w-4 h-4 text-[#0F766E]" />
              )}
              <span className="max-w-[96px] sm:max-w-[120px] truncate">
                {workerProfile?.displayName || t.navProfile}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('feedback')}
              className={`inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap ${
                activeTab === 'feedback'
                  ? 'bg-[#FFFBEB] border-[#D97706] text-[#B45309]'
                  : 'bg-white hover:bg-[#F1F5EF] border-[#DCE4DB] text-[#12372A]'
              }`}
            >
              <Star
                className={`w-4 h-4 ${
                  activeTab === 'feedback'
                    ? 'fill-[#F59E0B] text-[#D97706]'
                    : 'text-[#D97706]'
                }`}
              />
              <span>{t.navFeedback}</span>
            </button>

            <div
              className="inline-flex items-center p-1 bg-[#E9EFE8] rounded-xl shrink-0"
              role="group"
              aria-label="Language"
            >
              <button
                type="button"
                onClick={() => setLanguage('bho')}
                className={`min-h-[34px] px-2.5 sm:px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  language === 'bho'
                    ? 'bg-white text-[#12372A] shadow-xs'
                    : 'text-[#435C51] hover:text-[#12372A]'
                }`}
              >
                भोजपुरी
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`min-h-[34px] px-2.5 sm:px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  language === 'hi'
                    ? 'bg-white text-[#12372A] shadow-xs'
                    : 'text-[#435C51] hover:text-[#12372A]'
                }`}
              >
                हिन्दी
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`min-h-[34px] px-2.5 sm:px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  language === 'en'
                    ? 'bg-white text-[#12372A] shadow-xs'
                    : 'text-[#435C51] hover:text-[#12372A]'
                }`}
              >
                EN
              </button>
            </div>
          </div>
        </div>

        {dbError && (
          <div className="p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs font-medium text-[#B91C1C]">
            {dbError}
          </div>
        )}

        {/* 4-Column Summary Metric Strip (shown on core tracking views) */}
        {activeTab !== 'profile' && activeTab !== 'chat' && activeTab !== 'feedback' && (
          <section
            aria-label={pick('केंद्र का सारांश', 'केंद्र के पूरा हाल', 'Center Summary')}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3"
          >
            <button
              type="button"
              onClick={() => {
                setActiveTab('children');
                setRiskFilter('all');
                setMobileShowDetail(false);
              }}
              className="bg-white hover:bg-[#F1F5EF] rounded-2xl border border-[#DCE4DB] p-4 text-left transition-colors"
            >
              <div className="flex items-center justify-between gap-2 text-xs font-medium text-[#435C51]">
                <span>{pick('कुल पंजीकृत बच्चे', 'कुल लिखल लइका', 'Registered Children')}</span>
                <Users className="w-4 h-4 text-[#0F766E] shrink-0" />
              </div>
              <p className="text-2xl font-bold font-mono-tabular text-[#12372A] mt-1.5">
                {counts.all}
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('children');
                setRiskFilter('high');
                setMobileShowDetail(false);
              }}
              className="bg-[#FEF2F2] hover:bg-[#FEE2E2] rounded-2xl border border-[#FECACA] p-4 text-left transition-colors"
            >
              <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#B91C1C]">
                <span>{pick('उच्च जोखिम (SAM)', 'बेसी खतरा (SAM)', 'High Risk (SAM)')}</span>
                <AlertTriangle className="w-4 h-4 shrink-0" />
              </div>
              <p className="text-2xl font-bold font-mono-tabular text-[#B91C1C] mt-1.5">
                {counts.high}
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('children');
                setRiskFilter('rising');
                setMobileShowDetail(false);
              }}
              className="bg-[#FFFBEB] hover:bg-[#FEF3C7] rounded-2xl border border-[#FDE68A] p-4 text-left transition-colors"
            >
              <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#B45309]">
                <span>{pick('बढ़ता जोखिम (MAM)', 'बढ़त खतरा (MAM)', 'Rising Risk (MAM)')}</span>
                <TrendingUp className="w-4 h-4 shrink-0" />
              </div>
              <p className="text-2xl font-bold font-mono-tabular text-[#B45309] mt-1.5">
                {counts.rising}
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('children');
                setRiskFilter('normal');
                setMobileShowDetail(false);
              }}
              className="bg-[#F0FDF4] hover:bg-[#DCFCE7] rounded-2xl border border-[#BBF7D0] p-4 text-left transition-colors"
            >
              <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#15803D]">
                <span>{pick('सामान्य / स्वस्थ', 'स्वस्थ / ठीक बा', 'Healthy / Normal')}</span>
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              </div>
              <p className="text-2xl font-bold font-mono-tabular text-[#15803D] mt-1.5">
                {counts.normal}
              </p>
            </button>
          </section>
        )}

        {/* Active View Content */}
        {activeTab === 'children' && (
          dataLoading && children.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#DCE4DB] p-8 flex items-center justify-center gap-3 text-sm text-[#435C51]">
              <Loader2 className="w-5 h-5 animate-spin text-[#0F766E]" />
              <span>
                {pick(
                  'डेटाबेस से बच्चों का विवरण लोड हो रहा है...',
                  'डेटाबेस से लइकन के हाल लोड हो रहल बा...',
                  'Loading records from Firestore...'
                )}
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className={`lg:col-span-5 min-w-0 ${mobileShowDetail ? 'hidden lg:block' : 'block'}`}>
                <ChildListPanel
                  items={filteredChildren}
                  selectedChildId={selectedEntry?.child.id || ''}
                  onSelectChild={handleSelectChildFromList}
                  onOpenAddChild={() => setIsAddOpen(true)}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  riskFilter={riskFilter}
                  onRiskFilterChange={setRiskFilter}
                  counts={counts}
                  language={language}
                />
              </div>

              <div className={`lg:col-span-7 min-w-0 ${mobileShowDetail ? 'block' : 'hidden lg:block'}`}>
                <div className="lg:hidden mb-3">
                  <button
                    type="button"
                    onClick={() => setMobileShowDetail(false)}
                    className="inline-flex items-center gap-2 min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#DCE4DB] text-sm font-semibold text-[#12372A]"
                  >
                    <ArrowLeft className="w-4 h-4 text-[#0F766E]" />
                    <span>{pick('सभी बच्चों की सूची', 'सभे लइका के सूची', 'Back to Child List')}</span>
                  </button>
                </div>

                {selectedEntry && (
                  <ChildDetailWorkspace
                    child={selectedEntry.child}
                    assessment={selectedEntry.assessment}
                    workerProfile={workerProfile}
                    onUpdateChild={handleUpdateChild}
                    onMarkActionDone={handleMarkActionDone}
                    onRequestDeleteChild={(child) => setChildToDelete(child)}
                    language={language}
                  />
                )}
              </div>
            </div>
          )
        )}

        {activeTab === 'followups' && (
          <FollowUpQueueView
            items={assessedChildren}
            onOpenChild={handleOpenChildFromQueue}
            onMarkDone={handleMarkActionDone}
            language={language}
          />
        )}

        {activeTab === 'risk-check' && <QuickRiskCheckView language={language} />}

        {activeTab === 'guide' && <NutritionGuideView language={language} />}

        {activeTab === 'chat' && (
          <PoshanChatView selectedChild={selectedEntry?.child} language={language} />
        )}

        {activeTab === 'profile' && workerProfile && (
          <ProfileView
            profile={workerProfile}
            googlePhotoUrl={user.photoURL || ''}
            onSaveProfile={handleSaveWorkerProfile}
            onSignOut={handleSignOut}
            language={language}
          />
        )}

        {activeTab === 'feedback' && (
          <FeedbackView
            currentUid={user.uid}
            defaultAuthorName={workerProfile?.displayName || user.displayName || ''}
            language={language}
          />
        )}
      </main>

      <BottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'children') setMobileShowDetail(false);
        }}
        pendingFollowUpCount={pendingFollowUpCount}
        language={language}
      />

      <AddChildModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={handleAddChild}
        language={language}
      />

      <ConfirmDeleteModal
        child={childToDelete}
        isDeleting={isDeletingChild}
        onCancel={() => {
          if (!isDeletingChild) setChildToDelete(null);
        }}
        onConfirm={handleConfirmDeleteChild}
        language={language}
      />
    </div>
  );
}
