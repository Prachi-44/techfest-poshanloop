import re
import pytest
from fastapi.testclient import TestClient


def test_care_receipt_reference_format_and_no_pii(client: TestClient):
    payload = {
        "child_id": "CH-0007",
        "actor_role": "AWW",
        "actor_name": "Sunita Patil",
    }
    create_res = client.post("/api/referrals", json=payload, headers={"X-Demo-Role": "AWW"})
    assert create_res.status_code == 200
    ref = create_res.json()["care_receipt_ref"]

    # Match pattern PL-XXXXX (5 chars)
    assert re.match(r"^PL-[2-9A-HJ-NP-Z]{5}$", ref)

    # Verify no PII is embedded in the token
    assert "CH" not in ref
    assert "0007" not in ref
    assert "PATIL" not in ref


def test_care_receipt_slip_generation(client: TestClient):
    payload = {
        "child_id": "CH-0009",
        "destination_facility": "Nashik District Hospital NRC",
        "visit_instruction": "Bring MCP card.",
        "actor_role": "AWW",
        "actor_name": "Sunita Patil",
    }
    create_res = client.post("/api/referrals", json=payload, headers={"X-Demo-Role": "AWW"})
    case_id = create_res.json()["id"]

    slip_res = client.get(f"/api/referrals/{case_id}/care-receipt")
    assert slip_res.status_code == 200
    slip = slip_res.json()

    assert "care_receipt_ref" in slip
    assert slip["destination_facility"] == "Nashik District Hospital NRC"
    assert "hand-off reference token" in slip["notice"]


def test_facility_lookup_by_care_receipt_token(client: TestClient):
    payload = {
        "child_id": "CH-0010",
        "actor_role": "AWW",
        "actor_name": "Sunita Patil",
    }
    create_res = client.post("/api/referrals", json=payload, headers={"X-Demo-Role": "AWW"})
    ref = create_res.json()["care_receipt_ref"]

    lookup_res = client.get(f"/api/facility/lookup?ref={ref}")
    assert lookup_res.status_code == 200
    data = lookup_res.json()
    assert data["care_receipt_ref"] == ref
    assert data["child_id"] == "CH-0010"

