# POSHANLOOP — Demo Script

> **Duration:** 3 minutes  
> **Prerequisites:** Backend and frontend running locally  
> **Audience:** Technical evaluators, India @ 71/100 Challenge judges

---

## Setup

1. Start the application using the launcher script or manual commands (see README)
2. Open `http://localhost:5173` in a modern browser
3. The demo role switcher is at the top of the screen

---

## Demo Walkthrough (3 Minutes)

### Scene 1: Trust Gate — Spot a Doubtful Entry (30 seconds)

1. **Role:** Switch to **AWW (Anganwadi Worker)**
2. Navigate to **Trust Gate** from the sidebar
3. Show the flag list — point out child **CH-0005** with a "Duplicate Entry" flag and **CH-0008** with "Missing Unit"
4. Click on the CH-0008 flag — show the detail:
   - Rule: `MISSING_UNIT`
   - Source field: `unit`
   - Original value: *(empty)*
   - Recommended action: "Verify entry and add unit of measurement"
5. Click **"Correct Value"** — enter `kg` as the unit, add reason "Unit was not recorded at time of entry"
6. Show that the **original record is preserved** and a new corrected record is linked

> **Key point:** "Trust Gate checks data quality — missing fields, duplicates, unusual changes. It never makes a clinical diagnosis. The original record is never overwritten."

---

### Scene 2: BlindSpot — Find Unknown/Overdue Coverage (30 seconds)

1. **Role:** Switch to **Supervisor**
2. Navigate to **BlindSpot Coverage**
3. Show the coverage grid — point out centres with amber (Unknown/Overdue) status
4. Read the legend:
   - 🟢 **Up to date** — recent measurement recorded
   - 🟡 **Unknown/Overdue** — no valid recent measurement on file
   - 🔴 **Confirmed concern** — explicitly flagged by authorised input
5. Click on a centre with overdue records — show the count and days since last measurement
6. Point out: "These amber records are not healthy or unhealthy — they are **unknown**. We need to check."

> **Key point:** "Missing data is never assumed to be healthy. BlindSpot separates what we know from what we don't."

---

### Scene 3: Referral — Record a Family Barrier (30 seconds)

1. **Role:** Switch to **ASHA / ANM**
2. Navigate to **Referral Worklist**
3. Open the referral for **CH-0030** (travel barrier scenario)
4. Show the barrier checklist — "Travel distance" is checked, with a note about distance to facility
5. Click **"Add Barrier"** — check "No accompanying adult" and add a note
6. Click **"Arrange Support"** — assign to AWW with a due date and next action: "Coordinate with supervisor for transport support"
7. Show the event timeline updating with each action

> **Key point:** "We record WHY a family can't complete a referral, and WHO will help next. The barrier is connected to a named next owner."

---

### Scene 4: Care Receipt — Generate the Hand-Off Token (20 seconds)

1. Still on the CH-0030 case detail
2. Click **"Generate Care Receipt"**
3. Show the printable slip:
   - Reference: **PL-XXXXX** (random, non-identifying)
   - Destination facility
   - Visit instruction
   - Date issued
   - Help contact
4. Point out: "This reference does not encode the child's name, birth date, or condition. It's a simple hand-off token."
5. Show the message preview — clearly marked "Preview — Message not sent"

> **Key point:** "The Care Receipt is a simple reference the family can take to the facility. No sensitive health details in plain text."

---

### Scene 5: Offline Mode — Save and Sync (30 seconds)

1. Navigate to **Offline Queue**
2. Click **"Simulate Offline"** — show the connection indicator turn red
3. Navigate to **Referral Worklist** — open any case
4. Add an action: "Contact attempted — family not available"
5. Show the toast/notification: "Saved offline — will sync when connected"
6. Return to **Offline Queue** — show the pending event with:
   - Device-created time
   - Status: "Pending sync"
   - UUID/idempotency key
7. Click **"Go Online"** — connection indicator turns green
8. Click **"Sync Now"** — show the event status change to "Synced"
9. Point out the sync conflict entry for **CH-0055** — show both versions side by side

> **Key point:** "Events are saved with a UUID. Retrying sync never creates duplicates. Conflicts show both versions and require human resolution."

---

### Scene 6: Facility Acknowledgement (30 seconds)

1. **Role:** Switch to **Facility**
2. Navigate to **Facility Desk**
3. Enter the Care Receipt reference from Scene 4 (e.g., PL-7K4M2)
4. Show the matching referral details
5. Click **"Attended"** — record the outcome: "Child attended, referred to paediatrician for follow-up"
6. Show the status update: Facility acknowledged → Outcome recorded

> **Key point:** "The facility confirms with the same reference the family brought. The case isn't closed until the receiving side records what happened."

---

### Scene 7: Closed-Loop — Show the Ledger (30 seconds)

1. **Role:** Switch to **Supervisor**
2. Navigate to the case from earlier (or open the **Supervisor View** and find it)
3. Show the complete event timeline:
   - Case created
   - Barrier recorded
   - Support arranged
   - Care Receipt generated
   - Offline event synced
   - Facility acknowledged
   - Outcome recorded
4. Click **"Close Case"** — show that closure is only allowed because the facility outcome is recorded
5. Show the closed case with full audit trail

> **Key point:** "A case cannot be closed because a reminder was sent. It closes only after the receiving side confirms the outcome — or a supervisor provides a documented reason."

---

## Summary Statement (10 seconds)

> "POSHANLOOP doesn't replace Poshan Tracker or clinical judgement. It addresses the gap between a child being flagged and the next step being **confirmed**. Every feature connects: data quality feeds into coverage visibility, which feeds into referrals with barrier tracking, which hand off with a simple token, which works offline, and which closes only when the outcome is verified. That connected, low-burden workflow is the contribution."

---

## Seeded Scenarios Checklist

| Scenario | Child ID | Where to Find |
|----------|----------|---------------|
| Duplicate measurement | CH-0005 | Trust Gate |
| Missing unit | CH-0008 | Trust Gate |
| Missing date | CH-0012 | Trust Gate |
| Repeated identical values | CH-0015 | Trust Gate |
| Large value change | CH-0020 | Trust Gate |
| No recent measurement (overdue) | CH-0025 | BlindSpot |
| Travel barrier referral | CH-0030 | Referral Worklist |
| No accompanying adult | CH-0035 | Referral Worklist |
| Awaiting facility acknowledgement | CH-0040 | Referral Worklist |
| Attended referral | CH-0042 | Referral Worklist |
| Rescheduled referral | CH-0045 | Referral Worklist |
| Not reached | CH-0048 | Referral Worklist |
| Offline pending event | CH-0050 | Offline Queue |
| Sync conflict | CH-0055 | Offline Queue |

