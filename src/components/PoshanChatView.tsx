import { useEffect, useRef, useState } from 'react';
import { Send, Loader2, Bot, User as UserIcon, Zap } from 'lucide-react';
import type { ChatMessage, ChildRecord, Language } from '../types.ts';

interface PoshanChatViewProps {
  selectedChild?: ChildRecord;
  language: Language;
}

export function PoshanChatView({ selectedChild, language }: PoshanChatViewProps) {
  const isDevanagari = language === 'hi' || language === 'bho';
  const pick = (hi: string, bho: string, en: string) =>
    language === 'bho' ? bho : language === 'hi' ? hi : en;

  const welcomeText = pick(
    'नमस्ते दीदी! मैं पोषण मित्र AI हूँ। आप किसी बच्चे के वजन, MUAC माप, दस्त में ORS, टेक-होम राशन या माँ से बात करने के तरीके के बारे में कुछ भी पूछ सकती हैं।',
    'प्रणाम दीदी! हम पोषण मित्र AI बानी। रउआ कवनो लइका के वजन, MUAC नाप, दस्त में ORS, राशन भा माई से बतियावे के तरीका के बारे में कुछो पूछ सकेनी।',
    'Hello! I am Poshan Mitra AI. Ask me anything about child weight trends, MUAC screening, ORS/Zinc for diarrhea, Take-Home Ration, or mother counseling.'
  );

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      role: 'model',
      text: welcomeText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  useEffect(() => {
    setMessages((prev) =>
      prev.map((m) => (m.id === 'welcome' ? { ...m, text: welcomeText } : m))
    );
  }, [welcomeText]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [includeChildContext, setIncludeChildContext] = useState(true);
  const [fastMode, setFastMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const quickPrompts =
    language === 'bho'
      ? [
          'एह लइका खातिर आज का पोषण सलाह दीं?',
          'दस्त में 18 महीना के लइका के का खियाईं?',
          'सत्तू आ बदाम से घरे पोषण लड्डू कइसे बनाईं?',
        ]
      : language === 'hi'
      ? [
          'इस बच्चे के लिए आज क्या पोषण सलाह दें?',
          'दस्त में 18 माह के बच्चे को क्या खिलाएं?',
          'सत्तू और मूंगफली से घर पर पोषण आहार कैसे बनाएं?',
        ]
      : [
          'What nutrition plan fits this child today?',
          'How to feed an 18-month-old during diarrhea?',
          'How to prepare sattu-peanut energy mix at home?',
        ];

  const childContextStr = selectedChild
    ? `Name: ${isDevanagari ? selectedChild.nameHi : selectedChild.nameEn}, Age: ${
        selectedChild.ageMonths
      } months, Weight: ${selectedChild.weightKg}kg (prev ${selectedChild.prevWeightKg}kg), Height: ${
        selectedChild.heightCm
      }cm, MUAC: ${selectedChild.muacMm}mm, Attendance: ${selectedChild.attendanceDays}/${
        selectedChild.totalDays
      }, Ration: ${selectedChild.rationStatus}, Illnesses: ${
        selectedChild.recentIllness.join(', ') || 'None'
      }`
    : '';

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const historyForApi = messages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: historyForApi,
          childContext: includeChildContext ? childContextStr : '',
          language,
          fastMode,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Chat request failed');
      }

      const modelMsg: ChatMessage = {
        id: `m-${Date.now()}`,
        role: 'model',
        text: data.reply || pick('कोई उत्तर प्राप्त नहीं हुआ।', 'कवनो जवाब ना मिलल।', 'No response received.'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, modelMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach AI assistant.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-[#DCE4DB] overflow-hidden flex flex-col h-[calc(100dvh-230px)] min-h-[300px] sm:min-h-[420px] max-h-[720px]">
      {/* Chat Header */}
      <div className="px-4 sm:px-5 py-3.5 border-b border-[#DCE4DB] bg-[#F8FAF7] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-[#0F766E] text-white flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#12372A]">
              {pick('पोषण मित्र AI सहायक चैट', 'पोषण मित्र AI संगवारी चैट', 'Poshan Mitra AI Assistant')}
            </h2>
            <p className="text-xs text-[#435C51]">
              {selectedChild && includeChildContext
                ? `${pick('संदर्भ जुड़ा है:', 'लइका के हाल जुड़ल बा:', 'Context:')} ${
                    isDevanagari ? selectedChild.nameHi : selectedChild.nameEn
                  }`
                : pick('सामान्य आंगनवाड़ी मार्गदर्शन', 'आम आंगनवाड़ी सलाह', 'General Anganwadi guidance')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedChild && (
            <button
              type="button"
              onClick={() => setIncludeChildContext((v) => !v)}
              className={`min-h-[36px] px-3 rounded-lg text-xs font-semibold border transition-colors ${
                includeChildContext
                  ? 'bg-[#EEF6F3] border-[#0F766E]/30 text-[#0F766E]'
                  : 'bg-white border-[#DCE4DB] text-[#435C51]'
              }`}
            >
              {includeChildContext
                ? pick('✓ बच्चे की जानकारी जुड़ी', '✓ लइका के हाल जुड़ल बा', '✓ Child Context On')
                : pick('सामान्य चैट', 'साधारण चैट', 'General Chat')}
            </button>
          )}

          <button
            type="button"
            onClick={() => setFastMode((v) => !v)}
            className={`inline-flex items-center gap-1 min-h-[36px] px-3 rounded-lg text-xs font-semibold border transition-colors ${
              fastMode
                ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#B45309]'
                : 'bg-white border-[#DCE4DB] text-[#435C51]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>
              {fastMode
                ? pick('तेज़ उत्तर', 'तेज जवाब', 'Fast')
                : pick('संतुलित', 'सही जवाब', 'Standard')}
            </span>
          </button>
        </div>
      </div>

      {/* Scrollable Thread */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <span
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  isUser ? 'bg-[#12372A] text-white' : 'bg-[#EEF6F3] text-[#0F766E]'
                }`}
              >
                {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </span>
              <div
                className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? 'bg-[#0F766E] text-white'
                    : 'bg-[#F8FAF7] border border-[#DCE4DB] text-[#12372A]'
                }`}
              >
                <p>{m.text}</p>
                <span
                  className={`block text-[10px] mt-1 font-mono-tabular ${
                    isUser ? 'text-white/75 text-right' : 'text-[#647B71]'
                  }`}
                >
                  {m.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-[#EEF6F3] text-[#0F766E] flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
            </span>
            <span className="text-xs font-medium text-[#435C51]">
              {pick('उत्तर तैयार हो रहा है...', 'जवाब लिखात बा...', 'Writing reply...')}
            </span>
          </div>
        )}

        {error && (
          <p className="text-xs font-medium text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] px-3.5 py-2 rounded-xl">
            {error}
          </p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick Prompt Chips */}
      <div className="px-4 py-2 border-t border-[#E9EFE8] bg-[#F8FAF7] flex gap-2 overflow-x-auto">
        {quickPrompts.map((promptText, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => sendMessage(promptText)}
            className="min-h-[36px] px-3 py-1.5 rounded-lg bg-white hover:bg-[#F1F5EF] border border-[#DCE4DB] text-xs font-medium text-[#12372A] whitespace-nowrap shrink-0 transition-colors"
          >
            {promptText}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form onSubmit={handleSubmit} className="p-3 sm:p-4 border-t border-[#DCE4DB] flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={pick(
            'यहाँ अपना सवाल लिखें (जैसे: दस्त में क्या खिलाएं?)...',
            'इहाँ आपन सवाल लिखीं (जइसे: दस्त में का खियाईं?)...',
            'Ask a nutrition question...'
          )}
          className="flex-1 min-w-0 min-h-[46px] px-4 rounded-xl bg-[#F8FAF7] border border-[#DCE4DB] text-sm text-[#12372A] placeholder:text-[#647B71] focus:outline-none focus:border-[#0F766E]"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          aria-label={pick('भेजें', 'भेजीं', 'Send')}
          className="min-h-[46px] px-4 rounded-xl bg-[#0F766E] hover:bg-[#0D625B] text-white font-semibold text-sm inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">{pick('भेजें', 'भेजीं', 'Send')}</span>
        </button>
      </form>
    </div>
  );
}
