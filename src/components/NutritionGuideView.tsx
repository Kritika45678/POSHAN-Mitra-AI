import { useState } from 'react';
import { Utensils } from 'lucide-react';
import type { Language } from '../types.ts';
import guideBannerImg from '../assets/images/poshan_nutrition_guide_1794631707685.jpg';

interface NutritionGuideViewProps {
  language: Language;
}

const GUIDE_IMAGE = guideBannerImg;

export function NutritionGuideView({ language }: NutritionGuideViewProps) {
  const pick = (hi: string, bho: string, en: string) =>
    language === 'bho' ? bho : language === 'hi' ? hi : en;

  const [imgError, setImgError] = useState(false);

  const recipes = [
    {
      title: pick(
        '1. ऊर्जा-युक्त मूंग दाल खिचड़ी',
        '1. ताकत वाला मूंग दाल खिचड़ी',
        '1. Energy-Dense Moong Dal Khichdi'
      ),
      detail: pick(
        'चावल + पीली मूंग दाल (1:1) को गाढ़ा पकाएं। परोसते समय 1 बड़ा चम्मच सरसों तेल या घी और बारीक पालक जरूर मिलाएं।',
        'चाउर आ पीयर मूंग दाल (बराबर मात्रा) गाढ़ा पका लीं। खियावे के समय 1 बड़ चम्मच सरसों तेल भा घी आ महीन कटाइल पालक जरूर मिलाईं।',
        'Cook rice + yellow moong dal thick (1:1). Stir in 1 tbsp oil/ghee and finely chopped spinach before feeding.'
      ),
      when: pick(
        'दिन में 2 बार (MAM/SAM बच्चों हेतु)',
        'दिन में 2 बेर (MAM/SAM लइकन खातिर)',
        'Twice daily for MAM/SAM recovery'
      ),
    },
    {
      title: pick(
        '2. सत्तू-मूंगफली पोषण लड्डू',
        '2. सत्तू-बदाम के पोषण लड्डू',
        '2. Sattu-Peanut Energy Mix'
      ),
      detail: pick(
        'भुना चना सत्तू, पिसी हुई भुनी मूंगफली और गुड़ को थोड़े घी में मिलाकर छोटे लड्डू बनाएं। बिना पकाए खिलाना आसान है।',
        'भूंजल चना के सत्तू, पीसल भूंजल बदाम (मूंगफली) आ मीठा (गुड़) में तनी घी मिला के छोट-छोट लड्डू बना लीं। बिना पकावले खियावल आसान रहेला।',
        'Mix roasted chana sattu, crushed roasted peanuts, and jaggery with a spoon of ghee into bite-sized laddoos.'
      ),
      when: pick(
        'शाम का पौष्टिक नाश्ता',
        'साँझ के ताकतवर जलपान',
        'Evening high-calorie snack'
      ),
    },
    {
      title: pick(
        '3. दस्त होने पर तुरंत ORS + जिंक',
        '3. दस्त होखला पर तुरंत ORS आ जिंक',
        '3. ORS + Zinc During Diarrhea'
      ),
      detail: pick(
        '1 लीटर साफ उबले-ठंडे पानी में पूरा ORS पैकेट घोलें। हर पतले दस्त के बाद चम्मच से थोड़ा-थोड़ा पिलाते रहें व भोजन बंद न करें।',
        '1 लीटर साफ उबाल के ठंडा कइल पानी में पूरा ORS पैकेट घोर लीं। हर पातर दस्त के बाद चम्मच से थोड़ा-थोड़ा पियावत रहीं आ खाना बंद मत करीं।',
        'Dissolve 1 full ORS packet in 1L clean boiled-cooled water. Give spoon-by-spoon after every loose stool; never stop feeding.'
      ),
      when: pick(
        'दस्त के पहले दिन से लगातार 14 दिन जिंक',
        'दस्त के पहिला दिन से लगातार 14 दिन जिंक',
        'Start Day 1 + 14 days Zinc'
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Banner with Generated Poshan Image */}
      <div className="relative rounded-2xl overflow-hidden border border-[#DCE4DB] bg-[#12372A] min-h-[220px] sm:min-h-[260px]">
        {!imgError ? (
          <img
            src={GUIDE_IMAGE}
            alt={pick(
              'पौष्टिक आंगनवाड़ी भोजन थाली',
              'पौष्टिक आंगनवाड़ी भोजन थारी',
              'Nutritious Anganwadi meal ingredients'
            )}
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
            className="w-full h-[240px] sm:h-[280px] object-cover"
          />
        ) : (
          <div className="w-full h-[240px] sm:h-[280px] bg-gradient-to-br from-[#0F766E] to-[#12372A] flex items-center justify-center">
            <Utensils className="w-12 h-12 text-white/60" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#12372A]/90 via-[#12372A]/45 to-transparent flex flex-col justify-end p-5 sm:p-7">
          <h2 className="text-xl sm:text-2xl font-bold text-white text-balance">
            {pick(
              'माँ और परिवार के लिए सरल घरेलू पोषण मार्गदर्शिका',
              'माई आ घर के लोग खातिर आसान घरेलू पोषण सिखावन',
              'Simple Home-Visit Nutrition Counseling Guide'
            )}
          </h2>
          <p className="text-sm text-white/90 mt-1 max-w-2xl">
            {pick(
              'गृह भेंट के दौरान आसानी से उपलब्ध घरेलू खाद्य पदार्थों से बच्चे का वजन और ताकत बढ़ाने के व्यावहारिक उपाय।',
              'घर भेंट के समय घरे में सहज मिले वाला भोजन से लइका के वजन आ ताकत बढ़ावे के आसान उपाय।',
              'Practical ways to rebuild weight and immunity using affordable, locally available foods during home visits.'
            )}
          </p>
        </div>
      </div>

      {/* MUAC Tape Visual Reference */}
      <section className="bg-white rounded-2xl border border-[#DCE4DB] p-5">
        <h3 className="text-base font-bold text-[#12372A] mb-3">
          {pick(
            'MUAC टेप पहचान चार्ट (6 माह से 5 वर्ष)',
            'MUAC फीता पहचाने के चार्ट (6 महीना से 5 बरिस)',
            'MUAC Tape Reference (6–59 Months)'
          )}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl bg-[#FEF2F2] border border-[#FECACA] p-4">
            <p className="text-sm font-bold text-[#B91C1C]">
              {pick('लाल ज़ोन · < 115 mm', 'लाल पट्टी · < 115 mm', 'Red Zone · < 115 mm')}
            </p>
            <p className="text-xs text-[#12372A] mt-1 leading-relaxed">
              {pick(
                'गंभीर कुपोषण (SAM)। तुरंत ANM / NRC केंद्र में भेजें और चिकित्सीय देखरेख शुरू कराएं।',
                'गंभीर कुपोषण (SAM)। तुरंत ANM भा NRC केंद्र भेजीं आ डॉक्टरी इलाज शुरू कराईं।',
                'Severe Acute Malnutrition (SAM). Refer immediately to ANM / NRC for medical care.'
              )}
            </p>
          </div>
          <div className="rounded-xl bg-[#FFFBEB] border border-[#FDE68A] p-4">
            <p className="text-sm font-bold text-[#B45309]">
              {pick('पीला ज़ोन · 115 – 124 mm', 'पीला पट्टी · 115 – 124 mm', 'Amber Zone · 115 – 124 mm')}
            </p>
            <p className="text-xs text-[#12372A] mt-1 leading-relaxed">
              {pick(
                'मध्यम जोखिम (MAM)। हर 15 दिन में वजन लें, अतिरिक्त THR व ऊर्जा-युक्त खिचड़ी सुनिश्चित करें।',
                'बढ़त खतरा (MAM)। हर 15 दिन पर वजन करीं, बेसी THR राशन आ घी-तेल वाला खिचड़ी खियाईं।',
                'Moderate Acute Malnutrition (MAM). Re-weigh every 15 days and ensure double THR + oil-enriched feeds.'
              )}
            </p>
          </div>
          <div className="rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] p-4">
            <p className="text-sm font-bold text-[#15803D]">
              {pick('हरा ज़ोन · ≥ 125 mm', 'हरियर पट्टी · ≥ 125 mm', 'Green Zone · ≥ 125 mm')}
            </p>
            <p className="text-xs text-[#12372A] mt-1 leading-relaxed">
              {pick(
                'सामान्य और सुरक्षित। नियमित आंगनवाड़ी उपस्थिति, हरी सब्ज़ी व मासिक वजन जांच जारी रखें।',
                'ठीक आ सुरक्षित बा। रोज केंद्र आइल, हरियर साग-सब्जी आ महीना के वजन जांच जारी रखीं।',
                'Healthy range. Continue regular Anganwadi meals, greens, and monthly growth monitoring.'
              )}
            </p>
          </div>
        </div>
      </section>

      {/* Local Recipes */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recipes.map((r, i) => (
          <article key={i} className="bg-white rounded-2xl border border-[#DCE4DB] p-5 flex flex-col justify-between gap-3">
            <div>
              <h4 className="text-base font-bold text-[#12372A]">{r.title}</h4>
              <p className="text-sm text-[#435C51] mt-2 leading-relaxed">{r.detail}</p>
            </div>
            <p className="text-xs font-semibold text-[#0F766E] pt-3 border-t border-[#E9EFE8]">
              {r.when}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
