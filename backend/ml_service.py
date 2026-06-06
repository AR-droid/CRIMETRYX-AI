"""
CRIMETRYX-AI - ML Inference Service
Loads all trained models and exposes clean prediction functions
consumed by the Flask API routes.
"""

import os
import json
import pickle
import numpy as np
import warnings

warnings.filterwarnings("ignore")

BASE_DIR  = os.path.dirname(os.path.abspath(__file__))
ML_DIR    = os.path.join(os.path.dirname(BASE_DIR), "ml_model")
SAVE_DIR  = os.path.join(ML_DIR, "saved_models")

# ── Categorical orderings (must match training) ──────────────────────────────

CAT_FEATURES = [
    "crime_type", "location_type", "state", "time_of_day",
    "weapon_used", "entry_method", "target_type", "suspect_age_group"
]
NUM_FEATURES = [
    "prior_record", "accomplice_count", "evidence_recovered",
    "digital_evidence", "severity_score"
]

DEFAULTS = {
    "crime_type": "burglary",
    "location_type": "residential_area",
    "state": "MH",
    "time_of_day": "night",
    "weapon_used": "none",
    "entry_method": "forced_entry",
    "target_type": "household",
    "suspect_age_group": "26-35",
    "prior_record": 0,
    "accomplice_count": 0,
    "evidence_recovered": 0,
    "digital_evidence": 0,
    "severity_score": 5,
}

PRIORITY_LABELS = ["Low", "Medium", "High"]


# ── Lazy model loader ─────────────────────────────────────────────────────────

class MLService:
    """
    Singleton service that lazily loads all ML artefacts on first use.
    """

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialised = False
        return cls._instance

    def _load(self):
        """Load all models and artefacts from disk."""
        if self._initialised:
            return

        print("[ML-SVC] Loading models ...")

        # Label encoders
        enc_path = os.path.join(SAVE_DIR, "label_encoders.pkl")
        if os.path.exists(enc_path):
            with open(enc_path, "rb") as f:
                self.encoders = pickle.load(f)
            print("[ML-SVC] Label encoders loaded.")
        else:
            self.encoders = {}
            print("[ML-SVC] WARNING: label_encoders.pkl not found.")

        # Random Forest
        rf_path = os.path.join(SAVE_DIR, "rf_crime_classifier.pkl")
        self.rf = pickle.load(open(rf_path, "rb")) if os.path.exists(rf_path) else None
        if self.rf: print("[ML-SVC] Random Forest loaded.")

        # Logistic Regression + scaler
        lr_path  = os.path.join(SAVE_DIR, "lr_recidivism_predictor.pkl")
        sc_path  = os.path.join(SAVE_DIR, "lr_scaler.pkl")
        self.lr      = pickle.load(open(lr_path, "rb")) if os.path.exists(lr_path) else None
        self.scaler  = pickle.load(open(sc_path, "rb")) if os.path.exists(sc_path) else None
        if self.lr: print("[ML-SVC] Logistic Regression loaded.")

        # Gradient Boosting
        gbm_path = os.path.join(SAVE_DIR, "gbm_suspect_priority.pkl")
        self.gbm = pickle.load(open(gbm_path, "rb")) if os.path.exists(gbm_path) else None
        if self.gbm: print("[ML-SVC] Gradient Boosting loaded.")

        # LSTM (optional – TF may not be installed)
        self.lstm = None
        lstm_path = os.path.join(SAVE_DIR, "lstm_crime_predictor.h5")
        if os.path.exists(lstm_path):
            try:
                import tensorflow as tf
                self.lstm = tf.keras.models.load_model(lstm_path)
                print("[ML-SVC] LSTM loaded.")
            except Exception as e:
                print(f"[ML-SVC] LSTM load failed: {e}")

        # MO Vectorizer
        from ml_model.mo_vectorizer import MOVectorizer
        try:
            self.mo_vec = MOVectorizer.load()
            print("[ML-SVC] MO Vectorizer loaded.")
        except Exception as e:
            self.mo_vec = None
            print(f"[ML-SVC] MO Vectorizer load failed: {e}")

        # Training metrics
        metrics_path = os.path.join(SAVE_DIR, "training_metrics.json")
        if os.path.exists(metrics_path):
            with open(metrics_path) as f:
                self.metrics = json.load(f)
        else:
            self.metrics = {}

        self._initialised = True
        print("[ML-SVC] All models ready.")

    # ── Feature encoding helpers ──────────────────────────────────────────────

    def _encode_features(self, features: dict) -> np.ndarray:
        """Encode a feature dict into a numeric feature vector."""
        self._load()
        row = []
        for col in CAT_FEATURES:
            val = features.get(col, DEFAULTS[col])
            le  = self.encoders.get(col)
            if le is None:
                row.append(0)
            else:
                try:
                    row.append(int(le.transform([str(val)])[0]))
                except ValueError:
                    row.append(0)

        for col in NUM_FEATURES:
            row.append(float(features.get(col, DEFAULTS[col])))

        return np.array(row, dtype=float).reshape(1, -1)

    def _encode_with_tfidf(self, features: dict, mo_text: str = "") -> np.ndarray:
        """Encode features + TF-IDF MO vector (for LR model)."""
        base = self._encode_features(features)
        tfidf = self.encoders.get("tfidf")
        if tfidf is not None and mo_text:
            mo_vec = tfidf.transform([mo_text]).toarray()
        else:
            n = 50
            mo_vec = np.zeros((1, n))
        return np.hstack([base, mo_vec])

    # ── Prediction methods ────────────────────────────────────────────────────

    def predict_crime_type(self, features: dict) -> dict:
        """Random Forest: predict crime type + per-class probabilities."""
        self._load()
        if self.rf is None:
            return {"error": "Random Forest model not loaded"}

        X = self._encode_features(features)
        pred_enc   = self.rf.predict(X)[0]
        proba      = self.rf.predict_proba(X)[0]
        crime_type = self.encoders["crime_type"].inverse_transform([pred_enc])[0]
        classes    = self.encoders["crime_type"].classes_.tolist()

        return {
            "predicted_crime_type": crime_type,
            "confidence": round(float(np.max(proba)), 4),
            "class_probabilities": {c: round(float(p), 4) for c, p in zip(classes, proba)},
            "model": "RandomForest"
        }

    def predict_crime_type_lstm(self, features: dict) -> dict:
        """LSTM: predict crime type from encoded feature sequence."""
        self._load()
        if self.lstm is None:
            return {"error": "LSTM model not loaded"}

        X = self._encode_features(features)
        X_seq = X.reshape(1, 1, X.shape[1])
        proba = self.lstm.predict(X_seq, verbose=0)[0]
        pred_enc   = int(np.argmax(proba))
        crime_type = self.encoders["crime_type"].inverse_transform([pred_enc])[0]
        classes    = self.encoders["crime_type"].classes_.tolist()

        return {
            "predicted_crime_type": crime_type,
            "confidence": round(float(np.max(proba)), 4),
            "class_probabilities": {c: round(float(p), 4) for c, p in zip(classes, proba)},
            "model": "LSTM"
        }

    def predict_recidivism(self, features: dict, mo_text: str = "") -> dict:
        """Logistic Regression: predict recidivism risk probability."""
        self._load()
        if self.lr is None or self.scaler is None:
            return {"error": "Logistic Regression model not loaded"}

        X = self._encode_with_tfidf(features, mo_text)
        X_sc = self.scaler.transform(X)
        prob = self.lr.predict_proba(X_sc)[0]
        risk = round(float(prob[1]), 4)

        level = "Low" if risk < 0.33 else "Medium" if risk < 0.66 else "High"

        return {
            "recidivism_probability": risk,
            "risk_level": level,
            "no_recidivism_probability": round(float(prob[0]), 4),
            "model": "LogisticRegression"
        }

    def predict_suspect_priority(self, features: dict) -> dict:
        """Gradient Boosting: predict suspect investigation priority."""
        self._load()
        if self.gbm is None:
            return {"error": "Gradient Boosting model not loaded"}

        X = self._encode_features(features)
        pred  = self.gbm.predict(X)[0]
        proba = self.gbm.predict_proba(X)[0]

        return {
            "priority_level": PRIORITY_LABELS[int(pred)],
            "priority_score": int(pred),
            "probabilities": {
                "low":    round(float(proba[0]), 4),
                "medium": round(float(proba[1]), 4),
                "high":   round(float(proba[2]), 4),
            },
            "model": "GradientBoosting"
        }

    def mo_similarity(self, text_a: str, text_b: str) -> dict:
        """Compute cosine similarity between two MO descriptions."""
        self._load()
        if self.mo_vec is None:
            return {"error": "MO Vectorizer not loaded"}

        score = self.mo_vec.similarity(text_a, text_b)
        label = "High" if score > 0.7 else "Moderate" if score > 0.4 else "Low"

        return {
            "similarity_score": score,
            "similarity_label": label,
            "interpretation": f"The two modus operandi descriptions have {label.lower()} overlap ({score:.0%})."
        }

    def top_similar_firs(self, mo_text: str, k: int = 5) -> dict:
        """Find top-k FIRs in the corpus most similar to the given MO text."""
        self._load()
        if self.mo_vec is None:
            return {"error": "MO Vectorizer not loaded"}

        results = self.mo_vec.top_k_similar(mo_text, k=k)
        return {"query": mo_text, "top_matches": results}

    def get_model_metrics(self) -> dict:
        """Return training metrics for all models."""
        self._load()
        return self.metrics


# Singleton instance
ml_service = MLService()
