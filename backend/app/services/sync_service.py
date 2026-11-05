"""
Sync Service - offline event synchronisation with idempotency and conflict detection.

Ensures field updates made without connectivity are safely synced.
Duplicate sync retries do not create duplicate events. Conflicts are flagged for human resolution.
"""
import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.sync_event import SyncEvent
from app.models.referral import Referral
from app.models.case import CaseEvent
from app.schemas.sync_event import SyncEventBatchRequest, SyncEventResponse, SyncEventResolveRequest


class SyncService:
    @staticmethod
    def process_batch(db: Session, batch: SyncEventBatchRequest) -> List[Dict[str, Any]]:
        results = []
        now = datetime.datetime.utcnow()

        for item in batch.events:
            event_id = item.id
            existing = db.query(SyncEvent).filter(SyncEvent.id == event_id).first()

            if existing:
                # Check for conflict: same ID, different payload
                if existing.event_data == item.event_data:
                    # Idempotent retry: already safely recorded
                    results.append({
                        "id": event_id,
                        "status": existing.sync_status,
                        "message": "Idempotent: Event already recorded with identical data",
                        "server_received_at": existing.server_received_at.isoformat() if existing.server_received_at else None,
                    })
                else:
                    # Conflict detected: same ID, different payload
                    existing.sync_status = "conflict"
                    existing.conflict_data = item.event_data
                    db.flush()
                    results.append({
                        "id": event_id,
                        "status": "conflict",
                        "message": "Conflict detected: Event with this ID already exists with different data",
                        "conflict_data": existing.event_data,
                    })
            else:
                # New event
                sync_event = SyncEvent(
                    id=event_id,
                    event_type=item.event_type,
                    event_data=item.event_data,
                    device_created_at=item.device_created_at,
                    server_received_at=now,
                    sync_status="synced",
                )
                db.add(sync_event)

                # Apply event effect if applicable
                SyncService._apply_event_effect(db, item.event_type, item.event_data, item.device_created_at)

                results.append({
                    "id": event_id,
                    "status": "synced",
                    "message": "Successfully synchronized",
                    "server_received_at": now.isoformat(),
                })

        db.commit()
        return results

    @staticmethod
    def _apply_event_effect(db: Session, event_type: str, data: Dict[str, Any], device_time: datetime.datetime):
        """Applies offline events to main relational tables if recognized."""
        if event_type == "case_action":
            referral_id = data.get("referral_id")
            if referral_id:
                referral = db.query(Referral).filter(Referral.id == referral_id).first()
                if referral:
                    if data.get("new_status"):
                        referral.status = data["new_status"]
                    if data.get("barriers"):
                        referral.barriers = data["barriers"]
                    if data.get("next_action"):
                        referral.next_action = data["next_action"]

                    # Log audit event
                    event = CaseEvent(
                        referral_id=referral.id,
                        actor_role=data.get("actor_role", "Offline Worker"),
                        actor_name=data.get("actor_name", "Field Device"),
                        action=data.get("action", "Offline Field Action"),
                        note=data.get("note", "Synced from offline journal"),
                        timestamp=device_time,
                        event_data=data,
                    )
                    db.add(event)

    @staticmethod
    def list_events(db: Session, status: Optional[str] = None) -> List[SyncEvent]:
        query = db.query(SyncEvent)
        if status:
            query = query.filter(SyncEvent.sync_status == status)
        return query.order_by(SyncEvent.device_created_at.desc()).all()

    @staticmethod
    def resolve_conflict(db: Session, event_id: str, resolution: SyncEventResolveRequest) -> SyncEvent:
        event = db.query(SyncEvent).filter(SyncEvent.id == event_id).first()
        if not event:
            raise ValueError(f"Sync event {event_id} not found")

        if resolution.resolution == "keep_device":
            event.event_data = event.conflict_data or event.event_data
            event.sync_status = "synced"
        elif resolution.resolution == "keep_server":
            # keep existing event_data
            event.sync_status = "synced"

        event.conflict_data = None
        event.resolved_by = resolution.resolved_by
        event.resolved_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(event)
        return event
