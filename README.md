# AVERIQ — Advanced Verification and Emergency Response IQ

AI-Powered Emergency Response, GPS Reliability Verification & Ambulance Allocation Control-Room Dashboard Prototype (K! Hacks 4.0 — Team FOREX).

> **Note:** `SIMULATION MODE – DEMONSTRATION DATA` — This prototype runs entirely on frontend mock data and deterministic rule-based simulations without external APIs, databases, or real GPS/hospital feeds.

## Project Structure

- `averiq/` — React + TypeScript + Vite + Tailwind CSS interactive control-room dashboard prototype
- `AVERIQ.pdf` / `Khacks_4.0_ppt.pptx` — Final hackathon presentation deck

## Running the Prototype Locally

```bash
cd averiq
npm install
npm run dev
```

To build for production:

```bash
cd averiq
npm run build
npm run preview
```

## Core Capabilities Demonstrated

1. **Overview Command Center**: Live KPI metrics, Chennai Metro EMS tactical SVG map with GPS drift vectors, emergency priority distribution chart, fleet status, and telemetry alerts.
2. **Emergency Management (3-Agent Pipeline)**:
   - **Agent 01 — Emergency Assessment Agent**: Clinical severity scoring & priority classification (`Critical`, `High`, `Medium`, `Low`).
   - **Agent 02 — Smart Ambulance Allocation Agent**: GPS Trust Score verification, anomaly quarantine (`AMB-108-03` coordinate drift & `AMB-108-07` stale telemetry), vehicle suitability matching, and traffic-aware ETA prediction.
   - **Agent 03 — Hospital Coordination Agent**: ICU availability, bed capacity, and specialized trauma/cardiac center matching.
3. **Human-Supervised Dispatcher Controls**: `Approve Assignment` and `Override Assignment` workflows.
4. **Multi-Emergency Optimisation (`Simulate Second Emergency`)**: Detects competing unit demand and assigns conflict-free fallback units.
5. **Automatic Reassignment (`Simulate Ambulance Delay`)**: Dynamically re-runs Agent 02 when an assigned unit is delayed, requiring dispatcher approval before confirmation.
6. **Dedicated Monitoring Views**: `Ambulance Fleet`, `Hospital Network`, `AI Agent Monitoring`, `Dispatch History`, and `System Alerts`.
