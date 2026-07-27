"""
Sentiment scoring via a pretrained RoBERTa model fine-tuned for sentiment
(cardiffnlp/twitter-roberta-base-sentiment-latest — trained on social text,
which fits Reddit/YouTube comments much better than a generic news-trained model).

The pipeline is lazy-loaded on first use and cached, so importing this module
doesn't pay the model-download/load cost until sentiment analysis actually runs.
"""

from functools import lru_cache

from transformers import pipeline

MODEL_NAME = "cardiffnlp/twitter-roberta-base-sentiment-latest"

# Model outputs "negative" / "neutral" / "positive" — mapped to our 0-100 scale
_LABEL_TO_BASE_SCORE = {"negative": 15, "neutral": 50, "positive": 85}


@lru_cache(maxsize=1)
def _get_pipeline():
    return pipeline("sentiment-analysis", model=MODEL_NAME, tokenizer=MODEL_NAME, truncation=True)


def analyze(text: str) -> tuple[str, float]:
    """Returns (label, score) where label is 'positive'/'negative'/'neutral'
    and score is 0-100, weighted by the model's confidence."""
    if not text or not text.strip():
        return "neutral", 50.0

    result = _get_pipeline()(text[:512])[0]  # truncate very long comments
    label = result["label"].lower()
    confidence = result["score"]  # 0-1

    base = _LABEL_TO_BASE_SCORE.get(label, 50)
    # Pull the score toward the base by confidence, so a low-confidence
    # "positive" lands closer to neutral than a high-confidence one.
    score = 50 + (base - 50) * confidence

    return label, round(score, 1)


def analyze_batch(texts: list[str]) -> list[tuple[str, float]]:
    """Batched version — much faster than calling analyze() in a loop
    for ingestion runs with many mentions."""
    if not texts:
        return []

    clf = _get_pipeline()
    results = clf([t[:512] if t else "" for t in texts])

    output = []
    for result in results:
        label = result["label"].lower()
        confidence = result["score"]
        base = _LABEL_TO_BASE_SCORE.get(label, 50)
        score = 50 + (base - 50) * confidence
        output.append((label, round(score, 1)))
    return output