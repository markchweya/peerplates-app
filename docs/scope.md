# PeerPlates – MVP Scope

## 1. Purpose
PeerPlates is a peer-to-peer food platform.  
This MVP validates demand by running a **waitlist** for:
- **Consumers** (who can move up via referrals)
- **Vendors** (who are reviewed and queued manually + by priority score)

The goal is to validate interest **before building the full marketplace**.

---

## 2. Target Users
### Consumers
- People who buy prepared food regularly
- Incentivized to refer friends to move up the queue

### Vendors
- Independent food vendors / kitchens
- Reviewed via questionnaire
- Onboarded in priority order

---

## 3. User Flows (MVP)

### Landing
- User lands on homepage
- Chooses:
  - “I’m a Consumer” → `/join/consumer`
  - “I’m a Vendor” → `/join/vendor`
- Optional fallback: `/join` role selector

### Consumer Flow
1. Consumer completes questionnaire
2. Record saved to database
3. Unique referral code generated
4. User sees:
   - Confirmation
   - Referral link
   - Queue position
5. Referrals increase consumer’s priority

### Vendor Flow
1. Vendor completes questionnaire
2. Record saved to database
3. Vendor assigned a **priority score**
4. Admin can manually adjust onboarding order

---

## 4. Consumer Questionnaire (Final)

**Required**
1. Full name
2. Email
3. Location
4. How often do you buy prepared food?
5. What do you care about most?

**Optional**
6. Phone number
7. Typical budget per meal
8. Dietary preferences
9. What would make you invite friends?

---

## 5. Vendor Questionnaire (Final)

**Required**
1. Full name
2. Email
3. Business / brand name
4. Location / serving area
5. Type of food sold
6. Daily order capacity
7. Delivery availability
8. Food handling / hygiene compliance

**Optional**
9. Phone number
10. Instagram / website / photos link
11. Price range per meal
12. Additional notes

---

## 6. Vendor Priority Scoring

Vendors do **not** move via referrals.  
They are ranked by a **priority score (0–10)**.

### Scoring Breakdown
- **Daily capacity (0–3)**
- **Delivery availability (0–2)**
- **Hygiene/compliance (0–3)**
- **Professionalism (0–2)**  
  (clear food description + link/photos)

Higher score = earlier onboarding.

Admin can override ranking manually.

---

## 7. Referral Logic (Consumers Only)

- Each consumer gets a unique referral code
- Referrals increase consumer priority
- Queue reorders automatically based on referral count / points
- Vendors may have referral links, but referrals do **not** affect vendor order

---

## 8. Admin Dashboard (MVP)

Admin can:
- View all submissions
- Filter by Consumer / Vendor
- View questionnaire answers
- Export data (CSV)
- Adjust vendor onboarding order manually

---

## 9. Success Metrics (Validation Criteria)

The MVP is considered **validated** if:

- **150 consumers + 40 vendors** join within **14 days**
- At least **20 consumers** successfully refer ≥ 1 person

If these metrics are hit, the full product build proceeds.

---

## 10. Out of Scope (Explicitly)

The following are **not part of the MVP**:
- Payments
- In-app ordering
- Messaging
- Reviews
- Vendor payouts
- Consumer accounts / login
- Mobile apps

---

## 11. Current Project Status

- TJ‑001 (Scope + Questions): ✅ Completed
- TJ‑002 (Landing + Role Selection): ✅ Completed
- TJ‑003 (Forms + Data Capture): 🟡 In progress
- TJ‑004 (Admin Dashboard): ❌ Not started
- TJ‑005 (Referrals + Queue Logic): ❌ Not started
- TJ‑006 (Mailchimp + Deploy): ❌ Not started
