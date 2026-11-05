"""
Overview Service - dashboard aggregates and recent activity.
"""
import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.child import Child
from app.models.measurement import Measurement
from app.models.trust_gate import TrustGateFlag
from app.models.referral import Referral
from app.models.case import CaseEvent
from app.config import TRUST_GATE_CONFIG


class OverviewService:
    @staticmethod
    def get_overview(db: Session) -> Dict[str, Any]:
        now = datetime.datetime.utcnow()
        schedule_days = TRUST_GATE_CONFIG["MEASUREMENT_SCHEDULE_DAYS"]["value"]
        cutoff_date = now - datetime.timedelta(days=schedule_days)

        # 1. Total active children
        total_children = db.query(Child).filter(Child.status == "active").count()

        # 2. Trust Gate flags needing review
        trust_gate_flags = db.query(TrustGateFlag).filter(
            TrustGateFlag.status.in_(["Needs review", "Re-measurement requested"])
        ).count()

        # 3. Open referrals
        open_referrals = db.query(Referral).filter(
            Referral.status.notin_(["Closed", "Cancelled"])
        ).count()

        # 4. Overdue referrals (due_date in past, still open)
        overdue_cases = db.query(Referral).filter(
            Referral.status.notin_(["Closed", "Cancelled"]),
            Referral.due_date < now
        ).count()

        # 5. Confirmed outcomes (Outcome recorded or Closed)
        confirmed_outcomes = db.query(Referral).filter(
            Referral.status.in_(["Outcome recorded", "Closed"])
        ).count()

        # 6. Unknown / Overdue measurements: children without valid measurement in last 30 days
        all_children = db.query(Child).filter(Child.status == "active").all()
        unknown_overdue = 0
        records_due = 0

        for child in all_children:
            latest_m = db.query(Measurement).filter(
                Measurement.child_id == child.id,
                Measurement.is_corrected == False,
                Measurement.measurement_date.isnot(None)
            ).order_by(Measurement.measurement_date.desc()).first()

            if not latest_m:
                unknown_overdue += 1
                records_due += 1
            else:
                days_since = (now - latest_m.measurement_date).days
                if days_since > schedule_days:
                    unknown_overdue += 1
                    records_due += 1
                elif days_since > (schedule_days - 7):
                    # within 7 days of due date
                    records_due += 1

        # 7. Recent activity list
        recent_activity: List[Dict[str, Any]] = []

        # From CaseEvent
        recent_events = db.query(CaseEvent).order_by(CaseEvent.timestamp.desc()).limit(7).all()
        for ev in recent_events:
            ref = db.query(Referral).filter(Referral.id == ev.referral_id).first()
            recent_activity.append({
                "timestamp": ev.timestamp.isoformat() if ev.timestamp else None,
                "type": "case_event",
                "description": f"{ev.action}: {ev.note or 'Status updated'}",
                "actor": f"{ev.actor_name} ({ev.actor_role})",
                "child_id": ref.child_id if ref else None,
            })

        # From TrustGateFlag
        recent_flags = db.query(TrustGateFlag).order_by(TrustGateFlag.created_at.desc()).limit(3).all()
        for fl in recent_flags:
            recent_activity.append({
                "timestamp": fl.created_at.isoformat() if fl.created_at else None,
                "type": "flag",
                "description": f"Trust Gate alert: {fl.rule_code} ({fl.severity})",
                "actor": "Trust Gate Automated Rule",
                "child_id": fl.child_id,
            })

        # Sort combined recent activity
        recent_activity.sort(key=lambda x: x["timestamp"] or "", reverse=True)
        recent_activity = recent_activity[:10]

        return {
            "total_children": total_children,
            "records_due": records_due,
            "trust_gate_flags": trust_gate_flags,
            "unknown_overdue": unknown_overdue,
            "open_referrals": open_referrals,
            "overdue_cases": overdue_cases,
            "confirmed_outcomes": confirmed_outcomes,
            "recent_activity": recent_activity,
        }

