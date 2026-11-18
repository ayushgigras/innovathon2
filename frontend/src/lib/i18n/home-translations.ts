export type SupportedLanguage = "en" | "hi" | "ur";

export interface HomeTranslation {
  topBadge: string;
  brandTitle: string;
  brandSubtitle: string;
  navAapdaGridBtn: string;
  adminLoginBtn: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroDesc: string;
  ctaEnterGrid: string;
  ctaReportIncident: string;
  ctaLiveRoadMap: string;
  statsMonitoredAxis: string;
  statsMonitoredAxisVal: string;
  statsEmergencyUnits: string;
  statsEmergencyUnitsVal: string;
  statsReliefDepots: string;
  statsReliefDepotsVal: string;
  statsResponseTime: string;
  statsResponseTimeVal: string;
  pillar1Title: string;
  pillar1Desc: string;
  pillar2Title: string;
  pillar2Desc: string;
  pillar3Title: string;
  pillar3Desc: string;
  pillar4Title: string;
  pillar4Desc: string;
  emergencyHelplinesTitle: string;
  emergencyHelplinesDesc: string;
  helplineNational: string;
  helplineJkDisaster: string;
  helplineNhai: string;
  locationPromptTitle: string;
  locationPromptDesc: string;
  footerRights: string;
  footerDisclaimer: string;
}

export const HOME_TRANSLATIONS: Record<SupportedLanguage, HomeTranslation> = {
  en: {
    topBadge: "GOVERNMENT OF JAMMU & KASHMIR — STATE DISASTER MANAGEMENT AUTHORITY",
    brandTitle: "AAPDA GRID",
    brandSubtitle: "Mountain Disaster Intelligence & Response Network",
    navAapdaGridBtn: "AAPDA Grid Portal →",
    adminLoginBtn: "Official EOC Login",
    heroHeadline: "Real-Time Mountain Disaster Sentinel & Emergency Response for J&K",
    heroSubheadline: "Protecting Chenab Gorge, Pir Panjal & Himalayan Mountain Highways",
    heroDesc:
      "AAPDA Grid is the unified early warning, road closure detection, and disaster relief telemetry platform. Connect with on-ground field officers, track live machinery clearing landslides on NH-44, receive localized bypass routes, and report emergencies in real time.",
    ctaEnterGrid: "Enter AAPDA Grid (Select Area)",
    ctaReportIncident: "Report an Incident",
    ctaLiveRoadMap: "View Live Road Map",
    statsMonitoredAxis: "Highways Monitored",
    statsMonitoredAxisVal: "NH-44 & Mughal Rd",
    statsEmergencyUnits: "Field Patrol Teams",
    statsEmergencyUnitsVal: "24 Active Posts",
    statsReliefDepots: "Relief & Machinery",
    statsReliefDepotsVal: "JCBs, 4x4 & Medical",
    statsResponseTime: "Field Verification",
    statsResponseTimeVal: "< 15 Mins",
    pillar1Title: "Mountain Highway Sentinel (MargRakshak)",
    pillar1Desc:
      "Continuous tracking of landslides, shooting stones, and road blockages across NH-44, Banihal, Panthyal, and Mughal Road with instant diversion routing.",
    pillar2Title: "Eyewitness Incident Reporting & Deduplication",
    pillar2Desc:
      "Citizens report road obstacles and landslides in under 30 seconds. Geotagged duplicates are merged into unified incident cards for rapid field officer verification.",
    pillar3Title: "RahatGrid Heavy Machinery & Convoy Telemetry",
    pillar3Desc:
      "Live satellite telemetry tracking JCB 3DX earthmovers, ambulances, and food convoys as they traverse mountain terrains to reach cut-off settlements.",
    pillar4Title: "Localized Area Broadcasts & Alternate Routes",
    pillar4Desc:
      "Automatic detection of citizen sector (Jammu, Ramban, Udhampur, Doda) delivering targeted emergency advisories, highway closures, and alternate bypass transit.",
    emergencyHelplinesTitle: "24x7 Emergency Helplines (Jammu & Kashmir)",
    emergencyHelplinesDesc:
      "In case of immediate threat to life, contact district disaster control rooms directly.",
    helplineNational: "National Emergency Helpline: 112",
    helplineJkDisaster: "J&K State Emergency Operations Centre (SEOC): 1077",
    helplineNhai: "NHAI Highway Emergency Service: 1033",
    locationPromptTitle: "Select Your Area to Enter AAPDA Grid",
    locationPromptDesc:
      "AAPDA Grid tailors emergency road closures, bypass routes, and field updates to your exact sector in Jammu & Kashmir.",
    footerRights: "© 2026 AAPDA Grid — State Emergency Operations Centre (SEOC) & DDMA Jammu & Kashmir.",
    footerDisclaimer:
      "Developed for the Jammu & Kashmir Disaster Management Initiative. Real-time mountain intelligence for public safety.",
  },

  hi: {
    topBadge: "जम्मू और कश्मीर सरकार — राज्य आपदा प्रबंधन प्राधिकरण (SDMA)",
    brandTitle: "आपदा ग्रिड (AAPDA GRID)",
    brandSubtitle: "पर्वतीय आपदा निगरानी एवं त्वरित राहत नेटवर्क",
    navAapdaGridBtn: "आपदा ग्रिड पोर्टल →",
    adminLoginBtn: "अधिकारी ईओसी लॉगिन",
    heroHeadline: "जम्मू-कश्मीर के लिए वास्तविक समय पर्वतीय आपदा संप्रहरी एवं आपातकालीन प्रतिक्रिया",
    heroSubheadline: "चिनाब घाटी, पीर पंजाल एवं हिमालयी राजमार्गों की 24x7 सुरक्षा",
    heroDesc:
      "आपदा ग्रिड (AAPDA Grid) जम्मू-कश्मीर का एकीकृत पूर्व चेतावनी, सड़क अवरोध पहचान और राहत आपूर्ति टेलीमेट्री प्लेटफॉर्म है। जमीनी फील्ड अधिकारियों से जुड़ें, NH-44 पर भूस्खलन हटाती जेसीबी मशीनों को लाइव ट्रैक करें और अपने क्षेत्र के अनुसार सुरक्षित वैकल्पिक मार्ग प्राप्त करें।",
    ctaEnterGrid: "आपदा ग्रिड में प्रवेश करें (स्थान चुनें)",
    ctaReportIncident: "आपदा घटना की रिपोर्ट करें",
    ctaLiveRoadMap: "लाइव सड़क मानचित्र देखें",
    statsMonitoredAxis: "निगरानी अधीन मार्ग",
    statsMonitoredAxisVal: "NH-44 एवं मुगल रोड",
    statsEmergencyUnits: "सक्रिय फील्ड गश्ती दल",
    statsEmergencyUnitsVal: "24 अग्रिम चौकियां",
    statsReliefDepots: "राहत सामग्री व मशीनरी",
    statsReliefDepotsVal: "JCB, 4x4 व एम्बुलेंस",
    statsResponseTime: "फील्ड सत्यापन समय",
    statsResponseTimeVal: "< 15 मिनट",
    pillar1Title: "मार्ग रक्षक: पर्वतीय राजमार्ग निगरानी",
    pillar1Desc:
      "NH-44, बनिहाल, पंथियाल और मुगल रोड पर भूस्खलन और पत्थरों के गिरने की निरंतर ट्रैकिंग तथा वैकल्पिक डायवर्जन रूट्स की तुरंत गणना।",
    pillar2Title: "नागरिक प्रत्यक्षदर्शी रिपोर्टिंग एवं सत्यापन",
    pillar2Desc:
      "नागरिक केवल 30 सेकंड में सड़क रुकावट या भूस्खलन की रिपोर्ट कर सकते हैं। सिस्टम समान रिपोर्टों को एक में जोड़कर फील्ड ऑफिसर को तुरंत कॉल व सत्यापन भेजता है।",
    pillar3Title: "राहत ग्रिड: भारी मशीनरी व काफिला लाइव जीपीएस",
    pillar3Desc:
      "पहाड़ी रास्तों पर कट चुके गांवों तक पहुंचने वाले जेसीबी अर्थमूवर, एम्बुलेंस और खाद्य सामग्री से भरे ट्रकों की वास्तविक उपग्रह जीपीएस ट्रैकिंग।",
    pillar4Title: "क्षेत्र-आधारित आपातकालीन अलर्ट एवं वैकल्पिक मार्ग",
    pillar4Desc:
      "नागरिकों के क्षेत्र (जम्मू, रामबन, उधमपुर, डोडा) का स्वतः पता लगाकर केवल उनके मार्ग से जुड़े अलर्ट और वैकल्पिक सुगम मार्ग प्रदर्शित करना।",
    emergencyHelplinesTitle: "24x7 आपातकालीन हेल्पलाइन (जम्मू और कश्मीर)",
    emergencyHelplinesDesc: "जीवन के लिए तात्कालिक खतरे की स्थिति में सीधे आपदा नियंत्रण कक्ष से संपर्क करें।",
    helplineNational: "राष्ट्रीय आपातकालीन हेल्पलाइन: 112",
    helplineJkDisaster: "जम्मू-कश्मीर राज्य आपदा नियंत्रण कक्ष: 1077",
    helplineNhai: "एनएचएआई राजमार्ग हेल्पलाइन: 1033",
    locationPromptTitle: "आपदा ग्रिड में प्रवेश हेतु अपना क्षेत्र चुनें",
    locationPromptDesc:
      "आपदा ग्रिड आपके चयनित क्षेत्र के अनुसार सड़क बंद होने की सूचना, बाईपास मार्ग और फील्ड ऑफिसर अपडेट अनुकूलित करता है।",
    footerRights: "© 2026 आपदा ग्रिड — राज्य आपातकालीन संचालन केंद्र (SEOC) एवं जिला आपदा प्राधिकरण, जम्मू और कश्मीर।",
    footerDisclaimer: "जम्मू और कश्मीर आपदा प्रबंधन पहल के तहत जन सुरक्षा हेतु विकसित वास्तविक समय पर्वतीय प्रणाली।",
  },

  ur: {
    topBadge: "حکومتِ جموں و کشمیر — اسٹیٹ ڈیزاسٹر مینجمنٹ اتھارٹی",
    brandTitle: "آپدا گرڈ (AAPDA GRID)",
    brandSubtitle: "پہاڑی آفات کی نگرانی اور ہنگامی ردعمل کا نظام",
    navAapdaGridBtn: "← آپدا گرڈ پورٹل",
    adminLoginBtn: "کنٹرول روم لاگ ان",
    heroHeadline: "جموں و کشمیر کے لیے پہاڑی آفات کا ریئل ٹائم انتباہ اور ہنگامی ردعمل",
    heroSubheadline: "دریائے چناب کی وادی، پیر پنجال اور ہمالیائی شاہراہوں کی 24 گھنٹے نگرانی",
    heroDesc:
      "آپدا گرڈ جموں و کشمیر کا مربوط پیشگی انتباہ، سڑکوں کی بندش اور ریلیف قافلوں کا لائیو جی پی ایس پلیٹ فارم ہے۔ فیلڈ افسران سے براہِ راست رابطہ کریں، این ایچ 44 پر لینڈ سلائیڈنگ ہٹاتی جے سی بی مشینوں کو دیکھیں اور متبادل محفوظ راستے حاصل کریں۔",
    ctaEnterGrid: "آپدا گرڈ میں داخل ہوں (علاقہ منتخب کریں)",
    ctaReportIncident: "حادثے کی اطلاع دیں",
    ctaLiveRoadMap: "لائیو روڈ میپ دیکھیں",
    statsMonitoredAxis: "زیر نگرانی شاہراہیں",
    statsMonitoredAxisVal: "این ایچ 44 اور مغل روڈ",
    statsEmergencyUnits: "فیلڈ پیٹرول چوکیاں",
    statsEmergencyUnitsVal: "24 چوکیاں فعال",
    statsReliefDepots: "امدادی مشینری و سامان",
    statsReliefDepotsVal: "جے سی بی، ایمبولینس و راشن",
    statsResponseTime: "فیلڈ تصدیقی وقت",
    statsResponseTimeVal: "15 منٹ سے کم",
    pillar1Title: "مارگ رکشک: شاہراہوں کی پہاڑی نگرانی",
    pillar1Desc:
      "این ایچ 44، بانہال، پنتھیال اور مغل روڈ پر لینڈ سلائیڈنگ اور پتھر گرنے کی ریئل ٹائم نگرانی اور فوری متبادل راستوں کی رہنمائی۔",
    pillar2Title: "شہری رپورٹنگ اور فوری فیلڈ تصدیق",
    pillar2Desc:
      "شہری سڑک بند ہونے کی تصویر اور لوکیشن فوری بھیج سکتے ہیں۔ سسٹم ایک ہی علاقے کی اطلاعات کو یکجا کر کے فیلڈ آفیسر کو تصدیق کے لیے روانہ کرتا ہے۔",
    pillar3Title: "راحت گرڈ: مشینری اور ریلیف کانوائے کی لائیو ٹریکنگ",
    pillar3Desc:
      "پہاڑی راستوں پر محصور بستیوں تک پہنچنے والی جے سی بی مشینوں، 4x4 ٹرکوں اور ایمبولینسوں کی لائیو سیٹلائٹ جی پی ایس پرواز۔",
    pillar4Title: "علاقائی الرٹس اور متبادل راستوں کی نشاندہی",
    pillar4Desc:
      "شہریوں کے مقام (جموں، رامبن، ادھمپور، ڈوڈہ) کے مطابق ہنگامی اطلاعات اور مغل روڈ جیسے متبادل راستوں کی ذاتی رہنمائی۔",
    emergencyHelplinesTitle: "24x7 ہنگامی ہیلپ لائنز (جموں و کشمیر)",
    emergencyHelplinesDesc: "فوری ایمرجنسی کی صورت میں براہِ راست کنٹرول روم سے رابطہ کریں۔",
    helplineNational: "قومی ایمرجنسی ہیلپ لائن: 112",
    helplineJkDisaster: "جموں و کشمیر ڈیزاسٹر کنٹرول روم: 1077",
    helplineNhai: "قومی شاہراہ ہیلپ لائن: 1033",
    locationPromptTitle: "آپدا گرڈ میں داخلے کے لیے اپنا علاقہ منتخب کریں",
    locationPromptDesc: "آپدا گرڈ آپ کے مخصوص علاقے کے لیے بند سڑکیں اور متبادل راستے خودکار ترتیب دیتا ہے۔",
    footerRights: "© 2026 آپدا گرڈ — اسٹیٹ ایمرجنسی آپریشنز سینٹر اور ڈی ڈی ایم اے جموں و کشمیر۔",
    footerDisclaimer: "عوامی تحفظ کے لیے جموں و کشمیر ڈیزاسٹر مینجمنٹ اتھارٹی کا باضابطہ ڈیجیٹل اقدام۔",
  },
};
