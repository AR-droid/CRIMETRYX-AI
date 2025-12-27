"""
Crimetryx AI - Flask Backend Application
Main API server for case management, evidence, and AI agent orchestration.
"""

import os
import json
import hashlib
from datetime import datetime
from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

from models import db, Case, Evidence, AgentLog, Hypothesis, User
from agents import scene_interpreter, evidence_reasoner, timeline_builder, hypothesis_challenger, run_full_analysis
from kiri_service import KiriEngineService
kiri_service = KiriEngineService()

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'crimetryx-dev-key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///crimetryx.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads')
app.config['MODELS_FOLDER'] = os.path.join(os.path.dirname(__file__), 'models_3d')
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB max

# Ensure upload folders exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['MODELS_FOLDER'], exist_ok=True)

# Initialize database
db.init_app(app)

with app.app_context():
    db.create_all()
    # Create demo user if not exists
    if not User.query.filter_by(investigator_id='demo').first():
        demo_user = User(
            investigator_id='demo',
            password_hash=hashlib.sha256('demo123'.encode()).hexdigest(),
            name='Demo Investigator',
            role='investigator'
        )
        db.session.add(demo_user)
        db.session.commit()


def generate_case_id():
    """Generate unique case ID."""
    count = Case.query.count()
    return f"CRX-{datetime.now().year}-{count + 1:04d}"


def generate_evidence_id(case_id):
    """Generate unique evidence ID for a case."""
    count = Evidence.query.filter_by(case_id=case_id).count()
    return f"E-{count + 1:03d}"


# =============================================================================
# Authentication Routes
# =============================================================================

@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login endpoint."""
    data = request.get_json()
    investigator_id = data.get('investigator_id')
    password = data.get('password')
    
    if not investigator_id or not password:
        return jsonify({'error': 'Missing credentials'}), 400
    
    user = User.query.filter_by(investigator_id=investigator_id).first()
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    if user and user.password_hash == password_hash:
        return jsonify({
            'success': True,
            'user': user.to_dict(),
            'token': f"token_{user.investigator_id}_{datetime.now().timestamp()}"
        })
    
    return jsonify({'error': 'Invalid credentials'}), 401


# =============================================================================
# Case Management Routes
# =============================================================================

@app.route('/api/cases', methods=['GET'])
def get_cases():
    """Get all cases."""
    cases = Case.query.order_by(Case.created_at.desc()).all()
    return jsonify([case.to_dict() for case in cases])


@app.route('/api/cases', methods=['POST'])
def create_case():
    """Create a new case."""
    data = request.get_json()
    
    case = Case(
        case_id=generate_case_id(),
        location=data.get('location', ''),
        date=datetime.strptime(data.get('date'), '%Y-%m-%d').date() if data.get('date') else datetime.now().date(),
        investigator=data.get('investigator', ''),
        status='active'
    )
    
    db.session.add(case)
    db.session.commit()
    
    return jsonify(case.to_dict()), 201


@app.route('/api/cases/<int:case_id>', methods=['GET'])
def get_case(case_id):
    """Get a specific case with all details."""
    case = Case.query.get_or_404(case_id)
    case_data = case.to_dict()
    case_data['evidence'] = [e.to_dict() for e in case.evidence]
    case_data['agent_logs'] = [log.to_dict() for log in case.agent_logs]
    case_data['hypotheses'] = [h.to_dict() for h in case.hypotheses]
    return jsonify(case_data)


@app.route('/api/cases/<int:case_id>', methods=['PUT'])
def update_case(case_id):
    """Update a case."""
    case = Case.query.get_or_404(case_id)
    data = request.get_json()
    
    if 'location' in data:
        case.location = data['location']
    if 'investigator' in data:
        case.investigator = data['investigator']
    if 'status' in data:
        case.status = data['status']
    
    db.session.commit()
    return jsonify(case.to_dict())


@app.route('/api/cases/<int:case_id>', methods=['DELETE'])
def delete_case(case_id):
    """Delete a case."""
    case = Case.query.get_or_404(case_id)
    db.session.delete(case)
    db.session.commit()
    return jsonify({'success': True})


# =============================================================================
# Scene Upload & 3D Model Routes
# =============================================================================

@app.route('/api/cases/<int:case_id>/upload-scene', methods=['POST'])
def upload_scene(case_id):
    """Upload scene video for photogrammetry."""
    case = Case.query.get_or_404(case_id)
    
    if 'video' not in request.files:
        return jsonify({'error': 'No video file provided'}), 400
    
    video = request.files['video']
    if video.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Save video
    filename = secure_filename(f"case_{case_id}_{video.filename}")
    video_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    video.save(video_path)
    
    # Upload to KIRI Engine
    result = kiri_service.upload_video(video_path)
    
    if result['success']:
        case.scene_task_id = result['task_id']
        case.status = 'processing'
        db.session.commit()
        
        return jsonify({
            'success': True,
            'task_id': result['task_id'],
            'message': 'Video uploaded, processing started'
        })
    else:
        return jsonify(result), 500


@app.route('/api/cases/<int:case_id>/scene-status', methods=['GET'])
def get_scene_status(case_id):
    """Check scene processing status."""
    case = Case.query.get_or_404(case_id)
    
    if not case.scene_task_id:
        return jsonify({'status': 'not_started'})
    
    result = kiri_service.check_status(case.scene_task_id)
    
    if result['success'] and result.get('status') == 'completed':
        # Download and save model if ready
        if result.get('download_url') and not case.scene_model_path:
            model_filename = f"case_{case_id}_scene.gltf"
            model_path = os.path.join(app.config['MODELS_FOLDER'], model_filename)
            
            download_result = kiri_service.download_model(result['download_url'], model_path)
            
            if download_result['success']:
                case.scene_model_path = model_filename
                case.status = 'ready'
                db.session.commit()
    
    return jsonify(result)


@app.route('/api/cases/<int:case_id>/model', methods=['GET'])
def get_model(case_id):
    """Serve the 3D model file."""
    case = Case.query.get_or_404(case_id)
    
    if not case.scene_model_path:
        return jsonify({'error': 'No model available'}), 404
    
    return send_from_directory(
        app.config['MODELS_FOLDER'],
        case.scene_model_path,
        mimetype='model/gltf+json'
    )


# =============================================================================
# Evidence Routes
# =============================================================================

@app.route('/api/cases/<int:case_id>/evidence', methods=['GET'])
def get_evidence(case_id):
    """Get all evidence for a case."""
    evidence = Evidence.query.filter_by(case_id=case_id).all()
    return jsonify([e.to_dict() for e in evidence])


@app.route('/api/cases/<int:case_id>/evidence', methods=['POST'])
def add_evidence(case_id):
    """Add evidence to a case."""
    Case.query.get_or_404(case_id)  # Verify case exists
    data = request.get_json()
    
    evidence = Evidence(
        evidence_id=generate_evidence_id(case_id),
        case_id=case_id,
        evidence_type=data.get('type', 'unknown'),
        x=data.get('x', 0),
        y=data.get('y', 0),
        z=data.get('z', 0),
        notes=data.get('notes', ''),
        created_by=data.get('created_by', 'unknown')
    )
    evidence.generate_hash()
    
    db.session.add(evidence)
    db.session.commit()
    
    return jsonify(evidence.to_dict()), 201


@app.route('/api/cases/<int:case_id>/evidence/<int:evidence_db_id>', methods=['PUT'])
def update_evidence(case_id, evidence_db_id):
    """Update evidence."""
    evidence = Evidence.query.get_or_404(evidence_db_id)
    data = request.get_json()
    
    if 'type' in data:
        evidence.evidence_type = data['type']
    if 'notes' in data:
        evidence.notes = data['notes']
    if 'x' in data:
        evidence.x = data['x']
    if 'y' in data:
        evidence.y = data['y']
    if 'z' in data:
        evidence.z = data['z']
    
    evidence.generate_hash()  # Regenerate hash
    db.session.commit()
    
    return jsonify(evidence.to_dict())


@app.route('/api/cases/<int:case_id>/evidence/<int:evidence_db_id>', methods=['DELETE'])
def delete_evidence(case_id, evidence_db_id):
    """Delete evidence."""
    evidence = Evidence.query.get_or_404(evidence_db_id)
    db.session.delete(evidence)
    db.session.commit()
    return jsonify({'success': True})


# =============================================================================
# AI Agent Routes
# =============================================================================

@app.route('/api/cases/<int:case_id>/analyze', methods=['POST'])
def run_analysis(case_id):
    """Run full AI agent analysis on a case."""
    case = Case.query.get_or_404(case_id)
    evidence_list = [e.to_dict() for e in case.evidence]
    
    case_data = {
        'case_id': case.case_id,
        'location': case.location,
        'date': case.date.isoformat() if case.date else None,
        'has_3d_model': bool(case.scene_model_path)
    }
    
    # Run full analysis
    results = run_full_analysis(case_data, evidence_list)
    
    # Save agent logs
    for agent_name, agent_result in results.get('agents', {}).items():
        log = AgentLog(
            case_id=case.id,
            agent_type=agent_name,
            status=agent_result.get('status', 'unknown'),
            inputs=json.dumps(case_data),
            reasoning=json.dumps(agent_result.get('output', {})),
            outputs=json.dumps(agent_result.get('output', {})),
            execution_time=agent_result.get('execution_time', 0)
        )
        log.generate_hash()
        db.session.add(log)
    
    # Save hypotheses
    for hypothesis in results.get('hypotheses', []):
        h = Hypothesis(
            case_id=case.id,
            scenario_id=hypothesis.get('scenario_id', 'X'),
            description=hypothesis.get('title', ''),
            timeline=json.dumps(hypothesis.get('timeline', [])),
            confidence=hypothesis.get('confidence', 0),
            supporting_agents=json.dumps(hypothesis.get('supporting_evidence', [])),
            contradictions=json.dumps(hypothesis.get('contradictions', []))
        )
        db.session.add(h)
    
    case.status = 'analyzed'
    db.session.commit()
    
    return jsonify(results)


@app.route('/api/cases/<int:case_id>/agents/<agent_type>/run', methods=['POST'])
def run_single_agent(case_id, agent_type):
    """Run a single agent on a case."""
    case = Case.query.get_or_404(case_id)
    evidence_list = [e.to_dict() for e in case.evidence]
    
    # If no evidence in database, use demo evidence for analysis
    if not evidence_list:
        evidence_list = [
            {
                'evidence_id': 'E-001',
                'type': 'bloodstain_spatter',
                'x': 2.5, 'y': 0.1, 'z': -1.2,
                'description': 'Impact spatter pattern on wall, 4ft height',
                'notes': 'Medium velocity impact spatter consistent with blunt force'
            },
            {
                'evidence_id': 'E-002',
                'type': 'weapon_knife',
                'x': -1.8, 'y': 0, 'z': 0.5,
                'description': 'Kitchen knife, 6-inch blade, found on floor',
                'notes': 'Partial fingerprints recovered, blood trace on blade'
            },
            {
                'evidence_id': 'E-003',
                'type': 'footprint',
                'x': 0, 'y': 0, 'z': 2.1,
                'description': 'Size 10 boot print in blood',
                'notes': 'Pattern consistent with work boots, leading to exit'
            },
            {
                'evidence_id': 'E-004',
                'type': 'bloodstain_pool',
                'x': 1.5, 'y': 0, 'z': -0.5,
                'description': 'Blood pool, approximately 2ft diameter',
                'notes': 'Primary scene, victim location at time of injury'
            },
            {
                'evidence_id': 'E-005',
                'type': 'fingerprint',
                'x': -2.5, 'y': 1.2, 'z': -2.0,
                'description': 'Latent fingerprint on window frame',
                'notes': 'Clear ridge detail, possible suspect print'
            }
        ]
    
    case_data = {
        'case_id': case.case_id,
        'location': case.location or 'Residential Property - Master Bedroom',
        'date': case.date.isoformat() if case.date else None,
        'dimensions': {'width': 12, 'length': 10, 'height': 3}
    }
    
    # Get previous agent outputs if needed
    prev_logs = {log.agent_type: json.loads(log.outputs) if log.outputs else {} 
                 for log in case.agent_logs}
    
    # Run appropriate agent
    if agent_type == 'scene_interpreter':
        result = scene_interpreter(case_data, evidence_list)
    elif agent_type == 'evidence_reasoner':
        scene_output = prev_logs.get('scene_interpreter', {})
        result = evidence_reasoner(scene_output, evidence_list)
    elif agent_type == 'timeline_builder':
        scene_output = prev_logs.get('scene_interpreter', {})
        evidence_output = prev_logs.get('evidence_reasoner', {})
        result = timeline_builder(scene_output, evidence_output)
        
        # Save hypotheses/scenarios from timeline output
        output = result.get('output', {})
        scenarios = output.get('scenarios', [])
        
        # Clear previous hypotheses for this case
        Hypothesis.query.filter_by(case_id=case.id).delete()
        
        for scenario in scenarios:
            h = Hypothesis(
                case_id=case.id,
                scenario_id=scenario.get('scenario_id', 'X'),
                description=scenario.get('title', scenario.get('description', 'Unknown scenario')),
                timeline=json.dumps(scenario.get('timeline', [])),
                confidence=scenario.get('confidence', 0.5),
                supporting_agents=json.dumps(scenario.get('supporting_evidence', [])),
                contradictions=json.dumps(scenario.get('contradictions', []))
            )
            db.session.add(h)
        
    elif agent_type == 'hypothesis_challenger':
        scene_output = prev_logs.get('scene_interpreter', {})
        evidence_output = prev_logs.get('evidence_reasoner', {})
        timeline_output = prev_logs.get('timeline_builder', {})
        scenarios = timeline_output.get('scenarios', [])
        result = hypothesis_challenger(scenarios, scene_output, evidence_output)
        
        # Update hypothesis confidence based on challenger output
        challenges = result.get('output', {}).get('challenges', [])
        for challenge in challenges:
            scenario_id = challenge.get('scenario_id')
            if scenario_id:
                h = Hypothesis.query.filter_by(case_id=case.id, scenario_id=scenario_id).first()
                if h:
                    h.confidence = challenge.get('revised_confidence', h.confidence)
                    h.contradictions = json.dumps(challenge.get('contradictions', []))
    else:
        return jsonify({'error': 'Unknown agent type'}), 400
    
    # Save log
    log = AgentLog(
        case_id=case.id,
        agent_type=agent_type,
        status=result.get('status', 'unknown'),
        inputs=json.dumps(case_data),
        reasoning=json.dumps(result.get('output', {})),
        outputs=json.dumps(result.get('output', {})),
        execution_time=result.get('execution_time', 0)
    )
    log.generate_hash()
    db.session.add(log)
    db.session.commit()
    
    return jsonify(result)


@app.route('/api/cases/<int:case_id>/agent-logs', methods=['GET'])
def get_agent_logs(case_id):
    """Get all agent logs for a case."""
    logs = AgentLog.query.filter_by(case_id=case_id).order_by(AgentLog.created_at).all()
    return jsonify([log.to_dict() for log in logs])


# =============================================================================
# Report Generation
# =============================================================================

@app.route('/api/cases/<int:case_id>/report', methods=['GET'])
def generate_report(case_id):
    """Generate PDF report for a case."""
    from report_generator import generate_case_report
    
    case = Case.query.get_or_404(case_id)
    report_path = generate_case_report(case)
    
    return send_file(
        report_path,
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f'CrimetryxAI_Report_{case.case_id}.pdf'
    )


# =============================================================================
# Static Files (for serving 3D models and uploads)
# =============================================================================

@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


@app.route('/models/<path:filename>')
def serve_model(filename):
    return send_from_directory(app.config['MODELS_FOLDER'], filename)


# =============================================================================
# Health Check
# =============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })


if __name__ == '__main__':
    app.run(debug=True, port=5000)
