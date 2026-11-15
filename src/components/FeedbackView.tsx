import { useEffect, useMemo, useState } from 'react';
import {
  Star,
  Send,
  ShieldCheck,
  Loader2,
  Trash2,
  Check,
  MessageSquareQuote,
} from 'lucide-react';
import type { FeedbackEntry, Language } from '../types.ts';
import {
  createFeedbackInDb,
  deleteFeedbackFromDb,
  sanitizeFeedbackAuthorName,
  subscribeToFeedbacks,
} from '../services/firestoreService.ts';

interface FeedbackViewProps {
  currentUid: string;
  defaultAuthorName: string;
  language: Language;
}

type FeedbackFilter = 'all' | 'mine' | '5' | '4' | 'low';

export function FeedbackView({
  currentUid,
  defaultAuthorName,
  language,
}: FeedbackViewProps) {
  const isDevanagari = language === 'hi' || language === 'bho';
  const pick = (hi: string, bho: string, en: string) =>
    language === 'bho' ? bho : language === 'hi' ? hi : en;

  const [authorName, setAuthorName] = useState(() =>
    sanitizeFeedbackAuthorName(defaultAuthorName)
  );
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [feedbacks, setFeedbacks] = useState<FeedbackEntry[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FeedbackFilter>('all');

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setAuthorName((prev) =>
      prev.trim() ? prev : sanitizeFeedbackAuthorName(defaultAuthorName)
    );
  }, [defaultAuthorName]);

  useEffect(() => {
    setLoadingList(true);
    setListError(null);
    const unsub = subscribeToFeedbacks(
      (items) => {
        setFeedbacks(items);
        setLoadingList(false);
      },
      (err) => {
        setListError(err.message);
        setLoadingList(false);
      }
    );
    return () => unsub();
  }, []);

  const ratingLabel = (stars: number) => {
    switch (stars) {
      case 5:
        return pick('बहुत उपयोगी', 'बहुत बढ़िया', 'Excellent');
      case 4:
        return pick('अच्छा', 'नीमन बा', 'Very Good');
      case 3:
        return pick('ठीक है', 'ठीक बा', 'Good');
      case 2:
        return pick('सुधार चाहिए', 'सुधार चाहीं', 'Needs Work');
      default:
        return pick('काफी सुधार चाहिए', 'बहुते सुधार चाहीं', 'Poor');
    }
  };

  const activeStars = hoverRating || rating;

  const stats = useMemo(() => {
    if (feedbacks.length === 0) {
      return { avg: '0.0', total: 0, mineCount: 0 };
    }
    const sum = feedbacks.reduce((acc, item) => acc + item.rating, 0);
    const mineCount = feedbacks.filter((item) => item.authorId === currentUid).length;
    return {
      avg: (sum / feedbacks.length).toFixed(1),
      total: feedbacks.length,
      mineCount,
    };
  }, [feedbacks, currentUid]);

  const filteredFeedbacks = useMemo(() => {
    return feedbacks.filter((item) => {
      if (filter === 'mine') return item.authorId === currentUid;
      if (filter === '5') return item.rating === 5;
      if (filter === '4') return item.rating === 4;
      if (filter === 'low') return item.rating <= 3;
      return true;
    });
  }, [feedbacks, filter, currentUid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitSuccess(false);

    const trimmed = comment.trim();
    if (trimmed.length < 2) {
      setFormError(
        pick(
          'कृपया कम से कम 2 अक्षरों में अपना अनुभव लिखें।',
          'कृपया कम से कम 2 अक्षर में आपन बात लिखीं।',
          'Please write at least a short feedback message.'
        )
      );
      return;
    }

    setSubmitting(true);
    try {
      await createFeedbackInDb(currentUid, authorName, rating, trimmed);
      setComment('');
      setRating(5);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3500);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteOwnFeedback = async (feedbackId: string) => {
    setDeletingId(feedbackId);
    setListError(null);
    try {
      await deleteFeedbackFromDb(feedbackId);
      setConfirmDeleteId(null);
    } catch (err) {
      setListError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (iso: string) => {
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return '';
    return dt.toLocaleDateString(isDevanagari ? 'hi-IN' : 'en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Submit Feedback Form */}
      <section className="lg:col-span-5 bg-white rounded-2xl border border-[#DCE4DB] p-5 sm:p-6 space-y-5">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#12372A]">
            {pick(
              'अपना फीडबैक साझा करें',
              'आपन फीडबैक आ राय दीं',
              'Share Your Feedback'
            )}
          </h2>
          <p className="text-xs sm:text-sm text-[#435C51] mt-1 leading-relaxed">
            {pick(
              'Poshan Mitra Ai के बारे में अपना अनुभव स्टार रेटिंग और शब्दों में लिखें। यह सभी उपयोगकर्ताओं को दिखाई देगा।',
              'Poshan Mitra Ai चलावे में कइसन लागल, स्टार रेटिंग आ आपन बात लिख के बताईं। ई सभे उपयोगकर्ता के देखाई।',
              'Rate Poshan Mitra Ai with stars and share your experience. Your review helps every Anganwadi worker using this app.'
            )}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star Rating Picker */}
          <div>
            <label className="block text-xs font-semibold text-[#435C51] mb-2">
              {pick('स्टार रेटिंग चुनें *', 'स्टार रेटिंग चुनीं *', 'Star Rating *')}
            </label>
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-[#F8FAF7] border border-[#DCE4DB]">
              <div
                className="flex items-center gap-1"
                role="radiogroup"
                aria-label={pick('स्टार रेटिंग', 'स्टार रेटिंग', 'Star Rating')}
              >
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = star <= activeStars;
                  return (
                    <button
                      key={star}
                      type="button"
                      role="radio"
                      aria-checked={rating === star}
                      aria-label={`${star} ${pick('स्टार', 'स्टार', 'Stars')}`}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center transition-transform active:scale-95 hover:bg-[#FEF3C7]/60 focus-visible:outline-2 focus-visible:outline-[#0F766E]"
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          active
                            ? 'fill-[#F59E0B] text-[#D97706]'
                            : 'text-[#C2CFC5]'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="text-xs font-semibold text-[#12372A] px-2 font-mono-tabular whitespace-nowrap">
                {activeStars}/5 · {ratingLabel(activeStars)}
              </span>
            </div>
          </div>

          {/* Public Display Name Only (Privacy Safe) */}
          <div>
            <label
              htmlFor="feedback-author-name"
              className="block text-xs font-semibold text-[#435C51] mb-1.5"
            >
              {pick(
                'दिखाया जाने वाला नाम (केवल नाम)',
                'देखावे खातिर नाम (खाली नाम)',
                'Display Name (Name Only)'
              )}
            </label>
            <input
              id="feedback-author-name"
              type="text"
              required
              maxLength={80}
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder={pick('आपका नाम', 'राउर नाम', 'Your name')}
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF7] border border-[#DCE4DB] text-sm text-[#12372A] focus:outline-none focus:border-[#0F766E]"
            />
          </div>

          {/* Feedback Words */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="feedback-comment"
                className="block text-xs font-semibold text-[#435C51]"
              >
                {pick(
                  'आपका अनुभव / सुझाव *',
                  'आपन बात / सुझाव *',
                  'Your Feedback *'
                )}
              </label>
              <span className="text-[11px] font-mono-tabular text-[#647B71]">
                {comment.length}/600
              </span>
            </div>
            <textarea
              id="feedback-comment"
              rows={4}
              required
              minLength={2}
              maxLength={600}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={pick(
                'ऐप से काम कितना आसान हुआ, कोई सुझाव या अनुभव लिखें...',
                'ई ऐप से काम कतना आसान भइल, कवनो सुझाव भा बात लिखीं...',
                'Write how Poshan Mitra Ai helps your center or share suggestions...'
              )}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAF7] border border-[#DCE4DB] text-sm text-[#12372A] leading-relaxed focus:outline-none focus:border-[#0F766E]"
            />
          </div>

          {/* Privacy Guarantee Banner */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#EEF6F3] text-xs text-[#12372A] leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
            <span>
              {pick(
                'खाता गोपनीयता सुरक्षित: सभी को केवल आपका नाम, स्टार रेटिंग और फीडबैक दिखेगा। आपका मोबाइल नंबर, ईमेल या पता कभी साझा नहीं होता।',
                'खाता गोपनीयता सुरक्षित बा: सभे के खाली राउर नाम, स्टार रेटिंग आ बात देखाई। राउर मोबाइल नंबर, ईमेल भा पता कबो नइखे देखल जात।',
                'Account Privacy Protected: Only your name, star rating, and message are visible to others. Mobile number, email, and address are never shared.'
              )}
            </span>
          </div>

          {formError && (
            <p className="text-xs font-medium text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] px-3.5 py-2.5 rounded-xl">
              {formError}
            </p>
          )}

          {submitSuccess && (
            <p className="text-xs font-semibold text-[#15803D] bg-[#F0FDF4] border border-[#BBF7D0] px-3.5 py-2.5 rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>
                {pick(
                  'धन्यवाद! आपका फीडबैक सभी के लिए प्रकाशित हो गया है।',
                  'धन्यवाद! राउर फीडबैक सभे खातिर दर्ज हो गइल बा।',
                  'Thank you! Your feedback has been published.'
                )}
              </span>
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || comment.trim().length < 2}
            className="w-full inline-flex items-center justify-center gap-2 min-h-[48px] px-5 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0D625B] active:scale-[0.99] text-white text-sm font-semibold transition-all disabled:opacity-55"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{pick('सबमिट हो रहा है...', 'भेजल जात बा...', 'Submitting...')}</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>{pick('फीडबैक सबमिट करें', 'फीडबैक भेजीं', 'Submit Feedback')}</span>
              </>
            )}
          </button>
        </form>
      </section>

      {/* Right Column: Public Community Feedback Feed */}
      <section className="lg:col-span-7 bg-white rounded-2xl border border-[#DCE4DB] overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#DCE4DB] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-[#12372A]">
                {pick(
                  'सभी उपयोगकर्ताओं का फीडबैक',
                  'सभे उपयोगकर्ता के फीडबैक',
                  'Community Feedback'
                )}
              </h3>
              <p className="text-xs text-[#435C51] mt-0.5">
                {pick(
                  'सभी नए व पुराने खातों द्वारा साझा किए गए अनुभव (केवल नाम सहित)',
                  'सभे नयका आ पुरनका खाता से लिखल अनुभव (खाली नाम के साथे)',
                  'Reviews shared across all accounts (author name only, zero contact info)'
                )}
              </p>
            </div>

            {/* Summary Rating Metric */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#FFFBEB] border border-[#FDE68A]">
              <Star className="w-4 h-4 fill-[#F59E0B] text-[#D97706] shrink-0" />
              <span className="text-base font-bold font-mono-tabular text-[#12372A]">
                {stats.avg}
              </span>
              <span className="text-xs text-[#647B71] font-mono-tabular">
                ({stats.total})
              </span>
            </div>
          </div>

          {/* Interactive Filter Controls */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#F1F5EF] rounded-xl">
            {(
              [
                { id: 'all', label: `${pick('सभी', 'सभे', 'All')} (${stats.total})` },
                { id: 'mine', label: `${pick('मेरी राय', 'हमार राय', 'Mine')} (${stats.mineCount})` },
                { id: '5', label: '5 ★' },
                { id: '4', label: '4 ★' },
                { id: 'low', label: '≤ 3 ★' },
              ] as { id: FeedbackFilter; label: string }[]
            ).map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-white text-[#12372A] font-semibold shadow-xs'
                      : 'text-[#435C51] hover:text-[#12372A]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {listError && (
          <div className="m-4 p-3.5 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs font-medium text-[#B91C1C]">
            {listError}
          </div>
        )}

        {loadingList ? (
          <div className="p-10 flex items-center justify-center gap-2.5 text-sm text-[#435C51]">
            <Loader2 className="w-5 h-5 animate-spin text-[#0F766E]" />
            <span>
              {pick(
                'फीडबैक लोड हो रहा है...',
                'फीडबैक लोड हो रहल बा...',
                'Loading community feedback...'
              )}
            </span>
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <MessageSquareQuote className="w-8 h-8 text-[#94A89D] mx-auto" />
            <p className="text-sm font-medium text-[#12372A]">
              {filter === 'mine'
                ? pick(
                    'आपने अभी तक कोई फीडबैक सबमिट नहीं किया है।',
                    'रउआ अभी ले कवनो फीडबैक नइखीं भेजले।',
                    'You have not submitted any feedback yet.'
                  )
                : pick(
                    'अभी इस श्रेणी में कोई फीडबैक नहीं है। पहला फीडबैक आप दें!',
                    'अभी एह में कवनो फीडबैक नइखे। पहिला फीडबैक रउआ दीं!',
                    'No feedback in this category yet. Be the first to share!'
                  )}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[#E9EFE8]">
            {filteredFeedbacks.map((item) => {
              const isMine = item.authorId === currentUid;
              const initial = item.authorName.trim().charAt(0).toUpperCase() || 'W';
              const isConfirming = confirmDeleteId === item.id;
              const isDeletingThis = deletingId === item.id;

              return (
                <li key={item.id} className="p-5 sm:p-6 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        aria-hidden="true"
                        className="w-10 h-10 rounded-xl bg-[#EEF6F3] text-[#0F766E] font-bold text-sm flex items-center justify-center shrink-0"
                      >
                        {initial}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#12372A] truncate">
                          {item.authorName}
                          {isMine && (
                            <span className="text-xs font-medium text-[#0F766E]">
                              {' '}
                              · {pick('आप', 'रउआ', 'You')}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-[#647B71] font-mono-tabular">
                          {formatDate(item.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div
                        className="flex items-center gap-0.5"
                        aria-label={`${item.rating} / 5`}
                      >
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${
                              s <= item.rating
                                ? 'fill-[#F59E0B] text-[#D97706]'
                                : 'text-[#DCE4DB]'
                            }`}
                          />
                        ))}
                        <span className="ml-1.5 text-xs font-semibold font-mono-tabular text-[#12372A]">
                          {item.rating}/5
                        </span>
                      </div>

                      {isMine && !isConfirming && (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(item.id)}
                          aria-label={pick('अपना फीडबैक हटाएं', 'आपन फीडबैक हटाईं', 'Delete feedback')}
                          title={pick('हटाएं', 'हटाईं', 'Delete')}
                          className="min-w-[36px] min-h-[36px] rounded-lg flex items-center justify-center text-[#647B71] hover:text-[#B91C1C] hover:bg-[#FEF2F2] transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-[15px] text-[#12372A] leading-relaxed whitespace-pre-wrap">
                    {item.comment}
                  </p>

                  {isMine && isConfirming && (
                    <div className="pt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        disabled={isDeletingThis}
                        onClick={() => setConfirmDeleteId(null)}
                        className="min-h-[36px] px-3 py-1 rounded-lg bg-[#F1F5EF] hover:bg-[#E4ECE1] text-xs font-semibold text-[#12372A]"
                      >
                        {pick('रद्द करें', 'रद्द करीं', 'Cancel')}
                      </button>
                      <button
                        type="button"
                        disabled={isDeletingThis}
                        onClick={() => handleDeleteOwnFeedback(item.id)}
                        className="inline-flex items-center gap-1.5 min-h-[36px] px-3 py-1 rounded-lg bg-[#B91C1C] hover:bg-[#991B1B] text-xs font-semibold text-white disabled:opacity-60"
                      >
                        {isDeletingThis && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>{pick('पक्का हटाएं', 'पक्का हटाईं', 'Confirm Delete')}</span>
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
