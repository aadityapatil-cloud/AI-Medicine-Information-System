from medicine_retrieval import get_medicine_information
from safety_layer import check_medicine_safety


# ==================================================
# 1. MEDICINE + SAFETY PIPELINE
# ==================================================

def get_medicine_with_safety(condition, max_results=3):
    """
    Retrieve medicine information and apply the
    safety-information layer.

    This is an information-support pipeline.
    It does not diagnose or prescribe medicines.
    """

    # --------------------------------------------------
    # Step 1: Retrieve medicine information
    # --------------------------------------------------

    medicine_result = get_medicine_information(
        condition,
        max_results=max_results
    )


    # --------------------------------------------------
    # Step 2: Check whether medicines were found
    # --------------------------------------------------

    if not medicine_result["match_found"]:

        return {
            "condition": condition,
            "match_found": False,
            "medicines": []
        }


    # --------------------------------------------------
    # Step 3: Apply safety layer
    # --------------------------------------------------

    final_medicines = []


    for medicine in medicine_result["medicines"]:

        safety_result = check_medicine_safety(
            medicine
        )


        combined_result = {

            "medicine_information": medicine,

            "safety": safety_result

        }


        final_medicines.append(
            combined_result
        )


    # --------------------------------------------------
    # Step 4: Final response
    # --------------------------------------------------

    return {

        "condition": condition,

        "match_found": True,

        "medicines": final_medicines

    }


# ==================================================
# 2. TEST THE COMPLETE PIPELINE
# ==================================================

if __name__ == "__main__":

    result = get_medicine_with_safety(
        "Diabetes",
        max_results=2
    )


    print("=" * 60)
    print("MEDICINE + SAFETY PIPELINE TEST")
    print("=" * 60)


    print(
        "\nCondition:",
        result["condition"]
    )


    print(
        "Match found:",
        result["match_found"]
    )


    print(
        "Number of medicines:",
        len(result["medicines"])
    )


    # --------------------------------------------------
    # Display each medicine
    # --------------------------------------------------

    for index, medicine_result in enumerate(
        result["medicines"],
        start=1
    ):

        medicine = medicine_result[
            "medicine_information"
        ]

        safety = medicine_result[
            "safety"
        ]


        print("\n" + "-" * 60)

        print(
            f"Medicine {index}:",
            medicine["name"]
        )


        print(
            "Uses:",
            medicine["uses"]
        )


        print(
            "Composition:",
            medicine["composition"]
        )


        print("\nSafety Information:")


        for field, value in safety[
            "safety_information"
        ].items():

            print(
                f"{field}: {value}"
            )


        print("\nWarnings:")


        if safety["warnings"]:

            for warning in safety["warnings"]:

                print(
                    "-",
                    warning
                )

        else:

            print(
                "No specific warnings found."
            )

            