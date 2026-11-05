import pytest
from fastapi.testclient import TestClient


def test_create_referral(client: TestClient):
    payload = {
        "child_id": "CH-0001",
        "destination_facility": "Nashik PHC",
        "priority": "routine",
        "actor_role": "AWW",
        "actor_name": "Sunita Patil",
        "barriers": ["travel_distance"],
        "barrier_notes": "Living 8km from primary health centre.",
    }
    response = client.post("/api/referrals", json=payload, headers={"X-Demo-Role": "AWW"})
    assert response.status_code == 200
    data = response.json()
    assert "care_receipt_ref" in data
    assert data["care_receipt_ref"].startswith("PL-")
    assert data["status"] == "New"
    assert "travel_distance" in data["barriers"]


def test_closure_validation_rejects_unauthorized_closure(client: TestClient):
    # Create referral first
    payload = {
        "child_id": "CH-0002",
        "actor_role": "AWW",
        "actor_name": "Sunita Patil",
    }
    create_res = client.post("/api/referrals", json=payload, headers={"X-Demo-Role": "AWW"})
    case_id = create_res.json()["id"]

    # Attempt to close case without facility outcome or supervisor reason
    action_payload = {
        "action": "Close Case",
        "actor_role": "AWW",
        "actor_name": "Sunita Patil",
        "new_status": "Closed",
        "note": "Sent SMS reminder to mother",
    }
    close_res = client.post(f"/api/referrals/{case_id}/actions", json=action_payload)
    assert close_res.status_code == 400
    assert "Cannot close case" in close_res.json()["detail"]


def test_closure_allowed_with_supervisor_reason(client: TestClient):
    payload = {
        "child_id": "CH-0003",
        "actor_role": "Supervisor",
        "actor_name": "Meena Kulkarni",
    }
    create_res = client.post("/api/referrals", json=payload, headers={"X-Demo-Role": "Supervisor"})
    case_id = create_res.json()["id"]

    action_payload = {
        "action": "Supervisor Review & Closure",
        "actor_role": "Supervisor",
        "actor_name": "Meena Kulkarni",
        "new_status": "Closed",
        "closure_reason": "Verified family received supplementary home ration and attended village health day.",
    }
    close_res = client.post(f"/api/referrals/{case_id}/actions", json=action_payload)
    assert close_res.status_code == 200
    assert close_res.json()["new_status"] == "Closed"


def test_closure_allowed_with_facility_attended_outcome(client: TestClient):
    payload = {
        "child_id": "CH-0004",
        "actor_role": "AWW",
        "actor_name": "Sunita Patil",
    }
    create_res = client.post("/api/referrals", json=payload, headers={"X-Demo-Role": "AWW"})
    case_id = create_res.json()["id"]

    # Facility records attendance
    facility_res = client.post(
        f"/api/referrals/{case_id}/facility-acknowledgement",
        json={"facility_status": "Attended", "recorded_by": "Dr. Deshmukh", "notes": "Child received checkup"},
        headers={"X-Demo-Role": "Facility"},
    )
    assert facility_res.status_code == 200

    # Now closure is permitted
    action_payload = {
        "action": "Final Closure",
        "actor_role": "AWW",
        "actor_name": "Sunita Patil",
        "new_status": "Closed",
    }
    close_res = client.post(f"/api/referrals/{case_id}/actions", json=action_payload)
    assert close_res.status_code == 200
    assert close_res.json()["new_status"] == "Closed"

