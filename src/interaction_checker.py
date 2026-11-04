import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

# Comprehensive clinical interaction database
CLINICAL_INTERACTIONS: Dict[frozenset, Dict[str, Any]] = {
    frozenset({"aspirin", "warfarin"}): {
        "severity": "Severe",
        "description": "Significantly elevated risk of major gastrointestinal and systemic bleeding.",
        "action": "Do not co-administer without close anticoagulant monitoring (INR) by a physician.",
    },
    frozenset({"ibuprofen", "warfarin"}): {
        "severity": "Severe",
        "description": "Marked increase in hemorrhage risk and gastrointestinal ulceration.",
        "action": "Avoid NSAIDs with anticoagulants; use paracetamol for analgesia if approved.",
    },
    frozenset({"clopidogrel", "omeprazole"}): {
        "severity": "Moderate",
        "description": "Omeprazole inhibits CYP2C19, significantly reducing active clopidogrel conversion.",
        "action": "Consider pantoprazole or an H2 blocker (e.g. famotidine) as an alternative.",
    },
    frozenset({"aspirin", "clopidogrel"}): {
        "severity": "Moderate",
        "description": "Dual antiplatelet therapy elevates bleeding risk, though standard in specific cardiac indications.",
        "action": "Must be prescribed and strictly monitored by a cardiologist.",
    },
    frozenset({"alcohol", "metformin"}): {
        "severity": "Severe",
        "description": "Increased risk of life-threatening lactic acidosis and hypoglycemia.",
        "action": "Avoid excessive or binge alcohol consumption while taking metformin.",
    },
    frozenset({"ciprofloxacin", "glimepiride"}): {
        "severity": "Moderate",
        "description": "Fluoroquinolones may potentiate hypoglycemic effects of sulfonylureas.",
        "action": "Monitor blood glucose closely for unexpected hypoglycemia.",
    },
    frozenset({"potassium", "lisinopril"}): {
        "severity": "Moderate",
        "description": "ACE inhibitors reduce aldosterone secretion, risking severe hyperkalemia.",
        "action": "Avoid potassium supplements or salt substitutes containing potassium without physician guidance.",
    },
    frozenset({"potassium", "ramipril"}): {
        "severity": "Moderate",
        "description": "ACE inhibitors elevate potassium retention, risking cardiac arrhythmias.",
        "action": "Periodic serum potassium monitoring is recommended.",
    },
    frozenset({"amlodipine", "simvastatin"}): {
        "severity": "Moderate",
        "description": "Amlodipine increases simvastatin exposure; doses over 20mg daily increase myopathy risk.",
        "action": "Do not exceed 20mg daily simvastatin when combined with amlodipine.",
    },
    frozenset({"digoxin", "amiodarone"}): {
        "severity": "Severe",
        "description": "Amiodarone increases serum digoxin levels up to twofold, risking fatal toxicity.",
        "action": "Reduce digoxin dosage by 50% and monitor serum levels regularly.",
    },
    frozenset({"atenolol", "verapamil"}): {
        "severity": "Severe",
        "description": "Additive negative inotropic and chronotropic effects; risks severe bradycardia and heart failure.",
        "action": "Concurrent intravenous or high-dose oral administration should generally be avoided.",
    },
    frozenset({"simvastatin", "amiodarone"}): {
        "severity": "Severe",
        "description": "Marked increase in simvastatin concentration risking rhabdomyolysis and renal failure.",
        "action": "Limit simvastatin to 20mg daily or switch to a statin with alternative metabolic pathway.",
    },
    frozenset({"clarithromycin", "atorvastatin"}): {
        "severity": "Severe",
        "description": "Strong CYP3A4 inhibition elevates atorvastatin levels, drastically raising myopathy risk.",
        "action": "Temporarily suspend atorvastatin during macrolide antibiotic course.",
    },
    frozenset({"fluoxetine", "tramadol"}): {
        "severity": "Severe",
        "description": "High risk of life-threatening serotonin syndrome and increased seizure liability.",
        "action": "Avoid combination or monitor closely for agitation, tremor, hyperthermia, and rigidity.",
    },
    frozenset({"sertraline", "tramadol"}): {
        "severity": "Severe",
        "description": "Synergistic serotonergic activity risks serotonin toxicity and CNS hyperexcitability.",
        "action": "Use with extreme caution under psychiatric and pain specialist supervision.",
    },
    frozenset({"alcohol", "alprazolam"}): {
        "severity": "Severe",
        "description": "Profound central nervous system and respiratory depression, sedation, coma, or fatal overdose.",
        "action": "Strictly avoid all alcoholic beverages while taking benzodiazepines.",
    },
    frozenset({"ciprofloxacin", "theophylline"}): {
        "severity": "Severe",
        "description": "Ciprofloxacin inhibits theophylline clearance, risking seizures and cardiac arrhythmias.",
        "action": "Reduce theophylline dosage and monitor serum concentrations closely.",
    },
    frozenset({"antacids", "levofloxacin"}): {
        "severity": "Moderate",
        "description": "Chelation with polyvalent cations (aluminum, magnesium, calcium) impairs antibiotic absorption.",
        "action": "Take levofloxacin at least 2 hours before or 4 hours after antacids.",
    },
    frozenset({"ibuprofen", "methotrexate"}): {
        "severity": "Severe",
        "description": "NSAIDs decrease renal clearance of methotrexate, causing severe hematologic and GI toxicity.",
        "action": "Avoid NSAIDs or adjust methotrexate dosage with close blood counts.",
    },
    frozenset({"nitroglycerin", "sildenafil"}): {
        "severity": "Severe",
        "description": "Potentiation of hypotensive effects; can trigger profound, potentially fatal shock.",
        "action": "Concomitant use is strictly contraindicated. Do not use within 24 hours of each other.",
    },
    frozenset({"alcohol", "paracetamol"}): {
        "severity": "Moderate",
        "description": "Chronic alcohol intake induces CYP2E1, escalating hepatotoxicity risk even at standard doses.",
        "action": "Limit paracetamol dosage to under 2000mg/day and avoid regular alcohol consumption.",
    },
}

ALLERGEN_KEYWORDS: Dict[str, List[str]] = {
    "penicillin": ["penicillin", "amoxicillin", "ampicillin", "augmentin", "clavulanate", "piperacillin"],
    "sulfa": ["sulfamethoxazole", "bactrim", "septran", "sulfasalazine", "sulfonamide"],
    "aspirin": ["aspirin", "acetylsalicylic", "ecosprin", "disprin"],
    "nsaid": ["ibuprofen", "diclofenac", "naproxen", "combiflam", "mefenamic", "aceclofenac"],
    "paracetamol": ["paracetamol", "acetaminophen", "crocin", "calpol", "dolo"],
    "cephalosporin": ["cefixime", "ceftriaxone", "cephalexin", "cefuroxime", "cefpodoxime"],
    "fluoroquinolone": ["ciprofloxacin", "levofloxacin", "ofloxacin", "norfloxacin"],
    "statin": ["atorvastatin", "simvastatin", "rosuvastatin"],
}


def _normalize_name(name: str) -> str:
    """Cleans and standardizes drug name."""
    clean = name.strip().lower()
    # Strip common brand suffixes, numbers, mg, tablets
    clean = re.sub(r"\b\d+(\.\d+)?\s*(mg|ml|mcg|gm|tablet|capsule|syrup)\b", "", clean)
    clean = re.sub(r"[^a-z0-9\s]", "", clean)
    return clean.strip()


import re


def check_drug_pair(drug1: str, drug2: str) -> Optional[Dict[str, Any]]:
    """Checks interaction between two drug names using fuzzy stem lookup."""
    d1 = _normalize_name(drug1)
    d2 = _normalize_name(drug2)

    if not d1 or not d2 or d1 == d2:
        return None

    # 1. Exact match
    direct_key = frozenset({d1, d2})
    if direct_key in CLINICAL_INTERACTIONS:
        res = dict(CLINICAL_INTERACTIONS[direct_key])
        res["drugs"] = [drug1.strip(), drug2.strip()]
        return res

    # 2. Substring / Stem lookup
    for key, data in CLINICAL_INTERACTIONS.items():
        k1, k2 = list(key)
        if (k1 in d1 and k2 in d2) or (k1 in d2 and k2 in d1):
            res = dict(data)
            res["drugs"] = [drug1.strip(), drug2.strip()]
            return res

    return None


def check_multiple_drugs(drugs: List[str]) -> List[Dict[str, Any]]:
    """Evaluates all pairwise combinations in a list of medicines."""
    cleaned = [d.strip() for d in drugs if d and d.strip()]
    interactions: List[Dict[str, Any]] = []

    for i in range(len(cleaned)):
        for j in range(i + 1, len(cleaned)):
            res = check_drug_pair(cleaned[i], cleaned[j])
            if res:
                interactions.append(res)

    return interactions


def check_allergy_conflict(
    medicine_name: str,
    medicine_composition: str,
    patient_allergies: str,
) -> Optional[Dict[str, Any]]:
    """Checks whether a medicine or its composition conflicts with patient's known allergies."""
    if not patient_allergies or patient_allergies.strip().lower() in ("none", "no", "n/a"):
        return None

    text_to_check = f"{medicine_name.lower()} {medicine_composition.lower()}"
    allergies_lower = patient_allergies.lower()

    for category, terms in ALLERGEN_KEYWORDS.items():
        # Check if patient is allergic to this category
        if category in allergies_lower:
            for term in terms:
                if term in text_to_check:
                    return {
                        "category": category,
                        "matched_term": term,
                        "warning": f"ALLERGY WARNING: This medicine contains or is related to '{term}', which matches your reported allergy to '{category}'.",
                        "severity": "High",
                    }

    return None
