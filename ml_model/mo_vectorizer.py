"""
CRIMETRYX-AI - Modus Operandi Vectorizer
Provides TF-IDF based text vectorization and cosine similarity scoring
for matching FIR modus operandi patterns against historical records.
"""

import os
import pickle
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
SAVE_DIR   = os.path.join(BASE_DIR, "saved_models")
VECTOR_PATH = os.path.join(SAVE_DIR, "mo_tfidf_vectorizer.pkl")
CORPUS_PATH = os.path.join(SAVE_DIR, "mo_corpus.pkl")


class MOVectorizer:
    """
    Modus Operandi vectorizer for FIR text similarity analysis.
    Fits a TF-IDF model on historical MO descriptions and supports
    real-time similarity queries.
    """

    def __init__(self):
        self.vectorizer = None
        self.corpus_vectors = None
        self.corpus_meta = []

    def fit(self, texts: list, metadata: list = None):
        """
        Fit the TF-IDF vectorizer on a corpus of MO texts.

        Args:
            texts:    List of MO description strings.
            metadata: Optional list of dicts with fir_id, crime_type, etc.
        """
        self.vectorizer = TfidfVectorizer(
            max_features=200,
            ngram_range=(1, 2),
            sublinear_tf=True,
            min_df=2
        )
        self.corpus_vectors = self.vectorizer.fit_transform(texts)
        self.corpus_meta = metadata or [{} for _ in texts]
        return self

    def vectorize(self, text: str) -> np.ndarray:
        """Transform a single MO text into its TF-IDF vector."""
        if self.vectorizer is None:
            raise RuntimeError("Vectorizer not fitted. Call fit() or load() first.")
        return self.vectorizer.transform([text])

    def similarity(self, text_a: str, text_b: str) -> float:
        """
        Compute cosine similarity between two MO texts.

        Returns:
            Float in [0, 1]: 1.0 = identical MO, 0.0 = no overlap.
        """
        vec_a = self.vectorize(text_a)
        vec_b = self.vectorize(text_b)
        score = cosine_similarity(vec_a, vec_b)[0][0]
        return round(float(score), 4)

    def top_k_similar(self, query_text: str, k: int = 5) -> list:
        """
        Find the top-k most similar MO patterns in the corpus.

        Returns:
            List of dicts: {rank, similarity_score, meta}.
        """
        query_vec = self.vectorize(query_text)
        scores = cosine_similarity(query_vec, self.corpus_vectors)[0]
        top_k_indices = np.argsort(scores)[::-1][:k]

        results = []
        for rank, idx in enumerate(top_k_indices, start=1):
            results.append({
                "rank": rank,
                "similarity_score": round(float(scores[idx]), 4),
                "meta": self.corpus_meta[idx]
            })
        return results

    def save(self, vectorizer_path: str = VECTOR_PATH, corpus_path: str = CORPUS_PATH):
        """Persist vectorizer and corpus to disk."""
        os.makedirs(os.path.dirname(vectorizer_path), exist_ok=True)
        with open(vectorizer_path, "wb") as f:
            pickle.dump(self.vectorizer, f)
        with open(corpus_path, "wb") as f:
            pickle.dump({
                "vectors": self.corpus_vectors,
                "meta": self.corpus_meta
            }, f)

    @classmethod
    def load(cls, vectorizer_path: str = VECTOR_PATH, corpus_path: str = CORPUS_PATH):
        """Load a previously saved vectorizer and corpus from disk."""
        obj = cls()
        with open(vectorizer_path, "rb") as f:
            obj.vectorizer = pickle.load(f)
        with open(corpus_path, "rb") as f:
            bundle = pickle.load(f)
            obj.corpus_vectors = bundle["vectors"]
            obj.corpus_meta    = bundle["meta"]
        return obj


def build_and_save_from_dataset(data_path: str):
    """
    Convenience function: fit the MO vectorizer on the full FIR dataset
    and save it to disk.  Called at the end of train_models.py.
    """
    import pandas as pd
    print("[MO-VEC] Building MO vectorizer from dataset ...")
    df = pd.read_csv(data_path)

    texts = df["mo_text"].fillna("").tolist()
    meta  = df[["fir_id", "crime_type", "severity_score", "recidivism"]].to_dict(orient="records")

    vec = MOVectorizer()
    vec.fit(texts, metadata=meta)
    vec.save()
    print(f"[MO-VEC] Saved vectorizer -> {VECTOR_PATH}")
    print(f"[MO-VEC] Saved corpus     -> {CORPUS_PATH}")
    return vec


if __name__ == "__main__":
    DATA_PATH = os.path.join(BASE_DIR, "data", "fir_dataset.csv")
    build_and_save_from_dataset(DATA_PATH)
