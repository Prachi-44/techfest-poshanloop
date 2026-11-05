import datetime
import uuid
import pytest
from sqlalchemy.orm import Session

from app.models.child import Child
from app.models.measurement import Measurement
from app.models.trust_gate import TrustGateFlag
from app.services.trust_gate_service import TrustGateService


def test_missing_unit_rule(db_session: Session):
    m = Measurement(
        id=str(uuid.uuid4()),
        child_id="CH-0001",
        measurement_type="weight",
        value=10.2,
        unit="",  # Missing unit
        measurement_date=datetime.datetime.utcnow(),
        recorded_by="Test Worker",
    )
    db_session.add(m)
    db_session.flush()

    flags = TrustGateService.run_all_rules(db_session, m)
    rule_codes = [f.rule_code for f in flags]
    assert "MISSING_UNIT" in rule_codes


def test_missing_date_rule(db_session: Session):
    m = Measurement(
        id=str(uuid.uuid4()),
        child_id="CH-0002",
        measurement_type="weight",
        value=10.5,
        unit="kg",
        measurement_date=None,  # Missing date
        recorded_by="Test Worker",
    )
    db_session.add(m)
    db_session.flush()

    flags = TrustGateService.run_all_rules(db_session, m)
    rule_codes = [f.rule_code for f in flags]
    assert "MISSING_DATE" in rule_codes


def test_invalid_future_date_rule(db_session: Session):
    m = Measurement(
        id=str(uuid.uuid4()),
        child_id="CH-0003",
        measurement_type="weight",
        value=11.0,
        unit="kg",
        measurement_date=datetime.datetime.utcnow() + datetime.timedelta(days=10),  # Future date
        recorded_by="Test Worker",
    )
    db_session.add(m)
    db_session.flush()

    flags = TrustGateService.run_all_rules(db_session, m)
    rule_codes = [f.rule_code for f in flags]
    assert "INVALID_DATE" in rule_codes


def test_large_change_rule(db_session: Session):
    child_id = "CH-0004"
    prev_date = datetime.datetime.utcnow() - datetime.timedelta(days=20)
    curr_date = datetime.datetime.utcnow() - datetime.timedelta(days=5)

    m1 = Measurement(
        id=str(uuid.uuid4()),
        child_id=child_id,
        measurement_type="weight",
        value=9.0,
        unit="kg",
        measurement_date=prev_date,
        recorded_by="Test Worker",
    )
    db_session.add(m1)
    db_session.flush()

    # Weight jump of 4.5kg exceeds 3.0kg threshold
    m2 = Measurement(
        id=str(uuid.uuid4()),
        child_id=child_id,
        measurement_type="weight",
        value=13.5,
        unit="kg",
        measurement_date=curr_date,
        recorded_by="Test Worker",
    )
    db_session.add(m2)
    db_session.flush()

    flags = TrustGateService.run_all_rules(db_session, m2)
    rule_codes = [f.rule_code for f in flags]
    assert "LARGE_CHANGE" in rule_codes


def test_correction_preserves_original_record(db_session: Session):
    m = Measurement(
        id=str(uuid.uuid4()),
        child_id="CH-0006",
        measurement_type="weight",
        value=9.5,
        unit="",
        measurement_date=datetime.datetime.utcnow(),
        recorded_by="Test Worker",
    )
    db_session.add(m)
    db_session.flush()

    flags = TrustGateService.run_all_rules(db_session, m)
    flag = flags[0]

    # Verify and apply correction
    resolved = TrustGateService.verify_flag(
        db=db_session,
        flag_id=flag.id,
        status="Corrected",
        reviewed_by="Supervisor Patil",
        resolution_note="Added missing unit kg and verified value",
        corrected_value=9.5,
        corrected_unit="kg",
    )
    db_session.commit()

    assert resolved.status == "Corrected"

    # Verify original measurement is preserved and marked is_corrected=True
    original = db_session.query(Measurement).filter(Measurement.id == m.id).first()
    assert original is not None
    assert original.is_corrected is True
    assert original.value == 9.5

    # Verify new corrected measurement was created and links to original
    new_m = db_session.query(Measurement).filter(Measurement.corrected_by_id == m.id).first()
    assert new_m is not None
    assert new_m.unit == "kg"
    assert new_m.recorded_by == "Supervisor Patil"

