"""
BlindSpot Service - calculates coverage visibility without confusing missing data with healthy results.

Divides children into:
1. Confirmed concern: Explicitly flagged by authorized input / referral / critical trust flag
2. Unknown / overdue: No valid recent measurement within expected schedule (e.g. 30 days)
3. Up to date: Valid measurement within 30 days and no current concern
"""
import datetime
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.child import Block, Centre, Child
from app.models.measurement import Measurement
from app.models.trust_gate import TrustGateFlag
from app.models.referral import Referral
from app.config import TRUST_GATE_CONFIG


class BlindspotService:
    @staticmethod
    def get_child_coverage_status(db: Session, child: Child) -> Dict[str, Any]:
        """Determine coverage status for an individual child."""
        now = datetime.datetime.utcnow()
        schedule_days = TRUST_GATE_CONFIG["MEASUREMENT_SCHEDULE_DAYS"]["value"]

        # 1. Check for confirmed concern: active referral with high priority or unresolved critical flags
        active_concern = db.query(Referral).filter(
            Referral.child_id == child.id,
            Referral.status.notin_(["Closed", "Cancelled"])
        ).first()

        critical_flag = db.query(TrustGateFlag).filter(
            TrustGateFlag.child_id == child.id,
            TrustGateFlag.status.in_(["Needs review", "Re-measurement requested"]),
            TrustGateFlag.severity.in_(["critical", "warning"])
        ).first()

        # 2. Get latest valid measurement
        latest_measurement = db.query(Measurement).filter(
            Measurement.child_id == child.id,
            Measurement.is_corrected == False,
            Measurement.measurement_date.isnot(None)
        ).order_by(Measurement.measurement_date.desc()).first()

        if active_concern or critical_flag:
            status = "Confirmed concern"
        elif not latest_measurement:
            status = "Unknown / overdue"
        else:
            days_since = (now - latest_measurement.measurement_date).days
            if days_since > schedule_days:
                status = "Unknown / overdue"
            else:
                status = "Up to date"

        days_since = None
        last_date = None
        if latest_measurement and latest_measurement.measurement_date:
            days_since = (now - latest_measurement.measurement_date).days
            last_date = latest_measurement.measurement_date.isoformat()

        return {
            "child_id": child.id,
            "child_name": child.name,
            "centre_id": child.centre_id,
            "age_months": child.age_months,
            "gender": child.gender,
            "status": status,
            "days_since_last_measurement": days_since,
            "last_measurement_date": last_date,
        }

    @staticmethod
    def get_coverage(
        db: Session,
        block_id: Optional[str] = None,
        age_band: Optional[str] = None,
        status_filter: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Aggregate coverage data across centres and blocks."""
        now = datetime.datetime.utcnow()
        centres_query = db.query(Centre)
        if block_id:
            centres_query = centres_query.filter(Centre.block_id == block_id)
        centres = centres_query.all()

        centres_data = []
        total_up_to_date = 0
        total_unknown_overdue = 0
        total_confirmed_concern = 0
        total_children_count = 0

        for centre in centres:
            children_query = db.query(Child).filter(
                Child.centre_id == centre.id,
                Child.status == "active"
            )

            # Age band filtering
            if age_band:
                if age_band == "0-6m":
                    children_query = children_query.filter(Child.age_months <= 6)
                elif age_band == "6-12m":
                    children_query = children_query.filter(Child.age_months > 6, Child.age_months <= 12)
                elif age_band == "12-24m":
                    children_query = children_query.filter(Child.age_months > 12, Child.age_months <= 24)
                elif age_band == "24-60m":
                    children_query = children_query.filter(Child.age_months > 24, Child.age_months <= 60)

            children = children_query.all()
            centre_total = len(children)
            c_up_to_date = 0
            c_unknown = 0
            c_concern = 0
            oldest_overdue_days = 0

            for ch in children:
                stat = BlindspotService.get_child_coverage_status(db, ch)
                s = stat["status"]
                if s == "Confirmed concern":
                    c_concern += 1
                elif s == "Unknown / overdue":
                    c_unknown += 1
                    days = stat["days_since_last_measurement"]
                    if days and days > oldest_overdue_days:
                        oldest_overdue_days = days
                    elif days is None and oldest_overdue_days < 60:
                        oldest_overdue_days = 60
                else:
                    c_up_to_date += 1

            if status_filter:
                if status_filter == "Confirmed concern" and c_concern == 0:
                    continue
                elif status_filter == "Unknown / overdue" and c_unknown == 0:
                    continue
                elif status_filter == "Up to date" and c_up_to_date == 0:
                    continue

            total_children_count += centre_total
            total_up_to_date += c_up_to_date
            total_unknown_overdue += c_unknown
            total_confirmed_concern += c_concern

            block = db.query(Block).filter(Block.id == centre.block_id).first()

            centres_data.append({
                "centre_id": centre.id,
                "centre_name": centre.name,
                "block_id": centre.block_id,
                "block_name": block.name if block else "",
                "district": block.district if block else "",
                "total_children": centre_total,
                "up_to_date": c_up_to_date,
                "unknown_overdue": c_unknown,
                "confirmed_concern": c_concern,
                "days_since_oldest_overdue": oldest_overdue_days,
                "coverage_pct": round((c_up_to_date / centre_total * 100), 1) if centre_total > 0 else 0,
            })

        return {
            "summary": {
                "total_children": total_children_count,
                "up_to_date": total_up_to_date,
                "unknown_overdue": total_unknown_overdue,
                "confirmed_concern": total_confirmed_concern,
                "coverage_rate_pct": round((total_up_to_date / total_children_count * 100), 1) if total_children_count > 0 else 0,
            },
            "legend": {
                "up_to_date": "Recent measurement on record (within 30 days) and no current flags.",
                "unknown_overdue": "No valid measurement in the last 30 days. Missing data is NOT healthy data.",
                "confirmed_concern": "Explicitly flagged by authorized staff, critical flag, or active concern.",
            },
            "centres": centres_data,
        }

