# CRIMETRYX AI

**AI-Powered Forensic Crime Scene Analysis Platform**

Crimetryx AI extends the original Crimetryx modus operandi intelligence system by linking historical FIR-based behavioral patterns with real-time 3D crime scene analysis.

## Features

### 🎯 3D Crime Scene Viewer
- Interactive 3D scene visualization using Three.js/R3F
- Evidence marker placement with detailed categorization
- Support for KIRI Engine photogrammetry integration
- Grid overlay and measurement tools

### 🤖 Agentic AI Analysis
Multi-agent reasoning system for forensic analysis:
- **Scene Interpreter Agent**: Maps spatial actions (entry points, movement paths)
- **Evidence Reasoning Agent**: Analyzes weapon placement, violence patterns
- **Timeline Reconstruction Agent**: Reconstructs event sequences
- **Hypothesis Challenger Agent**: Identifies contradictions and inconsistencies

### 📊 FIR-Based Predictions
- Modus Operandi (MO) pattern extraction using NLP
- Suspect matching based on behavioral signatures
- Risk scoring and severity assessment
- Gang affiliation analysis

### 🔗 Crime Network Analysis
- Interactive crime-suspect-location graph
- Relationship visualization
- Pattern matching across historical cases

### 📄 Report Generation
- PDF export with full analysis
- Chain of custody with SHA-256 hashing
- Hypothesis documentation

## Tech Stack

**Frontend:**
- React + Vite
- Three.js / React Three Fiber
- Lucide React Icons

**Backend:**
- Flask (Python)
- SQLAlchemy + SQLite
- GROQ AI (Llama 3.3)

**3D Processing:**
- KIRI Engine API (photogrammetry)

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+
- GROQ API Key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/AR-droid/CRIMETRYX-AI.git
cd CRIMETRYX-AI
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Install backend dependencies:
```bash
cd backend
pip install -r requirements.txt
```

4. Create `.env` file in project root:
```
GROQ_API_KEY=your_groq_api_key
KIRI_ENGINE_API_KEY=your_kiri_key (optional)
```

5. Start the backend:
```bash
cd backend
python app.py
```

6. Start the frontend:
```bash
cd frontend
npm run dev
```

7. Open http://localhost:5173 in your browser

### Demo Login
- Investigator ID: `demo`
- Password: `demo123`

## Project Structure

```
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── SceneViewerPage.jsx
│   │   │   ├── WorkflowCanvasPage.jsx
│   │   │   ├── PredictionsPage.jsx
│   │   │   ├── NetworkPage.jsx
│   │   │   └── ReportPage.jsx
│   │   └── styles/
│   └── public/models/
├── backend/
│   ├── app.py
│   ├── agents.py
│   ├── models.py
│   ├── report_generator.py
│   └── kiri_service.py
└── README.md
```

## License

MIT License

## Credits

Developed as part of forensic investigation enhancement research.
