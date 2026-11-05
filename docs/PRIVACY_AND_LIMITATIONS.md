# POSHANLOOP — Privacy, Safety and Limitations

> **Version:** 1.0.0 (Prototype)  
> **Status:** Local prototype — not production software  
> **This document describes design intentions, not certified compliance.**

---

## 1. Purpose Statement

POSHANLOOP is a **prototype** demonstration of an operational continuity workflow for maternal and early-childhood nutrition follow-up. It is built for the India @ 71/100 Challenge as a design contribution, not as production-deployed software.

---

## 2. Data Privacy

### 2.1 Synthetic Data Only

- All child records, guardian names, measurements, and case data in this prototype are **entirely fictional**
- No real child, caregiver, or government beneficiary data is used at any point
- Synthetic data does not represent real prevalence rates, clinical outcomes, or population statistics
- The dataset is clearly labelled as synthetic in the application and documentation

### 2.2 No Government System Integration

This prototype does **not**:
- ❌ Connect to Poshan Tracker or any government API
- ❌ Use Aadhaar numbers or biometric data
- ❌ Use ABHA (Ayushman Bharat Health Account) identifiers
- ❌ Ingest personal health records from any external system
- ❌ Send real SMS messages or notifications
- ❌ Require any paid cloud service or external API

### 2.3 Minimum Data Collection (Design Principle)

The prototype is designed with data minimisation in mind:
- Child records use neutral IDs (CH-0001 format) rather than government IDs
- Care Receipt references (PL-XXXXX) are randomly generated and do not encode any personal information (no name, birth date, phone number, or health condition)
- Barrier notes are designed for operational details, not clinical records
- The Cause Finder checklist uses pre-approved, non-diagnostic questions only

### 2.4 Data Separation (Design Principle)

- Identifying information (names, locations) is kept separate from workflow analytics
- Maps and coverage grids show **aggregate centre/area-level** counts only
- No child's name, phone number, or home location appears on any map or public view
- Role-based data masking limits what each user type can see

### 2.5 DPDP Act Compliance

> **Important:** This prototype does **not** claim compliance with the Digital Personal Data Protection Act, 2023 or any other privacy legislation. The privacy controls described here are **prototype design measures** that would require:
> - Independent legal review
> - Data Protection Impact Assessment
> - Consent mechanism design
> - Data Processing Agreement review
> - Appointment of a Data Protection Officer
> - Regular compliance audits
>
> before any deployment with real personal data.

---

## 3. Clinical Safety

### 3.1 Not a Diagnostic Tool

POSHANLOOP is an **operational workflow system**, not a clinical decision support system.

- **Trust Gate** flags are data quality checks (missing fields, duplicates, unusual changes), not clinical diagnoses
- **BlindSpot** identifies coverage gaps (missing data), not health status
- **Cause Finder** guides a supportive conversation, not a medical assessment
- **Referral priority** is for workflow ordering only and must never deny a service

### 3.2 Clear Boundaries

The application includes explicit notices:
- "This is not a diagnosis or treatment recommendation"
- "Clinical care decisions belong to qualified health professionals"
- "Missing data does not mean healthy — it means we need to check"
- Workflow flags are clearly distinguished from clinical diagnoses

### 3.3 What POSHANLOOP Does NOT Do

- ❌ Recommend medicines, dosages, or emergency treatment
- ❌ Make clinical decisions
- ❌ Calculate clinical risk scores (no WHO LMS z-scores, no composite risk indices)
- ❌ Set hard-coded clinical SLAs (no "48-hour" or "7-day" clinical deadlines)
- ❌ Override frontline worker judgement
- ❌ Replace qualified health professional assessment

### 3.4 What POSHANLOOP DOES Do

- ✅ Check if measurement data looks complete and consistent
- ✅ Track whether follow-up actions have been confirmed
- ✅ Record family barriers to accessing services
- ✅ Provide a simple referral hand-off mechanism
- ✅ Work offline and sync safely
- ✅ Maintain an audit trail of actions taken

---

## 4. Security (Prototype Status)

| Area | Current Status | Production Requirement |
|------|---------------|----------------------|
| Authentication | Demo role header (X-Demo-Role) | OAuth2 / Government SSO |
| Authorization | Role-checked in API routes | Full RBAC with audit |
| Transport encryption | None (localhost only) | TLS 1.3 minimum |
| Data-at-rest encryption | None (SQLite file) | AES-256 encryption |
| Audit logging | Append-only case events | Tamper-proof centralised logging |
| Session management | None (stateless demo) | Secure session with timeout |
| Input validation | Pydantic schema validation | Additional WAF rules |
| Network isolation | Local only | Government network / VPN |

> The demo role switcher is clearly labelled as a prototype feature. In production, authentication would use government SSO or equivalent secure authentication.

---

## 5. Honesty and Claims

### 5.1 What We Claim

- This is a **working local prototype** demonstrating an operational continuity workflow
- The technology choices (React, FastAPI, SQLAlchemy) are compatible with production scaling
- The workflow design addresses a real gap between flagging and confirmed follow-up
- The synthetic data demonstrates realistic operational scenarios

### 5.2 What We Do NOT Claim

- ❌ Production deployment readiness
- ❌ Government API integration
- ❌ DPDP Act compliance certification
- ❌ Measured impact on health outcomes
- ❌ Clinical accuracy or medical device status
- ❌ That every individual component is globally novel

### 5.3 Pilot Targets (Proposed, Not Measured)

Any targets mentioned in the demo are **proposed pilot targets**, not measured outcomes. Actual impact would need to be assessed through a properly designed pilot study with ethical review.

---

## 6. Accessibility

The prototype implements:
- Minimum 14px text size for interface elements
- Keyboard navigation and visible focus indicators
- Semantic HTML elements (nav, main, section, table, button)
- ARIA labels for interactive elements
- Sufficient colour contrast (WCAG AA target)
- Responsive layout for tablet and desktop
- System font stack for readability

### Language

- English labels are provided first
- Layout is designed to accommodate Marathi translation in future
- No right-to-left layout requirements identified currently

---

## 7. Limitations Summary

| Limitation | Description |
|-----------|-------------|
| Data | Synthetic only — no real beneficiary data |
| Authentication | Demo role switching, not secure authentication |
| Encryption | No transport or at-rest encryption |
| Scale | SQLite single-user database |
| Offline | IndexedDB in single browser only |
| Messaging | Message preview only — no actual SMS/notification delivery |
| Maps | Aggregate grid only — no geographic mapping service |
| Language | English only in this version |
| Testing | Functional tests only — no load, security, or penetration testing |
| Compliance | No privacy certification or legal review completed |

---

## 8. Responsible Use

This prototype is intended for:
- ✅ Demonstrating the operational continuity workflow concept
- ✅ Gathering feedback on the user interface and workflow design
- ✅ Technical evaluation of the architecture

This prototype is **NOT** intended for:
- ❌ Use with real beneficiary data
- ❌ Clinical decision-making
- ❌ Production deployment without further development, security review, and legal compliance
- ❌ Replacement of existing government systems or professional judgement

---

*This document should be reviewed and updated by qualified legal and security professionals before any deployment beyond local demonstration.*

