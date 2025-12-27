"""
Crimetryx AI - Database Models
SQLAlchemy models for cases, evidence, agent logs, and hypotheses.
"""

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import hashlib
import json

db = SQLAlchemy()


class Case(db.Model):
    """Case model representing a crime scene investigation."""
    __tablename__ = 'cases'
    
    id = db.Column(db.Integer, primary_key=True)
    case_id = db.Column(db.String(20), unique=True, nullable=False)
    location = db.Column(db.String(200), nullable=False)
    date = db.Column(db.Date, nullable=False)
    investigator = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(20), default='active')  # active, processing, analyzed, closed
    scene_model_path = db.Column(db.String(500))
    scene_task_id = db.Column(db.String(100))  # KIRI Engine task ID
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    evidence = db.relationship('Evidence', backref='case', lazy=True, cascade='all, delete-orphan')
    agent_logs = db.relationship('AgentLog', backref='case', lazy=True, cascade='all, delete-orphan')
    hypotheses = db.relationship('Hypothesis', backref='case', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'case_id': self.case_id,
            'location': self.location,
            'date': self.date.isoformat() if self.date else None,
            'investigator': self.investigator,
            'status': self.status,
            'scene_model_path': self.scene_model_path,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Evidence(db.Model):
    """Evidence model for items placed in 3D scene."""
    __tablename__ = 'evidence'
    
    id = db.Column(db.Integer, primary_key=True)
    evidence_id = db.Column(db.String(20), unique=True, nullable=False)
    case_id = db.Column(db.Integer, db.ForeignKey('cases.id'), nullable=False)
    evidence_type = db.Column(db.String(50), nullable=False)  # weapon, bloodstain, footprint, etc.
    
    # 3D coordinates
    x = db.Column(db.Float, nullable=False)
    y = db.Column(db.Float, nullable=False)
    z = db.Column(db.Float, nullable=False)
    
    notes = db.Column(db.Text)
    photo_path = db.Column(db.String(500))
    
    # Chain of custody
    hash = db.Column(db.String(64))  # SHA-256 hash
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.String(100))
    
    def generate_hash(self):
        """Generate SHA-256 hash for chain of custody."""
        data = f"{self.evidence_id}{self.case_id}{self.evidence_type}{self.x}{self.y}{self.z}{self.notes}{self.created_at}"
        self.hash = hashlib.sha256(data.encode()).hexdigest()
        return self.hash
    
    def to_dict(self):
        return {
            'id': self.id,
            'evidence_id': self.evidence_id,
            'case_id': self.case_id,
            'type': self.evidence_type,
            'coordinates': {'x': self.x, 'y': self.y, 'z': self.z},
            'notes': self.notes,
            'photo_path': self.photo_path,
            'hash': self.hash,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'created_by': self.created_by
        }


class AgentLog(db.Model):
    """Agent execution logs for transparency and auditability."""
    __tablename__ = 'agent_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    case_id = db.Column(db.Integer, db.ForeignKey('cases.id'), nullable=False)
    agent_type = db.Column(db.String(50), nullable=False)  # scene_interpreter, evidence_reasoner, etc.
    status = db.Column(db.String(20), default='idle')  # idle, running, completed, error
    
    # Input/Output
    inputs = db.Column(db.Text)  # JSON string
    reasoning = db.Column(db.Text)  # Agent's reasoning output
    outputs = db.Column(db.Text)  # JSON string
    
    # Metadata
    execution_time = db.Column(db.Float)  # seconds
    hash = db.Column(db.String(64))  # For immutability verification
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def generate_hash(self):
        """Generate hash of agent output for immutability."""
        data = f"{self.agent_type}{self.inputs}{self.reasoning}{self.outputs}{self.created_at}"
        self.hash = hashlib.sha256(data.encode()).hexdigest()
        return self.hash
    
    def to_dict(self):
        return {
            'id': self.id,
            'case_id': self.case_id,
            'agent_type': self.agent_type,
            'status': self.status,
            'inputs': json.loads(self.inputs) if self.inputs else None,
            'reasoning': self.reasoning,
            'outputs': json.loads(self.outputs) if self.outputs else None,
            'execution_time': self.execution_time,
            'hash': self.hash,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Hypothesis(db.Model):
    """Hypothesis/scenario generated by timeline agent."""
    __tablename__ = 'hypotheses'
    
    id = db.Column(db.Integer, primary_key=True)
    case_id = db.Column(db.Integer, db.ForeignKey('cases.id'), nullable=False)
    scenario_id = db.Column(db.String(10), nullable=False)  # A, B, C, etc.
    
    description = db.Column(db.Text, nullable=False)
    timeline = db.Column(db.Text)  # JSON array of events
    confidence = db.Column(db.Float, default=0.0)  # 0.0 to 1.0
    
    supporting_agents = db.Column(db.Text)  # JSON array of agent types
    contradictions = db.Column(db.Text)  # JSON array of contradiction details
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'case_id': self.case_id,
            'scenario_id': self.scenario_id,
            'description': self.description,
            'timeline': json.loads(self.timeline) if self.timeline else [],
            'confidence': self.confidence,
            'supporting_agents': json.loads(self.supporting_agents) if self.supporting_agents else [],
            'contradictions': json.loads(self.contradictions) if self.contradictions else [],
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class User(db.Model):
    """User model for authentication."""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    investigator_id = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(50), default='investigator')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'investigator_id': self.investigator_id,
            'name': self.name,
            'role': self.role
        }
