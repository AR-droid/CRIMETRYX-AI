"""
Run only LSTM training on top of already-trained sklearn models.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import json
import pickle
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.feature_extraction.text import TfidfVectorizer

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"

BASE_DIR  = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "fir_dataset.csv")
SAVE_DIR  = os.path.join(BASE_DIR, "saved_models")

CAT_FEATURES = ["crime_type","location_type","state","time_of_day","weapon_used","entry_method","target_type","suspect_age_group"]
NUM_FEATURES = ["prior_record","accomplice_count","evidence_recovered","digital_evidence","severity_score"]

print("[INFO] Loading dataset and encoders ...")
df = pd.read_csv(DATA_PATH)

with open(os.path.join(SAVE_DIR, "label_encoders.pkl"), "rb") as f:
    encoders = pickle.load(f)

for col in CAT_FEATURES:
    df[col + "_enc"] = encoders[col].transform(df[col].astype(str))

feature_cols = [c + "_enc" for c in CAT_FEATURES] + NUM_FEATURES
X = df[feature_cols].values
y_raw = encoders["crime_type"].transform(df["crime_type"].astype(str))
n_classes = len(encoders["crime_type"].classes_)

X_train, X_test, y_train, y_test = train_test_split(X, y_raw, test_size=0.2, random_state=42, stratify=y_raw)

import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout, BatchNormalization
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
from tensorflow.keras.utils import to_categorical

X_train_seq = X_train.reshape(X_train.shape[0], 1, X_train.shape[1])
X_test_seq  = X_test.reshape(X_test.shape[0],  1, X_test.shape[1])
y_train_cat = to_categorical(y_train, num_classes=n_classes)
y_test_cat  = to_categorical(y_test,  num_classes=n_classes)

model = Sequential([
    LSTM(128, input_shape=(1, X_train.shape[1]), return_sequences=True),
    Dropout(0.3),
    LSTM(64, return_sequences=False),
    Dropout(0.2),
    BatchNormalization(),
    Dense(64, activation="relu"),
    Dropout(0.2),
    Dense(32, activation="relu"),
    Dense(n_classes, activation="softmax"),
])
model.compile(optimizer=tf.keras.optimizers.Adam(0.001), loss="categorical_crossentropy", metrics=["accuracy"])
model.summary()

history = model.fit(
    X_train_seq, y_train_cat,
    validation_data=(X_test_seq, y_test_cat),
    epochs=30, batch_size=64, verbose=1,
    callbacks=[
        EarlyStopping(monitor="val_loss", patience=5, restore_best_weights=True),
        ReduceLROnPlateau(monitor="val_loss", factor=0.5, patience=3, verbose=0),
    ]
)

from sklearn.metrics import accuracy_score, f1_score, classification_report
y_pred = np.argmax(model.predict(X_test_seq, verbose=0), axis=1)
acc = accuracy_score(y_test, y_pred)
f1  = f1_score(y_test, y_pred, average="weighted")
print(f"\n[LSTM] Accuracy: {acc:.4f} | F1: {f1:.4f}")
print(classification_report(y_test, y_pred, target_names=encoders["crime_type"].classes_))

model_path = os.path.join(SAVE_DIR, "lstm_crime_predictor.h5")
model.save(model_path)
print(f"[LSTM] Saved -> {model_path}")

# Patch metrics file
metrics_path = os.path.join(SAVE_DIR, "training_metrics.json")
with open(metrics_path) as f:
    metrics = json.load(f)

metrics["lstm"] = {
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
    "n_features": int(X_train.shape[1]),
    "architecture": "LSTM(128) -> Dropout -> LSTM(64) -> BN -> Dense(64) -> Dense(32) -> Softmax"
}

with open(metrics_path, "w") as f:
    json.dump(metrics, f, indent=2)
print("[INFO] Metrics updated.")
