export type Language = "en" | "mr" | "hi";

export interface Translations {
  // Brand & Header
  brandTitle: string;
  brandSubtitle: string;
  clinicalSupport: string;
  searchPlaceholder: string;
  onlineIndicator: string;

  // Navigation
  navDashboard: string;
  navChecker: string;
  navResults: string;
  navMedicines: string;
  navAbout: string;
  signOut: string;
  patientAccount: string;

  // Screen titles & subtitles
  dashboardTitle: string;
  dashboardSubtitle: string;
  checkerTitle: string;
  checkerSubtitle: string;
  resultsTitle: string;
  resultsSubtitle: string;
  medicinesTitle: string;
  medicinesSubtitle: string;
  aboutTitle: string;
  aboutSubtitle: string;

  // Auth Page
  signInToAccount: string;
  patientRegistration: string;
  forgotPasswordTitle: string;
  signInDesc: string;
  signUpDesc: string;
  forgotPasswordDesc: string;
  signInTab: string;
  signUpTab: string;
  forgotPasswordTab: string;
  emailLabel: string;
  passwordLabel: string;
  forgotPasswordLink: string;
  signInBtn: string;
  signingInBtn: string;
  noAccountPrompt: string;
  createAccountLink: string;
  fullNameLabel: string;
  dobLabel: string;
  ageValidBadge: string;
  ageInvalidBadge: string;
  dobHint: string;
  mobileLabel: string;
  confirmPasswordLabel: string;
  createAccountBtn: string;
  creatingAccountBtn: string;
  alreadyRegisteredPrompt: string;
  signInHereLink: string;
  registeredMobileLabel: string;
  registeredMobileHint: string;
  okBtn: string;
  verifyingBtn: string;
  rememberPasswordPrompt: string;
  backToSignInBtn: string;
  securityNote: string;
  disclaimerText: string;

  // Welcome Popup
  welcome: string;
  systemName: string;
  sessionAuthenticated: string;
  welcomeDesc: string;
  dismissingIn: string;
  enteringDashboard: string;
  enterNowBtn: string;

  // Symptom panel & actions
  symptomInputKicker: string;
  selectSymptomsTitle: string;
  selectSymptomsSubtitle: string;
  clearAllBtn: string;
  symptomSearchPlaceholder: string;
  addSymptomText: string;
  popularLabel: string;
  selectedSymptomsLabel: string;
  noSymptomsSelected: string;
  runAnalysisBtn: string;
  analysingBtn: string;
  atLeastOneSymptomPrompt: string;

  // Feature cards
  featureConditionTitle: string;
  featureConditionText: string;
  featureXaiTitle: string;
  featureXaiText: string;
  featureMedicineTitle: string;
  featureMedicineText: string;
  featureSafetyTitle: string;
  featureSafetyText: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    brandTitle: "AI Medicine",
    brandSubtitle: "Information System",
    clinicalSupport: "Clinical Decision Support",
    searchPlaceholder: "Search symptoms, conditions, medicines...",
    onlineIndicator: "Online",

    navDashboard: "Dashboard",
    navChecker: "Symptom Checker",
    navResults: "Prediction Results",
    navMedicines: "Medicine Information",
    navAbout: "About the Project",
    signOut: "Sign Out",
    patientAccount: "Patient Account",

    dashboardTitle: "Healthcare Analytics Dashboard",
    dashboardSubtitle: "AI-Powered Medical Decision Support System",
    checkerTitle: "Symptom Checker & Analysis",
    checkerSubtitle: "132 Clinical Features • Real-Time Machine Learning Inference",
    resultsTitle: "Prediction & Explainability Results",
    resultsSubtitle: "Multi-Class Logistic Regression • XAI Attribution • Medicine Safety",
    medicinesTitle: "Medicine Information Explorer",
    medicinesSubtitle: "Verified Dataset Formulations, Side Effects & Contraindications",
    aboutTitle: "Project Methodology & Architecture",
    aboutSubtitle: "Academic Decision Support Prototype & Responsible AI Standards",

    signInToAccount: "Sign In to Your Account",
    patientRegistration: "Patient Registration",
    forgotPasswordTitle: "Forgot Password",
    signInDesc: "Access AI-powered symptom analysis, model predictions, and safety verification.",
    signUpDesc: "Create an account to evaluate symptoms and access personalized clinical support.",
    forgotPasswordDesc: "Enter your registered mobile number to verify your account and access your dashboard.",
    signInTab: "Sign In",
    signUpTab: "Sign Up",
    forgotPasswordTab: "Forgot Password",
    emailLabel: "Email Address",
    passwordLabel: "Password",
    forgotPasswordLink: "Forgot Password?",
    signInBtn: "Sign In to Dashboard",
    signingInBtn: "Signing In…",
    noAccountPrompt: "Don't have an account yet?",
    createAccountLink: "Create a patient account",
    fullNameLabel: "Full Name",
    dobLabel: "Date of Birth",
    ageValidBadge: "Eligible",
    ageInvalidBadge: "Under 18",
    dobHint: "Must be at least 18 years old to register. Calculated securely from your birth date.",
    mobileLabel: "Mobile Number",
    confirmPasswordLabel: "Confirm Password",
    createAccountBtn: "Create Patient Account",
    creatingAccountBtn: "Creating Account…",
    alreadyRegisteredPrompt: "Already registered?",
    signInHereLink: "Sign in here",
    registeredMobileLabel: "Registered Mobile Number",
    registeredMobileHint: "Enter the mobile number registered during your account signup to verify your identity.",
    okBtn: "OK",
    verifyingBtn: "Verifying…",
    rememberPasswordPrompt: "Remembered your password?",
    backToSignInBtn: "Back to Sign In",
    securityNote: "Security note: Mobile verification is validated on the backend against your registered patient profile. Production systems require SMS OTP authentication.",
    disclaimerText: "Educational AI decision-support platform. This system does not provide medical diagnoses or prescriptions. Minimum age requirement is 18 years.",

    welcome: "Welcome",
    systemName: "AI Medicine Recommendation System",
    sessionAuthenticated: "Session Authenticated",
    welcomeDesc: "Your clinical analytics dashboard is ready with 132 machine learning symptom inference features and safety verification.",
    dismissingIn: "Dismissing in",
    enteringDashboard: "Entering dashboard…",
    enterNowBtn: "Enter Dashboard →",

    symptomInputKicker: "Symptom input",
    selectSymptomsTitle: "Select what you are experiencing",
    selectSymptomsSubtitle: "Search across 132 model-supported symptoms. You can remove symptoms at any time.",
    clearAllBtn: "Clear all",
    symptomSearchPlaceholder: "Search symptoms, e.g. itching, skin rash, mild fever, cough",
    addSymptomText: "Add symptom",
    popularLabel: "Popular:",
    selectedSymptomsLabel: "Selected Symptoms",
    noSymptomsSelected: "No symptoms selected yet. Choose from above to begin analysis.",
    runAnalysisBtn: "Run Clinical Analysis",
    analysingBtn: "Evaluating symptoms with ML model…",
    atLeastOneSymptomPrompt: "Select at least one symptom before continuing.",

    featureConditionTitle: "Condition Prediction",
    featureConditionText: "Explore model-based patterns from selected symptoms.",
    featureXaiTitle: "Explainable AI",
    featureXaiText: "See which inputs influenced the model's output.",
    featureMedicineTitle: "Medicine Information",
    featureMedicineText: "Review records available in the connected dataset.",
    featureSafetyTitle: "Safety Information",
    featureSafetyText: "Read clearly labelled medicine safety information.",
  },

  mr: {
    brandTitle: "एआय मेडिसिन",
    brandSubtitle: "माहिती प्रणाली",
    clinicalSupport: "क्लिनिकल निर्णय सहाय्यक",
    searchPlaceholder: "लक्षणे, आजार किंवा औषधे शोधा...",
    onlineIndicator: "सक्रिय",

    navDashboard: "डॅशबोर्ड",
    navChecker: "लक्षण तपासणी",
    navResults: "निदान अंदाज",
    navMedicines: "औषध माहिती",
    navAbout: "प्रकल्पाविषयी",
    signOut: "बाहेर पडा (Sign Out)",
    patientAccount: "रुग्ण खाते",

    dashboardTitle: "आरोग्य विश्लेषण डॅशबोर्ड",
    dashboardSubtitle: "एआय-आधारित वैद्यकीय निर्णय सहाय्य प्रणाली",
    checkerTitle: "लक्षण तपासणी आणि विश्लेषण",
    checkerSubtitle: "१३२ क्लिनिकल लक्षणे • रिअल-टाईम मशीन लर्निंग मॉडेल",
    resultsTitle: "अंदाज आणि स्पष्टीकरण निकाल",
    resultsSubtitle: "लॉजिस्टिक रिग्रेशन अंदाज • XAI घटक • औषध सुरक्षा",
    medicinesTitle: "औषध माहिती एक्सप्लोरर",
    medicinesSubtitle: "प्रमाणित औषध फॉर्म्युलेशन, दुष्परिणाम आणि सुरक्षितता",
    aboutTitle: "प्रकल्प पद्धती आणि रचना",
    aboutSubtitle: "शैक्षणिक निर्णय समर्थन आणि जबाबदार एआय मानके",

    signInToAccount: "तुमच्या खात्यात साइन इन करा",
    patientRegistration: "नवीन रुग्ण नोंदणी",
    forgotPasswordTitle: "पासवर्ड विसरलात?",
    signInDesc: "एआय-सक्षम लक्षण विश्लेषण, मॉडेल अंदाज आणि औषध सुरक्षिततेसाठी प्रवेश मिळवा.",
    signUpDesc: "लक्षणे तपासण्यासाठी आणि वैयक्तिकृत क्लिनिकल मदतीसाठी खाते तयार करा.",
    forgotPasswordDesc: "आपली ओळख पडताळण्यासाठी आणि डॅशबोर्डवर जाण्यासाठी नोंदणीकृत मोबाईल नंबर टाका.",
    signInTab: "साइन इन",
    signUpTab: "नोंदणी (Sign Up)",
    forgotPasswordTab: "पासवर्ड विसरलात",
    emailLabel: "ईमेल पत्ता",
    passwordLabel: "पासवर्ड",
    forgotPasswordLink: "पासवर्ड विसरलात?",
    signInBtn: "डॅशबोर्डवर साइन इन करा",
    signingInBtn: "साइन इन होत आहे…",
    noAccountPrompt: "अद्याप खाते नाही?",
    createAccountLink: "नवीन रुग्ण खाते तयार करा",
    fullNameLabel: "पूर्ण नाव",
    dobLabel: "जन्मतारीख",
    ageValidBadge: "पात्र (१८+ वर्षे)",
    ageInvalidBadge: "१८ वर्षांखालील",
    dobHint: "नोंदणीसाठी वय किमान १८ वर्षे असणे आवश्यक आहे. जन्मतारखेवरून वय मोजले जाते.",
    mobileLabel: "मोबाईल नंबर",
    confirmPasswordLabel: "पासवर्डची पुष्टी करा",
    createAccountBtn: "रुग्ण खाते तयार करा",
    creatingAccountBtn: "खाते तयार होत आहे…",
    alreadyRegisteredPrompt: "आधीच नोंदणी झाली आहे?",
    signInHereLink: "येथे साइन इन करा",
    registeredMobileLabel: "नोंदणीकृत मोबाईल नंबर",
    registeredMobileHint: "ओळख पडताळणीसाठी साइनअप दरम्यान नोंदवलेला मोबाईल नंबर टाका.",
    okBtn: "ओके (OK)",
    verifyingBtn: "पडताळणी सुरू आहे…",
    rememberPasswordPrompt: "पासवर्ड आठवला का?",
    backToSignInBtn: "साइन इन वर परत जा",
    securityNote: "सुरक्षा टीप: मोबाईल पडताळणी सुरक्षित रुग्ण डेटाबेसमधून केली जाते. लाईव्ह सिस्टीममध्ये एसएमएस ओटीपी आवश्यक असतो.",
    disclaimerText: "शैक्षणिक एआय निर्णय-समर्थन व्यासपीठ. ही प्रणाली वैद्यकीय निदान किंवा प्रिस्क्रिप्शन देत नाही. किमान वय १८ वर्षे असणे आवश्यक आहे.",

    welcome: "स्वागत आहे",
    systemName: "एआय औषध शिफारस प्रणाली",
    sessionAuthenticated: "सत्र प्रमाणीकृत झाले",
    welcomeDesc: "आपला क्लिनिकल डॅशबोर्ड १३२ मशीन लर्निंग लक्षण मॉडेल आणि सुरक्षा पडताळणीसह सज्ज आहे.",
    dismissingIn: "आपोआप बंद होत आहे",
    enteringDashboard: "डॅशबोर्ड सुरू होत आहे…",
    enterNowBtn: "डॅशबोर्डवर जा →",

    symptomInputKicker: "लक्षण इनपुट",
    selectSymptomsTitle: "तुम्हाला जाणवणारी लक्षणे निवडा",
    selectSymptomsSubtitle: "१३२ समर्थित लक्षणांमधून शोधा. तुम्ही लक्षणे कधीही बदलू शकता.",
    clearAllBtn: "सर्व काढा",
    symptomSearchPlaceholder: "लक्षणे शोधा, उदा. खाज सुटणे, पुरळ, ताप, खोकला",
    addSymptomText: "लक्षण जोडा",
    popularLabel: "लोकप्रिय:",
    selectedSymptomsLabel: "निवडलेली लक्षणे",
    noSymptomsSelected: "कोणतेही लक्षण निवडलेले नाही. विश्लेषणासाठी वरील लक्षणे निवडा.",
    runAnalysisBtn: "क्लिनिकल विश्लेषण सुरू करा",
    analysingBtn: "मशीन लर्निंग मॉडेलद्वारे लक्षणे तपासत आहे…",
    atLeastOneSymptomPrompt: "पुढे जाण्यापूर्वी किमान एक लक्षण निवडा.",

    featureConditionTitle: "आजार अंदाज",
    featureConditionText: "निवडलेल्या लक्षणांवरून मॉडेल-आधारित आजारांचे नमुने पहा.",
    featureXaiTitle: "स्पष्टीकरणात्मक एआय (XAI)",
    featureXaiText: "कोणत्या लक्षणांनी अंदाजावर प्रभाव टाकला ते तपासा.",
    featureMedicineTitle: "औषध माहिती",
    featureMedicineText: "डेटाबेसमध्ये उपलब्ध औषधांची माहिती जाणून घ्या.",
    featureSafetyTitle: "सुरक्षितता माहिती",
    featureSafetyText: "औषधांच्या सुरक्षिततेचे आणि दुष्परिणामांचे लेबल वाचा.",
  },

  hi: {
    brandTitle: "एआई मेडिसिन",
    brandSubtitle: "सूचना प्रणाली",
    clinicalSupport: "क्लिनिकल निर्णय समर्थन",
    searchPlaceholder: "लक्षण, बीमारी या दवाइयां खोजें...",
    onlineIndicator: "सक्रिय",

    navDashboard: "डैशबोर्ड",
    navChecker: "लक्षण जांच",
    navResults: "भविष्यवाणी परिणाम",
    navMedicines: "दवा जानकारी",
    navAbout: "प्रोजेक्ट के बारे में",
    signOut: "साइन आउट (लॉग आउट)",
    patientAccount: "मरीज खाता",

    dashboardTitle: "स्वास्थ्य सेवा विश्लेषण डैशबोर्ड",
    dashboardSubtitle: "एआई-संचालित चिकित्सा निर्णय समर्थन प्रणाली",
    checkerTitle: "लक्षण जांच एवं विश्लेषण",
    checkerSubtitle: "132 क्लिनिकल लक्षण • रीयल-टाइम मशीन लर्निंग मॉडल",
    resultsTitle: "पूर्वानुमान एवं व्याख्या परिणाम",
    resultsSubtitle: "लॉजिस्टिक रिग्रेशन मॉडल • XAI कारक • दवा सुरक्षा",
    medicinesTitle: "दवा जानकारी एक्सप्लोरर",
    medicinesSubtitle: "सत्यापित दवा फॉर्मूलेशन, दुष्प्रभाव और सावधानियां",
    aboutTitle: "परियोजना पद्धति और वास्तुकला",
    aboutSubtitle: "शैक्षणिक निर्णय सहायता प्रोटोटाइप और जिम्मेदार एआई मानक",

    signInToAccount: "अपने खाते में साइन इन करें",
    patientRegistration: "मरीज पंजीकरण",
    forgotPasswordTitle: "पासवर्ड भूल गए?",
    signInDesc: "एआई-संचालित लक्षण विश्लेषण, मॉडल पूर्वानुमान और सुरक्षा सत्यापन प्राप्त करें।",
    signUpDesc: "लक्षणों का मूल्यांकन करने और व्यक्तिगत क्लिनिकल सहायता के लिए खाता बनाएं।",
    forgotPasswordDesc: "अपनी पहचान सत्यापित करने और डैशबोर्ड तक पहुंचने के लिए पंजीकृत मोबाइल नंबर दर्ज करें।",
    signInTab: "साइन इन",
    signUpTab: "पंजीकरण (Sign Up)",
    forgotPasswordTab: "पासवर्ड भूल गए",
    emailLabel: "ईमेल पता",
    passwordLabel: "पासवर्ड",
    forgotPasswordLink: "पासवर्ड भूल गए?",
    signInBtn: "डैशबोर्ड में साइन इन करें",
    signingInBtn: "साइन इन हो रहा है…",
    noAccountPrompt: "अभी तक खाता नहीं है?",
    createAccountLink: "मरीज खाता बनाएं",
    fullNameLabel: "पूरा नाम",
    dobLabel: "जन्म तिथि",
    ageValidBadge: "पात्र (18+ वर्ष)",
    ageInvalidBadge: "18 से कम",
    dobHint: "पंजीकरण के लिए न्यूनतम आयु 18 वर्ष आवश्यक है। यह आपकी जन्मतिथि से सत्यापित होती है।",
    mobileLabel: "मोबाइल नंबर",
    confirmPasswordLabel: "पासवर्ड की पुष्टि करें",
    createAccountBtn: "मरीज खाता बनाएं",
    creatingAccountBtn: "खाता बन रहा है…",
    alreadyRegisteredPrompt: "पहले से पंजीकृत हैं?",
    signInHereLink: "यहाँ साइन इन करें",
    registeredMobileLabel: "पंजीकृत मोबाइल नंबर",
    registeredMobileHint: "पहचान सत्यापित करने के लिए साइनअप के समय का मोबाइल नंबर दर्ज करें।",
    okBtn: "ओके (OK)",
    verifyingBtn: "सत्यापन हो रहा है…",
    rememberPasswordPrompt: "पासवर्ड याद आ गया?",
    backToSignInBtn: "साइन इन पर वापस जाएं",
    securityNote: "सुरक्षा नोट: मोबाइल सत्यापन पंजीकृत डेटाबेस से सुरक्षित रूप से किया जाता है। लाइव सिस्टम में एसएमएस ओटीपी आवश्यक होता है।",
    disclaimerText: "शैक्षणिक एआई निर्णय-समर्थन मंच। यह प्रणाली चिकित्सीय निदान या नुस्खा प्रदान नहीं करती है। न्यूनतम आयु 18 वर्ष आवश्यक है।",

    welcome: "स्वागत है",
    systemName: "एआई दवा सिफारिश प्रणाली",
    sessionAuthenticated: "सत्र प्रमाणित हुआ",
    welcomeDesc: "आपका क्लिनिकल डैशबोर्ड 132 मशीन लर्निंग लक्षण मॉडल और सुरक्षा जांच के साथ तैयार है।",
    dismissingIn: "स्वतः बंद हो रहा है",
    enteringDashboard: "डैशबोर्ड लोड हो रहा है…",
    enterNowBtn: "डैशबोर्ड में जाएं →",

    symptomInputKicker: "लक्षण इनपुट",
    selectSymptomsTitle: "आप जो महसूस कर रहे हैं उन लक्षणों को चुनें",
    selectSymptomsSubtitle: "132 समर्थित लक्षणों में से खोजें। आप कभी भी लक्षण हटा या जोड़ सकते हैं।",
    clearAllBtn: "सभी हटाएं",
    symptomSearchPlaceholder: "लक्षण खोजें, जैसे खुजली, त्वचा पर चकत्ते, बुखार, खांसी",
    addSymptomText: "लक्षण जोड़ें",
    popularLabel: "लोकप्रिय:",
    selectedSymptomsLabel: "चुने हुए लक्षण",
    noSymptomsSelected: "अभी तक कोई लक्षण नहीं चुना गया। विश्लेषण शुरू करने के लिए ऊपर से चुनें।",
    runAnalysisBtn: "क्लिनिकल विश्लेषण शुरू करें",
    analysingBtn: "मशीन लर्निंग मॉडल से लक्षणों का विश्लेषण हो रहा है…",
    atLeastOneSymptomPrompt: "आगे बढ़ने से पहले कृपया कम से कम एक लक्षण चुनें।",

    featureConditionTitle: "बीमारी का अनुमान",
    featureConditionText: "चुने हुए लक्षणों के आधार पर संभावित स्थितियों का विश्लेषण देखें।",
    featureXaiTitle: "व्याख्यात्मक एआई (XAI)",
    featureXaiText: "देखें कि किन लक्षणों ने मॉडल के परिणाम को प्रभावित किया।",
    featureMedicineTitle: "दवा की जानकारी",
    featureMedicineText: "डेटाबेस में उपलब्ध दवाओं और उनके उपयोग की जानकारी लें।",
    featureSafetyTitle: "सुरक्षा जानकारी",
    featureSafetyText: "दवाओं के दुष्प्रभाव और सुरक्षा चेतावनियों को ध्यान से पढ़ें।",
  },
};

export const LANGUAGE_STORAGE_KEY = "ai_med_preferred_lang";

export function getStoredLanguage(): Language {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === "mr" || saved === "hi" || saved === "en") {
      return saved;
    }
  } catch {
    // Ignore storage errors
  }
  return "en";
}

export function setStoredLanguage(lang: Language): void {
  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // Ignore storage errors
  }
}
