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

