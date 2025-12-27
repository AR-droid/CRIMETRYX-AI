Crimetryx AI
Agentic AI–Driven 3D Crime Scene Analysis with FIR-Based Modus Operandi Intelligence
Overview

Crimetryx AI is an advanced forensic intelligence platform that combines 3D crime scene reconstruction, agentic artificial intelligence, FIR-based modus operandi (MO) analysis, and blockchain-backed evidence integrity to support transparent, explainable, and auditable crime investigations.

The system transforms traditional static crime scene documentation into an interactive, reasoning-driven digital workflow, enabling investigators to understand what happened, how it happened, and how it aligns with historical criminal behavior.

Crimetryx AI is an evolution of the original Crimetryx project, which focused on extracting and analyzing modus operandi patterns from FIR data using NLP and machine learning. This version extends that intelligence into the physical world through 3D reconstruction and multi-agent reasoning.

Problem Statement

Crime scene investigation in India still relies largely on photographs, handwritten notes, and manual sketches. These methods often fail to preserve spatial context, event sequencing, and structured reasoning, leading to ambiguity, weak courtroom explainability, and delays in justice.

Crimetryx AI addresses this gap by digitizing crime scenes into 3D environments and applying transparent, agentic AI reasoning combined with FIR-based behavioral intelligence.

Key Capabilities

3D reconstruction of crime scenes from smartphone video

FIR text analysis and modus operandi extraction

Automatic mapping of Crime IDs to potential suspects

Multi-agent AI reasoning with visible decision paths

Explainable hypothesis generation and contradiction detection

Blockchain-backed evidence integrity and audit trail

Court-ready forensic report generation

System Architecture (High-Level)
Crime Scene Video / FIR Data
        ↓
Photogrammetry + NLP Processing
        ↓
3D Scene + MO Knowledge Graph
        ↓
Agentic AI Reasoning (CrewAI)
        ↓
Explainable Hypotheses & Reports

Agentic AI Design

Crimetryx AI uses a multi-agent architecture where each agent has a distinct forensic responsibility. All agents are visible to the user through an n8n-style workflow interface.

Agents in the System
Scene Interpreter Agent

Analyzes 3D geometry

Identifies entry and exit points

Computes distances and visibility

Establishes spatial constraints

Evidence Reasoning Agent

Evaluates evidence placement

Analyzes bloodstain directionality

Assesses weapon reachability

Detects signs of struggle or staging

Timeline Reconstruction Agent

Generates multiple plausible event sequences

Assigns probabilities to each scenario

Explicitly represents uncertainty

Hypothesis Challenger Agent

Critically evaluates all hypotheses

Flags logical and spatial contradictions

Penalizes inconsistent scenarios

Improves explainability and trust

FIR and Modus Operandi Intelligence

Crimetryx AI integrates the original Crimetryx FIR analysis pipeline.

FIR Processing

FIR narratives are processed using NLP

Extracted features include:

Entry methods

Weapons or tools used

Target patterns

Time-of-day behavior

Crime sequence

Modus Operandi Knowledge Base

MO patterns are stored as vectors and graphs

Suspects accumulate behavioral signatures over time

Enables crime-to-suspect mapping and pattern similarity scoring

Role of MO in 3D Reasoning

Agent-generated hypotheses are cross-validated against historical MO patterns to determine whether a crime aligns with known behavior or represents deviation or staging.

Crime ID to Suspect Mapping Workflow

Investigator enters a Crime ID or FIR reference

FIR data is retrieved and parsed

Modus operandi features are extracted

Features are matched against the suspect database

Suspects are ranked using:

MO similarity

Location proximity

Crime history

Results are displayed as risk-scored suspect cards

This process supports investigative prioritization and does not automate guilt attribution.

3D Crime Scene Reconstruction

Input: Smartphone video or image sequence

Process: Photogrammetry-based reconstruction

Output: Textured 3D mesh with preserved spatial geometry

Evidence Annotation

Evidence is placed directly within the 3D scene

Each evidence item stores:

Spatial coordinates

Metadata

Timestamp

Cryptographic hash

Blockchain and Evidence Integrity

To ensure trust and auditability:

Evidence metadata is hashed using SHA-256

Hashes are recorded on a blockchain network

An immutable chain of custody is maintained

Any tampering is immediately detectable

Sensitive evidence data remains off-chain; only hashes are stored on-chain.

Visualization and User Interface
UI Components

Investigator dashboard

Crime prediction and suspect mapping page

Agent workflow canvas (n8n-style)

Interactive 3D crime scene viewer

Timeline and scenario comparison panels

Agent reasoning and audit logs

Forensic report export interface

All AI reasoning remains visible, inspectable, and auditable.
<img width="552" height="572" alt="Screenshot 2025-12-27 at 9 46 57 AM" src="https://github.com/user-attachments/assets/bb3e7270-5389-429a-b737-390ebac2e35f" />

Installation and Setup
Prerequisites

Ensure the following are installed on your system:

Python 3.9 or higher

Node.js 18+ and npm

Git

Docker (optional, recommended)

MetaMask wallet (for blockchain testing)

Repository Setup
git clone https://github.com/your-username/crimetryx-ai.git
cd crimetryx-ai


Project structure (recommended):

crimetryx-ai/
├── backend/
├── frontend/
├── contracts/
├── data/
├── docs/
└── README.md

Backend Setup (Flask + Agentic AI)
1. Create Virtual Environment
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

2. Install Backend Dependencies
pip install -r requirements.txt


Key dependencies include:

Flask

CrewAI

LangChain

Open3D

spaCy

Neo4j Python Driver

Web3.py

3. Environment Variables

Create a .env file inside backend/:

FLASK_ENV=development
SECRET_KEY=your_secret_key

LLM_API_KEY=your_llm_api_key
KIRI_API_KEY=your_kiri_engine_key

NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password

BLOCKCHAIN_RPC_URL=http://127.0.0.1:8545
SMART_CONTRACT_ADDRESS=0x...

FIR NLP Setup

Download language models:

python -m spacy download en_core_web_sm


Optional (for better FIR extraction):

python -m spacy download en_core_web_trf

Start Backend Server
python app.py


Backend runs on:

http://localhost:5000

Frontend Setup (React + 3D + Agent UI)
1. Install Dependencies
cd frontend
npm install


Key frontend libraries:

React

React Flow

Three.js

Axios

Socket.io-client

2. Configure API Endpoint

Create .env inside frontend/:

REACT_APP_API_URL=http://localhost:5000

3. Start Frontend
npm start


Frontend runs on:

http://localhost:3000

3D Reconstruction Setup

Capture a short video of the scene (30–60 seconds)

Upload via UI or API

Backend sends video to KIRI Engine API

Returned GLTF/OBJ model is stored and parsed using Open3D

No local GPU required.

Agentic AI Setup (CrewAI)

Agents are defined in:

backend/agents/
├── scene_interpreter.py
├── evidence_reasoner.py
├── timeline_agent.py
└── hypothesis_challenger.py


Agent orchestration handled by:

backend/crew.py


Agents are triggered when:

User clicks “Run Analysis”

Crime ID is linked to FIR + suspect mapping


