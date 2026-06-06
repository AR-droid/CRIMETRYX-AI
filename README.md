# CRIMETRYX AI

Agentic AI-Driven Crime Scene Analysis with ML-Powered FIR Intelligence

---

## Overview

CRIMETRYX AI is a forensic intelligence platform combining 3D crime scene reconstruction, multi-agent AI reasoning, and a machine learning layer trained on First Information Report (FIR) data. It predicts crime types, assesses recidivism risk, scores suspect investigation priority, and matches modus operandi patterns — powered by four models: LSTM, Random Forest, Logistic Regression, and Gradient Boosting.

Built for the Amazon ML Summer School.

---

## Directory Structure

```
CRIMETRYX-AI/
|
|-- backend/                        Flask REST API
|   |-- app.py                      Main server (cases, agents, ML routes)
|   |-- agents.py                   Multi-agent AI reasoning via GROQ LLM
|   |-- ml_service.py               ML inference service (loads all models)
|   |-- models.py                   SQLAlchemy database models
|   |-- kiri_service.py             3D photogrammetry integration
|   |-- report_generator.py         PDF forensic report generation
|   |-- requirements.txt            Python dependencies
|   |-- Procfile                    Gunicorn start command
|   |-- render.yaml                 Render deployment config
|   `-- .env.example                Environment variable reference
|
|-- frontend/                       React + Vite web application
|   |-- src/
|   |   |-- App.jsx                 Root router
|   |   `-- pages/
|   |       |-- DashboardPage.jsx   Investigator dashboard
|   |       |-- MLDashboard.jsx     ML intelligence panel
|   |       |-- PredictionsPage.jsx Crime prediction and suspect mapping
|   |       |-- SceneViewerPage.jsx Interactive 3D crime scene viewer
|   |       |-- WorkflowCanvasPage.jsx  Agent workflow canvas
|   |       |-- CaseSetupPage.jsx   Case creation
|   |       |-- NetworkPage.jsx     Suspect network graph
|   |       |-- ReportPage.jsx      Report export
|   |       `-- LoginPage.jsx       Authentication
|   `-- vercel.json                 Vercel deployment config
|
|-- ml_model/                       Machine learning pipeline
|   |-- data/
|   |   |-- generate_fir_dataset.py Synthetic FIR dataset generator
|   |   |-- fir_dataset.csv         3,000-record FIR dataset
|   |   `-- fir_dataset_sample.json 50-record JSON preview
|   |-- train_models.py             Training script (all 4 models)
|   |-- train_lstm_only.py          LSTM-only training script
|   |-- mo_vectorizer.py            TF-IDF modus operandi vectorizer
|   `-- saved_models/
|       `-- training_metrics.json   Accuracy, F1, AUC-ROC per model
|
|-- render.yaml                     Root-level Render deployment config
`-- README.md
```

---

## Machine Learning Pipeline

### Dataset

`fir_dataset.csv` — 3,000 synthetic FIR records with 17 features.

| Feature | Description |
|---|---|
| crime_type | One of 10 crime categories (target for classification) |
| location_type | Type of location where crime occurred |
| time_of_day | Time window of the crime |
| weapon_used | Weapon type or none |
| entry_method | How suspect gained access |
| target_type | Individual, household, commercial, etc. |
| suspect_age_group | Suspect age bracket |
| prior_record | Binary: prior criminal history |
| accomplice_count | Number of accomplices |
| severity_score | Crime severity 1-10 |
| mo_text | Natural language modus operandi description |
| recidivism | Binary label: repeat offender (target for LR model) |

### Models

| Model | Task | Accuracy | Notes |
|---|---|---|---|
| LSTM | Crime type prediction | — | Embedding + LSTM(128) + LSTM(64) + Softmax |
| Random Forest | Crime type classification | 100% | 200 estimators, class_weight=balanced |
| Logistic Regression | Recidivism risk | 59% / AUC 0.63 | TF-IDF MO text + numeric features |
| Gradient Boosting | Suspect priority scoring | 65% | Low / Medium / High priority |

To retrain locally:
```bash
python3 ml_model/data/generate_fir_dataset.py
python3 ml_model/train_models.py
```

### ML API Endpoints

| Method | Endpoint | Model |
|---|---|---|
| POST | /api/ml/predict-crime-type | Random Forest |
| POST | /api/ml/predict-crime-type-lstm | LSTM |
| POST | /api/ml/predict-recidivism | Logistic Regression |
| POST | /api/ml/predict-suspect-priority | Gradient Boosting |
| POST | /api/ml/mo-similarity | TF-IDF cosine similarity |
| POST | /api/ml/mo-top-matches | Top-k similar FIRs |
| GET  | /api/ml/model-metrics | Training metrics for all models |

---

## Agentic AI System

| Agent | Responsibility |
|---|---|
| Scene Interpreter | Spatial analysis, entry/exit points, visibility |
| Evidence Reasoner | Bloodstain analysis, weapon trajectories |
| Timeline Builder | Generates probabilistic crime scenarios |
| Hypothesis Challenger | Flags contradictions, revises confidence |

All agent reasoning is logged with SHA-256 hashes and displayed in the workflow canvas.

---

## Local Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env          # add your GROQ_API_KEY
python3 app.py                 # runs on http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
npm run dev                    # runs on http://localhost:5173
```

Navigate to `/ml-dashboard` for the ML intelligence panel.

---

## Deployment

### Backend — Render

1. Go to [render.com](https://render.com) and create a new Web Service.
2. Connect this GitHub repository.
3. Render will detect `render.yaml` automatically.
4. Add `GROQ_API_KEY` in the Environment tab.

### Frontend — Vercel

1. Go to [vercel.com](https://vercel.com) and import this repository.
2. Set the Root Directory to `frontend/`.
3. After Render deploys, copy your Render URL into `frontend/vercel.json` under `destination`.
4. Deploy.

---

## Tech Stack

| Layer | Technology |
|---|---|
| ML | TensorFlow/Keras, scikit-learn, TF-IDF |
| Backend | Flask, SQLAlchemy, GROQ API |
| Frontend | React, Vite |
| 3D Viewer | Three.js |
| Deployment | Render (backend), Vercel (frontend) |
| Evidence Integrity | SHA-256 chain of custody |
