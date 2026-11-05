"""
POSHANLOOP Configuration

All trust-gate thresholds and system-wide settings are defined here
with plain-language descriptions so any team member can understand
what each value controls.
"""

TRUST_GATE_CONFIG = {
    "LARGE_WEIGHT_CHANGE_KG": {
        "value": 3.0,
        "description": "Maximum expected weight change in kg between consecutive measurements"
    },
    "LARGE_HEIGHT_CHANGE_CM": {
        "value": 5.0,
        "description": "Maximum expected height change in cm between consecutive measurements"
    },
    "LARGE_MUAC_CHANGE_CM": {
        "value": 2.0,
        "description": "Maximum expected MUAC change in cm between consecutive measurements"
    },
    "REPEATED_VALUE_COUNT": {
        "value": 3,
        "description": "Number of consecutive identical values to flag as suspicious"
    },
    "MEASUREMENT_SCHEDULE_DAYS": {
        "value": 30,
        "description": "Expected days between measurements for overdue calculation"
    },
}

DATABASE_URL = "sqlite:///./poshanloop.db"

# For tests
TEST_DATABASE_URL = "sqlite:///./test_poshanloop.db"

# Demo roles
ROLES = ["AWW", "ASHA_ANM", "Facility", "Supervisor"]

# Referral statuses (ordered lifecycle)
REFERRAL_STATUSES = [
    "New",
    "Needs verification",
    "Assigned",
    "Family contacted",
    "Barrier support arranged",
    "Referred",
    "Facility acknowledged",
    "Outcome recorded",
    "Closed",
    "Rescheduled",
    "Not reached",
    "Transferred",
    "Cancelled",
    "Escalated",
]

# Valid status transitions: from_status -> [allowed_to_statuses]
VALID_STATUS_TRANSITIONS = {
    "New": ["Needs verification", "Assigned", "Cancelled", "Escalated"],
    "Needs verification": ["Assigned", "Cancelled", "Escalated"],
    "Assigned": ["Family contacted", "Not reached", "Cancelled", "Escalated", "Transferred"],
    "Family contacted": ["Barrier support arranged", "Referred", "Not reached", "Cancelled", "Escalated", "Rescheduled"],
    "Barrier support arranged": ["Referred", "Family contacted", "Cancelled", "Escalated", "Rescheduled"],
    "Referred": ["Facility acknowledged", "Not reached", "Rescheduled", "Cancelled", "Escalated"],
    "Facility acknowledged": ["Outcome recorded", "Rescheduled", "Not reached", "Cancelled", "Escalated"],
    "Outcome recorded": ["Closed", "Escalated"],
    "Rescheduled": ["Family contacted", "Referred", "Cancelled", "Escalated", "Not reached"],
    "Not reached": ["Family contacted", "Referred", "Cancelled", "Escalated", "Rescheduled"],
    "Escalated": ["Assigned", "Cancelled", "Closed"],
    "Transferred": ["Closed"],
    "Closed": [],
    "Cancelled": [],
}

# Trust gate flag statuses
TRUST_FLAG_STATUSES = [
    "Clear",
    "Needs review",
    "Re-measurement requested",
    "Verified",
    "Corrected",
]

# Facility statuses
FACILITY_STATUSES = [
    "Received",
    "Attended",
    "Rescheduled",
    "Not reached",
    "Wrong facility",
]

# Sync statuses
SYNC_STATUSES = [
    "pending",
    "synced",
    "needs_review",
    "conflict",
]

# Cause-finder checklist
CAUSE_FINDER_CHECKLIST = [
    {
        "id": "food_variety",
        "category": "Diet",
        "question": "Is the child eating food from at least 4 food groups daily?",
        "info_card": "Children aged 6-23 months need diverse diets including grains, pulses, dairy, eggs, fruits and vegetables for adequate nutrition."
    },
    {
        "id": "meal_frequency",
        "category": "Diet",
        "question": "Is the child getting the recommended number of meals per day for their age?",
        "info_card": "Breastfed children 6-8 months: 2-3 meals; 9-23 months: 3-4 meals. Non-breastfed: add 1-2 extra meals and snacks."
    },
    {
        "id": "breastfeeding",
        "category": "Diet",
        "question": "Is the child being breastfed (if under 24 months)?",
        "info_card": "WHO recommends exclusive breastfeeding for the first 6 months and continued breastfeeding up to 2 years with complementary foods."
    },
    {
        "id": "recent_illness",
        "category": "Health",
        "question": "Has the child had diarrhea, fever, or respiratory infection in the last 2 weeks?",
        "info_card": "Frequent illness is a major driver of undernutrition. Ensure the child receives ORS, zinc supplementation, and continued feeding during illness."
    },
    {
        "id": "immunization",
        "category": "Health",
        "question": "Is the child up to date on immunizations?",
        "info_card": "Immunization prevents illness that can contribute to malnutrition. Check the immunization card and refer for catch-up if needed."
    },
    {
        "id": "deworming",
        "category": "Health",
        "question": "Has the child received deworming medication in the last 6 months (if over 12 months)?",
        "info_card": "Intestinal worms compete for nutrients and can cause anemia. Deworming every 6 months is recommended for children over 12 months."
    },
    {
        "id": "water_sanitation",
        "category": "Environment",
        "question": "Does the family have access to clean drinking water and a toilet?",
        "info_card": "Poor water and sanitation lead to repeated infections and environmental enteropathy, reducing nutrient absorption."
    },
    {
        "id": "handwashing",
        "category": "Environment",
        "question": "Does the caregiver practice handwashing before feeding the child?",
        "info_card": "Handwashing with soap before feeding and after toilet use can reduce diarrhea by 40%."
    },
    {
        "id": "caregiver_stress",
        "category": "Social",
        "question": "Is the primary caregiver experiencing stress, depression, or lack of support?",
        "info_card": "Caregiver mental health directly affects child feeding and care practices. Connect with support services if needed."
    },
    {
        "id": "economic_barrier",
        "category": "Social",
        "question": "Does the family face economic barriers to accessing nutritious food?",
        "info_card": "Poverty is a root cause of malnutrition. Link the family with government schemes like ICDS supplementary nutrition, PDS, and MGNREGA."
    },
    {
        "id": "migration",
        "category": "Social",
        "question": "Has the family recently migrated or is seasonally mobile?",
        "info_card": "Migration disrupts nutrition services. Ensure transfer of records and re-registration at the destination Anganwadi centre."
    },
    {
        "id": "maternal_nutrition",
        "category": "Maternal",
        "question": "Did the mother receive adequate nutrition and IFA tablets during pregnancy?",
        "info_card": "Maternal undernutrition and anemia during pregnancy lead to low birth weight and increased risk of child malnutrition."
    },
]

# Suggested actions mapping based on checklist responses
CAUSE_FINDER_ACTIONS = {
    "food_variety": "Counsel caregiver on including foods from all food groups. Refer to ICDS supplementary nutrition program.",
    "meal_frequency": "Counsel on age-appropriate meal frequency. Provide feeding schedule card.",
    "breastfeeding": "Counsel on benefits of continued breastfeeding. Refer to lactation support if needed.",
    "recent_illness": "Refer to health facility for treatment. Counsel on continued feeding during illness and ORS/Zinc for diarrhea.",
    "immunization": "Refer to health facility for catch-up immunization. Update immunization card.",
    "deworming": "Administer albendazole (if eligible) or refer to health facility for deworming.",
    "water_sanitation": "Counsel on water treatment methods. Link with Swachh Bharat Mission for toilet construction.",
    "handwashing": "Demonstrate proper handwashing technique. Provide soap if available through ICDS.",
    "caregiver_stress": "Connect caregiver with ASHA for home visits. Refer to mental health support if available.",
    "economic_barrier": "Link with PDS, ICDS supplementary nutrition, and MGNREGA. Check eligibility for other government schemes.",
    "migration": "Facilitate transfer of records to destination AWC. Provide referral slip with child's nutrition history.",
    "maternal_nutrition": "Ensure mother receives IFA and calcium tablets. Refer for ANC check-up. Counsel on maternal diet.",
}
