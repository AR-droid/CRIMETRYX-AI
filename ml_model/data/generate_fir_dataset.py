"""
CRIMETRYX-AI - Synthetic FIR Dataset Generator
Generates realistic synthetic First Information Report (FIR) records
for training ML models on crime pattern recognition and modus operandi analysis.
"""

import csv
import json
import random
import os

random.seed(42)

# ── Label definitions ───────────────────────────────────────────────────────

CRIME_TYPES = [
    "burglary", "robbery", "assault", "vehicle_theft", "cybercrime",
    "fraud", "kidnapping", "murder", "drug_offense", "vandalism"
]

LOCATIONS = [
    "residential_area", "commercial_zone", "industrial_area",
    "public_transport", "educational_institution", "rural_area",
    "highway", "marketplace", "bank_premises", "parking_lot"
]

TIME_OF_DAY = ["early_morning", "morning", "afternoon", "evening", "night", "midnight"]

WEAPONS = [
    "knife", "firearm", "blunt_object", "none", "chemical",
    "vehicle", "rope", "improvised_tool", "none", "none"   # none weighted higher
]

ENTRY_METHODS = [
    "forced_entry", "lock_picking", "social_engineering", "none",
    "window_break", "tunneling", "impersonation", "cyber_access",
    "unlocked_door", "roof_access"
]

TARGET_TYPES = [
    "individual", "household", "commercial_establishment",
    "financial_institution", "government_property", "vehicle",
    "digital_asset", "public_space", "infrastructure", "multiple"
]

SUSPECT_AGE_GROUPS = ["juvenile", "18-25", "26-35", "36-45", "46-60", "60+"]

MO_TAGS_POOL = [
    "prior_surveillance", "accomplice_involved", "use_of_disguise",
    "night_operation", "repeat_target", "opportunistic", "planned_operation",
    "insider_help", "use_of_technology", "physical_restraint",
    "psychological_manipulation", "escape_vehicle_used", "local_knowledge",
    "multiple_offenders", "lone_wolf", "evidence_concealment"
]

STATE_CODES = [
    "MH", "DL", "UP", "TN", "KA", "GJ", "RJ", "WB", "MP", "AP",
    "TS", "KL", "HR", "PB", "BR"
]

# ── Rule-based probability tables ────────────────────────────────────────────

CRIME_RULES = {
    "burglary":      {"likely_time": ["night", "midnight"], "likely_entry": ["forced_entry", "lock_picking", "window_break"], "likely_weapon": ["none", "blunt_object"], "likely_target": ["household", "commercial_establishment"]},
    "robbery":       {"likely_time": ["night", "midnight", "evening"], "likely_entry": ["none", "social_engineering"], "likely_weapon": ["knife", "firearm", "blunt_object"], "likely_target": ["individual", "financial_institution"]},
    "assault":       {"likely_time": ["evening", "night", "afternoon"], "likely_entry": ["none"], "likely_weapon": ["blunt_object", "knife", "none"], "likely_target": ["individual"]},
    "vehicle_theft": {"likely_time": ["night", "midnight", "early_morning"], "likely_entry": ["lock_picking", "unlocked_door"], "likely_weapon": ["none", "improvised_tool"], "likely_target": ["vehicle"]},
    "cybercrime":    {"likely_time": ["morning", "afternoon", "evening"], "likely_entry": ["cyber_access"], "likely_weapon": ["none"], "likely_target": ["digital_asset", "financial_institution", "individual"]},
    "fraud":         {"likely_time": ["morning", "afternoon"], "likely_entry": ["social_engineering", "impersonation"], "likely_weapon": ["none"], "likely_target": ["individual", "commercial_establishment", "financial_institution"]},
    "kidnapping":    {"likely_time": ["morning", "afternoon", "evening"], "likely_entry": ["none", "social_engineering"], "likely_weapon": ["firearm", "knife", "chemical"], "likely_target": ["individual"]},
    "murder":        {"likely_time": ["night", "midnight", "evening"], "likely_entry": ["none", "forced_entry"], "likely_weapon": ["knife", "firearm", "blunt_object"], "likely_target": ["individual"]},
    "drug_offense":  {"likely_time": ["night", "midnight", "early_morning"], "likely_entry": ["none"], "likely_weapon": ["none", "knife"], "likely_target": ["individual", "public_space"]},
    "vandalism":     {"likely_time": ["night", "midnight"], "likely_entry": ["none"], "likely_weapon": ["blunt_object", "improvised_tool", "chemical"], "likely_target": ["government_property", "public_space", "commercial_establishment"]},
}

# Recidivism probabilities per crime type (based on criminology research trends)
RECIDIVISM_RATES = {
    "burglary": 0.55, "robbery": 0.48, "assault": 0.42, "vehicle_theft": 0.60,
    "cybercrime": 0.35, "fraud": 0.38, "kidnapping": 0.25, "murder": 0.15,
    "drug_offense": 0.65, "vandalism": 0.50
}


def weighted_choice(pool, preferred, weight=0.70):
    """Return an item from pool, preferring items in 'preferred' list."""
    if preferred and random.random() < weight:
        return random.choice(preferred)
    return random.choice(pool)


def generate_mo_text(tags):
    """Generate a natural-language MO description from tags."""
    tag_phrases = {
        "prior_surveillance": "suspect conducted prior surveillance of the target",
        "accomplice_involved": "at least one accomplice was involved in the act",
        "use_of_disguise": "suspect used a disguise to conceal identity",
        "night_operation": "crime was executed during nighttime hours",
        "repeat_target": "location or victim was targeted previously",
        "opportunistic": "crime appears to be opportunistic in nature",
        "planned_operation": "evidence of pre-planned operation",
        "insider_help": "insider assistance may have been involved",
        "use_of_technology": "digital tools or devices were used",
        "physical_restraint": "victim was physically restrained",
        "psychological_manipulation": "victim was manipulated psychologically",
        "escape_vehicle_used": "suspect escaped using a vehicle",
        "local_knowledge": "suspect demonstrated knowledge of the local area",
        "multiple_offenders": "multiple offenders participated",
        "lone_wolf": "single offender acted alone",
        "evidence_concealment": "suspect attempted to conceal evidence",
    }
    phrases = [tag_phrases.get(t, t.replace("_", " ")) for t in tags]
    return ". ".join(phrases).capitalize() + "."


def generate_record(record_id):
    """Generate a single synthetic FIR record."""
    crime_type = random.choice(CRIME_TYPES)
    rules = CRIME_RULES[crime_type]

    time_of_day   = weighted_choice(TIME_OF_DAY, rules["likely_time"])
    entry_method  = weighted_choice(ENTRY_METHODS, rules["likely_entry"])
    weapon        = weighted_choice(WEAPONS, rules["likely_weapon"])
    target_type   = weighted_choice(TARGET_TYPES, rules["likely_target"])
    location      = random.choice(LOCATIONS)
    age_group     = random.choice(SUSPECT_AGE_GROUPS)
    state         = random.choice(STATE_CODES)
    prior_record  = random.random() < 0.45   # 45% have prior offenses

    # MO tags: 2-5 relevant tags
    n_tags = random.randint(2, 5)
    mo_tags = random.sample(MO_TAGS_POOL, k=n_tags)

    mo_text = generate_mo_text(mo_tags)

    # Recidivism label with some noise
    base_rate = RECIDIVISM_RATES[crime_type]
    if prior_record:
        base_rate = min(base_rate + 0.20, 0.95)
    recidivism = int(random.random() < base_rate)

    # Severity score (1-10)
    severity_map = {
        "murder": 10, "kidnapping": 9, "robbery": 8, "fraud": 7,
        "burglary": 6, "assault": 6, "cybercrime": 5, "drug_offense": 5,
        "vehicle_theft": 4, "vandalism": 3
    }
    severity = severity_map.get(crime_type, 5) + random.randint(-1, 1)
    severity = max(1, min(10, severity))

    return {
        "fir_id": f"FIR-{record_id:05d}",
        "crime_type": crime_type,
        "location_type": location,
        "state": state,
        "time_of_day": time_of_day,
        "weapon_used": weapon,
        "entry_method": entry_method,
        "target_type": target_type,
        "suspect_age_group": age_group,
        "prior_record": int(prior_record),
        "accomplice_count": random.randint(0, 4) if "multiple_offenders" in mo_tags else random.randint(0, 1),
        "evidence_recovered": random.randint(0, 1),
        "digital_evidence": int(crime_type in ["cybercrime", "fraud"]),
        "mo_tags": "|".join(mo_tags),
        "mo_text": mo_text,
        "severity_score": severity,
        "recidivism": recidivism,
    }


def main():
    out_dir = os.path.dirname(os.path.abspath(__file__))
    csv_path = os.path.join(out_dir, "fir_dataset.csv")
    json_path = os.path.join(out_dir, "fir_dataset_sample.json")

    n_records = 3000
    records = [generate_record(i + 1) for i in range(n_records)]

    # Write CSV
    fieldnames = list(records[0].keys())
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)

    # Write a 50-record JSON sample for quick inspection
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(records[:50], f, indent=2)

    # Print distribution summary
    from collections import Counter
    crime_dist = Counter(r["crime_type"] for r in records)
    recid_rate = sum(r["recidivism"] for r in records) / n_records

    print(f"Dataset generated: {n_records} records")
    print(f"CSV  -> {csv_path}")
    print(f"JSON -> {json_path}")
    print(f"\nCrime type distribution:")
    for crime, count in sorted(crime_dist.items(), key=lambda x: -x[1]):
        print(f"  {crime:<25} {count:>5}  ({count/n_records*100:.1f}%)")
    print(f"\nOverall recidivism rate: {recid_rate:.2%}")


if __name__ == "__main__":
    main()
