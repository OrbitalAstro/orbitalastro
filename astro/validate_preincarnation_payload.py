def validate_preincarnation_payload(data: dict):
    required_natal_fields = [
        "sun_sign",
        "sun_house",
        "moon_sign",
        "moon_house",
        "asc_sign",
        "mc_sign",
        "chiron_sign",
        "chiron_house",
        "planets",
        "houses",
    ]

    natal = data.get("natal", {})
    for field in required_natal_fields:
        if field not in natal:
            raise ValueError(f"Missing natal field: {field}")

    required_prebirth = {
        "prenatal_lunation": ["type", "in_sign", "in_house", "timestamp"],
        "prenatal_eclipse": ["type", "in_sign", "in_house", "timestamp"],
        "prenatal_epoch": ["type", "in_sign", "in_house", "timestamp"],
    }

    for block, fields in required_prebirth.items():
        block_data = data.get(block, {})
        for field in fields:
            if field not in block_data:
                raise ValueError(f"Missing {block}.{field}")

    # Ensure no unresolved symbolic placeholders remain
    serialized = repr(data)
    placeholders = [
        "{natal.",
        "{prenatal_lunation.",
        "{prenatal_eclipse.",
        "{prenatal_epoch.",
    ]
    for token in placeholders:
        if token in serialized:
            raise ValueError("Payload still contains unresolved placeholder braces.")

    return True
