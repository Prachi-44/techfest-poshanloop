"""
POSHANLOOP - Synthetic Data Seed Script

IMPORTANT:
All data generated here is 100% fictional and synthetic.
No real beneficiary, child, caregiver, or government data is used.
All values are for demonstration purposes and do not represent prevalence or clinical truth.
"""
import datetime
import uuid
from sqlalchemy.orm import Session

from app.database import Base, engine, SessionLocal
from app.models.child import Block, Centre, Child
from app.models.measurement import Measurement
from app.models.trust_gate import TrustGateFlag
from app.models.referral import Referral
from app.models.case import CaseEvent
from app.models.sync_event import SyncEvent
from app.models.cause_finder import CauseFinderSession
from app.models.user import DemoUser
from app.services.trust_gate_service import TrustGateService


def seed_database(db: Session):
    # Check if already seeded
    if db.query(Block).first():
        print("Database already contains data, skipping seed.")
        return

    print("Seeding synthetic data for POSHANLOOP...")
    now = datetime.datetime.utcnow()

    # 1. BLOCKS (3 blocks)
    blocks_data = [
        {"id": "BLK-01", "name": "Nashik Urban", "district": "Nashik"},
        {"id": "BLK-02", "name": "Nashik Rural", "district": "Nashik"},
        {"id": "BLK-03", "name": "Sinnar", "district": "Nashik"},
    ]
    for b in blocks_data:
        db.add(Block(**b))
    db.flush()

    # 2. CENTRES (8 Anganwadi Centres)
    centres_data = [
        {"id": "AWC-01", "name": "Panchavati AWC 1", "block_id": "BLK-01"},
        {"id": "AWC-02", "name": "Panchavati AWC 2", "block_id": "BLK-01"},
        {"id": "AWC-03", "name": "CIDCO Sector 4 AWC", "block_id": "BLK-01"},
        {"id": "AWC-04", "name": "Trimbak Road Rural AWC", "block_id": "BLK-02"},
        {"id": "AWC-05", "name": "Girnare Village AWC", "block_id": "BLK-02"},
        {"id": "AWC-06", "name": "Dugaon AWC", "block_id": "BLK-02"},
        {"id": "AWC-07", "name": "Sinnar Town AWC", "block_id": "BLK-03"},
        {"id": "AWC-08", "name": "Musalgaon Industrial Fringe AWC", "block_id": "BLK-03"},
    ]
    for c in centres_data:
        db.add(Centre(**c))
    db.flush()

    # 3. DEMO USERS (covering all 4 demo roles)
    demo_users = [
        {"id": 1, "name": "Sunita Patil (Anganwadi Worker)", "role": "AWW", "centre_id": "AWC-01", "block_id": "BLK-01"},
        {"id": 2, "name": "Kavita Shinde (ASHA / ANM)", "role": "ASHA_ANM", "centre_id": "AWC-01", "block_id": "BLK-01"},
        {"id": 3, "name": "Dr. Ramesh Deshmukh (PHC Panchavati)", "role": "Facility", "centre_id": None, "block_id": "BLK-01"},
        {"id": 4, "name": "Meena Kulkarni (CDPO / Supervisor)", "role": "Supervisor", "centre_id": None, "block_id": "BLK-01"},
        {"id": 5, "name": "Anita Jadhav (Anganwadi Worker)", "role": "AWW", "centre_id": "AWC-04", "block_id": "BLK-02"},
    ]
    for u in demo_users:
        db.add(DemoUser(**u))
    db.flush()

    # 4. SYNTHETIC CHILDREN (65 Children: CH-0001 to CH-0065)
    fictional_first_names = [
        "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Reyansh", "Muhammad", "Sai", "Ayaan", "Krishna",
        "Ishaan", "Shaurya", "Atharva", "Advik", "Pranav", "Advaith", "Aaryan", "Dhruv", "Kabir", "Ritvik",
        "Ananya", "Diya", "Gauri", "Kavya", "Khushi", "Navya", "Rhea", "Pooja", "Aarohi", "Saanvi",
        "Pari", "Myra", "Avani", "Ira", "Siya", "Riya", "Prisha", "Aditi", "Tara", "Tanvi",
        "Om", "Yash", "Rohan", "Samarth", "Nikhil", "Sneha", "Kalyani", "Ishita", "Meera", "Swara",
        "Dev", "Rudra", "Ved", "Karan", "Neil", "Anika", "Radha", "Bhakti", "Manasi", "Tejaswini",
        "Shlok", "Varun", "Chaitanya", "Aalok", "Gayatri"
    ]
    fictional_guardians = [
        "Suresh Pawar", "Ganesh More", "Rajesh Gaikwad", "Santosh Kadam", "Dattatray Shinde",
        "Vijay Thorat", "Sachin Wagh", "Mahesh Jadhav", "Nitin Chavan", "Pravin Salve",
        "Sunil Gite", "Dipak Sonawane", "Anil Bhalerao", "Vikram Tambe", "Vikas Khairnar"
    ]

    for i in range(1, 66):
        child_id = f"CH-{i:04d}"
        centre_id = centres_data[(i - 1) % len(centres_data)]["id"]
        name = fictional_first_names[(i - 1) % len(fictional_first_names)]
        guardian = fictional_guardians[(i - 1) % len(fictional_guardians)]
        age_months = 6 + (i * 7) % 52
        gender = "M" if i % 2 == 1 else "F"

        child = Child(
            id=child_id,
            name=f"{name} {guardian.split()[-1]}",
            age_months=age_months,
            gender=gender,
            centre_id=centre_id,
            guardian_name=guardian,
            status="active",
            created_at=now - datetime.timedelta(days=120),
        )
        db.add(child)
    db.flush()

    # 5. MEASUREMENTS & SPECIFIC SEEDED SCENARIOS

    # Normal baseline measurements for general children
    for i in range(1, 66):
        child_id = f"CH-{i:04d}"

        # Scenario 6: CH-0025 has NO measurement in the last 45 days (overdue/unknown)
        if i == 25:
            # Last measurement was 55 days ago
            old_date = now - datetime.timedelta(days=55)
            m = Measurement(
                id=str(uuid.uuid4()),
                child_id=child_id,
                measurement_type="weight",
                value=8.5,
                unit="kg",
                measurement_date=old_date,
                recorded_by="Sunita Patil",
                recorded_at=old_date,
            )
            db.add(m)
            continue

        # Regular past measurements
        m_date_prev = now - datetime.timedelta(days=40)
        m_date_recent = now - datetime.timedelta(days=10)

        # Baseline weight: between 7.0 and 14.0 kg
        base_weight = 7.0 + ((i % 10) * 0.7)

        # Record 1: Previous month
        m1 = Measurement(
            id=str(uuid.uuid4()),
            child_id=child_id,
            measurement_type="weight",
            value=base_weight,
            unit="kg",
            measurement_date=m_date_prev,
            recorded_by="Sunita Patil",
            recorded_at=m_date_prev,
        )
        db.add(m1)

        # Record 2: Current month (with specific seeded scenarios)

        # Scenario 1: CH-0005: Duplicate measurement
        if i == 5:
            m2 = Measurement(
                id=str(uuid.uuid4()),
                child_id=child_id,
                measurement_type="weight",
                value=base_weight + 0.3,
                unit="kg",
                measurement_date=m_date_recent,
                recorded_by="Sunita Patil",
                recorded_at=m_date_recent,
            )
            db.add(m2)
            db.flush()
            # Exact duplicate entry
            m_dup = Measurement(
                id=str(uuid.uuid4()),
                child_id=child_id,
                measurement_type="weight",
                value=base_weight + 0.3,
                unit="kg",
                measurement_date=m_date_recent,
                recorded_by="Sunita Patil",
                recorded_at=m_date_recent,
                notes="Accidental re-entry on field tablet",
            )
            db.add(m_dup)
            continue

        # Scenario 2: CH-0008: Missing unit on a weight measurement
        elif i == 8:
            m2 = Measurement(
                id=str(uuid.uuid4()),
                child_id=child_id,
                measurement_type="weight",
                value=base_weight + 0.2,
                unit=None,  # Missing unit
                measurement_date=m_date_recent,
                recorded_by="Anita Jadhav",
                recorded_at=m_date_recent,
            )
            db.add(m2)
            continue

        # Scenario 3: CH-0012: Missing measurement_date
        elif i == 12:
            m2 = Measurement(
                id=str(uuid.uuid4()),
                child_id=child_id,
                measurement_type="weight",
                value=base_weight + 0.25,
                unit="kg",
                measurement_date=None,  # Missing date
                recorded_by="Sunita Patil",
                recorded_at=m_date_recent,
            )
            db.add(m2)
            continue

        # Scenario 4: CH-0015: 3 consecutive identical weight values
        elif i == 15:
            fixed_val = 9.2
            m1.value = fixed_val
            # Midpoint measurement
            m_mid = Measurement(
                id=str(uuid.uuid4()),
                child_id=child_id,
                measurement_type="weight",
                value=fixed_val,
                unit="kg",
                measurement_date=now - datetime.timedelta(days=25),
                recorded_by="Sunita Patil",
                recorded_at=now - datetime.timedelta(days=25),
            )
            db.add(m_mid)
            # 3rd identical measurement
            m2 = Measurement(
                id=str(uuid.uuid4()),
                child_id=child_id,
                measurement_type="weight",
                value=fixed_val,
                unit="kg",
                measurement_date=m_date_recent,
                recorded_by="Sunita Patil",
                recorded_at=m_date_recent,
            )
            db.add(m2)
            continue

        # Scenario 5: CH-0020: Large weight change (>3kg between consecutive measurements)
        elif i == 20:
            m2 = Measurement(
                id=str(uuid.uuid4()),
                child_id=child_id,
                measurement_type="weight",
                value=base_weight + 4.2,  # Jump of 4.2kg!
                unit="kg",
                measurement_date=m_date_recent,
                recorded_by="Anita Jadhav",
                recorded_at=m_date_recent,
            )
            db.add(m2)
            continue

        # Standard healthy or normal progression
        else:
            m2 = Measurement(
                id=str(uuid.uuid4()),
                child_id=child_id,
                measurement_type="weight",
                value=round(base_weight + 0.2 + (i % 3) * 0.1, 1),
                unit="kg",
                measurement_date=m_date_recent,
                recorded_by="Sunita Patil",
                recorded_at=m_date_recent,
            )
            db.add(m2)

    db.flush()

    # Run Trust Gate validation rules on all measurements to populate flags
    all_measurements = db.query(Measurement).all()
    for m in all_measurements:
        TrustGateService.run_all_rules(db, m)
    db.flush()

    # 6. SEEDED REFERRALS & CASES (Scenarios 7, 8, 9, 10, 11, 12)

    # Scenario 7: CH-0030: Family with travel barrier, active referral
    ref_30 = Referral(
        id=str(uuid.uuid4()),
        child_id="CH-0030",
        care_receipt_ref="PL-7K4M2",
        status="Barrier support arranged",
        destination_facility="Nashik District Hospital NRC",
        visit_instruction="Family requires bus pass or vehicle coordination. OPD Room 12.",
        date_issued=now - datetime.timedelta(days=5),
        expiry_date=now + datetime.timedelta(days=25),
        barriers=["travel_distance", "transport_cost"],
        barrier_notes="Family lives 18km from NRC in Girnare tribal pocket. No direct bus service in the morning.",
        assigned_to_role="ASHA_ANM",
        assigned_to_name="Kavita Shinde",
        priority="high",
        next_action="Coordinate panchayat vehicle or emergency travel fund with supervisor",
        due_date=now + datetime.timedelta(days=2),
    )
    db.add(ref_30)
    db.flush()
    db.add(CaseEvent(
        referral_id=ref_30.id,
        actor_role="AWW",
        actor_name="Sunita Patil",
        action="Case Opened",
        note="Identified growth faltering during monthly AWC check.",
        timestamp=now - datetime.timedelta(days=5),
    ))
    db.add(CaseEvent(
        referral_id=ref_30.id,
        actor_role="ASHA_ANM",
        actor_name="Kavita Shinde",
        action="Home Visit & Barrier Captured",
        note="Met mother. Recorded distance and transport cost barriers. Transport support request initiated.",
        timestamp=now - datetime.timedelta(days=3),
    ))

    # Scenario 8: CH-0035: Family with no accompanying adult barrier
    ref_35 = Referral(
        id=str(uuid.uuid4()),
        child_id="CH-0035",
        care_receipt_ref="PL-3B8Q1",
        status="Family contacted",
        destination_facility="Panchavati Sub-District Hospital",
        visit_instruction="OPD registration before 11:30 AM.",
        date_issued=now - datetime.timedelta(days=4),
        expiry_date=now + datetime.timedelta(days=26),
        barriers=["no_accompanying_adult", "childcare_responsibility"],
        barrier_notes="Mother works daily wage brick-kiln shift; single caregiver with two younger siblings at home.",
        assigned_to_role="AWW",
        assigned_to_name="Sunita Patil",
        priority="urgent",
        next_action="Arrange neighbor or ASHA accompany on Saturday morning OPD",
        due_date=now + datetime.timedelta(days=1),
    )
    db.add(ref_35)
    db.flush()
    db.add(CaseEvent(
        referral_id=ref_35.id,
        actor_role="AWW",
        actor_name="Sunita Patil",
        action="Home Visit Completed",
        note="Mother explained absence of second adult caregiver at home.",
        timestamp=now - datetime.timedelta(days=4),
    ))

    # Scenario 9: CH-0040: Referral waiting for facility acknowledgement (status=Referred)
    ref_40 = Referral(
        id=str(uuid.uuid4()),
        child_id="CH-0040",
        care_receipt_ref="PL-9X2L5",
        status="Referred",
        destination_facility="Nashik District Hospital NRC",
        visit_instruction="Report to Paediatric triage desk with MCP card.",
        date_issued=now - datetime.timedelta(days=2),
        expiry_date=now + datetime.timedelta(days=28),
        barriers=["unclear_instructions"],
        barrier_notes="Explained OPD location and token system during ASHA briefing.",
        assigned_to_role="Facility",
        assigned_to_name="Dr. Ramesh Deshmukh",
        priority="routine",
        next_action="Awaiting patient presentation and facility acknowledgement",
        due_date=now + datetime.timedelta(days=3),
    )
    db.add(ref_40)
    db.flush()
    db.add(CaseEvent(
        referral_id=ref_40.id,
        actor_role="ASHA_ANM",
        actor_name="Kavita Shinde",
        action="Care Receipt Issued",
        note="Care Receipt PL-9X2L5 handed to caregiver with transit instructions.",
        timestamp=now - datetime.timedelta(days=2),
    ))

    # Scenario 10: CH-0042: Attended referral (facility_status=Attended, status=Outcome recorded)
    ref_42 = Referral(
        id=str(uuid.uuid4()),
        child_id="CH-0042",
        care_receipt_ref="PL-5M1N8",
        status="Outcome recorded",
        destination_facility="PHC Panchavati",
        visit_instruction="Paediatric Nutrition OPD.",
        date_issued=now - datetime.timedelta(days=7),
        expiry_date=now + datetime.timedelta(days=23),
        barriers=[],
        barrier_notes=None,
        assigned_to_role="Supervisor",
        assigned_to_name="Meena Kulkarni",
        priority="routine",
        next_action="Supervisor review and formal case closure",
        due_date=now + datetime.timedelta(days=2),
        facility_status="Attended",
        facility_recorded_by="Dr. Ramesh Deshmukh",
        facility_recorded_at=now - datetime.timedelta(days=1),
    )
    db.add(ref_42)
    db.flush()
    db.add(CaseEvent(
        referral_id=ref_42.id,
        actor_role="AWW",
        actor_name="Sunita Patil",
        action="Case Opened",
        note="Referred for faltering trajectory.",
        timestamp=now - datetime.timedelta(days=7),
    ))
    db.add(CaseEvent(
        referral_id=ref_42.id,
        actor_role="Facility",
        actor_name="Dr. Ramesh Deshmukh",
        action="Facility Outcome: Attended",
        note="Child examined. Dietary counseling provided and supplementary therapeutic ration prescribed for 14 days.",
        timestamp=now - datetime.timedelta(days=1),
    ))

    # Scenario 11: CH-0045: Rescheduled referral
    ref_45 = Referral(
        id=str(uuid.uuid4()),
        child_id="CH-0045",
        care_receipt_ref="PL-8R4K7",
        status="Rescheduled",
        destination_facility="PHC Panchavati",
        visit_instruction="Rescheduled OPD visit.",
        date_issued=now - datetime.timedelta(days=8),
        expiry_date=now + datetime.timedelta(days=22),
        barriers=["facility_timing"],
        barrier_notes="Mother arrived after OPD closing hours on initial visit.",
        assigned_to_role="ASHA_ANM",
        assigned_to_name="Kavita Shinde",
        priority="routine",
        next_action="Confirm family attends morning OPD slot before 11:00 AM",
        due_date=now + datetime.timedelta(days=2),
        facility_status="Rescheduled",
        facility_recorded_by="Dr. Ramesh Deshmukh",
        facility_recorded_at=now - datetime.timedelta(days=3),
    )
    db.add(ref_45)
    db.flush()
    db.add(CaseEvent(
        referral_id=ref_45.id,
        actor_role="Facility",
        actor_name="Dr. Ramesh Deshmukh",
        action="Facility Outcome: Rescheduled",
        note="Caregiver arrived late due to harvesting shift. Rescheduled for upcoming Tuesday.",
        timestamp=now - datetime.timedelta(days=3),
    ))

    # Scenario 12: CH-0048: Referral not reached
    ref_48 = Referral(
        id=str(uuid.uuid4()),
        child_id="CH-0048",
        care_receipt_ref="PL-2W6H9",
        status="Not reached",
        destination_facility="Nashik District Hospital NRC",
        visit_instruction="Pediatric follow-up.",
        date_issued=now - datetime.timedelta(days=12),
        expiry_date=now + datetime.timedelta(days=18),
        barriers=["migration_moved"],
        barrier_notes="Family moved temporarily to brick kiln in adjoining block.",
        assigned_to_role="AWW",
        assigned_to_name="Sunita Patil",
        priority="high",
        next_action="Verify seasonal migration return date with grandmother",
        due_date=now - datetime.timedelta(days=1),  # Overdue case
        facility_status="Not reached",
        facility_recorded_by="Dr. Ramesh Deshmukh",
        facility_recorded_at=now - datetime.timedelta(days=5),
    )
    db.add(ref_48)
    db.flush()
    db.add(CaseEvent(
        referral_id=ref_48.id,
        actor_role="Facility",
        actor_name="Dr. Ramesh Deshmukh",
        action="Facility Outcome: Not reached",
        note="Beneficiary did not present within 7 days of scheduled referral.",
        timestamp=now - datetime.timedelta(days=5),
    ))

    # 7. SEEDED OFFLINE SYNC SCENARIOS (Scenarios 13 & 14)

    # Scenario 13: CH-0050: Offline pending event
    sync_pending = SyncEvent(
        id=str(uuid.uuid4()),
        event_type="case_action",
        event_data={
            "referral_id": ref_30.id,
            "child_id": "CH-0050",
            "action": "Offline Home Visit Note",
            "actor_role": "AWW",
            "actor_name": "Sunita Patil",
            "note": "Ration distributed; family confirmed availability for upcoming hospital transport.",
        },
        device_created_at=now - datetime.timedelta(hours=4),
        server_received_at=None,
        sync_status="pending",
    )
    db.add(sync_pending)

    # Scenario 14: CH-0055: Sync conflict event
    conflict_event_id = str(uuid.uuid4())
    sync_conflict = SyncEvent(
        id=conflict_event_id,
        event_type="case_action",
        event_data={
            "child_id": "CH-0055",
            "action": "Status Update: Home Contacted",
            "status": "Family contacted",
            "note": "Device A: Mother agreed to visit PHC on Thursday morning.",
        },
        device_created_at=now - datetime.timedelta(hours=6),
        server_received_at=now - datetime.timedelta(hours=1),
        sync_status="conflict",
        conflict_data={
            "child_id": "CH-0055",
            "action": "Status Update: Support Arranged",
            "status": "Barrier support arranged",
            "note": "Device B: Grandfather requested vehicle support; OPD appointment altered to Friday.",
        },
    )
    db.add(sync_conflict)

    # 8. CAUSE FINDER SESSION SEEDING
    cf_session = CauseFinderSession(
        id=str(uuid.uuid4()),
        child_id="CH-0030",
        worker_role="ASHA_ANM",
        worker_name="Kavita Shinde",
        checklist_responses={
            "food_variety": True,
            "recent_illness": False,
            "economic_barrier": True,
            "travel_barrier": True,
        },
        suggested_actions=[
            "Counsel caregiver on including foods from all food groups. Refer to ICDS supplementary nutrition program.",
            "Link with PDS, ICDS supplementary nutrition, and MGNREGA. Check eligibility for other government schemes.",
            "Record barrier in referral. Discuss transport support with supervisor.",
        ],
        disclaimer_shown=True,
        created_at=now - datetime.timedelta(days=3),
    )
    db.add(cf_session)

    db.commit()
    print("Synthetic seeding completed successfully with 65 children and all 14 scenarios!")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()

