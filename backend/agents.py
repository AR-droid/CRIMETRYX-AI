"""
Crimetryx AI - AI Agents using GROQ API
Simple LLM function calls styled as autonomous agents in the UI.
"""

import os
import json
import time
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# Initialize GROQ client lazily to allow app to start without API key
client = None

def get_groq_client():
    global client
    if client is None:
        api_key = os.getenv('GROQ_API_KEY')
        if not api_key:
            return None
        client = Groq(api_key=api_key)
    return client

# Default model - Updated to current active model
MODEL = "llama-3.3-70b-versatile"


def scene_interpreter(scene_data: dict, evidence_list: list) -> dict:
    """
    Scene Interpreter Agent
    Analyzes spatial layout, entry/exit points, visibility, and distance constraints.
    """
    prompt = f"""You are a forensic scene interpreter AI agent. Analyze the following crime scene data and provide spatial analysis.

SCENE DATA:
{json.dumps(scene_data, indent=2)}

EVIDENCE LOCATIONS:
{json.dumps(evidence_list, indent=2)}

Provide your analysis in the following JSON format:
{{
    "entry_exit_points": [
        {{"location": "description", "coordinates": {{"x": 0, "y": 0, "z": 0}}, "type": "entry/exit"}}
    ],
    "visibility_analysis": [
        {{"from": "location A", "to": "location B", "visible": true/false, "obstructions": []}}
    ],
    "distance_constraints": [
        {{"from": "evidence A", "to": "evidence B", "distance_meters": 0.0, "significance": "description"}}
    ],
    "spatial_observations": [
        "observation 1",
        "observation 2"
    ],
    "reasoning": "Your detailed reasoning about the scene layout"
}}

Respond ONLY with valid JSON."""

    start_time = time.time()
    groq_client = get_groq_client()
    
    if not groq_client:
        return {"status": "error", "error": "GROQ API key not configured", "execution_time": 0}
    
    try:
        response = groq_client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=2000
        )
        
        result = response.choices[0].message.content
        execution_time = time.time() - start_time
        
        # Try to parse as JSON
        try:
            parsed = json.loads(result)
            return {
                "status": "completed",
                "output": parsed,
                "execution_time": execution_time
            }
        except json.JSONDecodeError:
            return {
                "status": "completed",
                "output": {"reasoning": result},
                "execution_time": execution_time
            }
            
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "execution_time": time.time() - start_time
        }


def evidence_reasoner(scene_analysis: dict, evidence_list: list) -> dict:
    """
    Evidence Reasoning Agent
    Analyzes evidence patterns, bloodstain analysis, weapon trajectories.
    """
    prompt = f"""You are a forensic evidence reasoning AI agent. Analyze the evidence in context of the scene.

SCENE ANALYSIS:
{json.dumps(scene_analysis, indent=2)}

EVIDENCE LIST:
{json.dumps(evidence_list, indent=2)}

Provide your analysis in the following JSON format:
{{
    "evidence_analysis": [
        {{
            "evidence_id": "E-001",
            "type": "bloodstain/weapon/footprint/etc",
            "findings": ["finding 1", "finding 2"],
            "inferred_direction": "description if applicable",
            "consistency_score": 0.0-1.0
        }}
    ],
    "pattern_correlations": [
        {{
            "evidence_pair": ["E-001", "E-002"],
            "relationship": "description",
            "confidence": 0.0-1.0
        }}
    ],
    "anomalies": [
        {{"description": "anomaly description", "significance": "high/medium/low"}}
    ],
    "reasoning": "Your detailed reasoning about the evidence"
}}

Respond ONLY with valid JSON."""

    start_time = time.time()
    groq_client = get_groq_client()
    
    if not groq_client:
        return {"status": "error", "error": "GROQ API key not configured", "execution_time": 0}
    
    try:
        response = groq_client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=2000
        )
        
        result = response.choices[0].message.content
        execution_time = time.time() - start_time
        
        try:
            parsed = json.loads(result)
            return {
                "status": "completed",
                "output": parsed,
                "execution_time": execution_time
            }
        except json.JSONDecodeError:
            return {
                "status": "completed",
                "output": {"reasoning": result},
                "execution_time": execution_time
            }
            
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "execution_time": time.time() - start_time
        }


def timeline_builder(scene_analysis: dict, evidence_analysis: dict) -> dict:
    """
    Timeline Reconstruction Agent
    Generates multiple possible event timelines/scenarios.
    """
    prompt = f"""You are a forensic timeline reconstruction AI agent. Generate multiple plausible crime scenarios.

SCENE ANALYSIS:
{json.dumps(scene_analysis, indent=2)}

EVIDENCE ANALYSIS:
{json.dumps(evidence_analysis, indent=2)}

Generate 2-3 distinct scenarios with different interpretations. Provide in JSON format:
{{
    "scenarios": [
        {{
            "scenario_id": "A",
            "title": "Brief scenario title",
            "confidence": 0.0-1.0,
            "timeline": [
                {{"sequence": 1, "event": "description", "estimated_time": "relative time"}},
                {{"sequence": 2, "event": "description", "estimated_time": "relative time"}}
            ],
            "supporting_evidence": ["E-001", "E-002"],
            "key_assumptions": ["assumption 1"],
            "summary": "Brief scenario summary"
        }}
    ],
    "reasoning": "Your reasoning for generating these scenarios"
}}

Respond ONLY with valid JSON."""

    start_time = time.time()
    groq_client = get_groq_client()
    
    if not groq_client:
        return {"status": "error", "error": "GROQ API key not configured", "execution_time": 0}
    
    try:
        response = groq_client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.5,
            max_tokens=3000
        )
        
        result = response.choices[0].message.content
        execution_time = time.time() - start_time
        
        try:
            parsed = json.loads(result)
            return {
                "status": "completed",
                "output": parsed,
                "execution_time": execution_time
            }
        except json.JSONDecodeError:
            return {
                "status": "completed",
                "output": {"reasoning": result},
                "execution_time": execution_time
            }
            
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "execution_time": time.time() - start_time
        }


def hypothesis_challenger(scenarios: list, scene_analysis: dict, evidence_analysis: dict) -> dict:
    """
    Hypothesis Challenger Agent
    Identifies contradictions, logical inconsistencies, and challenges assumptions.
    """
    prompt = f"""You are a forensic hypothesis challenger AI agent. Your job is to find contradictions and weaknesses in proposed scenarios.

PROPOSED SCENARIOS:
{json.dumps(scenarios, indent=2)}

SCENE ANALYSIS:
{json.dumps(scene_analysis, indent=2)}

EVIDENCE ANALYSIS:
{json.dumps(evidence_analysis, indent=2)}

Critically analyze each scenario and identify contradictions. Provide in JSON format:
{{
    "challenges": [
        {{
            "scenario_id": "A",
            "contradictions": [
                {{
                    "type": "physical_impossibility/timeline_conflict/evidence_mismatch",
                    "description": "detailed description",
                    "affected_evidence": ["E-001"],
                    "severity": "high/medium/low",
                    "confidence_penalty": 0.0-0.3
                }}
            ],
            "revised_confidence": 0.0-1.0,
            "verdict": "supported/partially_supported/contradicted"
        }}
    ],
    "cross_scenario_conflicts": [
        {{"scenarios": ["A", "B"], "conflict": "description"}}
    ],
    "overall_assessment": "summary assessment",
    "reasoning": "Your detailed reasoning"
}}

Be critical and thorough. Respond ONLY with valid JSON."""

    start_time = time.time()
    groq_client = get_groq_client()
    
    if not groq_client:
        return {"status": "error", "error": "GROQ API key not configured", "execution_time": 0}
    
    try:
        response = groq_client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=2500
        )
        
        result = response.choices[0].message.content
        execution_time = time.time() - start_time
        
        try:
            parsed = json.loads(result)
            return {
                "status": "completed",
                "output": parsed,
                "execution_time": execution_time
            }
        except json.JSONDecodeError:
            return {
                "status": "completed",
                "output": {"reasoning": result},
                "execution_time": execution_time
            }
            
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "execution_time": time.time() - start_time
        }


def run_full_analysis(case_data: dict, evidence_list: list) -> dict:
    """
    Run the complete agent pipeline.
    Returns all agent outputs and final hypotheses.
    """
    results = {
        "agents": {},
        "hypotheses": [],
        "total_execution_time": 0
    }
    
    start_total = time.time()
    
    # Step 1: Scene Interpreter
    scene_result = scene_interpreter(case_data, evidence_list)
    results["agents"]["scene_interpreter"] = scene_result
    
    if scene_result["status"] == "error":
        results["error"] = "Scene interpretation failed"
        return results
    
    # Step 2: Evidence Reasoner
    evidence_result = evidence_reasoner(
        scene_result.get("output", {}),
        evidence_list
    )
    results["agents"]["evidence_reasoner"] = evidence_result
    
    if evidence_result["status"] == "error":
        results["error"] = "Evidence reasoning failed"
        return results
    
    # Step 3: Timeline Builder
    timeline_result = timeline_builder(
        scene_result.get("output", {}),
        evidence_result.get("output", {})
    )
    results["agents"]["timeline_builder"] = timeline_result
    
    if timeline_result["status"] == "error":
        results["error"] = "Timeline building failed"
        return results
    
    scenarios = timeline_result.get("output", {}).get("scenarios", [])
    
    # Step 4: Hypothesis Challenger
    challenger_result = hypothesis_challenger(
        scenarios,
        scene_result.get("output", {}),
        evidence_result.get("output", {})
    )
    results["agents"]["hypothesis_challenger"] = challenger_result
    
    # Compile final hypotheses with adjusted confidence
    if challenger_result["status"] == "completed":
        challenges = challenger_result.get("output", {}).get("challenges", [])
        for scenario in scenarios:
            final_confidence = scenario.get("confidence", 0.5)
            contradictions = []
            
            # Find challenges for this scenario
            for challenge in challenges:
                if challenge.get("scenario_id") == scenario.get("scenario_id"):
                    final_confidence = challenge.get("revised_confidence", final_confidence)
                    contradictions = challenge.get("contradictions", [])
            
            results["hypotheses"].append({
                "scenario_id": scenario.get("scenario_id"),
                "title": scenario.get("title"),
                "timeline": scenario.get("timeline", []),
                "confidence": final_confidence,
                "supporting_evidence": scenario.get("supporting_evidence", []),
                "contradictions": contradictions
            })
    
    results["total_execution_time"] = time.time() - start_total
    return results
