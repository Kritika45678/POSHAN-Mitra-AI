import type { User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  onSnapshotsInSync,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase.ts';
import type { ChildRecord, FeedbackEntry, FollowUpEntry, WorkerProfile } from '../types.ts';
import { INITIAL_CHILDREN } from '../data/initialChildren.ts';

const sanitizeId = (id: string) => id.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 128);

export async function loadOrCreateWorkerProfile(user: User): Promise<WorkerProfile> {
  const uid = user.uid;
  const publicPath = `users/${uid}`;
  const privatePath = `users/${uid}/private/profile`;

  const publicRef = doc(db, 'users', uid);
  const privateRef = doc(db, 'users', uid, 'private', 'profile');

  let publicSnap;
  try {
    publicSnap = await getDoc(publicRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, publicPath);
  }

  let privateSnap;
  try {
    privateSnap = await getDoc(privateRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, privatePath);
  }

  const defaultDisplayName = (user.displayName || 'आंगनवाड़ी कार्यकर्ता').slice(0, 120);
  const defaultPhoto = (user.photoURL || '').slice(0, 200000);
  const defaultEmail = (user.email || '').slice(0, 160);

  if (!publicSnap.exists()) {
    try {
      await setDoc(publicRef, {
        uid,
        displayName: defaultDisplayName,
        centerCode: 'केंद्र 042 · रामपुर वार्ड 3',
        photoUrl: defaultPhoto,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, publicPath);
    }
  }

  if (!privateSnap.exists()) {
    try {
      await setDoc(privateRef, {
        uid,
        email: defaultEmail,
        phone: '',
        gender: 'female',
        address: '',
        villageWard: 'रामपुर वार्ड 3',
        districtState: '',
        pincode: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, privatePath);
    }
  }

  const pubData = publicSnap.exists() ? publicSnap.data() : {};
  const privData = privateSnap.exists() ? privateSnap.data() : {};

  return {
    uid,
    displayName: typeof pubData.displayName === 'string' ? pubData.displayName : defaultDisplayName,
    centerCode:
      typeof pubData.centerCode === 'string'
        ? pubData.centerCode
        : 'केंद्र 042 · रामपुर वार्ड 3',
    photoUrl: typeof pubData.photoUrl === 'string' ? pubData.photoUrl : defaultPhoto,
    email: typeof privData.email === 'string' ? privData.email : defaultEmail,
    phone: typeof privData.phone === 'string' ? privData.phone : '',
    gender:
      privData.gender === 'female' || privData.gender === 'male' || privData.gender === 'other'
        ? privData.gender
        : 'female',
    address: typeof privData.address === 'string' ? privData.address : '',
    villageWard:
      typeof privData.villageWard === 'string' ? privData.villageWard : 'रामपुर वार्ड 3',
    districtState: typeof privData.districtState === 'string' ? privData.districtState : '',
    pincode: typeof privData.pincode === 'string' ? privData.pincode : '',
  };
}

export async function saveWorkerProfile(uid: string, profile: WorkerProfile): Promise<void> {
  const publicPath = `users/${uid}`;
  const privatePath = `users/${uid}/private/profile`;

  const publicRef = doc(db, 'users', uid);
  const privateRef = doc(db, 'users', uid, 'private', 'profile');

  try {
    await updateDoc(publicRef, {
      displayName: (profile.displayName.trim() || 'आंगनवाड़ी कार्यकर्ता').slice(0, 120),
      centerCode: profile.centerCode.trim().slice(0, 80),
      photoUrl: profile.photoUrl.slice(0, 200000),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, publicPath);
  }

  try {
    await updateDoc(privateRef, {
      email: profile.email.trim().slice(0, 160),
      phone: profile.phone.trim().slice(0, 30),
      gender: profile.gender,
      address: profile.address.trim().slice(0, 300),
      villageWard: profile.villageWard.trim().slice(0, 120),
      districtState: profile.districtState.trim().slice(0, 120),
      pincode: profile.pincode.trim().slice(0, 16),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, privatePath);
  }
}

function toFirestoreChildPayload(uid: string, child: ChildRecord) {
  const safeId = sanitizeId(child.id);
  const payload: Record<string, unknown> = {
    id: safeId,
    ownerId: uid,
    nameHi: child.nameHi.slice(0, 120),
    nameEn: child.nameEn.slice(0, 120),
    motherNameHi: child.motherNameHi.slice(0, 120),
    motherNameEn: child.motherNameEn.slice(0, 120),
    ward: (child.ward || '').slice(0, 120),
    ageMonths: child.ageMonths,
    gender: child.gender,
    phone: (child.phone || '').slice(0, 30),
    attendanceDays: child.attendanceDays,
    totalDays: child.totalDays,
    recentAbsenceStreak: child.recentAbsenceStreak ?? 0,
    rationStatus: child.rationStatus,
    weightKg: child.weightKg,
    prevWeightKg: child.prevWeightKg,
    heightCm: child.heightCm,
    muacMm: child.muacMm,
    growthHistory: (child.growthHistory || []).slice(-24),
    recentIllness: (child.recentIllness || []).slice(0, 6),
    immunizationUpToDate: child.immunizationUpToDate,
    householdFactors: (child.householdFactors || []).slice(0, 6),
    followUpHistory: (child.followUpHistory || []).slice(0, 50),
  };

  if (child.lastActionDoneAt) {
    payload.lastActionDoneAt = child.lastActionDoneAt.slice(0, 64);
  }
  return payload;
}

export async function seedInitialChildren(uid: string): Promise<void> {
  const path = `users/${uid}/children`;
  try {
    const batch = writeBatch(db);
    for (const child of INITIAL_CHILDREN) {
      const safeId = sanitizeId(child.id);
      const childRef = doc(db, 'users', uid, 'children', safeId);
      batch.set(childRef, {
        ...toFirestoreChildPayload(uid, child),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export interface ChildrenSnapshotMeta {
  hasPendingWrites: boolean;
  pendingCount: number;
  fromCache: boolean;
}

export function subscribeToChildren(
  uid: string,
  onData: (children: ChildRecord[], meta: ChildrenSnapshotMeta) => void,
  onError: (err: Error) => void
): () => void {
  const path = `users/${uid}/children`;
  const q = query(collection(db, 'users', uid, 'children'), where('ownerId', '==', uid));

  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snapshot) => {
      const pendingCount = snapshot.docs.filter((d) => d.metadata.hasPendingWrites).length;
      const hasPendingWrites = snapshot.metadata.hasPendingWrites || pendingCount > 0;
      const fromCache = snapshot.metadata.fromCache;

      const list: ChildRecord[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          nameHi: String(data.nameHi ?? ''),
          nameEn: String(data.nameEn ?? ''),
          motherNameHi: String(data.motherNameHi ?? ''),
          motherNameEn: String(data.motherNameEn ?? ''),
          ward: String(data.ward ?? ''),
          ageMonths: Number(data.ageMonths ?? 18),
          gender: data.gender === 'boy' ? 'boy' : 'girl',
          phone: String(data.phone ?? ''),
          attendanceDays: Number(data.attendanceDays ?? 0),
          totalDays: Number(data.totalDays ?? 24),
          recentAbsenceStreak: Number(data.recentAbsenceStreak ?? 0),
          rationStatus:
            data.rationStatus === 'collected' || data.rationStatus === 'partial'
              ? data.rationStatus
              : 'missed',
          weightKg: Number(data.weightKg ?? 8),
          prevWeightKg: Number(data.prevWeightKg ?? 8),
          heightCm: Number(data.heightCm ?? 78),
          muacMm: Number(data.muacMm ?? 125),
          growthHistory: Array.isArray(data.growthHistory) ? data.growthHistory : [],
          recentIllness: Array.isArray(data.recentIllness) ? data.recentIllness : [],
          immunizationUpToDate: Boolean(data.immunizationUpToDate ?? true),
          householdFactors: Array.isArray(data.householdFactors) ? data.householdFactors : [],
          lastActionDoneAt:
            typeof data.lastActionDoneAt === 'string' ? data.lastActionDoneAt : undefined,
          followUpHistory: Array.isArray(data.followUpHistory) ? data.followUpHistory : [],
        };
      });
      onData(list, { hasPendingWrites, pendingCount, fromCache });
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export function subscribeToSnapshotsInSync(onInSync: () => void): () => void {
  return onSnapshotsInSync(db, onInSync);
}

export async function createChildInDb(uid: string, child: ChildRecord): Promise<void> {
  const safeId = sanitizeId(child.id);
  const path = `users/${uid}/children/${safeId}`;
  const childRef = doc(db, 'users', uid, 'children', safeId);

  try {
    await setDoc(childRef, {
      ...toFirestoreChildPayload(uid, child),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateChildSignalsInDb(uid: string, child: ChildRecord): Promise<void> {
  const safeId = sanitizeId(child.id);
  const path = `users/${uid}/children/${safeId}`;
  const childRef = doc(db, 'users', uid, 'children', safeId);

  try {
    await updateDoc(childRef, {
      attendanceDays: child.attendanceDays,
      recentAbsenceStreak: child.recentAbsenceStreak ?? 0,
      rationStatus: child.rationStatus,
      weightKg: child.weightKg,
      prevWeightKg: child.prevWeightKg,
      heightCm: child.heightCm,
      muacMm: child.muacMm,
      growthHistory: (child.growthHistory || []).slice(-24),
      recentIllness: (child.recentIllness || []).slice(0, 6),
      immunizationUpToDate: child.immunizationUpToDate,
      householdFactors: (child.householdFactors || []).slice(0, 6),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function markChildActionDoneInDb(
  uid: string,
  childId: string,
  lastActionDoneAt: string,
  followUpHistory: FollowUpEntry[]
): Promise<void> {
  const safeId = sanitizeId(childId);
  const path = `users/${uid}/children/${safeId}`;
  const childRef = doc(db, 'users', uid, 'children', safeId);

  try {
    await updateDoc(childRef, {
      lastActionDoneAt: lastActionDoneAt.slice(0, 64),
      followUpHistory: followUpHistory.slice(0, 50),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteChildFromDb(uid: string, childId: string): Promise<void> {
  const safeId = sanitizeId(childId);
  const path = `users/${uid}/children/${safeId}`;
  const childRef = doc(db, 'users', uid, 'children', safeId);

  try {
    await deleteDoc(childRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function sanitizeFeedbackAuthorName(rawName: string): string {
  let clean = rawName.trim();
  // Strip domain if an email string slipped in as display name
  if (clean.includes('@')) {
    clean = clean.split('@')[0].replace(/[._\-]+/g, ' ').trim();
  }
  // Remove accidental phone-like long digit sequences (7+ digits) to protect contact privacy
  clean = clean.replace(/\+?\d[\d\s\-]{6,}\d/g, '').trim();
  if (!clean) {
    clean = 'आंगनवाड़ी कार्यकर्ता';
  }
  return clean.slice(0, 80);
}

export function subscribeToFeedbacks(
  onData: (feedbacks: FeedbackEntry[]) => void,
  onError: (err: Error) => void
): () => void {
  const path = 'feedbacks';
  const q = query(collection(db, 'feedbacks'), where('visibility', '==', 'public'));

  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snapshot) => {
      const entries: { item: FeedbackEntry; sortMs: number }[] = snapshot.docs.map((d) => {
        const data = d.data({ serverTimestamps: 'estimate' });
        const ts = data.createdAt;
        const sortMs = ts instanceof Timestamp ? ts.toMillis() : Date.now();
        return {
          sortMs,
          item: {
            id: d.id,
            authorId: String(data.authorId ?? ''),
            authorName: sanitizeFeedbackAuthorName(String(data.authorName ?? '')),
            rating: Math.min(5, Math.max(1, Math.round(Number(data.rating ?? 5)))),
            comment: String(data.comment ?? ''),
            createdAt: new Date(sortMs).toISOString(),
          },
        };
      });

      entries.sort((a, b) => b.sortMs - a.sortMs);
      onData(entries.map((e) => e.item));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function createFeedbackInDb(
  uid: string,
  authorName: string,
  rating: number,
  comment: string
): Promise<void> {
  const feedbackId = sanitizeId(`fb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const path = `feedbacks/${feedbackId}`;
  const ref = doc(db, 'feedbacks', feedbackId);

  const safeName = sanitizeFeedbackAuthorName(authorName);
  const safeRating = Math.min(5, Math.max(1, Math.round(rating)));
  const safeComment = comment.trim().slice(0, 600);

  if (safeComment.length < 2) {
    throw new Error('Feedback message must be at least 2 characters.');
  }

  try {
    await setDoc(ref, {
      id: feedbackId,
      authorId: uid,
      authorName: safeName,
      rating: safeRating,
      comment: safeComment,
      visibility: 'public',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function deleteFeedbackFromDb(feedbackId: string): Promise<void> {
  const safeId = sanitizeId(feedbackId);
  const path = `feedbacks/${safeId}`;
  const ref = doc(db, 'feedbacks', safeId);

  try {
    await deleteDoc(ref);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
