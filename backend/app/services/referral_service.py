"""
Referral & Case Service - manages the Action-to-Closure ledger.

Rule: A case is not complete because a number was entered or a message was sent.
It is complete only after the next action and receiving-side outcome are recorded.
"""
import random
import string
import datetime
from typing import List, Optional, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.models.referral import Referral
from app.models.case import CaseEvent
from app.models.child import Child
from app.schemas.referral import ReferralCreate, ReferralActionRequest, FacilityAcknowledgementRequest


def generate_care_receipt_ref(db: Session) -> str:
    """Generate unique 5-char alphanumeric reference (e.g. PL-7K4M2), excluding ambiguous chars."""
    chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
    for _ in range(100):
        suffix = "".join(random.choices(chars, k=5))
        ref = f"PL-{suffix}"
        existing = db.query(Referral).filter(Referral.care_receipt_ref == ref).first()
        if not existing:
            return ref
    raise RuntimeError("Failed to generate a unique Care Receipt Reference after multiple attempts")


class ReferralService:
    @staticmethod
    def create_referral(db: Session, data: ReferralCreate) -> Referral:
        """Create new referral case and log initial audit trail event."""
        child = db.query(Child).filter(Child.id == data.child_id).first()
        if not child:
            raise ValueError(f"Child {data.child_id} not found")

        ref = generate_care_receipt_ref(db)
        expiry = data.expiry_date or (datetime.datetime.utcnow() + datetime.timedelta(days=30))

        referral = Referral(
            child_id=data.child_id,
            care_receipt_ref=ref,
            status="New",
            destination_facility=data.destination_facility or "Primary Health Centre (PHC)",
            visit_instruction=data.visit_instruction or "Bring mother and child health card / MCP card.",
            date_issued=datetime.datetime.utcnow(),
            expiry_date=expiry,
            barriers=data.barriers or [],
            barrier_notes=data.barrier_notes,
            assigned_to_role=data.assigned_to_role or "ASHA_ANM",
            assigned_to_name=data.assigned_to_name or "Assigned Worker",
            priority=data.priority or "routine",
            next_action=data.next_action or "Family contact and initial barrier assessment",
            due_date=data.due_date or (datetime.datetime.utcnow() + datetime.timedelta(days=3)),
        )
        db.add(referral)
        db.flush()

        # Log initial event
        event = CaseEvent(
            referral_id=referral.id,
            actor_role=data.actor_role,
            actor_name=data.actor_name,
            action="Case Created",
            note=f"Referral opened with Care Receipt {ref}. Assigned to {referral.assigned_to_role}.",
            timestamp=datetime.datetime.utcnow(),
            event_data={"care_receipt_ref": ref, "priority": referral.priority},
        )
        db.add(event)
        db.commit()
        db.refresh(referral)
        return referral

    @staticmethod
    def get_referral(db: Session, referral_id: str) -> Optional[Referral]:
        return db.query(Referral).filter(Referral.id == referral_id).first()

    @staticmethod
    def get_by_care_receipt(db: Session, ref: str) -> Optional[Referral]:
        clean_ref = ref.strip().upper()
        return db.query(Referral).filter(Referral.care_receipt_ref == clean_ref).first()

    @staticmethod
    def list_referrals(
        db: Session,
        status: Optional[str] = None,
        assigned_to_role: Optional[str] = None,
        priority: Optional[str] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[Referral], int]:
        query = db.query(Referral)
        if status:
            query = query.filter(Referral.status == status)
        if assigned_to_role:
            query = query.filter(Referral.assigned_to_role == assigned_to_role)
        if priority:
            query = query.filter(Referral.priority == priority)
        if search:
            query = query.filter(
                or_(
                    Referral.care_receipt_ref.ilike(f"%{search}%"),
                    Referral.child_id.ilike(f"%{search}%"),
                )
            )

        total = query.count()
        referrals = query.order_by(Referral.created_at.desc()).offset(skip).limit(limit).all()
        return referrals, total

    @staticmethod
    def perform_action(db: Session, referral_id: str, req: ReferralActionRequest) -> Referral:
        """
        Record an action on a case with audit logging.
        Validates closure restrictions:
        Case cannot be closed solely because a reminder or message was sent.
        Requires a confirmed facility outcome or an authorized supervisor closure reason.
        """
        referral = db.query(Referral).filter(Referral.id == referral_id).first()
        if not referral:
            raise ValueError(f"Referral {referral_id} not found")

        # Check closure rule
        if req.new_status == "Closed":
            is_supervisor = req.actor_role.lower() == "supervisor"
            has_supervisor_reason = bool(req.closure_reason and req.closure_reason.strip())
            has_facility_outcome = referral.facility_status in ["Attended", "Received"] or (
                req.facility_status in ["Attended", "Received"]
            )

            if not (has_facility_outcome or (is_supervisor and has_supervisor_reason)):
                raise ValueError(
                    "Cannot close case: A case is not complete because a reminder was sent. "
                    "Case closure strictly requires either a recorded facility outcome (e.g. Attended) "
                    "or an authorized Supervisor closure reason."
                )

            referral.status = "Closed"
            referral.closed_by = req.actor_name
            referral.closed_at = datetime.datetime.utcnow()
            referral.closure_reason = req.closure_reason or "Facility outcome confirmed"
        elif req.new_status:
            referral.status = req.new_status

        # Update other fields if supplied
        if req.barriers is not None:
            referral.barriers = req.barriers
        if req.barrier_notes is not None:
            referral.barrier_notes = req.barrier_notes
        if req.assigned_to_role is not None:
            referral.assigned_to_role = req.assigned_to_role
        if req.assigned_to_name is not None:
            referral.assigned_to_name = req.assigned_to_name
        if req.next_action is not None:
            referral.next_action = req.next_action
        if req.due_date is not None:
            referral.due_date = req.due_date
        if req.facility_status is not None:
            referral.facility_status = req.facility_status
            referral.facility_recorded_by = req.actor_name
            referral.facility_recorded_at = datetime.datetime.utcnow()

        referral.updated_at = datetime.datetime.utcnow()

        # Log event in append-only trail
        event = CaseEvent(
            referral_id=referral.id,
            actor_role=req.actor_role,
            actor_name=req.actor_name,
            action=req.action,
            note=req.note,
            timestamp=datetime.datetime.utcnow(),
            event_data=req.event_data,
        )
        db.add(event)
        db.commit()
        db.refresh(referral)
        return referral

    @staticmethod
    def facility_acknowledgement(
        db: Session,
        referral_id: str,
        facility_status: str,
        recorded_by: str,
        notes: Optional[str] = None,
    ) -> Referral:
        """Facility staff acknowledges referral and records reception or outcome."""
        referral = db.query(Referral).filter(Referral.id == referral_id).first()
        if not referral:
            raise ValueError(f"Referral {referral_id} not found")

        referral.facility_status = facility_status
        referral.facility_recorded_by = recorded_by
        referral.facility_recorded_at = datetime.datetime.utcnow()

        # Update case status based on facility action
        if facility_status in ["Attended"]:
            referral.status = "Outcome recorded"
            referral.next_action = "Supervisor review and case closure"
        elif facility_status in ["Received"]:
            referral.status = "Facility acknowledged"
            referral.next_action = "Awaiting clinical consultation"
        elif facility_status in ["Rescheduled"]:
            referral.status = "Rescheduled"
            referral.next_action = "Coordinate rescheduled appointment with family"
        elif facility_status in ["Not reached"]:
            referral.status = "Not reached"
            referral.next_action = "Frontline worker home visit to verify family status"
        elif facility_status in ["Wrong facility"]:
            referral.status = "Needs verification"
            referral.next_action = "Re-route referral to correct destination facility"

        referral.updated_at = datetime.datetime.utcnow()

        # Add event to audit trail
        event = CaseEvent(
            referral_id=referral.id,
            actor_role="Facility",
            actor_name=recorded_by,
            action=f"Facility Outcome: {facility_status}",
            note=notes or f"Facility recorded status: {facility_status}",
            timestamp=datetime.datetime.utcnow(),
            event_data={"facility_status": facility_status},
        )
        db.add(event)
        db.commit()
        db.refresh(referral)
        return referral

    @staticmethod
    def get_care_receipt_slip(db: Session, referral_id: str) -> Dict[str, Any]:
        """Generate non-sensitive Care Receipt slip data."""
        referral = db.query(Referral).filter(Referral.id == referral_id).first()
        if not referral:
            raise ValueError(f"Referral {referral_id} not found")

        child = db.query(Child).filter(Child.id == referral.child_id).first()

        return {
            "care_receipt_ref": referral.care_receipt_ref,
            "child_id": referral.child_id,
            "child_name": child.name if child else "Registered Child",
            "age_months": child.age_months if child else None,
            "destination_facility": referral.destination_facility,
            "visit_instruction": referral.visit_instruction or "Bring MCP card and visit during OPD hours (9 AM - 1 PM).",
            "date_issued": referral.date_issued.isoformat() if referral.date_issued else datetime.datetime.utcnow().isoformat(),
            "expiry_date": referral.expiry_date.isoformat() if referral.expiry_date else None,
            "priority": referral.priority,
            "contact_help_instruction": "For assistance or transport guidance, contact your local Anganwadi Worker or ASHA.",
            "notice": "This reference slip is a hand-off reference token, NOT proof of treatment and NOT a national ID.",
        }

