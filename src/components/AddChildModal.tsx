import { useState } from 'react';
import { X } from 'lucide-react';
import type { ChildRecord, Language, RationStatus } from '../types.ts';

interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newChild: ChildRecord) => void;
  language: Language;
}

export function AddChildModal({ isOpen, onClose, onAdd, language }: AddChildModalProps) {
  const [name, setName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [ageMonths, setAgeMonths] = useState('18');
  const [gender, setGender] = useState<'girl' | 'boy'>('girl');
  const [weightKg, setWeightKg] = useState('8.6');
  const [prevWeightKg, setPrevWeightKg] = useState('8.7');
  const [heightCm, setHeightCm] = useState('77.5');
  const [muacMm, setMuacMm] = useState('122');
  const [attendanceDays, setAttendanceDays] = useState('14');
  const [rationStatus, setRationStatus] = useState<RationStatus>('partial');
  const [hasDiarrhea, setHasDiarrhea] = useState(false);

  if (!isOpen) return null;

  const isDevanagari = language === 'hi' || language === 'bho';
  const pick = (hi: string, bho: string, en: string) =>
    language === 'bho' ? bho : language === 'hi' ? hi : en;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !motherName.trim()) return;

    const parsedWeight = Math.max(3, Number(weightKg) || 8.5);
    const parsedPrevWeight = Math.max(3, Number(prevWeightKg) || 8.5);
    const parsedHeight = Math.max(45, Math.min(130, Number(heightCm) || 77.5));

    const newChild: ChildRecord = {
      id: `c-${Date.now()}`,
      nameHi: name.trim(),
      nameEn: name.trim(),
      motherNameHi: motherName.trim(),
      motherNameEn: motherName.trim(),
      ward: isDevanagari ? 'वार्ड 3 · नया पंजीकरण' : 'Ward 3 · New Entry',
      ageMonths: Math.max(6, Math.min(60, Number(ageMonths) || 18)),
      gender,
      phone: '98000-00000',
      attendanceDays: Math.max(0, Math.min(24, Number(attendanceDays) || 12)),
      totalDays: 24,
      recentAbsenceStreak: Number(attendanceDays) < 12 ? 6 : 1,
      rationStatus,
      weightKg: parsedWeight,
      prevWeightKg: parsedPrevWeight,
      heightCm: parsedHeight,
      muacMm: Math.max(85, Math.min(180, Number(muacMm) || 125)),
      growthHistory: [
        {
          monthHi: 'अक्टू',
          monthEn: 'Oct',
          weightKg: parsedPrevWeight,
          heightCm: Number((parsedHeight - 0.6).toFixed(1)),
        },
        {
          monthHi: 'नव',
          monthEn: 'Nov',
          weightKg: parsedWeight,
          heightCm: parsedHeight,
        },
      ],
      recentIllness: hasDiarrhea ? ['diarrhea'] : [],
      immunizationUpToDate: true,
      householdFactors: [],
      followUpHistory: [],
    };

    onAdd(newChild);
    setName('');
    setMotherName('');
    setHasDiarrhea(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#12372A]/45 backdrop-blur-xs flex items-end md:items-center justify-center p-0 md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-child-title"
    >
      <div className="w-full md:max-w-lg bg-white rounded-t-3xl md:rounded-2xl border border-[#DCE4DB] shadow-xl max-h-[90dvh] overflow-y-auto">
        <div className="md:hidden w-10 h-1.5 bg-[#DCE4DB] rounded-full mx-auto mt-3" />

        <div className="flex items-center justify-between px-5 py-4 border-b border-[#DCE4DB]">
          <h2 id="add-child-title" className="text-lg font-bold text-[#12372A]">
            {pick('नया बच्चा जोड़ें (केंद्र 042)', 'नया लइका जोड़ीं (केंद्र 042)', 'Register New Child')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={pick('बंद करें', 'बंद करीं', 'Close')}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#435C51] hover:bg-[#F1F5EF]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#435C51] mb-1.5">
                {pick('बच्चे का नाम *', 'लइका के नाम *', 'Child Name *')}
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={pick('जैसे: प्रिया कुमारी', 'जइसे: प्रिया कुमारी', 'e.g. Priya Kumari')}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF7] border border-[#DCE4DB] text-sm text-[#12372A] focus:outline-none focus:border-[#0F766E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#435C51] mb-1.5">
                {pick('माँ का नाम *', 'माई के नाम *', 'Mother Name *')}
              </label>
              <input
                type="text"
                required
                value={motherName}
                onChange={(e) => setMotherName(e.target.value)}
                placeholder={pick('जैसे: रेखा देवी', 'जइसे: रेखा देवी', 'e.g. Rekha Devi')}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF7] border border-[#DCE4DB] text-sm text-[#12372A] focus:outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#435C51] mb-1.5">
                {pick('उम्र (माह)', 'उमर (महीना)', 'Age (months)')}
              </label>
              <input
                type="number"
                min={6}
                max={60}
                value={ageMonths}
                onChange={(e) => setAgeMonths(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF7] border border-[#DCE4DB] text-sm font-mono-tabular text-[#12372A] focus:outline-none focus:border-[#0F766E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#435C51] mb-1.5">
                {pick('लिंग', 'लिंग', 'Gender')}
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-[#F1F5EF] rounded-xl">
                <button
                  type="button"
                  onClick={() => setGender('girl')}
                  className={`min-h-[36px] rounded-lg text-xs font-medium ${
                    gender === 'girl' ? 'bg-white text-[#12372A] font-semibold shadow-xs' : 'text-[#435C51]'
                  }`}
                >
                  {pick('बालिका', 'बबुनी', 'Girl')}
                </button>
                <button
                  type="button"
                  onClick={() => setGender('boy')}
                  className={`min-h-[36px] rounded-lg text-xs font-medium ${
                    gender === 'boy' ? 'bg-white text-[#12372A] font-semibold shadow-xs' : 'text-[#435C51]'
                  }`}
                >
                  {pick('बालक', 'बबुआ', 'Boy')}
                </button>
              </div>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-[#435C51] mb-1.5">
                MUAC (mm)
              </label>
              <input
                type="number"
                min={80}
                max={180}
                value={muacMm}
                onChange={(e) => setMuacMm(e.target.value)}
                className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF7] border border-[#DCE4DB] text-sm font-mono-tabular text-[#12372A] focus:outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#435C51] mb-1.5">
                {pick('वजन (kg)', 'वजन (kg)', 'Weight (kg)')}
              </label>
              <input
                type="number"
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#F8FAF7] border border-[#DCE4DB] text-sm font-mono-tabular text-[#12372A] focus:outline-none focus:border-[#0F766E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#435C51] mb-1.5">
                {pick('पिछला वजन', 'पाछिला वजन', 'Prev Weight')}
              </label>
              <input
                type="number"
                step="0.1"
                value={prevWeightKg}
                onChange={(e) => setPrevWeightKg(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#F8FAF7] border border-[#DCE4DB] text-sm font-mono-tabular text-[#12372A] focus:outline-none focus:border-[#0F766E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#435C51] mb-1.5">
                {pick('लंबाई (cm)', 'लंबाई (cm)', 'Height (cm)')}
              </label>
              <input
                type="number"
                step="0.5"
                min={45}
                max={130}
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#F8FAF7] border border-[#DCE4DB] text-sm font-mono-tabular text-[#12372A] focus:outline-none focus:border-[#0F766E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#435C51] mb-1.5">
                {pick('उपस्थिति (/24)', 'आइल (/24)', 'Days (/24)')}
              </label>
              <input
                type="number"
                min={0}
                max={24}
                value={attendanceDays}
                onChange={(e) => setAttendanceDays(e.target.value)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-[#F8FAF7] border border-[#DCE4DB] text-sm font-mono-tabular text-[#12372A] focus:outline-none focus:border-[#0F766E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#435C51] mb-1.5">
              {pick('राशन / टेक-होम राशन (THR)', 'राशन / THR उठाव', 'Ration / THR Uptake')}
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#F1F5EF] rounded-xl">
              {(['collected', 'partial', 'missed'] as RationStatus[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setRationStatus(status)}
                  className={`min-h-[40px] rounded-lg text-xs font-medium ${
                    rationStatus === status
                      ? 'bg-white text-[#12372A] font-semibold shadow-xs'
                      : 'text-[#435C51]'
                  }`}
                >
                  {status === 'collected'
                    ? pick('पूरा मिला', 'पूरा मिलल', 'Collected')
                    : status === 'partial'
                    ? pick('आंशिक', 'आधा-अधूरा', 'Partial')
                    : pick('नहीं लिया', 'ना मिलल', 'Missed')}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 min-h-[44px] px-3.5 py-2 rounded-xl bg-[#F8FAF7] border border-[#DCE4DB] cursor-pointer">
            <input
              type="checkbox"
              checked={hasDiarrhea}
              onChange={(e) => setHasDiarrhea(e.target.checked)}
              className="w-5 h-5 accent-[#0F766E] rounded"
            />
            <span className="text-sm text-[#12372A]">
              {pick(
                'हाल में दस्त या तेज कमजोरी की शिकायत',
                'हाल में दस्त भा बेसी कमजोरी के दिक्कत',
                'Recent diarrhea or acute weakness'
              )}
            </span>
          </label>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[48px] rounded-xl bg-[#F1F5EF] hover:bg-[#E5ECE2] text-[#12372A] text-sm font-semibold transition-colors"
            >
              {pick('रद्द करें', 'रद्द करीं', 'Cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 min-h-[48px] rounded-xl bg-[#0F766E] hover:bg-[#0D625B] text-white text-sm font-semibold transition-colors"
            >
              {pick('बच्चा जोड़ें व जांचें', 'लइका जोड़ीं आ जांचीं', 'Save & Assess')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
