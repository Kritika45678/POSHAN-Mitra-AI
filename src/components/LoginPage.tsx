import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { ShieldCheck, Sprout, FileDown, MessageSquareHeart, Loader2 } from 'lucide-react';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import type { Language } from '../types.ts';
import emblemImg from '../assets/images/poshan_mitra_mark_1794631707133.jpg';

interface LoginPageProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export function LoginPage({ language, onLanguageChange }: LoginPageProps) {
  const pick = (hi: string, bho: string, en: string) =>
    language === 'bho' ? bho : language === 'hi' ? hi : en;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('popup-closed-by-user')) {
        setError(
          pick(
            'लॉगिन विंडो बंद कर दी गई। कृपया फिर से प्रयास करें।',
            'लॉगिन के खिड़की बंद हो गइल। कृपया फिर से कोशिश करीं।',
            'Sign-in window was closed. Please try again.'
          )
        );
      } else {
        setError(
          pick(
            `लॉगिन में त्रुटि: ${msg}`,
            `लॉगिन में गड़बड़ी भइल: ${msg}`,
            `Sign-in failed: ${msg}`
          )
        );
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#F8FAF7] text-[#12372A] flex flex-col justify-between p-4 sm:p-6">
      <div className="max-w-md w-full mx-auto flex justify-end">
        <div className="inline-flex items-center p-1 bg-[#E9EFE8] rounded-xl">
          <button
            type="button"
            onClick={() => onLanguageChange('bho')}
            className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold transition-colors ${
              language === 'bho' ? 'bg-white text-[#12372A] shadow-xs' : 'text-[#435C51]'
            }`}
          >
            भोजपुरी
          </button>
          <button
            type="button"
            onClick={() => onLanguageChange('hi')}
            className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold transition-colors ${
              language === 'hi' ? 'bg-white text-[#12372A] shadow-xs' : 'text-[#435C51]'
            }`}
          >
            हिन्दी
          </button>
          <button
            type="button"
            onClick={() => onLanguageChange('en')}
            className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold transition-colors ${
              language === 'en' ? 'bg-white text-[#12372A] shadow-xs' : 'text-[#435C51]'
            }`}
          >
            English
          </button>
        </div>
      </div>

      <main className="max-w-md w-full mx-auto my-auto py-6 sm:py-8">
        <div className="bg-white rounded-3xl border border-[#DCE4DB] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            {!imgFailed ? (
              <img
                src={emblemImg}
                alt="Poshan Mitra Ai"
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="w-16 h-16 rounded-2xl object-cover border border-[#DCE4DB]"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-[#0F766E] text-white flex items-center justify-center">
                <Sprout className="w-8 h-8" />
              </div>
            )}

            <div>
              <h1 className="text-2xl font-bold text-[#12372A] tracking-tight">
                Poshan Mitra Ai
              </h1>
              <p className="text-sm text-[#435C51] mt-1.5 text-balance">
                {pick(
                  'आंगनवाड़ी कार्यकर्ताओं के लिए सुरक्षित बाल पोषण एवं जोखिम पहचान मंच',
                  'आंगनवाड़ी दीदी लोगन खातिर लइकन के पोषण आ खतरा पहचाने के सुरक्षित मंच',
                  'Secure child nutrition & early SAM/MAM risk workspace for Anganwadi workers'
                )}
              </p>
            </div>
          </div>

          <ul className="space-y-3 pt-2 border-t border-[#E9EFE8] text-sm text-[#12372A]">
            <li className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#0F766E] shrink-0 mt-0.5" />
              <span>
                {pick(
                  'उपस्थिति, राशन, वजन और MUAC संकेत एक ही सुरक्षित डेटाबेस में',
                  'आवल-जाइल, राशन, वजन आ MUAC नाप एकही सुरक्षित डेटाबेस में',
                  'Attendance, ration, weight & MUAC signals synced safely to Firestore'
                )}
              </span>
            </li>
            <li className="flex items-start gap-3">
              <FileDown className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
              <span>
                {pick(
                  'हर बच्चे व केंद्र की हिंदी PDF रिपोर्ट एक क्लिक में डाउनलोड करें',
                  'हर लइका आ केंद्र के पूरा PDF रिपोर्ट एक बटन दबा के डाउनलोड करीं',
                  'Download child & center nutrition reports in clean PDF format'
                )}
              </span>
            </li>
            <li className="flex items-start gap-3">
              <MessageSquareHeart className="w-5 h-5 text-[#0F766E] shrink-0 mt-0.5" />
              <span>
                {pick(
                  'सरल हिंदी में स्पष्ट फॉलो-अप कदम और AI पोषण सहायक चैट',
                  'आसान भोजपुरी आ हिन्दी में साफ भेंट के कदम आ AI संगवारी चैट',
                  'Clear follow-up steps and AI Poshan chat guidance'
                )}
              </span>
            </li>
          </ul>

          {error && (
            <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs font-medium text-[#B91C1C]">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full min-h-[50px] px-5 py-3 rounded-xl bg-[#0F766E] hover:bg-[#0D625B] active:scale-[0.99] text-white font-semibold text-sm flex items-center justify-center gap-3 transition-all disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{pick('लॉगिन हो रहा है...', 'भीतर आवल जा रहल बा...', 'Signing in...')}</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                  />
                </svg>
                <span>
                  {pick('Google से लॉगिन करें', 'Google से लॉगिन करीं', 'Continue with Google')}
                </span>
              </>
            )}
          </button>
        </div>
      </main>

      <footer className="text-center text-xs text-[#647B71] py-2">
        Poshan Mitra Ai · ICDS Anganwadi Support
      </footer>
    </div>
  );
}
