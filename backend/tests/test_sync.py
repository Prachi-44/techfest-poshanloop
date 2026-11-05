import uuid
import datetime
import pytest
from fastapi.testclient import TestClient


def test_idempotent_sync_same_uuid_no_duplicate(client: TestClient):
    event_id = str(uuid.uuid4())
    event_payload = {
        "events": [
            {
                "id": event_id,
                "event_type": "contact_note",
                "event_data": {"note": "First offline visit attempt", "worker": "Sunita"},
                "device_created_at": datetime.datetime.utcnow().isoformat(),
            }
        ]
    }

    # Initial sync
    res1 = client.post("/api/sync/events", json=event_payload)
    assert res1.status_code == 200
    assert res1.json()["results"][0]["status"] == "synced"

    # Repeated sync attempt with same UUID and same data
    res2 = client.post("/api/sync/events", json=event_payload)
    assert res2.status_code == 200
    assert res2.json()["results"][0]["status"] == "synced"
    assert "Idempotent" in res2.json()["results"][0]["message"]


def test_sync_conflict_detection(client: TestClient):
    event_id = str(uuid.uuid4())
    device_time = datetime.datetime.utcnow().isoformat()

    # Device A syncs first payload
    client.post("/api/sync/events", json={
        "events": [
            {
                "id": event_id,
                "event_type": "contact_note",
                "event_data": {"note": "Device A: Family agreed to visit"},
                "device_created_at": device_time,
            }
        ]
    })

    # Device B attempts to sync different payload with the same event ID
    res_conflict = client.post("/api/sync/events", json={
        "events": [
            {
                "id": event_id,
                "event_type": "contact_note",
                "event_data": {"note": "Device B: Family requested home visit instead"},
                "device_created_at": device_time,
            }
        ]
    })
    assert res_conflict.status_code == 200
    assert res_conflict.json()["results"][0]["status"] == "conflict"


def test_sync_conflict_resolution(client: TestClient):
    # From seed, CH-0055 has an existing conflict event
    events_res = client.get("/api/sync/events?sync_status=conflict")
    assert events_res.status_code == 200
    conflicts = events_res.json()
    assert len(conflicts) > 0

    target_id = conflicts[0]["id"]
    resolve_res = client.post(
        f"/api/sync/events/{target_id}/resolve",
        json={"resolved_by": "Supervisor Meena", "resolution": "keep_server"},
    )
    assert resolve_res.status_code == 200
    assert resolve_res.json()["sync_status"] == "synced"

