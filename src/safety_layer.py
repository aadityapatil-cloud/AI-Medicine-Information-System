import pandas as pd


# ==================================================
# 1. SAFETY FIELDS
# ==================================================

SAFETY_FIELDS = [
    "alcohol",
    "pregnancy",
    "breast_feeding",
    "driving",
    "kidney",
    "liver"
]


# ==================================================
# 2. SAFETY CHECK FUNCTION
# ==================================================

def check_medicine_safety(medicine):
    """
    Check available safety information for a medicine.

    This function provides safety information from the
    dataset. It does not diagnose, prescribe, or make
    an independent medical decision.
    """

    if not isinstance(medicine, dict):
        return {
            "safety_available": False,
            "safety_information": {},
            "warnings": [
                "Medicine information is not available."
            ]
        }


    safety_information = {}
    warnings = []


    # --------------------------------------------------
    # Check each safety field
    # --------------------------------------------------

    for field in SAFETY_FIELDS:

        value = medicine.get(
            field,
            "Information not available"
        )


        # Handle missing or empty values
        if pd.isna(value) or str(value).strip() == "":
            value = "Information not available"


        value = str(value).strip()


        safety_information[field] = value


        # --------------------------------------------------
        # Generate warning messages
        # --------------------------------------------------

        if value.upper() == "UNSAFE":

            warnings.append(
                f"{field.replace('_', ' ').title()}: "
                f"UNSAFE according to the dataset."
            )


        elif value.upper() == "CAUTION":

            warnings.append(
                f"{field.replace('_', ' ').title()}: "
                f"CAUTION according to the dataset."
            )


        elif "CONSULT YOUR DOCTOR" in value.upper():

            warnings.append(
                f"{field.replace('_', ' ').title()}: "
                f"Consult a qualified healthcare professional."
            )


    # --------------------------------------------------
    # Final safety result
    # --------------------------------------------------

    return {
        "safety_available": True,
        "safety_information": safety_information,
        "warnings": warnings
    }


# ==================================================
# 3. TEST SAFETY LAYER
# ==================================================

if __name__ == "__main__":

    test_medicine = {

        "name": "Example Medicine",

        "alcohol": "UNSAFE",

        "pregnancy": "CONSULT YOUR DOCTOR",

        "breast_feeding": "UNSAFE",

        "driving": "CAUTION",

        "kidney": "CAUTION",

        "liver": "CAUTION"
    }


    result = check_medicine_safety(
        test_medicine
    )


    print("=" * 60)
    print("SAFETY LAYER TEST")
    print("=" * 60)

    print(
        "\nSafety information available:",
        result["safety_available"]
    )


    print("\nSafety Information:")

    for field, value in result[
        "safety_information"
    ].items():

        print(
            f"{field}: {value}"
        )


    print("\nWarnings:")

    if result["warnings"]:

        for warning in result["warnings"]:

            print("-", warning)

    else:

        print(
            "No specific warnings found."
        )