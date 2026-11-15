export type Language = 'hi' | 'bho' | 'en';

export type RiskLevel = 'high' | 'rising' | 'normal';

export type RationStatus = 'collected' | 'partial' | 'missed';

export type TabId = 'children' | 'followups' | 'risk-check' | 'guide' | 'chat' | 'profile' | 'feedback';

export type SyncState = 'synced' | 'syncing' | 'queued' | 'offline';

export interface SyncInfo {
  state: SyncState;
  pendingCount: number;
  fromCache: boolean;
  lastSyncedAt: string | null;
}

export type WorkerGender = 'female' | 'male' | 'other' | '';

export interface WorkerProfile {
  uid: string;
  displayName: string;
  centerCode: string;
  photoUrl: string;
  email: string;
  phone: string;
  gender: WorkerGender;
  address: string;
  villageWard: string;
  districtState: string;
  pincode: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export type IllnessFlag = 'diarrhea' | 'fever' | 'cough' | 'appetite_loss';

export type HouseholdFlag = 'food_shortage' | 'migration' | 'mother_unwell' | 'missed_ifa';

export interface FollowUpEntry {
  id: string;
  date: string;
  actionTaken: string;
  workerNote: string;
  completed: boolean;
}

export interface GrowthPoint {
  monthHi: string;
  monthEn: string;
  weightKg: number;
  heightCm: number;
}

export interface ChildRecord {
  id: string;
  nameHi: string;
  nameEn: string;
  motherNameHi: string;
  motherNameEn: string;
  ward: string;
  ageMonths: number;
  gender: 'girl' | 'boy';
  phone: string;
  // Scattered Signal 1: Attendance
  attendanceDays: number;
  totalDays: number;
  recentAbsenceStreak: number;
  // Scattered Signal 2: Ration / THR uptake
  rationStatus: RationStatus;
  // Scattered Signal 3: Health & Growth
  weightKg: number;
  prevWeightKg: number;
  heightCm: number;
  muacMm: number;
  growthHistory: GrowthPoint[];
  recentIllness: IllnessFlag[];
  immunizationUpToDate: boolean;
  // Scattered Signal 4: Household Context
  householdFactors: HouseholdFlag[];
  // Follow-up state
  lastActionDoneAt?: string;
  followUpHistory: FollowUpEntry[];
}

export interface RiskSignalReason {
  stream: 'health' | 'attendance' | 'ration' | 'household';
  labelHi: string;
  labelBho: string;
  labelEn: string;
  severity: 'high' | 'rising' | 'info';
}

export interface RiskAssessment {
  level: RiskLevel;
  score: number;
  reasons: RiskSignalReason[];
  oneClearActionHi: string;
  oneClearActionBho: string;
  oneClearActionEn: string;
  urgencyHi: string;
  urgencyBho: string;
  urgencyEn: string;
  counselingHintHi: string;
  counselingHintBho: string;
  counselingHintEn: string;
}

export interface AiAnalysisResult {
  oneClearAction: string;
  whyFlagged: string[];
  motherCounselingScript: string;
  urgencyLabel: string;
}

export interface FeedbackEntry {
  id: string;
  authorId: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
}
