import os
import re
from typing import Any, Dict, List, Optional

RED_FLAG_KEYWORDS = [
    "chest pain",
    "heart attack",
    "unconscious",
    "stroke",
    "paralysis",
    "breathing difficulty",
    "severe bleeding",
    "severe burn",
    "choking",
    "poison",
    "suicide",
    "छातीत दुखणे",
    "श्वास घेण्यास त्रास",
    "बेशुद्ध",
    "पक्षाघात",
    "रक्तस्त्राव",
    "विषबाधा",
    "सीने में दर्द",
    "सांस लेने में तकलीफ",
    "बेहोश",
    "लकवा",
    "अत्यधिक रक्तस्राव",
    "जहर",
]

KB_RESPONSES = {
    "fever": {
        "en": (
            "🌡️ **Fever Guidance:**\n\n"
            "• **Rest & Hydration:** Drink plenty of fluids (water, ORS, coconut water, clear soups) to prevent dehydration.\n"
            "• **Cooling:** Rest in a cool, ventilated room and use light cotton clothing. A lukewarm water sponge can help reduce high body temperature.\n"
            "• **Monitoring:** Keep a regular temperature log using a digital thermometer.\n"
            "• **When to Consult a Doctor Immediately:** If fever exceeds 102°F (38.9°C), persists beyond 3 days, or is accompanied by stiff neck, rash, breathing difficulty, or persistent vomiting."
        ),
        "hi": (
            "🌡️ **बुखार (Fever) के लिए मार्गदर्शन:**\n\n"
            "• **आराम और पर्याप्त पानी:** शरीर में पानी की कमी न होने दें। खूब पानी, ओआरएस (ORS) और नारियल पानी पिएं।\n"
            "• **सामान्य उपाय:** हल्के सूती कपड़े पहनें और हवादार कमरे में आराम करें। तेज बुखार में हल्के गुनगुने पानी की पट्टी माथे पर रख सकते हैं।\n"
            "• **तापमान मापें:** डिजिटल थर्मामीटर से हर 4-6 घंटे में तापमान नोट करें।\n"
            "• **डॉक्टर से तुरंत कब मिलें:** यदि बुखार 102°F से अधिक हो, 3 दिनों से ज्यादा रहे, या सांस फूलने, गर्दन में अकड़न या उल्टी के साथ हो तो तुरंत डॉक्टर से संपर्क करें।"
        ),
        "mr": (
            "🌡️ **ताप (Fever) आल्यास प्राथमिक काळजी:**\n\n"
            "• **विश्रांती आणि भरपूर पाणी:** शरीरात पाण्याचे प्रमाण कमी होऊ नये म्हणून ओआरएस (ORS), ताक, नारळपाणी आणि भरपूर स्वच्छ पाणी प्या.\n"
            "• **साधे उपाय:** हलके सुती कपडे वापरा. ताप जास्त असल्यास कपाळावर कोमट पाण्याच्या पट्ट्या ठेवा.\n"
            "• **तापमान नोंद:** थर्मामीटरने दर ४-६ तासांनी तापमान तपासा.\n"
            "• **डॉक्टरांचा सल्ला कधी घ्यावा:** जर ताप १०२° फॅरनहाइटपेक्षा जास्त असेल, ३ दिवसांपेक्षा जास्त दिवस टिकून राहिला किंवा श्वास घेण्यास त्रास होत असेल, तर तातडीने डॉक्टरांकडे जा."
        ),
    },
    "blood_pressure": {
        "en": (
            "🩺 **Blood Pressure Management:**\n\n"
            "• **Normal BP:** Around 120/80 mmHg. High BP (Hypertension) is typically 140/90 mmHg or above.\n"
            "• **Dietary Advice:** Lower daily sodium/salt intake (< 5g/day). Adopt the DASH diet rich in vegetables, fruits, and low-fat dairy.\n"
            "• **Physical Activity:** 30 minutes of moderate aerobic exercise (brisk walking) 5 days a week.\n"
            "• **Warning:** Never adjust prescribed BP medication on your own. If systolic BP exceeds 180 or you feel chest tightness, seek emergency medical care."
        ),
        "hi": (
            "🩺 **रक्तचाप (Blood Pressure) नियंत्रण:**\n\n"
            "• **सामान्य बीपी:** लगभग 120/80 mmHg। उच्च रक्तचाप (हाइपरटेंशन) आमतौर पर 140/90 mmHg से ऊपर माना जाता है।\n"
            "• **आहार:** भोजन में नमक (Sodium) कम करें। हरी पत्तेदार सब्जियां, फल और साबुत अनाज लें।\n"
            "• **व्यायाम:** रोजाना 30 मिनट तेज चाल (Brisk Walk) या योग करें।\n"
            "• **महत्वपूर्ण चेतावनी:** डॉक्टर द्वारा दी गई बीपी की दवा कभी अचानक बंद न करें। बीपी 180 से ऊपर जाने पर तुरंत इमरजेंसी डॉक्टर से मिलें।"
        ),
        "mr": (
            "🩺 **रक्तदाब (Blood Pressure) नियंत्रण:**\n\n"
            "• **सामान्य रक्तदाब:** १२०/८० mmHg च्या आसपास. उच्च रक्तदाब (Hypertension) सामान्यतः १४०/९० mmHg किंवा त्याहून अधिक मानला जातो.\n"
            "• **आहारातील बदल:** आहारात मिठाचे प्रमाण कमी करा. फळे, हिरव्या पालेभाज्या आणि पौष्टिक आहारावर भर द्या.\n"
            "• **व्यायाम:** दररोज किमान ३० मिनिटे चालणे किंवा सौम्य योगासने करा.\n"
            "• **महत्त्वाचा सल्ला:** डॉक्टरांनी दिलेली रक्तदाबाची औषधे परस्पर बंद करू नका. १८० पेक्षा जास्त बीपी झाल्यास त्वरित रुग्णालयात जा."
        ),
    },
    "diabetes": {
        "en": (
            "🩸 **Diabetes & Blood Sugar Care:**\n\n"
            "• **Monitoring:** Regularly check fasting and post-prandial (2 hours after meal) glucose levels.\n"
            "• **Dietary Balance:** Avoid refined sugars, sweetened beverages, and simple carbs. Prioritize high-fiber complex grains (oats, millets, lentils).\n"
            "• **Foot Care:** Inspect feet daily for cuts or sores; wear comfortable footwear.\n"
            "• **Hypoglycemia Alert:** If you feel shaky, sweaty, dizzy, or confused, immediately consume 15g of fast-acting sugar (fruit juice or glucose tablet) and consult your doctor."
        ),
        "hi": (
            "🩸 **मधुमेह (Diabetes) प्रबंधन:**\n\n"
            "• **शुगर जांच:** नियमित रूप से खाली पेट (Fasting) और खाने के 2 घंटे बाद शुगर लेवल जांचें।\n"
            "• **खान-पान:** चीनी, मीठे पेय और मैदा से बचें। ज्वार, बाजरा, रागी, दालें और रेशेदार (High fiber) सब्जियां खाएं।\n"
            "• **पैरों की देखभाल:** पैरों में कोई घाव या छाला न हो, इसके लिए रोज जांच करें।\n"
            "• **शुगर कम होने (Hypoglycemia) के लक्षण:** चक्कर आना, पसीना आना या कंपकंपी महसूस होने पर तुरंत थोड़ा ग्लूकोज या मीठा फल लें और डॉक्टर को बताएं।"
        ),
        "mr": (
            "🩸 **मधुमेह (Diabetes) आणि साखर नियंत्रण:**\n\n"
            "• **तपासणी:** नियमितपणे उपाशीपोटी आणि जेवणानंतर २ तासांनी रक्तातील साखर (Sugar) तपासा.\n"
            "• **आहार:** गोड पदार्थ, साखर आणि पांढरा भात मर्यादित ठेवा. नाचणी, ज्वारी, हिरव्या भाज्या आणि कडधान्यांचा आहारात समावेश करा.\n"
            "• **पायांची काळजी:** पायाला जखम होणार नाही याची काळजी घ्या; रोज पाय स्वच्छ धुवून तपासा.\n"
            "• **साखर अचानक कमी झाल्यास:** घाम येणे, थरथरणे किंवा चक्कर आल्यास ताबडतोब ग्लुकोजचे पाणी किंवा फळांचा रस घ्या आणि डॉक्टरांशी संपर्क साधा."
        ),
    },
    "headache": {
        "en": (
            "💆 **Headache & Migraine Relief:**\n\n"
            "• **Triggers:** Dehydration, lack of sleep, eye strain, and skipped meals are common culprits.\n"
            "• **Home Care:** Drink 2 glasses of water, rest in a quiet dark room, and apply a cool cloth to your forehead.\n"
            "• **Red Flags:** Seek emergency evaluation if headache is sudden, explosive ('worst headache of life'), follows head trauma, or accompanies weakness/numbness on one side."
        ),
        "hi": (
            "💆 **सिरदर्द (Headache) से राहत:**\n\n"
            "• **सामान्य कारण:** पानी की कमी, नींद पूरी न होना, ज्यादा स्क्रीन टाइम या तनाव।\n"
            "• **प्राथमिक देखभाल:** पर्याप्त पानी पिएं, शांत व अंधेरे कमरे में 20-30 मिनट आराम करें।\n"
            "• **सावधानी:** यदि सिरदर्द अचानक और बहुत असहनीय हो, या एक तरफ कमजोरी या बोलने में लड़खड़ाहट हो, तो तुरंत न्यूरोलॉजिस्ट या इमरजेंसी जाएं।"
        ),
        "mr": (
            "💆 **डोकेदुखी (Headache) वरील उपाय:**\n\n"
            "• **कारणे:** पाण्याचे प्रमाण कमी होणे, अपुरी झोप, सतत स्क्रीन पाहणे किंवा मानसिक ताण.\n"
            "• **घरगुती काळजी:** १-२ ग्लास पाणी प्या, शांत अंधाऱ्या खोलीत थोडा वेळ डोळे बंद करून विश्रांती घ्या.\n"
            "• **धोक्याची चिन्हे:** डोकेदुखी अचानक आणि तीव्र असल्यास, किंवा एका हाता-पायात कमजोरी जाणवल्यास त्वरित डॉक्टरांचा सल्ला घ्या."
        ),
    },
    "diet": {
        "en": (
            "🥗 **Healthy Nutrition & Diet Advice:**\n\n"
            "• **Balanced Plate:** Fill half your plate with colorful vegetables and salads, one quarter with lean protein (lentils, paneer, eggs, sprouts), and one quarter with complex carbs.\n"
            "• **Hydration:** Aim for 2.5 to 3 liters of water daily.\n"
            "• **Gut Health:** Include natural probiotics like fresh yogurt/curd or buttermilk.\n"
            "• **Limit:** Ultra-processed packaged foods, trans fats, and excess sugar."
        ),
        "hi": (
            "🥗 **संतुलित आहार और पोषण:**\n\n"
            "• **थाली का संतुलन:** आधी थाली हरी सब्जियों और सलाद की हो, एक-चौथाई प्रोटीन (दालें, पनीर, स्प्राउट्स) और एक-चौथाई साबुत अनाज।\n"
            "• **पानी:** दिन में कम से कम 2.5 से 3 लीटर पानी अवश्य पिएं।\n"
            "• **पाचन:** भोजन में ताज़ा दही या छाछ शामिल करें जो पेट के अच्छे बैक्टीरिया के लिए लाभदायक है।\n"
            "• **परहेज:** पैकेज्ड फूड, ज्यादा तला-भुना और अत्यधिक मीठे से दूर रहें।"
        ),
        "mr": (
            "🥗 **आरोग्यदायी संतुलित आहार:**\n\n"
            "• **आहाराची रचना:** ताटाचा अर्धा भाग भाज्या आणि सॅलड, पाव भाग प्रथिने (डाळी, कडधान्ये, पनीर/अंडी) आणि पाव भाग भाकरी किंवा पोळी असावा.\n"
            "• **पाणी:** दिवसातून २.५ ते ३ लिटर स्वच्छ पाणी पिणे आवश्यक आहे.\n"
            "• **पचनसंस्था:** आहारात ताक किंवा ताज्या दह्याचा वापर करा.\n"
            "• **टाळा:** जंक फूड, प्रक्रिया केलेले अन्नपदार्थ आणि प्रमाणाबाहेर गोड खाणे टाळा."
        ),
    },
}

TOPIC_KEYWORDS = {
    "fever": ["fever", "temperature", "cold", "flu", "ताप", "बुखार", "सर्दी", "कफ"],
    "blood_pressure": ["bp", "blood pressure", "hypertension", "रक्तदाब", "बीपी", "रक्तचाप", "उच्च रक्तचाप"],
    "diabetes": ["diabetes", "sugar", "glucose", "मधुमेह", "साखर", "शुगर"],
    "headache": ["headache", "migraine", "head pain", "डोकेदुखी", "मायग्रेन", "सिरदर्द"],
    "diet": ["diet", "food", "nutrition", "eat", "weight loss", "आहार", "जेवण", "खानपान", "पोषण"],
}


def detect_language(query: str, default_lang: str = "en") -> str:
    """Detects if query is in Marathi, Hindi, or English using script/keywords."""
    q = query.strip()
    # Check Devanagari script range
    has_devanagari = any("\u0900" <= c <= "\u097F" for c in q)
    if has_devanagari:
        # Distinguish Marathi vs Hindi via specific Marathi markers
        marathi_markers = ["आहे", "नाही", "करावे", "काय", "मला", "होते", "पाहिजे", "कसे", "औषध", "लक्षणे"]
        for marker in marathi_markers:
            if marker in q:
                return "mr"
        hindi_markers = ["है", "नहीं", "करना", "क्या", "मुझे", "होता", "चाहिए", "कैसे", "दवा", "लक्षण"]
        for marker in hindi_markers:
            if marker in q:
                return "hi"
        # If default is mr or hi, preserve it
        if default_lang in ("mr", "hi"):
            return default_lang
        return "hi"

    if default_lang in ("mr", "hi", "en"):
        return default_lang
    return "en"


def get_ai_chatbot_response(
    query: str,
    lang: str = "en",
    patient_context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Evaluates health queries and returns structured, safe healthcare guidance.
    Enforces medical disclaimers and emergency detection.
    """
    clean_query = query.strip()
    detected_lang = detect_language(clean_query, lang)
    lower_query = clean_query.lower()

    # 1. Emergency Red-Flag Detection
    for kw in RED_FLAG_KEYWORDS:
        if kw.lower() in lower_query:
            emergency_messages = {
                "en": (
                    "⚠️ **CRITICAL MEDICAL EMERGENCY DETECTED!**\n\n"
                    "Your symptoms may indicate a life-threatening medical emergency. "
                    "**Do not wait or rely on an AI system.**\n\n"
                    "• **Action:** Call **112** (National Emergency Helpline) immediately or go to the nearest emergency trauma center.\n"
                    "• **SOS:** Use the platform's red Emergency SOS button below to contact nearest ambulance services."
                ),
                "hi": (
                    "⚠️ **आपातकालीन स्थिति (MEDICAL EMERGENCY)!**\n\n"
                    "आपके द्वारा बताए गए लक्षण गंभीर आपातकालीन स्थिति का संकेत हो सकते हैं। "
                    "**कृपया AI पर निर्भर न रहें और तुरंत डॉक्टर के पास जाएं।**\n\n"
                    "• **तुरंत कदम:** **112** राष्ट्रीय आपातकालीन नंबर पर कॉल करें या नजदीकी अस्पताल के इमरजेंसी वार्ड में जाएं।\n"
                    "• **SOS:** तुरंत सहायता के लिए नीचे दिए गए लाल Emergency SOS बटन का उपयोग करें।"
                ),
                "mr": (
                    "⚠️ **तातडीची वैद्यकीय मदत आवश्यक (MEDICAL EMERGENCY)!**\n\n"
                    "तुमची लक्षणे अतिशय गंभीर आणि तत्काळ उपचारांची गरज दर्शवत आहेत. "
                    "**कृपया AI उत्तराची वाट न पाहता ताबडतोब वैद्यकीय मदत घ्या.**\n\n"
                    "• **तातडीची कृती:** त्वरित **112** रुग्णवाहिका/आपत्कालीन क्रमांकावर कॉल करा किंवा जवळच्या रुग्णालयात जा.\n"
                    "• **SOS:** खालील लाल रंगाचे Emergency SOS बटण दाबून जवळच्या रुग्णालयाशी संपर्क साधा."
                ),
            }
            return {
                "response": emergency_messages.get(detected_lang, emergency_messages["en"]),
                "is_emergency": True,
                "detected_language": detected_lang,
                "recommendation": "seek_immediate_care",
                "disclaimer": "Emergency alert: Always dial 112 in life-threatening scenarios.",
            }

    # 2. Match Knowledge Base
    matched_topic = None
    for topic, keywords in TOPIC_KEYWORDS.items():
        if any(kw in lower_query for kw in keywords):
            matched_topic = topic
            break

    if matched_topic and matched_topic in KB_RESPONSES:
        topic_content = KB_RESPONSES[matched_topic].get(
            detected_lang,
            KB_RESPONSES[matched_topic]["en"]
        )

        patient_note = ""
        if patient_context:
            gender = patient_context.get("gender")
            age = patient_context.get("age")
            allergies = patient_context.get("known_allergies")
            if allergies and allergies.lower() != "none":
                if detected_lang == "mr":
                    patient_note = f"\n\n*टीप: तुमच्या प्रोफाईलनुसार नोंदवलेली ऍलर्जी: {allergies}. कोणतीही नवीन औषधे घेताना डॉक्टरांना नक्की सांगा.*"
                elif detected_lang == "hi":
                    patient_note = f"\n\n*नोट: आपके प्रोफाइल में दर्ज एलर्जी: {allergies}। कोई भी नई दवा लेने से पहले डॉक्टर को अवश्य बताएं।* "
                else:
                    patient_note = f"\n\n*Note: Based on your health profile, noted allergy: {allergies}. Always inform your prescribing doctor.*"

        disclaimers = {
            "en": "General health guidance only. Not a medical diagnosis or prescription. Consult a doctor.",
            "hi": "यह केवल सामान्य स्वास्थ्य सलाह है। यह चिकित्सकीय निदान या दवा का पर्चा नहीं है।",
            "mr": "ही केवळ सामान्य आरोग्यविषयक माहिती आहे. हा वैद्यकीय सल्ला किंवा औषधांची शिफारस नाही.",
        }

        return {
            "response": topic_content + patient_note,
            "is_emergency": False,
            "detected_language": detected_lang,
            "topic": matched_topic,
            "recommendation": "consult_doctor_if_persistent",
            "disclaimer": disclaimers.get(detected_lang, disclaimers["en"]),
        }

    # 3. Default contextual fallback
    default_answers = {
        "en": (
            "🤖 **AI Healthcare Assistant**\n\n"
            "I can assist you with general information on common health concerns, medicine precautions, "
            "blood pressure, diabetes, fever management, and lifestyle advice.\n\n"
            "• For specific health complaints, please run our **Symptom Checker** with your full profile.\n"
            "• To get a clinical evaluation or digital prescription, book an appointment under **Doctor Consultation**.\n"
            "• If you are experiencing severe symptoms, please visit a doctor immediately."
        ),
        "hi": (
            "🤖 **AI स्वास्थ्य सहायक (Health Assistant)**\n\n"
            "मैं आपको सामान्य स्वास्थ्य, बुखार, बीपी, शुगर, सिरदर्द और खान-पान संबंधी सुरक्षित जानकारी दे सकता हूँ।\n\n"
            "• लक्षणों की जांच के लिए हमारे **Symptom Checker** का उपयोग करें।\n"
            "• डॉक्टर से परामर्श और डिजिटल पर्चा प्राप्त करने के लिए **Doctor Consultation** में अपॉइंटमेंट बुक करें।\n"
            "• गंभीर लक्षणों की स्थिति में तुरंत नजदीकी डॉक्टर से संपर्क करें।"
        ),
        "mr": (
            "🤖 **AI आरोग्य सहाय्यक (Health Assistant)**\n\n"
            "मी आपल्याला ताप, रक्तदाब, मधुमेह, डोकेदुखी आणि सकस आहाराविषयी प्राथमिक आरोग्य माहिती देऊ शकतो.\n\n"
            "• लक्षणांच्या विश्लेषणासाठी कृपया **Symptom Checker** वापरा.\n"
            "• तज्ज्ञ डॉक्टरांचा सल्ला आणि डिजिटल प्रिस्क्रिप्शन मिळवण्यासाठी **Doctor Consultation** मध्ये अपॉइंटमेंट घ्या.\n"
            "• लक्षणे तीव्र असल्यास कृपया त्वरित जवळच्या डॉक्टरांशी संपर्क साधा."
        ),
    }

    disclaimers = {
        "en": "This assistant provides educational health information, not a formal diagnosis or prescription.",
        "hi": "यह सहायक केवल शैक्षणिक स्वास्थ्य जानकारी प्रदान करता है, कोई निदान या नुस्खा नहीं।",
        "mr": "हा सहाय्यक केवळ शैक्षणिक आरोग्य माहिती पुरवतो, अधिकृत निदान किंवा औषधांची चिठ्ठी नाही.",
    }

    return {
        "response": default_answers.get(detected_lang, default_answers["en"]),
        "is_emergency": False,
        "detected_language": detected_lang,
        "topic": "general_inquiry",
        "recommendation": "consult_doctor",
        "disclaimer": disclaimers.get(detected_lang, disclaimers["en"]),
    }
