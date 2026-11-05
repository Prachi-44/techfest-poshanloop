from typing import Optional, List, Dict, Any
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.sync_event import SyncEvent
from app.models.referral import Referral
from app.models.case import CaseEvent
from app.schemas.sync_event import (
    SyncEventBatchRequest,
    SyncBatchResponse,
    SyncBatchResultItem,
    SyncEventResponse,
    SyncEventResolveRequest,
)

router = APIRouter(prefix="/sync", tags=["Offline Sync & Event Journal"])


@router.post("/events", response_model=SyncBatchResponse)
def sync_events(batch: SyncEventBatchRequest, db: Session = Depends(get_db)):
    """
    Synchronise a batch of offline events.
    Guarantees idempotency using unique event UUIDs:
    - If event UUID already exists with matching payload: returns 'synced' without duplicating.
    - If event UUID already exists with differing payload: flags as 'conflict' for human review.
    - If new: creates record, applies updates, and preserves device_created_at.
    """
    results: List[SyncBatchResultItem] = []
    now = datetime.datetime.utcnow()

    for item in batch.events:
        existing = db.query(SyncEvent).filter(SyncEvent.id == item.id).first()

        if existing:
            if existing.event_data == item.event_data:
                results.append(SyncBatchResultItem(
                    id=item.id,
                    status=existing.sync_status,
                    message="Idempotent: Event already saved with identical data",
                ))
            else:
                existing.sync_status = "conflict"
                existing.conflict_data = item.event_data
                results.append(SyncBatchResultItem(
                    id=item.id,
                    status="conflict",
                    message="Conflict: Server has different record for this event ID",
                ))
        else:
            new_event = SyncEvent(
                id=item.id,
                event_type=item.event_type,
                event_data=item.event_data,
                device_created_at=item.device_created_at,
                server_received_at=now,
                sync_status="synced",
            )
            db.add(new_event)

            # Apply domain update if applicable
            if item.event_type == "case_action":
                ref_id = item.event_data.get("referral_id")
                if ref_id:
                    ref = db.query(Referral).filter(Referral.id == ref_id).first()
                    if ref:
                        if item.event_data.get("new_status"):
                            ref.status = item.event_data["new_status"]
                        if item.event_data.get("next_action"):
                            ref.next_action = item.event_data["next_action"]
                        if item.event_data.get("barriers"):
                            ref.barriers = item.event_data["barriers"]

                        # Append audit event
                        c_ev = CaseEvent(
                            referral_id=ref.id,
                            actor_role=item.event_data.get("actor_role", "Offline Worker"),
                            actor_name=item.event_data.get("actor_name", "Field Device"),
                            action=item.event_data.get("action", "Offline Action"),
                            note=item.event_data.get("note", "Synced from offline journal"),
                            timestamp=item.device_created_at,
                            event_data=item.event_data,
                        )
                        db.add(c_ev)

            results.append(SyncBatchResultItem(
                id=item.id,
                status="synced",
                message="Successfully synchronized",
            ))

    db.commit()
    return SyncBatchResponse(results=results)


@router.get("/events")
def list_sync_events(
    sync_status: Optional[str] = Query(None, description="Filter by pending/synced/needs_review/conflict"),
    db: Session = Depends(get_db),
):
    """List sync journal events with status."""
    query = db.query(SyncEvent)
    if sync_status:
        query = query.filter(SyncEvent.sync_status == sync_status)
    events = query.order_by(SyncEvent.device_created_at.desc()).all()

    return [
        {
            "id": ev.id,
            "event_type": ev.event_type,
            "event_data": ev.event_data,
            "device_created_at": ev.device_created_at.isoformat() if ev.device_created_at else None,
            "server_received_at": ev.server_received_at.isoformat() if ev.server_received_at else None,
            "sync_status": ev.sync_status,
            "conflict_data": ev.conflict_data,
            "resolved_by": ev.resolved_by,
            "resolved_at": ev.resolved_at.isoformat() if ev.resolved_at else None,
        }
        for ev in events
    ]


@router.post("/events/{event_id}/resolve")
def resolve_sync_conflict(
    event_id: str,
    req: SyncEventResolveRequest,
    db: Session = Depends(get_db),
):
    """Authorised human conflict resolution for an offline sync event."""
    event = db.query(SyncEvent).filter(SyncEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail=f"Sync event {event_id} not found")

    if req.resolution == "keep_device":
        if event.conflict_data:
            event.event_data = event.conflict_data
        event.sync_status = "synced"
    elif req.resolution == "keep_server":
        event.sync_status = "synced"
    else:
        raise HTTPException(status_code=400, detail="Invalid resolution choice: must be 'keep_server' or 'keep_device'")

    event.conflict_data = None
    event.resolved_by = req.resolved_by
    event.resolved_at = datetime.datetime.utcnow()
    db.commit()

    return {"status": "success", "event_id": event.id, "sync_status": event.sync_status}

