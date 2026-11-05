"""
Trust Gate Service - validates measurements and flags data quality issues.

Each rule checks a specific aspect of measurement data quality and creates
TrustGateFlag records when violations are found. Corrections always create
new linked measurements, never overwrite existing data.
"""
import datetime
import uuid
from typing import List, Optional

from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.measurement import Measurement
from app.models.trust_gate import TrustGateFlag
from app.config import TRUST_GATE_CONFIG


class TrustGateService:
    """Service for running trust gate validation rules on measurements."""

    @staticmethod
    def run_all_rules(db: Session, measurement: Measurement) -> List[TrustGateFlag]:
        """Run all trust gate rules against a measurement and return created flags."""
        flags = []

        rule_methods = [
            TrustGateService._check_missing_date,
            TrustGateService._check_missing_unit,
            TrustGateService._check_invalid_date,
            TrustGateService._check_duplicate_entry,
            TrustGateService._check_repeated_value,
            TrustGateService._check_large_change,
        ]

        for rule_fn in rule_methods:
            flag = rule_fn(db, measurement)
            if flag:
                db.add(flag)
                flags.append(flag)

        if flags:
            db.flush()

        return flags

    @staticmethod
    def _check_missing_date(db: Session, measurement: Measurement) -> Optional[TrustGateFlag]:
        """MISSING_DATE: measurement_date is null."""
        if measurement.measurement_date is None:
            return TrustGateFlag(
                id=str(uuid.uuid4()),
                measurement_id=measurement.id,
                child_id=measurement.child_id,
                rule_code="MISSING_DATE",
                rule_description="Measurement date is missing. Without a date, this record cannot be placed in the child's growth timeline.",
                severity="warning",
                source_field="measurement_date",
                source_value="None",
                recommended_action="Ask the recorder to provide the date when this measurement was taken. If unknown, mark as approximate.",
                status="Needs review",
            )
        return None

    @staticmethod
    def _check_missing_unit(db: Session, measurement: Measurement) -> Optional[TrustGateFlag]:
        """MISSING_UNIT: unit is null or empty."""
        if not measurement.unit or measurement.unit.strip() == "":
            return TrustGateFlag(
                id=str(uuid.uuid4()),
                measurement_id=measurement.id,
                child_id=measurement.child_id,
                rule_code="MISSING_UNIT",
                rule_description="Measurement unit is missing. The value cannot be interpreted without knowing its unit (kg, cm, etc.).",
                severity="warning",
                source_field="unit",
                source_value=str(measurement.unit),
                recommended_action="Ask the recorder to specify the unit of measurement. Standard units: kg for weight, cm for height and MUAC.",
                status="Needs review",
            )
        return None

    @staticmethod
    def _check_invalid_date(db: Session, measurement: Measurement) -> Optional[TrustGateFlag]:
        """INVALID_DATE: measurement_date is in the future."""
        if measurement.measurement_date is None:
            return None

        now = datetime.datetime.utcnow()
        if measurement.measurement_date > now:
            return TrustGateFlag(
                id=str(uuid.uuid4()),
                measurement_id=measurement.id,
                child_id=measurement.child_id,
                rule_code="INVALID_DATE",
                rule_description=f"Measurement date ({measurement.measurement_date.strftime('%Y-%m-%d')}) is in the future. This likely indicates a data entry error.",
                severity="critical",
                source_field="measurement_date",
                source_value=measurement.measurement_date.isoformat(),
                recommended_action="Verify the measurement date with the recorder. Correct if it was entered in error.",
                status="Needs review",
            )
        return None

    @staticmethod
    def _check_duplicate_entry(db: Session, measurement: Measurement) -> Optional[TrustGateFlag]:
        """DUPLICATE_ENTRY: same child_id + measurement_date + measurement_type already exists."""
        if measurement.measurement_date is None:
            return None

        duplicate = db.query(Measurement).filter(
            and_(
                Measurement.child_id == measurement.child_id,
                Measurement.measurement_date == measurement.measurement_date,
                Measurement.measurement_type == measurement.measurement_type,
                Measurement.id != measurement.id,
                Measurement.is_corrected == False,
            )
        ).first()

        if duplicate:
            return TrustGateFlag(
                id=str(uuid.uuid4()),
                measurement_id=measurement.id,
                child_id=measurement.child_id,
                rule_code="DUPLICATE_ENTRY",
                rule_description=f"A {measurement.measurement_type} measurement for this child on {measurement.measurement_date.strftime('%Y-%m-%d')} already exists (value: {duplicate.value}). This may be an accidental double entry.",
                severity="warning",
                source_field="measurement_date",
                source_value=measurement.measurement_date.isoformat(),
                recommended_action="Review both entries and determine if one should be marked as corrected. Keep the accurate one.",
                status="Needs review",
            )
        return None

    @staticmethod
    def _check_repeated_value(db: Session, measurement: Measurement) -> Optional[TrustGateFlag]:
        """REPEATED_VALUE: identical value for same child and type across N consecutive measurements."""
        threshold = int(TRUST_GATE_CONFIG["REPEATED_VALUE_COUNT"]["value"])

        # Get the last N-1 measurements of same type for same child, ordered by recorded_at desc
        previous = db.query(Measurement).filter(
            and_(
                Measurement.child_id == measurement.child_id,
                Measurement.measurement_type == measurement.measurement_type,
                Measurement.id != measurement.id,
                Measurement.is_corrected == False,
            )
        ).order_by(Measurement.recorded_at.desc()).limit(threshold - 1).all()

        if len(previous) < threshold - 1:
            return None

        # Check if all have the same value
        all_same = all(m.value == measurement.value for m in previous)

        if all_same:
            return TrustGateFlag(
                id=str(uuid.uuid4()),
                measurement_id=measurement.id,
                child_id=measurement.child_id,
                rule_code="REPEATED_VALUE",
                rule_description=f"The {measurement.measurement_type} value {measurement.value} has been identical across {threshold} consecutive measurements. This is unusual and may indicate copied data rather than actual measurements.",
                severity="info",
                source_field="value",
                source_value=str(measurement.value),
                recommended_action="Verify that each measurement was independently taken. If values are genuinely unchanged, mark as verified.",
                status="Needs review",
            )
        return None

    @staticmethod
    def _check_large_change(db: Session, measurement: Measurement) -> Optional[TrustGateFlag]:
        """LARGE_CHANGE: value change exceeds threshold compared to previous measurement."""
        # Get threshold based on measurement type
        threshold_map = {
            "weight": TRUST_GATE_CONFIG["LARGE_WEIGHT_CHANGE_KG"]["value"],
            "height": TRUST_GATE_CONFIG["LARGE_HEIGHT_CHANGE_CM"]["value"],
            "muac": TRUST_GATE_CONFIG["LARGE_MUAC_CHANGE_CM"]["value"],
        }

        threshold = threshold_map.get(measurement.measurement_type)
        if threshold is None:
            return None

        # Get the most recent previous measurement of same type for same child
        previous = db.query(Measurement).filter(
            and_(
                Measurement.child_id == measurement.child_id,
                Measurement.measurement_type == measurement.measurement_type,
                Measurement.id != measurement.id,
                Measurement.is_corrected == False,
            )
        ).order_by(Measurement.recorded_at.desc()).first()

        if previous is None:
            return None

        change = abs(measurement.value - previous.value)
        if change > threshold:
            unit_label = {"weight": "kg", "height": "cm", "muac": "cm"}.get(measurement.measurement_type, "")
            return TrustGateFlag(
                id=str(uuid.uuid4()),
                measurement_id=measurement.id,
                child_id=measurement.child_id,
                rule_code="LARGE_CHANGE",
                rule_description=f"The {measurement.measurement_type} changed by {change:.1f}{unit_label} (from {previous.value} to {measurement.value}), exceeding the expected maximum change of {threshold}{unit_label}. This may indicate a measurement or data entry error.",
                severity="critical",
                source_field="value",
                source_value=str(measurement.value),
                recommended_action="Re-measure the child to confirm this reading. If confirmed, document the reason for the large change.",
                status="Needs review",
            )
        return None

    @staticmethod
    def verify_flag(
        db: Session,
        flag_id: str,
        status: str,
        reviewed_by: str,
        resolution_note: Optional[str] = None,
        corrected_value: Optional[float] = None,
        corrected_unit: Optional[str] = None,
    ) -> TrustGateFlag:
        """
        Verify/resolve a trust gate flag.
        If corrected_value is provided, creates a NEW measurement linked to the original.
        """
        flag = db.query(TrustGateFlag).filter(TrustGateFlag.id == flag_id).first()
        if not flag:
            raise ValueError(f"Flag {flag_id} not found")

        flag.status = status
        flag.reviewed_by = reviewed_by
        flag.reviewed_at = datetime.datetime.utcnow()
        flag.resolution_note = resolution_note

        # If correction value is provided, create a new linked measurement
        if corrected_value is not None and status == "Corrected":
            original = db.query(Measurement).filter(
                Measurement.id == flag.measurement_id
            ).first()

            if original:
                # Mark original as corrected
                original.is_corrected = True

                # Create new corrected measurement linked to original
                new_measurement = Measurement(
                    id=str(uuid.uuid4()),
                    child_id=original.child_id,
                    measurement_type=original.measurement_type,
                    value=corrected_value,
                    unit=corrected_unit if corrected_unit else original.unit,
                    measurement_date=original.measurement_date,
                    recorded_by=reviewed_by,
                    recorded_at=datetime.datetime.utcnow(),
                    is_corrected=False,
                    corrected_by_id=original.id,
                    correction_reason=resolution_note,
                    notes=f"Correction of measurement {original.id}",
                )
                db.add(new_measurement)

        db.flush()
        return flag
