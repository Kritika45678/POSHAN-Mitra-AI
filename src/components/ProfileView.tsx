import { useEffect, useRef, useState } from 'react';
import { Camera, Check, LogOut, RotateCcw, User as UserIcon, Loader2 } from 'lucide-react';
import type { Language, WorkerGender, WorkerProfile } from '../types.ts';

interface ProfileViewProps {
  profile: WorkerProfile;
  googlePhotoUrl: string;
  onSaveProfile: (updated: WorkerProfile) => Promise<void>;
  onSignOut: () => Promise<void>;
  language: Language;
}

function compressImageFileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read selected file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file.'));
      img.onload = () => {
        const size = 240;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas not supported.'));
          return;
        }
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function ProfileView({
  profile,
  googlePhotoUrl,
  onSaveProfile,
  onSignOut,
  language,
}: ProfileViewProps) {
  const pick = (hi: string, bho: string, en: string) =>
    language === 'bho' ? bho : language === 'hi' ? hi : en;

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState<WorkerProfile>(profile);
  const [saving, setSaving] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(profile);
  }, [profile]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const dataUrl = await compressImageFileToDataUrl(file);
      setForm((prev) => ({ ...prev, photoUrl: dataUrl }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process photo.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedBanner(false);
    setError(null);
    try {
      await onSaveProfile(form);
      setSavedBanner(true);
      setTimeout(() => setSavedBanner(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-[#DCE4DB] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {form.photoUrl ? (
              <img
                src={form.photoUrl}
                alt={form.displayName}
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-2xl object-cover border border-[#DCE4DB]"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-[#EEF6F3] text-[#0F766E] flex items-center justify-center border border-[#DCE4DB]">
                <UserIcon className="w-8 h-8" />
              </div>
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#12372A]">
              {form.displayName || pick('कार्यकर्ता प्रोफ़ाइल', 'दीदी के प्रोफ़ाइल', 'Worker Profile')}
            </h2>
            <p className="text-xs text-[#435C51] mt-0.5">
              {form.centerCode || pick('आंगनवाड़ी केंद्र', 'आंगनवाड़ी केंद्र', 'Anganwadi Center')}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-xl bg-[#F1F5EF] hover:bg-[#E4ECE1] text-[#12372A] text-xs font-semibold transition-colors"
              >
                <Camera className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>{pick('फोटो बदलें', 'फोटो बदलीं', 'Change Photo')}</span>
              </button>

              {googlePhotoUrl && form.photoUrl !== googlePhotoUrl && (
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, photoUrl: googlePhotoUrl }))}
                  className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-xl bg-white border border-[#DCE4DB] hover:bg-[#F8FAF7] text-[#435C51] text-xs font-medium"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{pick('Google फोटो लगाएं', 'Google फोटो लगाईं', 'Use Google Photo')}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onSignOut}
          className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FECACA] text-[#B91C1C] text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
        >
          <LogOut className="w-4 h-4" />
          <span>{pick('लॉग आउट', 'बाहर निकलीं', 'Sign Out')}</span>
        </button>
      </div>

      {/* Editable Profile Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl border border-[#DCE4DB] p-5 sm:p-6 space-y-5"
      >
        <div>
          <h3 className="text-base font-bold text-[#12372A]">
            {pick(
              'व्यक्तिगत एवं केंद्र विवरण संपादित करें',
              'आपन जानकारी आ केंद्र के हाल सुधारीं',
              'Edit Personal & Center Details'
            )}
          </h3>
          <p className="text-xs text-[#435C51] mt-0.5">
            {pick(
              'आपका नाम, मोबाइल नंबर, ईमेल और पता PDF पोषण रिपोर्ट में स्वतः शामिल होगा।',
              'राउर नाम, मोबाइल नंबर, ईमेल आ पता अपने आप PDF रिपोर्ट में आ जाई।',
              'Your saved details automatically appear on exported PDF nutrition reports.'
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#435C51] mb-1.5">
              {pick('पूरा नाम *', 'पूरा नाम *', 'Full Name *')}
            </label>
            <input
              type="text"
              required
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF7] border border-[#DCE4DB] text-sm text-[#12372A] focus:outline-none focus:border-[#0F766E]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#435C51] mb-1.5">
              {pick('आंगनवाड़ी केंद्र कोड / वार्ड', 'आंगनवाड़ी केंद्र कोड / वार्ड', 'Anganwadi Center Code / Ward')}
            </label>
            <input
              type="text"
              value={form.centerCode}
              onChange={(e) => setForm({ ...form, centerCode: e.target.value })}
              placeholder={pick('जैसे: केंद्र 042 · रामपुर वार्ड 3', 'जइसे: केंद्र 042 · रामपुर वार्ड 3', 'e.g. Center 042 · Ward 3')}
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF7] border border-[#DCE4DB] text-sm text-[#12372A] focus:outline-none focus:border-[#0F766E]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#435C51] mb-1.5">
              {pick('मोबाइल नंबर', 'मोबाइल नंबर', 'Mobile Number')}
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+91 98XXXXXXXX"
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF7] border border-[#DCE4DB] text-sm font-mono-tabular text-[#12372A] focus:outline-none focus:border-[#0F766E]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#435C51] mb-1.5">
              {pick('ईमेल पता', 'ईमेल पता', 'Email Address')}
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF7] border border-[#DCE4DB] text-sm text-[#12372A] focus:outline-none focus:border-[#0F766E]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#435C51] mb-1.5">
            {pick('लिंग (Gender)', 'लिंग (Gender)', 'Gender')}
          </label>
          <div className="grid grid-cols-3 gap-2 p-1 bg-[#F1F5EF] rounded-xl max-w-md">
            {(
              [
                { id: 'female', hi: 'महिला', bho: 'मेहरारू', en: 'Female' },
                { id: 'male', hi: 'पुरुष', bho: 'मरद', en: 'Male' },
                { id: 'other', hi: 'अन्य', bho: 'दोसर', en: 'Other' },
              ] as { id: WorkerGender; hi: string; bho: string; en: string }[]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setForm({ ...form, gender: opt.id })}
                className={`min-h-[40px] rounded-lg text-xs font-medium transition-colors ${
                  form.gender === opt.id
                    ? 'bg-white text-[#12372A] font-semibold shadow-xs'
                    : 'text-[#435C51] hover:text-[#12372A]'
                }`}
              >
                {pick(opt.hi, opt.bho, opt.en)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#435C51] mb-1.5">
            {pick(
              'पूरा पता (मकान / मोहल्ला / केंद्र स्थान)',
              'पूरा पता (घर / टोला / केंद्र के जगह)',
              'Street / Center Address'
            )}
          </label>
          <textarea
            rows={2}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder={pick(
              'आंगनवाड़ी भवन के पास, मुख्य सड़क...',
              'आंगनवाड़ी भवन के नजदीक, मुख्य सड़क...',
              'Near Panchayat Bhawan, Main Road...'
            )}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8FAF7] border border-[#DCE4DB] text-sm text-[#12372A] focus:outline-none focus:border-[#0F766E]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#435C51] mb-1.5">
              {pick('गाँव / वार्ड', 'गाँव / टोला / वार्ड', 'Village / Ward')}
            </label>
            <input
              type="text"
              value={form.villageWard}
              onChange={(e) => setForm({ ...form, villageWard: e.target.value })}
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF7] border border-[#DCE4DB] text-sm text-[#12372A] focus:outline-none focus:border-[#0F766E]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#435C51] mb-1.5">
              {pick('जिला व राज्य', 'जिला आ राज्य', 'District & State')}
            </label>
            <input
              type="text"
              value={form.districtState}
              onChange={(e) => setForm({ ...form, districtState: e.target.value })}
              placeholder={pick('जैसे: गया, बिहार', 'जइसे: बक्सर / आरा, बिहार', 'e.g. Gaya, Bihar')}
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF7] border border-[#DCE4DB] text-sm text-[#12372A] focus:outline-none focus:border-[#0F766E]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#435C51] mb-1.5">
              {pick('पिन कोड (PIN Code)', 'पिन कोड (PIN Code)', 'PIN Code')}
            </label>
            <input
              type="text"
              value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value })}
              placeholder="823001"
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#F8FAF7] border border-[#DCE4DB] text-sm font-mono-tabular text-[#12372A] focus:outline-none focus:border-[#0F766E]"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs font-medium text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] px-3.5 py-2.5 rounded-xl">
            {error}
          </p>
        )}

        {savedBanner && (
          <p className="text-xs font-semibold text-[#15803D] bg-[#F0FDF4] border border-[#BBF7D0] px-3.5 py-2.5 rounded-xl inline-flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>
              {pick(
                'प्रोफ़ाइल सुरक्षित रूप से सेव हो गई।',
                'प्रोफ़ाइल बढ़िया से सहेजा गइल।',
                'Profile saved successfully.'
              )}
            </span>
          </p>
        )}

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-2.5 rounded-xl bg-[#0F766E] hover:bg-[#0D625B] text-white text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{pick('सेव हो रहा है...', 'सहेजात बा...', 'Saving...')}</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{pick('प्रोफ़ाइल सेव करें', 'प्रोफ़ाइल सहेजीं', 'Save Profile')}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
