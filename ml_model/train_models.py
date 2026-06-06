"""
CRIMETRYX-AI - Multi-Model Training Pipeline
Trains four classifiers on the synthetic FIR dataset:
  1. LSTM (crime type sequence predictor)
  2. Random Forest (crime type classifier)
  3. Logistic Regression (recidivism risk predictor)
  4. Gradient Boosting (suspect priority scorer)

All models and supporting artifacts are saved to ./saved_models/
"""

import os
import json
import pickle
import warnings
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    classification_report, confusion_matrix,
    accuracy_score, f1_score, roc_auc_score
)
from sklearn.feature_extraction.text import TfidfVectorizer

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
warnings.filterwarnings("ignore")

# ── Paths ─────────────────────────────────────────────────────────────────────

BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
DATA_PATH  = os.path.join(BASE_DIR, "data", "fir_dataset.csv")
SAVE_DIR   = os.path.join(BASE_DIR, "saved_models")
os.makedirs(SAVE_DIR, exist_ok=True)

# ── Categorical feature columns ───────────────────────────────────────────────

CAT_FEATURES = [
    "crime_type", "location_type", "state", "time_of_day",
    "weapon_used", "entry_method", "target_type", "suspect_age_group"
]
NUM_FEATURES = [
    "prior_record", "accomplice_count", "evidence_recovered",
    "digital_evidence", "severity_score"
]


# ── Data loading and preprocessing ────────────────────────────────────────────

def load_and_preprocess(path):
    print("[INFO] Loading dataset ...")
    df = pd.read_csv(path)
    print(f"       {len(df)} records, {df.shape[1]} columns")

    # Encode categoricals
    encoders = {}
    for col in CAT_FEATURES:
        le = LabelEncoder()
        df[col + "_enc"] = le.fit_transform(df[col].astype(str))
        encoders[col] = le

    # TF-IDF for MO text
    tfidf = TfidfVectorizer(max_features=50, ngram_range=(1, 2))
    mo_matrix = tfidf.fit_transform(df["mo_text"].fillna("")).toarray()
    mo_cols = [f"mo_tfidf_{i}" for i in range(mo_matrix.shape[1])]
    mo_df = pd.DataFrame(mo_matrix, columns=mo_cols, index=df.index)
    df = pd.concat([df, mo_df], axis=1)
    encoders["tfidf"] = tfidf

    return df, encoders


# ── LSTM Model ────────────────────────────────────────────────────────────────

def train_lstm(df, encoders):
    print("\n[LSTM] Training crime type sequence predictor ...")
    try:
        import tensorflow as tf
        from tensorflow.keras.models import Sequential
        from tensorflow.keras.layers import Embedding, LSTM, Dense, Dropout, BatchNormalization
        from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
        from tensorflow.keras.utils import to_categorical
    except ImportError:
        print("[LSTM] TensorFlow not installed. Skipping LSTM training.")
        return None, {}

    # Use sequence of encoded features as input (simulate temporal sequence)
    feature_cols = [c + "_enc" for c in CAT_FEATURES] + NUM_FEATURES
    X = df[feature_cols].values
    y_raw = df["crime_type_enc"].values
    n_classes = len(encoders["crime_type"].classes_)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_raw, test_size=0.2, random_state=42, stratify=y_raw
    )

    # Reshape for LSTM: (samples, timesteps=1, features)
    X_train_seq = X_train.reshape(X_train.shape[0], 1, X_train.shape[1])
    X_test_seq  = X_test.reshape(X_test.shape[0],  1, X_test.shape[1])

    y_train_cat = to_categorical(y_train, num_classes=n_classes)
    y_test_cat  = to_categorical(y_test,  num_classes=n_classes)

    n_features = X_train.shape[1]

    model = Sequential([
        LSTM(128, input_shape=(1, n_features), return_sequences=True),
        Dropout(0.3),
        LSTM(64, return_sequences=False),
        Dropout(0.2),
        BatchNormalization(),
        Dense(64, activation="relu"),
        Dropout(0.2),
        Dense(32, activation="relu"),
        Dense(n_classes, activation="softmax"),
    ])

    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss="categorical_crossentropy",
        metrics=["accuracy"]
    )
    model.summary()

    callbacks = [
        EarlyStopping(monitor="val_loss", patience=5, restore_best_weights=True),
        ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=3, verbose=0)
    ]

    history = model.fit(
        X_train_seq, y_train_cat,
        validation_data=(X_test_seq, y_test_cat),
        epochs=30, batch_size=64,
        callbacks=callbacks, verbose=1
    )

    # Evaluation
    y_pred_proba = model.predict(X_test_seq, verbose=0)
    y_pred = np.argmax(y_pred_proba, axis=1)
    acc = accuracy_score(y_test, y_pred)
    f1  = f1_score(y_test, y_pred, average="weighted")
    print(f"[LSTM] Accuracy: {acc:.4f} | F1 (weighted): {f1:.4f}")
    print(classification_report(
        y_test, y_pred,
        target_names=encoders["crime_type"].classes_
    ))

    # Save
    model_path = os.path.join(SAVE_DIR, "lstm_crime_predictor.h5")
    model.save(model_path)
    print(f"[LSTM] Saved -> {model_path}")

    metrics = {
        "model": "LSTM",
        "task": "Crime Type Prediction",
        "accuracy": round(float(acc), 4),
        "f1_weighted": round(float(f1), 4),
        "epochs_trained": len(history.history["accuracy"]),
        "train_acc_history": [round(v, 4) for v in history.history["accuracy"]],
        "val_acc_history":   [round(v, 4) for v in history.history["val_accuracy"]],
        "train_loss_history":[round(v, 4) for v in history.history["loss"]],
        "val_loss_history":  [round(v, 4) for v in history.history["val_loss"]],
        "classes": list(encoders["crime_type"].classes_),
        "n_features": int(n_features),
        "architecture": "LSTM(128) -> Dropout -> LSTM(64) -> BN -> Dense(64) -> Dense(32) -> Softmax"
    }
    return model, metrics


# ── Random Forest ─────────────────────────────────────────────────────────────

def train_random_forest(df, encoders):
    print("\n[RF] Training Random Forest crime type classifier ...")
    feature_cols = [c + "_enc" for c in CAT_FEATURES] + NUM_FEATURES
    X = df[feature_cols].values
    y = df["crime_type_enc"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    rf = RandomForestClassifier(
        n_estimators=200, max_depth=20, min_samples_split=5,
        class_weight="balanced", random_state=42, n_jobs=-1
    )
    rf.fit(X_train, y_train)

    y_pred = rf.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    f1  = f1_score(y_test, y_pred, average="weighted")
    print(f"[RF]   Accuracy: {acc:.4f} | F1 (weighted): {f1:.4f}")
    print(classification_report(
        y_test, y_pred,
        target_names=encoders["crime_type"].classes_
    ))

    path = os.path.join(SAVE_DIR, "rf_crime_classifier.pkl")
    with open(path, "wb") as f:
        pickle.dump(rf, f)
    print(f"[RF]   Saved -> {path}")

    # Feature importances
    importances = dict(zip(feature_cols, rf.feature_importances_.tolist()))
    top10 = dict(sorted(importances.items(), key=lambda x: -x[1])[:10])

    metrics = {
        "model": "RandomForest",
        "task": "Crime Type Classification",
        "accuracy": round(float(acc), 4),
        "f1_weighted": round(float(f1), 4),
        "n_estimators": 200,
        "classes": list(encoders["crime_type"].classes_),
        "top10_feature_importances": top10
    }
    return rf, metrics


# ── Logistic Regression ───────────────────────────────────────────────────────

def train_logistic_regression(df, encoders):
    print("\n[LR] Training Logistic Regression recidivism predictor ...")
    feature_cols = [c + "_enc" for c in CAT_FEATURES] + NUM_FEATURES
    X_base = df[feature_cols].values

    # Include TF-IDF MO features
    tfidf_cols = [c for c in df.columns if c.startswith("mo_tfidf_")]
    X_tfidf = df[tfidf_cols].values
    X = np.hstack([X_base, X_tfidf])
    y = df["recidivism"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_train_sc = scaler.fit_transform(X_train)
    X_test_sc  = scaler.transform(X_test)

    lr = LogisticRegression(
        C=1.0, max_iter=1000, solver="lbfgs",
        class_weight="balanced", random_state=42
    )
    lr.fit(X_train_sc, y_train)

    y_pred  = lr.predict(X_test_sc)
    y_proba = lr.predict_proba(X_test_sc)[:, 1]
    acc = accuracy_score(y_test, y_pred)
    f1  = f1_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_proba)
    print(f"[LR]   Accuracy: {acc:.4f} | F1: {f1:.4f} | AUC-ROC: {auc:.4f}")
    print(classification_report(y_test, y_pred, target_names=["no_recidivism", "recidivism"]))

    path_lr     = os.path.join(SAVE_DIR, "lr_recidivism_predictor.pkl")
    path_scaler = os.path.join(SAVE_DIR, "lr_scaler.pkl")
    with open(path_lr, "wb") as f:
        pickle.dump(lr, f)
    with open(path_scaler, "wb") as f:
        pickle.dump(scaler, f)
    print(f"[LR]   Saved -> {path_lr}")

    metrics = {
        "model": "LogisticRegression",
        "task": "Recidivism Risk Prediction",
        "accuracy": round(float(acc), 4),
        "f1": round(float(f1), 4),
        "auc_roc": round(float(auc), 4),
        "classes": ["no_recidivism", "recidivism"],
        "solver": "lbfgs"
    }
    return lr, scaler, metrics


# ── Gradient Boosting ─────────────────────────────────────────────────────────

def train_gradient_boosting(df, encoders):
    print("\n[GBM] Training Gradient Boosting suspect priority scorer ...")
    feature_cols = [c + "_enc" for c in CAT_FEATURES] + NUM_FEATURES
    X = df[feature_cols].values

    # Composite priority target: severity + recidivism + prior_record
    y_cont = (
        df["severity_score"].values / 10.0 * 0.5
        + df["recidivism"].values * 0.3
        + df["prior_record"].values * 0.2
    )
    # Bin into 3 priority classes
    y = pd.cut(y_cont, bins=[0, 0.33, 0.66, 1.01], labels=[0, 1, 2]).astype(int)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    gbm = GradientBoostingClassifier(
        n_estimators=150, learning_rate=0.1, max_depth=5,
        subsample=0.8, random_state=42
    )
    gbm.fit(X_train, y_train)

    y_pred = gbm.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    f1  = f1_score(y_test, y_pred, average="weighted")
    print(f"[GBM]  Accuracy: {acc:.4f} | F1 (weighted): {f1:.4f}")
    print(classification_report(y_test, y_pred, target_names=["low", "medium", "high"]))

    path = os.path.join(SAVE_DIR, "gbm_suspect_priority.pkl")
    with open(path, "wb") as f:
        pickle.dump(gbm, f)
    print(f"[GBM]  Saved -> {path}")

    feature_importance = dict(zip(feature_cols, gbm.feature_importances_.tolist()))
    top10 = dict(sorted(feature_importance.items(), key=lambda x: -x[1])[:10])

    metrics = {
        "model": "GradientBoosting",
        "task": "Suspect Priority Scoring",
        "accuracy": round(float(acc), 4),
        "f1_weighted": round(float(f1), 4),
        "n_estimators": 150,
        "priority_labels": ["low", "medium", "high"],
        "top10_feature_importances": top10
    }
    return gbm, metrics


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    df, encoders = load_and_preprocess(DATA_PATH)

    all_metrics = {}

    # 1. LSTM
    _, lstm_metrics = train_lstm(df, encoders)
    if lstm_metrics:
        all_metrics["lstm"] = lstm_metrics

    # 2. Random Forest
    _, rf_metrics = train_random_forest(df, encoders)
    all_metrics["random_forest"] = rf_metrics

    # 3. Logistic Regression
    _, _, lr_metrics = train_logistic_regression(df, encoders)
    all_metrics["logistic_regression"] = lr_metrics

    # 4. Gradient Boosting
    _, gbm_metrics = train_gradient_boosting(df, encoders)
    all_metrics["gradient_boosting"] = gbm_metrics

    # Save encoders bundle
    encoders_path = os.path.join(SAVE_DIR, "label_encoders.pkl")
    with open(encoders_path, "wb") as f:
        pickle.dump(encoders, f)
    print(f"\n[INFO] Label encoders saved -> {encoders_path}")

    # Save all metrics
    metrics_path = os.path.join(SAVE_DIR, "training_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(all_metrics, f, indent=2)
    print(f"[INFO] Training metrics saved -> {metrics_path}")

    # Summary table
    print("\n" + "=" * 60)
    print("TRAINING SUMMARY")
    print("=" * 60)
    for name, m in all_metrics.items():
        acc = m.get("accuracy", "N/A")
        f1  = m.get("f1_weighted", m.get("f1", "N/A"))
        auc = m.get("auc_roc", "")
        auc_str = f" | AUC {auc}" if auc else ""
        print(f"  {name:<25} Acc={acc}  F1={f1}{auc_str}")
    print("=" * 60)


if __name__ == "__main__":
    main()
