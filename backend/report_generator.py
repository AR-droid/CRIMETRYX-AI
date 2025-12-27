"""
Crimetryx AI - PDF Report Generator
Generates forensic reports in PDF format.
"""

import os
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY

from models import Case, Evidence, AgentLog, Hypothesis


def generate_case_report(case: Case) -> str:
    """
    Generate a comprehensive PDF report for a case.
    
    Args:
        case: The Case object to generate report for
        
    Returns:
        Path to the generated PDF file
    """
    # Create reports directory
    reports_dir = os.path.join(os.path.dirname(__file__), 'reports')
    os.makedirs(reports_dir, exist_ok=True)
    
    # Output path
    filename = f"CrimetryxAI_Report_{case.case_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    output_path = os.path.join(reports_dir, filename)
    
    # Create document
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72
    )
    
    # Styles
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        name='CenteredTitle',
        parent=styles['Heading1'],
        alignment=TA_CENTER,
        spaceAfter=30,
        fontSize=24
    ))
    styles.add(ParagraphStyle(
        name='SectionHeader',
        parent=styles['Heading2'],
        spaceAfter=12,
        spaceBefore=20,
        textColor=colors.darkblue
    ))
    styles.add(ParagraphStyle(
        name='SubSection',
        parent=styles['Heading3'],
        spaceAfter=8,
        spaceBefore=12
    ))
    styles.add(ParagraphStyle(
        name='BodyJustified',
        parent=styles['Normal'],
        alignment=TA_JUSTIFY,
        spaceAfter=8
    ))
    
    # Build content
    story = []
    
    # Title Page
    story.append(Spacer(1, 2*inch))
    story.append(Paragraph("CRIMETRYX AI", styles['CenteredTitle']))
    story.append(Paragraph("Forensic Analysis Report", styles['CenteredTitle']))
    story.append(Spacer(1, 0.5*inch))
    story.append(Paragraph(f"Case ID: {case.case_id}", styles['CenteredTitle']))
    story.append(Spacer(1, 2*inch))
    
    # Case info table
    case_info = [
        ['Location:', case.location],
        ['Date:', case.date.strftime('%B %d, %Y') if case.date else 'N/A'],
        ['Investigator:', case.investigator],
        ['Status:', case.status.upper()],
        ['Generated:', datetime.now().strftime('%B %d, %Y at %H:%M')]
    ]
    
    case_table = Table(case_info, colWidths=[2*inch, 4*inch])
    case_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.darkblue),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
    ]))
    story.append(case_table)
    story.append(PageBreak())
    
    # Evidence Section
    story.append(Paragraph("EVIDENCE CATALOG", styles['SectionHeader']))
    
    evidence_list = Evidence.query.filter_by(case_id=case.id).all()
    
    if evidence_list:
        evidence_data = [['ID', 'Type', 'Coordinates (X, Y, Z)', 'Notes', 'Hash']]
        for e in evidence_list:
            evidence_data.append([
                e.evidence_id,
                e.evidence_type,
                f"({e.x:.2f}, {e.y:.2f}, {e.z:.2f})",
                (e.notes[:50] + '...') if e.notes and len(e.notes) > 50 else (e.notes or 'N/A'),
                (e.hash[:16] + '...') if e.hash else 'N/A'
            ])
        
        evidence_table = Table(evidence_data, colWidths=[0.8*inch, 1*inch, 1.5*inch, 2*inch, 1.2*inch])
        evidence_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey])
        ]))
        story.append(evidence_table)
    else:
        story.append(Paragraph("No evidence recorded for this case.", styles['BodyJustified']))
    
    story.append(Spacer(1, 0.5*inch))
    
    # Agent Analysis Section
    story.append(Paragraph("AI AGENT ANALYSIS", styles['SectionHeader']))
    
    # Get only the latest run of each agent type
    agent_logs = AgentLog.query.filter_by(case_id=case.id).order_by(AgentLog.created_at.desc()).all()
    seen_agents = set()
    latest_logs = []
    for log in agent_logs:
        if log.agent_type not in seen_agents:
            seen_agents.add(log.agent_type)
            latest_logs.append(log)
    latest_logs.reverse()  # Show in order
    
    agent_names = {
        'scene_interpreter': 'Scene Interpreter Agent',
        'evidence_reasoner': 'Evidence Reasoning Agent',
        'timeline_builder': 'Timeline Reconstruction Agent',
        'hypothesis_challenger': 'Hypothesis Challenger Agent'
    }
    
    def clean_json_text(text):
        """Remove markdown code blocks and parse JSON."""
        if not text:
            return {}
        # Remove markdown code blocks
        text = text.replace('```json', '').replace('```', '').strip()
        try:
            return json.loads(text)
        except:
            return {}
    
    def format_findings(data, prefix=""):
        """Format nested data as readable text."""
        lines = []
        if isinstance(data, dict):
            for key, value in data.items():
                if key in ['reasoning', 'summary']:
                    lines.append(f"• {value}")
                elif key == 'scenarios' and isinstance(value, list):
                    for scenario in value[:2]:  # Limit to 2 scenarios
                        lines.append(f"\n<b>Scenario {scenario.get('scenario_id', '?')}: {scenario.get('title', 'Unknown')}</b>")
                        lines.append(f"  Confidence: {scenario.get('confidence', 0) * 100:.0f}%")
                        if scenario.get('timeline'):
                            for event in scenario['timeline'][:4]:
                                lines.append(f"  {event.get('sequence', '?')}. {event.get('event', '')} ({event.get('estimated_time', '')})")
                elif key == 'entry_exit_points' and isinstance(value, list):
                    for point in value[:3]:
                        if point.get('location') and point.get('location') != 'Unknown':
                            lines.append(f"• {point.get('type', 'point').title()}: {point.get('location', 'Unknown')}")
                elif key == 'evidence_analysis' and isinstance(value, list):
                    for ev in value[:4]:
                        findings = ev.get('findings', [])
                        if findings:
                            lines.append(f"• {ev.get('evidence_id', '?')} ({ev.get('type', '')}): {', '.join(findings[:2])}")
                elif key == 'spatial_observations' and isinstance(value, list):
                    for obs in value[:3]:
                        if obs and 'insufficient' not in obs.lower() and 'no evidence' not in obs.lower():
                            lines.append(f"• {obs}")
                elif key == 'challenges' and isinstance(value, list):
                    for challenge in value[:2]:
                        if challenge.get('contradictions'):
                            for c in challenge['contradictions'][:2]:
                                lines.append(f"• {c.get('type', 'Issue')}: {c.get('description', '')[:200]}")
        return lines
    
    for log in latest_logs:
        story.append(Paragraph(agent_names.get(log.agent_type, log.agent_type), styles['SubSection']))
        story.append(Paragraph(f"<b>Status:</b> {log.status.upper()} | <b>Time:</b> {log.execution_time:.2f}s", styles['BodyJustified']))
        
        if log.reasoning:
            # Parse the reasoning JSON
            reasoning_text = log.reasoning
            if reasoning_text.startswith('"') and reasoning_text.endswith('"'):
                reasoning_text = reasoning_text[1:-1]
            
            # Try to extract and parse JSON
            try:
                reasoning = json.loads(log.reasoning)
                if isinstance(reasoning, str):
                    reasoning = clean_json_text(reasoning)
                elif isinstance(reasoning, dict) and 'reasoning' in reasoning:
                    if isinstance(reasoning['reasoning'], str) and reasoning['reasoning'].startswith('{'):
                        reasoning = clean_json_text(reasoning['reasoning'])
            except:
                reasoning = {}
            
            # Format the findings
            findings = format_findings(reasoning)
            if findings:
                story.append(Paragraph("<b>Key Findings:</b>", styles['BodyJustified']))
                for finding in findings[:6]:  # Limit to 6 items
                    story.append(Paragraph(finding[:300], styles['BodyJustified']))
            elif reasoning.get('reasoning'):
                # Fallback to reasoning text
                story.append(Paragraph(f"<b>Analysis:</b> {str(reasoning.get('reasoning', ''))[:400]}", styles['BodyJustified']))
        
        story.append(Spacer(1, 0.2*inch))
    
    if not latest_logs:
        story.append(Paragraph("No agent analysis has been performed on this case.", styles['BodyJustified']))
    
    story.append(PageBreak())
    
    # Hypotheses Section
    story.append(Paragraph("HYPOTHESES & SCENARIOS", styles['SectionHeader']))
    
    hypotheses = Hypothesis.query.filter_by(case_id=case.id).order_by(Hypothesis.confidence.desc()).all()
    
    for h in hypotheses:
        story.append(Paragraph(f"Scenario {h.scenario_id}: {h.description}", styles['SubSection']))
        story.append(Paragraph(f"<b>Confidence Score:</b> {h.confidence * 100:.1f}%", styles['BodyJustified']))
        
        import json
        try:
            timeline = json.loads(h.timeline) if h.timeline else []
            if timeline:
                story.append(Paragraph("<b>Timeline:</b>", styles['BodyJustified']))
                for event in timeline:
                    story.append(Paragraph(
                        f"• {event.get('sequence', '?')}. {event.get('event', 'Unknown event')} ({event.get('estimated_time', 'Unknown time')})",
                        styles['BodyJustified']
                    ))
        except:
            pass
        
        try:
            contradictions = json.loads(h.contradictions) if h.contradictions else []
            if contradictions:
                story.append(Paragraph("<b>Identified Contradictions:</b>", styles['BodyJustified']))
                for c in contradictions:
                    story.append(Paragraph(f"• {c.get('description', 'Unknown')}", styles['BodyJustified']))
        except:
            pass
        
        story.append(Spacer(1, 0.3*inch))
    
    if not hypotheses:
        story.append(Paragraph("No hypotheses have been generated for this case.", styles['BodyJustified']))
    
    # Footer disclaimer
    story.append(Spacer(1, 1*inch))
    story.append(Paragraph(
        "<i>This report was generated by Crimetryx AI, an agentic AI-powered forensic analysis platform. "
        "All AI-generated analyses should be reviewed by qualified forensic professionals. "
        "This document maintains chain-of-custody through cryptographic hashing.</i>",
        ParagraphStyle(name='Disclaimer', parent=styles['Normal'], fontSize=8, textColor=colors.grey)
    ))
    
    # Build PDF
    doc.build(story)
    
    return output_path
