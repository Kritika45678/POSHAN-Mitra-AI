import type { Language } from '../types.ts';

export const UI_TEXT: Record<
  Language,
  {
    navChildren: string;
    navFollowUps: string;
    navRiskCheck: string;
    navGuide: string;
    navChat: string;
    navProfile: string;
    navFeedback: string;
    addChildBtn: string;
    addChildShort: string;
    centerBadge: string;
    searchPlaceholder: string;
    filterAll: string;
    filterHigh: string;
    filterRising: string;
    filterNormal: string;
    highRiskLabel: string;
    risingRiskLabel: string;
    normalRiskLabel: string;
    oneClearActionTitle: string;
    listenAction: string;
    stopAudio: string;
    askAiBtn: string;
    askingAi: string;
    markDoneBtn: string;
    doneLogged: string;
    signalsHeading: string;
    signalAttendance: string;
    signalRation: string;
    signalHealth: string;
    signalHousehold: string;
    rationCollected: string;
    rationPartial: string;
    rationMissed: string;
    motherLabel: string;
    monthsUnit: string;
    girl: string;
    boy: string;
    daysLabel: string;
    muacLabel: string;
    weightLabel: string;
    prevWeightLabel: string;
    immunizationLabel: string;
    upToDate: string;
    dueNow: string;
    counselingTitle: string;
    historyTitle: string;
    noHistory: string;
    illnessDiarrhea: string;
    illnessFever: string;
    illnessCough: string;
    illnessAppetite: string;
    houseFood: string;
    houseMigration: string;
    houseMotherUnwell: string;
    houseIfa: string;
    aiWhyHeading: string;
    aiErrorFallback: string;
    emptyFilterTitle: string;
    emptyFilterReset: string;
  }
> = {
  hi: {
    navChildren: 'सभी बच्चे',
    navFollowUps: 'आज के फॉलो-अप',
    navRiskCheck: 'त्वरित जांच',
    navGuide: 'पोषण मार्गदर्शिका',
    navChat: 'AI सहायक चैट',
    navProfile: 'प्रोफ़ाइल',
    navFeedback: 'फीडबैक',
    addChildBtn: '+ नया बच्चा',
    addChildShort: 'नया',
    centerBadge: 'आंगनवाड़ी केंद्र 042 · रामपुर वार्ड 3',
    searchPlaceholder: 'बच्चे या माँ का नाम खोजें...',
    filterAll: 'सभी',
    filterHigh: 'उच्च जोखिम',
    filterRising: 'निगरानी',
    filterNormal: 'स्वस्थ',
    highRiskLabel: 'उच्च जोखिम · SAM संकेत',
    risingRiskLabel: 'बढ़ता जोखिम · MAM निगरानी',
    normalRiskLabel: 'सामान्य · स्वस्थ विकास',
    oneClearActionTitle: 'आज का एक स्पष्ट कदम (Follow-Up Action)',
    listenAction: 'सुनें',
    stopAudio: 'रोकें',
    askAiBtn: 'AI से परामर्श बनाएं',
    askingAi: 'तैयार हो रहा है...',
    markDoneBtn: 'फॉलो-अप पूरा हुआ',
    doneLogged: 'आज का फॉलो-अप दर्ज',
    signalsHeading: 'बिखरे हुए 4 संकेत — एक नज़र में (बदलकर तुरंत जांचें)',
    signalAttendance: 'केंद्र उपस्थिति',
    signalRation: 'राशन / THR',
    signalHealth: 'वजन व MUAC टेप',
    signalHousehold: 'स्वास्थ्य व घरेलू संकेत',
    rationCollected: 'पूरा मिला',
    rationPartial: 'आंशिक',
    rationMissed: 'नहीं लिया',
    motherLabel: 'माँ',
    monthsUnit: 'माह',
    girl: 'बालिका',
    boy: 'बालक',
    daysLabel: 'दिन उपस्थित',
    muacLabel: 'MUAC माप',
    weightLabel: 'वर्तमान वजन',
    prevWeightLabel: 'पिछला वजन',
    immunizationLabel: 'टीकाकरण व कृमिनाशक',
    upToDate: 'पूरा है',
    dueNow: 'बाकी है',
    counselingTitle: 'माँ से बात करने का सरल तरीका',
    historyTitle: 'पिछले फॉलो-अप का विवरण',
    noHistory: 'अभी तक कोई पिछला फॉलो-अप दर्ज नहीं है।',
    illnessDiarrhea: 'दस्त / पेचिश',
    illnessFever: 'बुखार',
    illnessCough: 'खांसी / जुकाम',
    illnessAppetite: 'भूख में कमी',
    houseFood: 'घर में खाद्य कमी',
    houseMigration: 'काम हेतु पलायन',
    houseMotherUnwell: 'माँ अस्वस्थ / अकेली',
    houseIfa: 'आयरन (IFA) छूटा',
    aiWhyHeading: 'ये संकेत एक साथ क्यों महत्वपूर्ण हैं:',
    aiErrorFallback: 'AI परामर्श अभी उपलब्ध नहीं है — ऊपर दिया गया मुख्य कदम लागू करें।',
    emptyFilterTitle: 'इस श्रेणी में कोई बच्चा नहीं मिला।',
    emptyFilterReset: 'सभी बच्चे दिखाएं',
  },
  bho: {
    navChildren: 'सभे लइका',
    navFollowUps: 'आज के भेंट',
    navRiskCheck: 'तुरंत जांच',
    navGuide: 'पोषण सिखावन',
    navChat: 'AI संगवारी',
    navProfile: 'प्रोफ़ाइल',
    navFeedback: 'फीडबैक',
    addChildBtn: '+ लइका जोड़ीं',
    addChildShort: 'जोड़ीं',
    centerBadge: 'आंगनवाड़ी केंद्र 042 · रामपुर वार्ड 3',
    searchPlaceholder: 'लइका चाहे माई के नाम खोजीं...',
    filterAll: 'सभे',
    filterHigh: 'बेसी खतरा',
    filterRising: 'निगरानी',
    filterNormal: 'स्वस्थ',
    highRiskLabel: 'बेसी खतरा · SAM लछन',
    risingRiskLabel: 'बढ़त खतरा · MAM निगरानी',
    normalRiskLabel: 'ठीक बा · बढ़िया बढ़त',
    oneClearActionTitle: 'आज के एगो साफ काम (Follow-Up Action)',
    listenAction: 'सुनीं',
    stopAudio: 'रोकीं',
    askAiBtn: 'AI से सलाह लीं',
    askingAi: 'सलाह बनत बा...',
    markDoneBtn: 'भेंट पूरा भइल',
    doneLogged: 'आज के भेंट दर्ज बा',
    signalsHeading: 'छितराइल 4 गो बात — एक साथे (बदल के तुरंत देखीं)',
    signalAttendance: 'केंद्र आवल-जाइल',
    signalRation: 'राशन / THR',
    signalHealth: 'वजन आ MUAC फीता',
    signalHousehold: 'बीमारी आ घर के हाल',
    rationCollected: 'पूरा मिलल',
    rationPartial: 'आधा-अधूरा',
    rationMissed: 'ना मिलल',
    motherLabel: 'माई',
    monthsUnit: 'महीना',
    girl: 'बबुनी',
    boy: 'बबुआ',
    daysLabel: 'दिन आइल',
    muacLabel: 'MUAC नाप',
    weightLabel: 'अभी के वजन',
    prevWeightLabel: 'पाछिला वजन',
    immunizationLabel: 'टीका आ कीड़ा के दवा',
    upToDate: 'पूरा बा',
    dueNow: 'बाकी बा',
    counselingTitle: 'माई से प्रेम से कहे के बात',
    historyTitle: 'पाछिला भेंट के हिसाब',
    noHistory: 'अभी ले कवनो पाछिला भेंट दर्ज नइखे।',
    illnessDiarrhea: 'दस्त / झरी',
    illnessFever: 'बोखार',
    illnessCough: 'खांसी / जुकाम',
    illnessAppetite: 'भूख कम लागल',
    houseFood: 'घरे राशन के तंगी',
    houseMigration: 'कमाए बाहर गइल',
    houseMotherUnwell: 'माई के तबीयत खराब',
    houseIfa: 'आयरन (IFA) छूटल',
    aiWhyHeading: 'ई बात एक साथे काहे जरूरी बा:',
    aiErrorFallback: 'AI सलाह अभी नइखे मिल पावत — ऊपर लिखल मुख्य काम पूरा करीं।',
    emptyFilterTitle: 'एह में कवनो लइका ना मिलल।',
    emptyFilterReset: 'सभे लइका देखाईं',
  },
  en: {
    navChildren: 'All Children',
    navFollowUps: 'Today Follow-Ups',
    navRiskCheck: 'Quick Check',
    navGuide: 'Nutrition Guide',
    navChat: 'AI Assistant Chat',
    navProfile: 'Profile',
    navFeedback: 'Feedback',
    addChildBtn: '+ Add Child',
    addChildShort: 'Add',
    centerBadge: 'Anganwadi Center 042 · Rampur Ward 3',
    searchPlaceholder: 'Search child or mother name...',
    filterAll: 'All',
    filterHigh: 'High Risk',
    filterRising: 'Watch',
    filterNormal: 'Healthy',
    highRiskLabel: 'High Risk · SAM Alert',
    risingRiskLabel: 'Rising Risk · MAM Watch',
    normalRiskLabel: 'Normal · Healthy Growth',
    oneClearActionTitle: 'One Clear Follow-Up Action',
    listenAction: 'Listen',
    stopAudio: 'Stop',
    askAiBtn: 'Generate AI Counseling',
    askingAi: 'Analyzing...',
    markDoneBtn: 'Mark Action Done',
    doneLogged: 'Logged Today',
    signalsHeading: 'Unified 4 Signals — Tap to Update Live',
    signalAttendance: 'Attendance',
    signalRation: 'Ration / THR',
    signalHealth: 'Weight & MUAC',
    signalHousehold: 'Illness & Household',
    rationCollected: 'Collected',
    rationPartial: 'Partial',
    rationMissed: 'Missed',
    motherLabel: 'Mother',
    monthsUnit: 'mo',
    girl: 'Girl',
    boy: 'Boy',
    daysLabel: 'days present',
    muacLabel: 'MUAC Tape',
    weightLabel: 'Current Weight',
    prevWeightLabel: 'Previous Weight',
    immunizationLabel: 'Immunization & Deworming',
    upToDate: 'Up to date',
    dueNow: 'Overdue',
    counselingTitle: 'What to Tell the Mother',
    historyTitle: 'Follow-Up History',
    noHistory: 'No prior follow-up logged yet.',
    illnessDiarrhea: 'Diarrhea',
    illnessFever: 'Fever',
    illnessCough: 'Cough / Cold',
    illnessAppetite: 'Low Appetite',
    houseFood: 'Food Shortage',
    houseMigration: 'Migration',
    houseMotherUnwell: 'Mother Unwell',
    houseIfa: 'Missed IFA',
    aiWhyHeading: 'Why these scattered signals matter together:',
    aiErrorFallback: 'AI counseling unavailable right now — follow the primary action above.',
    emptyFilterTitle: 'No children match this filter.',
    emptyFilterReset: 'Show all children',
  },
};
