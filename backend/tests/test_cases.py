import pytest
from fastapi.testclient import TestClient


def test_full_case_lifecycle(client: TestClient):
    # 1. Open referral
    create_payload = {
        "child_id": "CH-0011",
        "destination_facility": "Panchavati Sub-District Hospital",
        "actor_role": "AWW",
        "actor_name": "Sunita Patil",
        "priority": "routine",
    }
    res1 = client.post("/api/referrals", json=create_payload, headers={"X-Demo-Role": "AWW"})
    assert res1.status_code == 200
    case_id = res1.json()["id"]
    ref_token = res1.json()["care_receipt_ref"]

    # 2. Worker contacts family and records barrier
    action1 = {
        "action": "Family Contacted & Barrier Assessed",
        "actor_role": "ASHA_ANM",
        "actor_name": "Kavita Shinde",
        "new_status": "Barrier support arranged",
        "barriers": ["transport_cost"],
        "barrier_notes": "Provided bus fare guidance from gram panchayat fund.",
    }
    res2 = client.post(f"/api/referrals/{case_id}/actions", json=action1)
    assert res2.status_code == 200

    # 3. Child referred with Care Receipt
    action2 = {
        "action": "Referral Issued",
        "actor_role": "ASHA_ANM",
        "actor_name": "Kavita Shinde",
        "new_status": "Referred",
        "note": f"Handed over Care Receipt {ref_token} to mother.",
    }
    res3 = client.post(f"/api/referrals/{case_id}/actions", json=action2)
    assert res3.status_code == 200

    # 4. Facility receives and acknowledges referral
    ack_res = client.post(
        "/api/facility/acknowledge",
        json={
            "care_receipt_ref": ref_token,
            "facility_status": "Received",
            "recorded_by": "Dr. Ramesh Deshmukh",
            "notes": "Patient registered at OPD desk.",
        },
        headers={"X-Demo-Role": "Facility"},
    )
    assert ack_res.status_code == 200

    # 5. Facility records attendance outcome
    attend_res = client.post(
        "/api/facility/acknowledge",
        json={
            "care_receipt_ref": ref_token,
            "facility_status": "Attended",
            "recorded_by": "Dr. Ramesh Deshmukh",
            "notes": "Examination completed; nutrition supplementation plan initiated.",
        },
        headers={"X-Demo-Role": "Facility"},
    )
    assert attend_res.status_code == 200
    assert attend_res.json()["case_status"] == "Outcome recorded"

    # 6. Verify chronological append-only timeline
    detail_res = client.get(f"/api/referrals/{case_id}")
    assert detail_res.status_code == 200
    events = detail_res.json()["events"]
    assert len(events) >= 5

    # 7. Final closure
    close_action = {
        "action": "Case Closed",
        "actor_role": "Supervisor",
        "actor_name": "Meena Kulkarni",
        "new_status": "Closed",
        "closure_reason": "Verified clinical outcome and continued AWC monitoring.",
    }
    close_res = client.post(f"/api/referrals/{case_id}/actions", json=close_action)
    assert close_res.status_code == 200
    assert close_res.json()["new_status"] == "Closed"

