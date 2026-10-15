"""
Calibrate scoring weights against human ratings.

Usage:
    python tools/calibrate_weights.py ratings.csv

CSV columns (one row per answer):
    human_score          1-5 rating from a human rater (mean of raters if several)
    question_type        technical | behavioural | hr   (optional)
    star, relevance5, keyword, depth_flu, grammar, llm_judge
                         component scores on the 0-5 scale (relevance5 = relevance*5).
                         Take them from the /evaluate response (nlp_detail / scores / llm_judge).

Reports Pearson, Spearman and quadratic-weighted kappa for:
  * your current hand-picked weights
  * non-negative least-squares fitted weights (sum normalised to 1)
Use 5-fold CV numbers (printed) in any paper, not the in-sample fit.
"""
import csv
import sys

import numpy as np

COMPONENTS = ["star", "relevance5", "keyword", "depth_flu", "grammar", "llm_judge"]
CURRENT = {"star": 0.25, "relevance5": 0.30, "keyword": 0.10, "depth_flu": 0.30, "grammar": 0.05, "llm_judge": 0.0}


def _rank(x):
    order = np.argsort(x)
    r = np.empty(len(x))
    r[order] = np.arange(len(x))
    return r


def spearman(a, b):
    return float(np.corrcoef(_rank(a), _rank(b))[0, 1])


def qwk(a, b, lo=1, hi=5):
    a, b = np.clip(np.rint(a), lo, hi).astype(int), np.clip(np.rint(b), lo, hi).astype(int)
    n = hi - lo + 1
    O = np.zeros((n, n))
    for x, y in zip(a, b):
        O[x - lo, y - lo] += 1
    E = np.outer(O.sum(1), O.sum(0)) / max(1, O.sum())
    W = np.array([[(i - j) ** 2 for j in range(n)] for i in range(n)]) / (n - 1) ** 2
    return float(1 - (W * O).sum() / max(1e-9, (W * E).sum()))


def nnls(X, y, iters=5000, lr=0.01):
    try:
        from scipy.optimize import nnls as _nnls
        return _nnls(X, y)[0]
    except Exception:
        w = np.full(X.shape[1], 1.0 / X.shape[1])
        for _ in range(iters):
            w = np.maximum(0, w - lr * X.T @ (X @ w - y) / len(y))
        return w


def report(name, pred, y):
    print(f"{name:28s} pearson={np.corrcoef(pred, y)[0, 1]:.3f} spearman={spearman(pred, y):.3f} "
          f"QWK={qwk(pred, y):.3f} MAE={np.abs(pred - y).mean():.3f}")


def main(path):
    rows = list(csv.DictReader(open(path, encoding="utf-8")))
    cols = [c for c in COMPONENTS if c in rows[0]]
    X = np.array([[float(r[c] or 0) for c in cols] for r in rows])
    y = np.array([float(r["human_score"]) for r in rows])
    print(f"{len(y)} rated answers, components: {cols}")
    cur = np.array([CURRENT[c] for c in cols]); cur = cur / cur.sum() if cur.sum() else cur
    report("current weights", X @ cur, y)

    w = nnls(X, y)
    w = w / w.sum()
    report("fitted (in-sample)", X @ w, y)
    print("fitted weights:", {c: round(float(v), 3) for c, v in zip(cols, w)})

    idx = np.random.default_rng(0).permutation(len(y))
    folds = np.array_split(idx, min(5, len(y)))
    cv = np.zeros(len(y))
    for f in folds:
        tr = np.setdiff1d(idx, f)
        wf = nnls(X[tr], y[tr]); wf = wf / max(wf.sum(), 1e-9)
        cv[f] = X[f] @ wf
    report("fitted (cross-validated)", cv, y)


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
