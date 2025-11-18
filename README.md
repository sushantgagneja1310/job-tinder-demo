# 🛡️ Job Tinder: The AI-Powered Career Guardian

## 📖 The Problem
The modern hiring process is a **Black Box**. 
1.  **ATS Obscurity:** Candidates are rejected by robots without knowing why.
2.  **Hidden Toxicity:** Job descriptions hide "hustle culture" red flags under buzzwords like "fast-paced."
3.  **Data asymmetry:** Candidates rarely know if a salary offer is fair until the very end.

## 💡 The Solution: Job Tinder
We didn't just build a job board. We built a **Neural Matching Interface** that acts as a candidate's bodyguard. 

Instead of opaque lists, we use a **physics-based card interface** that:
* **Visualizes the "Why":** A radar chart breaks down your fit by Tech, Culture, and Pay.
* **Intercepts Bad Decisions:** Our "Toxic Interceptor" physically prevents users from applying to roles with high burnout risk.
* **Benchmarks Salary:** Real-time evaluation of offers against market standards (Underpaid vs. Top 1%).

---

## 🚀 Key Technical Features

### 1. The "Neural" Interface (Canvas API)
A living, breathing background simulation built with HTML5 Canvas. It represents the matching algorithm forming connections in real-time, creating an immersive "Cyberpunk/Glassmorphism" aesthetic that keeps users engaged.

### 2. Toxicity Detection Engine (NLP Heuristics)
We implemented a client-side NLP (Natural Language Processing) engine that scans job descriptions for semantic patterns.
* **Red Flags:** "Rockstar", "Ninja", "Family", "Urgent".
* **Logic:** If >2 flags are detected, the system calculates a **Burnout Probability Score** and triggers a modal warning, overriding the user's swipe action.

### 3. Interactive Match Visualization (Recharts)
We moved beyond simple "Match %". Our **Poly-Dimensional Radar Chart** plots the job against the user's profile across 4 axes:
* **Tech Stack:** Skill vector overlap.
* **ATS Score:** Keyword density analysis.
* **Culture Fit:** Vibe alignment (Chaos vs. Structure).
* **Safety:** Inverse toxicity score.

### 4. Physics-Based Gestures (Framer Motion)
A fully fluid swipe interface with:
* 3D Tilt/Glare effects based on drag velocity.
* Dynamic opacity mapping for decision stamps ("APPLY" / "PASS").
* Haptic-style visual feedback on drag thresholds.

---

## 🏗️ Architecture & Engineering Decisions

**Current State: High-Fidelity Simulation (Deterministic MVP)**

To maximize the User Experience within the hackathon constraints, this project is architected as a **Simulation-First Prototype**.

### Why Simulation?
We chose to decouple the frontend from a live backend to demonstrate **edge-case behaviors** (like the Glitch Effect on toxic jobs) instantly, without network latency or API rate limits.

### The "Logic Engine"
While the data is local, the **logic is real**. The application runs a client-side JavaScript engine that:
1.  **Parses** raw text from job descriptions.
2.  **Computes** weighted scores based on user profile vectors.
3.  **Executes** conditional rendering based on salary/toxicity thresholds.

*Transition to Production:* The architecture is designed so that the `EXPANDED_JOB_DATABASE` JSON object can be swapped for a `fetch()` call to a REST API (e.g., JSearch + OpenAI) with zero changes to the UI components.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Core** | React + Vite | High-performance component rendering |
| **Physics** | Framer Motion | Gesture handling, 3D transforms, and spring animations |
| **Styling** | Tailwind CSS | Utility-first styling for the Glassmorphic UI |
| **Data Viz** | Recharts | Rendering the Radar/Spider charts for match data |
| **FX** | Canvas Confetti | Dopamine feedback loops on successful matches |

---

## ⚡ How to Run Locally

1.  **Clone the repo:**
    ```bash
    git clone [https://github.com/YOUR_USERNAME/job-tinder-demo.git](https://github.com/YOUR_USERNAME/job-tinder-demo.git)
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Ignite the engine:**
    ```bash
    npm run dev
    ```

---

*Built with LOVE for FEATURE CREEP CHAOS. Protecting engineers from toxic jobs, one swipe at a time.*
