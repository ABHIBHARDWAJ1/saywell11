"""Trains 4 model families on the SAYWELL corpus, evaluates on UNSEEN templates, exports the deployed model + model card."""
import json, time, numpy as np, pandas as pd
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.multiclass import OneVsRestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.metrics import precision_recall_fscore_support as prf, f1_score, multilabel_confusion_matrix as mcm
L = ["judgment","blame","absolute","demand","vague_request","sarcasm","threat"]
import glob
df = pd.concat([pd.read_csv(p) for p in sorted(glob.glob("data/saywell_dataset_part*.csv.gz"))], ignore_index=True); tr, te = df[df.split=="train"], df[df.split=="test"]
vec = CountVectorizer(binary=True, ngram_range=(1,2), min_df=8, max_features=40000, token_pattern=r"[a-z0-9']+")
Xtr, Xte = vec.fit_transform(tr.text), vec.transform(te.text); Ytr, Yte = tr[L].values, te[L].values
sub = np.random.RandomState(0).choice(len(tr), 60000, replace=False)
M = {"Logistic Regression": (OneVsRestClassifier(LogisticRegression(C=4, max_iter=300), n_jobs=-1), None),
     "Decision Tree": (DecisionTreeClassifier(max_depth=40, random_state=0), sub),
     "Random Forest": (RandomForestClassifier(n_estimators=30, max_depth=40, n_jobs=-1, random_state=0), sub),
     "Neural Network (MLP)": (MLPClassifier((64,), max_iter=12, early_stopping=True, random_state=0), sub)}
card = {"dataset": {"rows": len(df), "train": len(tr), "test": len(te), "english": int((df.lang=="en").sum()), "hinglish": int((df.lang=="hinglish").sum()),
  "labels": {l: int(df[l].sum()) for l in L}, "split": "Group split: test rows use sentence templates never seen in training."},
  "note": "The corpus is synthetic (composed from hand-written templates), so scores show how well each model learns these patterns, not accuracy on real chats. Replace or extend it with real labeled messages before claiming real-world accuracy.",
  "deployed": "Logistic Regression", "models": []}
for name, (m, idx) in M.items():
    t = time.time(); X, Y = (Xtr, Ytr) if idx is None else (Xtr[idx], Ytr[idx]); m.fit(X, Y); sec = round(time.time()-t, 1)
    P = m.predict(Xte); p, r, f, _ = prf(Yte, P, zero_division=0)
    card["models"].append({"name": name, "train_rows": X.shape[0], "train_seconds": sec, "macro_f1": round(f1_score(Yte, P, average="macro", zero_division=0), 4),
      "micro_f1": round(f1_score(Yte, P, average="micro", zero_division=0), 4),
      "per_label": {l: {"precision": round(p[i],3), "recall": round(r[i],3), "f1": round(f[i],3), "tn_fp_fn_tp": mcm(Yte, P)[i].ravel().tolist()} for i, l in enumerate(L)}})
    print(name, card["models"][-1]["macro_f1"], sec, "s", flush=True)
from sklearn.linear_model import Ridge
Wt = np.array([.8,.9,.6,.7,.3,.6,1.0]); ttr, tte = np.clip(Ytr @ Wt / 1.6, 0, 1), np.clip(Yte @ Wt / 1.6, 0, 1)
pt = np.clip(Ridge(alpha=1.0).fit(Xtr, ttr).predict(Xte), 0, 1)
card["regression"] = {"name": "Ridge Regression (tension score)", "mae": round(float(np.abs(pt - tte).mean()), 4), "r2": round(float(1 - ((pt - tte) ** 2).sum() / ((tte - tte.mean()) ** 2).sum()), 4)}
print(card["regression"])
lr = M["Logistic Regression"][0]
json.dump({"labels": L, "vocab": [t for t, _ in sorted(vec.vocabulary_.items(), key=lambda x: x[1])], "b": [round(float(e.intercept_[0]),4) for e in lr.estimators_],
  "w": [{int(i): round(float(v),3) for i, v in enumerate(e.coef_[0]) if abs(v) > .05} for e in lr.estimators_]}, open("../backend/model/saywell_clf.json", "w"))
json.dump(card, open("../frontend/model_card.json", "w"), indent=1)
