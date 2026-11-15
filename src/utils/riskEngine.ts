import type { ChildRecord, RiskAssessment, RiskSignalReason } from '../types.ts';

export function assessChildRisk(child: ChildRecord): RiskAssessment {
  let score = 0;
  const reasons: RiskSignalReason[] = [];

  const weightDiff = Number((child.weightKg - child.prevWeightKg).toFixed(2));
  const attendancePct =
    child.totalDays > 0 ? Math.round((child.attendanceDays / child.totalDays) * 100) : 100;

  // 1. Health & Anthropometry (MUAC + Weight trajectory)
  if (child.muacMm < 115) {
    score += 6;
    reasons.push({
      stream: 'health',
      labelHi: `MUAC टेप लाल ज़ोन में (${child.muacMm} mm · गंभीर कुपोषण संकेत)`,
      labelBho: `MUAC फीता लाल निशान में बा (${child.muacMm} mm · गंभीर कुपोषण के लछन)`,
      labelEn: `MUAC in Red Zone (${child.muacMm} mm · Severe wasting sign)`,
      severity: 'high',
    });
  } else if (child.muacMm < 125) {
    score += 3;
    reasons.push({
      stream: 'health',
      labelHi: `MUAC टेप पीले ज़ोन में (${child.muacMm} mm · मध्यम जोखिम)`,
      labelBho: `MUAC फीता पीयर निशान में बा (${child.muacMm} mm · मध्यम खतरा)`,
      labelEn: `MUAC in Amber Zone (${child.muacMm} mm · Moderate risk)`,
      severity: 'rising',
    });
  } else if (child.muacMm < 130) {
    score += 1;
    reasons.push({
      stream: 'health',
      labelHi: `MUAC सीमा पर (${child.muacMm} mm · ध्यान रखने योग्य)`,
      labelBho: `MUAC किनारा पर बा (${child.muacMm} mm · धेयान राखे के बा)`,
      labelEn: `Borderline MUAC (${child.muacMm} mm · Watch closely)`,
      severity: 'rising',
    });
  }

  if (weightDiff <= -0.3) {
    score += 4;
    reasons.push({
      stream: 'health',
      labelHi: `पिछले माह से वजन ${Math.abs(weightDiff)} किग्रा घटा`,
      labelBho: `पाछिला महीना से वजन ${Math.abs(weightDiff)} किलो घट गइल बा`,
      labelEn: `Weight dropped by ${Math.abs(weightDiff)} kg since last month`,
      severity: 'high',
    });
  } else if (weightDiff <= 0) {
    score += 2;
    reasons.push({
      stream: 'health',
      labelHi: `वजन में कोई बढ़ोतरी नहीं (${weightDiff} किग्रा)`,
      labelBho: `वजन में कवनो बढ़ोतरी नइखे (${weightDiff} किलो)`,
      labelEn: `Stagnant weight (${weightDiff} kg change)`,
      severity: 'rising',
    });
  }

  if (child.recentIllness.includes('diarrhea')) {
    score += 3;
    reasons.push({
      stream: 'health',
      labelHi: 'हाल ही में दस्त की शिकायत — पानी और पोषण की कमी का खतरा',
      labelBho: 'हाले में दस्त भइल बा — देह में पानी आ ताकत घटे के खतरा बा',
      labelEn: 'Recent diarrhea episode — dehydration & rapid weight-loss risk',
      severity: 'high',
    });
  } else if (child.recentIllness.length > 0) {
    score += 2;
    reasons.push({
      stream: 'health',
      labelHi: 'हालिया बीमारी (बुखार / खांसी / भूख में कमी)',
      labelBho: 'हाले के बीमारी (बोखार / खांसी / भूख कम लागल)',
      labelEn: 'Recent illness (fever / cough / reduced appetite)',
      severity: 'rising',
    });
  }

  if (!child.immunizationUpToDate) {
    score += 1;
    reasons.push({
      stream: 'health',
      labelHi: 'टीकाकरण या कृमिनाशक (Albendazole) खुराक बाकी है',
      labelBho: 'टीका चाहे कीड़ा के दवा (Albendazole) देवे के बाकी बा',
      labelEn: 'Immunization or deworming dose overdue',
      severity: 'rising',
    });
  }

  // 2. Attendance Signal
  if (child.recentAbsenceStreak >= 7 || attendancePct < 50) {
    score += 3;
    reasons.push({
      stream: 'attendance',
      labelHi: `केंद्र उपस्थिति कम (${child.attendanceDays}/${child.totalDays} दिन · लगातार ${child.recentAbsenceStreak} दिन अनुपस्थित)`,
      labelBho: `केंद्र पर हाजिरी बहुत कम बा (${child.attendanceDays}/${child.totalDays} दिन · ${child.recentAbsenceStreak} दिन से ना आइल)`,
      labelEn: `Low attendance (${child.attendanceDays}/${child.totalDays} days · ${child.recentAbsenceStreak}-day absence)`,
      severity: 'rising',
    });
  } else if (attendancePct < 75) {
    score += 1;
    reasons.push({
      stream: 'attendance',
      labelHi: `अनियमित उपस्थिति (${attendancePct}%)`,
      labelBho: `केंद्र पर कम आवत बा (${attendancePct}%)`,
      labelEn: `Irregular center attendance (${attendancePct}%)`,
      severity: 'info',
    });
  }

  // 3. Ration / THR Uptake Signal
  if (child.rationStatus === 'missed') {
    score += 3;
    reasons.push({
      stream: 'ration',
      labelHi: 'इस माह टेक-होम राशन (THR) नहीं लिया गया',
      labelBho: 'एह महीना टेक-होम राशन (THR) नइखे उठावल गइल',
      labelEn: 'Take-Home Ration (THR) missed this cycle',
      severity: 'rising',
    });
  } else if (child.rationStatus === 'partial') {
    score += 1;
    reasons.push({
      stream: 'ration',
      labelHi: 'राशन / गर्म पका भोजन आंशिक रूप से लिया',
      labelBho: 'राशन आ गरम खाना आधा-अधूरा मिलल बा',
      labelEn: 'Partial ration / meal uptake',
      severity: 'info',
    });
  }

  // 4. Household Vulnerability Signals
  if (child.householdFactors.includes('food_shortage')) {
    score += 2;
    reasons.push({
      stream: 'household',
      labelHi: 'घर में खाद्य संकट या आजीविका की कठिनाई',
      labelBho: 'घरे राशन-पानी के तंगी आ कमाई के दिक्कत बा',
      labelEn: 'Household food insecurity reported',
      severity: 'rising',
    });
  }
  if (child.householdFactors.includes('migration')) {
    score += 2;
    reasons.push({
      stream: 'household',
      labelHi: 'परिवार काम के लिए बाहर आने-जाने (पलायन) की स्थिति में',
      labelBho: 'परिवार कमाए खातिर बाहर आवत-जात बा',
      labelEn: 'Seasonal family migration affecting regular feeding',
      severity: 'rising',
    });
  }
  if (child.householdFactors.includes('mother_unwell')) {
    score += 2;
    reasons.push({
      stream: 'household',
      labelHi: 'माँ अस्वस्थ या देखभाल के लिए अतिरिक्त सहायता आवश्यक',
      labelBho: 'माई के तबीयत ठीक नइखे, देखे-भाले में मदद के जरूरत बा',
      labelEn: 'Mother unwell or needs caregiver support',
      severity: 'rising',
    });
  }

  const level =
    child.muacMm < 115 || score >= 8
      ? 'high'
      : child.muacMm < 125 || score >= 4
      ? 'rising'
      : 'normal';

  let oneClearActionHi = '';
  let oneClearActionBho = '';
  let oneClearActionEn = '';
  let urgencyHi = '';
  let urgencyBho = '';
  let urgencyEn = '';
  let counselingHintHi = '';
  let counselingHintBho = '';
  let counselingHintEn = '';

  if (level === 'high') {
    urgencyHi = 'आज ही (24 घंटे के भीतर)';
    urgencyBho = 'आज ही (24 घंटा के भीतर)';
    urgencyEn = 'Today (Within 24 hours)';
    if (child.muacMm < 115) {
      oneClearActionHi = `आज ही ${child.nameHi} के घर जाएं और कल सुबह ANM दीदी / नजदीकी NRC (पोषण पुनर्वास केंद्र) में जांच के लिए भेजें।`;
      oneClearActionBho = `आज ही ${child.nameHi} के घरे जाईं आ काल्ह बिहाने ANM दीदी चाहे नजदीकी NRC (पोषण केंद्र) में जांच खातिर भेजीं।`;
      oneClearActionEn = `Visit ${child.nameEn}'s home today and refer to the ANM / nearest NRC tomorrow morning for medical nutrition care.`;
    } else if (child.recentIllness.includes('diarrhea')) {
      oneClearActionHi = `आज शाम ${child.motherNameHi} को 2 ORS पैकेट व जिंक दें, और वजन में गिरावट की जांच के लिए कल स्वास्थ्य उप-केंद्र ले जाएं।`;
      oneClearActionBho = `आज साँझ के ${child.motherNameHi} के 2 गो ORS पैकेट आ जिंक दे दीं, आ काल्ह स्वास्थ्य केंद्र में वजन दिखा दीं।`;
      oneClearActionEn = `Deliver 2 ORS packets & Zinc to ${child.motherNameEn} this evening, and arrange a weight check at the sub-center tomorrow.`;
    } else {
      oneClearActionHi = `आज ${child.nameHi} के घर जाकर ताज़ा वजन लें, राशन पहुंचाएं और PHC में मेडिकल जांच की तारीख तय करें।`;
      oneClearActionBho = `आज ${child.nameHi} के घरे जा के नया वजन नापीं, राशन पहुंचाईं आ PHC में डॉक्टर से दिखावे के दिन तय करीं।`;
      oneClearActionEn = `Complete a home visit for ${child.nameEn} today to re-weigh, deliver ration, and schedule a PHC checkup.`;
    }
    counselingHintHi = `माँ से कहें: "बच्चे को दिन में 5-6 बार थोड़ी-थोड़ी गाढ़ी मूंग दाल खिचड़ी में 1 चम्मच तेल/घी मिलाकर खिलाएं और साफ उबला पानी पिलाएं।"`;
    counselingHintBho = `माई से कहीं: "बचवा के दिन भर में 5-6 बेर थोड़ा-थोड़ा गाढ़ मूंग दाल के खिचड़ी में एक चम्मच तेल चाहे घीव मिला के खियाईं आ उबालल साफ पानी पियाईं।"`;
    counselingHintEn = `Tell mother: "Feed small, thick moong-dal khichdi meals 5-6 times daily with 1 tsp oil/ghee and clean boiled water."`;
  } else if (level === 'rising') {
    urgencyHi = '3 दिनों के भीतर गृह भेंट';
    urgencyBho = '3 दिन के भीतर घरे जा के भेंट';
    urgencyEn = 'Home visit within 3 days';
    if (child.rationStatus === 'missed' && child.recentAbsenceStreak >= 5) {
      oneClearActionHi = `इस सप्ताह ${child.motherNameHi} के घर जाकर बकाया टेक-होम राशन (THR) दें और केंद्र न आने का कारण जानें।`;
      oneClearActionBho = `एह हफ्ता ${child.motherNameHi} के घरे जा के बाकी टेक-होम राशन (THR) दे दीं आ केंद्र ना आवे के कारण बूझीं।`;
      oneClearActionEn = `Visit ${child.motherNameEn} this week to deliver pending Take-Home Ration (THR) and check why attendance stopped.`;
    } else if (weightDiff <= 0) {
      oneClearActionHi = `अगले 3 दिनों में घर जाकर सत्तू-मूंगफली ऊर्जा मिश्रण की विधि सिखाएं और 15 दिन बाद दोबारा वजन लें।`;
      oneClearActionBho = `आवे वाला 3 दिन में घरे जा के सत्तू-बदाम के लड्डू बनावे के तरीका बताईं आ 15 दिन बाद फेर से वजन नापीं।`;
      oneClearActionEn = `Conduct a home visit within 3 days to demonstrate sattu-peanut energy mix and re-weigh in 15 days.`;
    } else if (!child.immunizationUpToDate) {
      oneClearActionHi = `आगामी VHSND (टीकाकरण दिवस) पर ${child.nameHi} को बुलाकर बकाया टीका व कृमिनाशक गोली दिलवाएं।`;
      oneClearActionBho = `आवे वाला टीका दिवस पर ${child.nameHi} के बोला के बाकी टीका आ कीड़ा के दवा खिया दीं।`;
      oneClearActionEn = `Call ${child.nameEn} to the upcoming VHSND immunization day for pending vaccine and deworming tablet.`;
    } else {
      oneClearActionHi = `अगले 3 दिन के भीतर गृह भेंट कर बच्चे की खुराक व दिनचर्या की समीक्षा करें और केंद्र उपस्थिति शुरू कराएं।`;
      oneClearActionBho = `3 दिन के भीतर घरे जा के लइका के खियावे-पियावे के हाल बूझीं आ फेर से केंद्र पर भेजावल शुरू कराईं।`;
      oneClearActionEn = `Do a home visit within 3 days to review feeding routine and restart Anganwadi attendance.`;
    }
    counselingHintHi = `माँ से कहें: "बच्चे के भोजन में 1 कटोरी दाल-चावल के साथ भुनी मूंगफली, गुड़ या केला हर दिन शामिल करें।"`;
    counselingHintBho = `माई से कहीं: "लइका के खाना में एक कटोरी दाल-भात के साथे भुजल बदाम, मीठा (गुड़) चाहे पाकल केरा रोज खियाईं।"`;
    counselingHintEn = `Tell mother: "Add roasted peanuts, jaggery, or mashed banana daily alongside dal-rice."`;
  } else {
    urgencyHi = 'नियमित मासिक निगरानी';
    urgencyBho = 'महीना के नियमित जांच';
    urgencyEn = 'Routine monthly check';
    oneClearActionHi = `${child.nameHi} की प्रगति अच्छी है — माह के अंत में नियमित वजन व MUAC जांच दर्ज करें और माँ को प्रोत्साहित करें।`;
    oneClearActionBho = `${child.nameHi} के सेहत बढ़िया बा — महीना पूरा भइला पर वजन आ MUAC नाप लिख लीं आ माई के शाबाशी दीं।`;
    oneClearActionEn = `${child.nameEn} is progressing well — record routine month-end weight & MUAC and encourage the mother.`;
    counselingHintHi = `माँ से कहें: "बहुत बढ़िया! हर दिन हरी सब्ज़ी, दाल और समय पर टीकाकरण इसी तरह जारी रखें।"`;
    counselingHintBho = `माई से कहीं: "बहुत नीमन! एही तरह रोज हरियर साग-सब्जी, दाल आ समय से टीका लगवावत रहीं।"`;
    counselingHintEn = `Tell mother: "Great progress! Continue daily greens, lentils, and timely immunization."`;
  }

  return {
    level,
    score,
    reasons,
    oneClearActionHi,
    oneClearActionBho,
    oneClearActionEn,
    urgencyHi,
    urgencyBho,
    urgencyEn,
    counselingHintHi,
    counselingHintBho,
    counselingHintEn,
  };
}
