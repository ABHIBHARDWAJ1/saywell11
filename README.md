# SAYWELL

NVC-based communication coach. Frontend (static, Vercel) + Backend (Node/Express, Render) + Firebase Auth/Firestore + Groq + Pexels.

## 1. Install (once)
Node.js 18+ and Git. Check: `node -v` and `git --version`.

## 2. Firebase setup (once)
1. console.firebase.google.com > project **saywell11** > Authentication > Sign-in method > enable **Google**.
2. Authentication > Settings > Authorized domains: add `localhost` (later also your Vercel domain).
3. Firestore Database > Create database > then Rules tab: paste `firestore.rules` from this folder > Publish.

## 3. Test on localhost (two terminals)
Terminal 1 (backend):
```
cd backend
npm install
npm run dev
```
Terminal 2 (frontend):
```
cd frontend
npx serve -l 3000 .
```
Open http://localhost:3000. `backend/.env` is already filled for local use.

## 4. Push to GitHub
Create an empty repo on github.com (no README), then from the saywell folder:
```
git init
git add .
git commit -m "SAYWELL first version"
git branch -M main
git remote add origin https://github.com/<you>/saywell.git
git push -u origin main
```
`.gitignore` keeps `backend/.env` off GitHub. Never commit it.

## 5. Deploy backend on Render
New > Web Service > connect repo. Root Directory `backend`, Build `npm install`, Start `npm start`, Free plan.
Environment variables: `GROQ_API_KEY`, `PEXELS_API_KEY`, `FIREBASE_PROJECT_ID=saywell11`, `FRONTEND_URL=https://<your-app>.vercel.app` (set after step 6).
Copy the Render URL (https://saywell-api.onrender.com). Free instances sleep, so the first request can take ~50 s.

## 6. Deploy frontend on Vercel
1. In `frontend/config.js` change `API` to the Render URL, then `git add . && git commit -m "api url" && git push`.
2. vercel.com > Add New Project > import repo. Root Directory `frontend`, Framework **Other**, no build command. Deploy.
3. Add the Vercel domain to Firebase > Authorized domains.
4. Set `FRONTEND_URL` on Render to the Vercel URL (comma-separate to keep `http://localhost:3000`), then redeploy Render.

## Changing things later
Edit code or env locally, test on localhost, `git push`. Render and Vercel redeploy automatically. Env changes on Render need a manual redeploy.

## Security
API keys live only in the backend. Rotate the Groq and Pexels keys after sharing them anywhere public.

## Machine learning (folder `ml/`)
`ml/generate_dataset.py` builds a 1,000,000-row English + Hinglish corpus (five gzip shards in `ml/data/`, each under GitHub's 100 MB limit) (7 patterns: judgment, blame, absolute, demand, vague request, sarcasm, threat). `ml/train.py` trains Logistic Regression, Decision Tree, Random Forest and a neural network (MLP), tests them on templates never seen in training, and writes `frontend/model_card.json` (shown at `/model.html`) plus `backend/model/saywell_clf.json` (the classifier the API runs at `/api/classify`).
```
cd ml
pip install pandas scikit-learn
python generate_dataset.py
python train.py
```
The corpus is synthetic, so treat the scores as pattern-learning scores, not real-world accuracy.

## App sections (v2)
After sign-in there is a sidebar on desktop and a bottom bar on phones: **Home · Communicate · Practice · Library · Insights**, plus Settings.

- **Home**: greeting, a quick "What are you trying to say?" box, four quick actions, your last three analyses, a weekly pattern note and lesson progress.
- **Communicate**: *Analyze* (workspace with context, tone, goal, "do not change" toggles, voice slider, length, English/Hinglish, inline pattern underlines, four rewrites with "why this changed", rewrite-controls drawer, before/after), *Reply* (what their message may be doing, choose a goal, "before you reply" options, drafts) and *Repair* (conversation lens: pattern flow, turning point, click any message for a rewrite, screenshot OCR with a check-every-line step, repair drafts).
- **Practice**: *Conversations* (scenario cards, three levels, full-screen simulator with a live checklist and a post-conversation review), *Learn* (8 lessons with drills and progress, adaptive suggestion from your patterns) and *Guide* (feelings, needs with a request builder, requests, patterns, boundaries, listening, repair).
- **Your space**: *Library* (saved phrases with search, filters, edit) and *History* (what you analyzed), *Insights* (patterns with try-this actions and a weekly reflection).
- **Settings**: Account, Communication defaults, Privacy (save-history switch, export, delete history, delete account), Experience (theme, reduce motion), About.
- A short onboarding runs once after first sign-in. The home page has a **Try Saywell** box that works without an account (rate-limited).

Everything saved (analyses, library, practice sessions, progress, preferences) lives per account in Firestore under `users/<uid>/...`, covered by the same `firestore.rules`. Reply, Practice, Analyze and the demo need the Groq key; the lens and live pattern hints run on the trained classifier alone.

## Chrome extension (folder `extension/`)
Everything runs only when you ask: type in the popup, right-click a selection and choose "Analyze with SAYWELL", or press **Alt+Shift+S** on selected text or inside a text box. A small card appears on the page with the patterns noticed and "Open in SAYWELL"; "Make this clearer" in the popup opens the web app and runs the full rewrite.
1. Open `chrome://extensions`, switch on Developer mode, press Load unpacked, choose the `extension` folder.
2. After deploying, edit `API` and `WEB` at the top of `background.js` and `popup.js` (Render URL and Vercel URL), add both hosts to `host_permissions` in `manifest.json`, then press the reload icon on the extension.

## Before you go live
- Set `API` in `frontend/config.js` and, if you want a Contact link in Settings, `CONTACT_EMAIL`.
- `privacy.html` and `terms.html` are plain-language drafts. Have them reviewed before a public launch.
- The home page testimonials are labelled "Example feedback". Replace them with real quotes only when you have real users.
- Rotate the Groq and Pexels keys if this folder was ever shared (the zip includes `backend/.env`).
- On Render set `FRONTEND_URL` to your Vercel URL (comma-separate to keep `http://localhost:3000`). New endpoints in v2: `/api/demo`, `/api/rewrite`; `/api/reply`, `/api/practice`, `/api/lens` returned richer data (old fields are still present).

## What changed in v3
- **Groq model**: `llama-3.3-70b-versatile` is retired for free and developer keys. The backend now uses `openai/gpt-oss-120b` and falls back to `openai/gpt-oss-20b` automatically. Change it with `GROQ_MODEL` in `backend/.env` (comma-separated list, first one is tried first). On Render, add `GROQ_MODEL` too or leave it unset to use the defaults.
- **Video everywhere**: one cinematic looping video sits behind every page and every landing section and crossfades as you scroll or change page (`frontend/js/bg.js`, queries in the `BG` map at the top). It needs `PEXELS_API_KEY` on the backend.
- **More pages**: `features.html`, `method.html`, `extension.html` (install steps + download), plus restyled `privacy.html`, `terms.html`, `model.html`. Inside the app there is a new **Toolkit** (Say no, Set a boundary, Apologize, Start a hard talk) backed by `POST /api/build`.
- **Extension download**: `frontend/downloads/saywell-extension.zip` is linked on the landing header, hero, a landing section, every static page, the app sidebar and the mobile More menu. If you edit `extension/`, rebuild it: `cd extension && zip -r ../frontend/downloads/saywell-extension.zip .`
- **Motion and polish**: `frontend/polish.css` (glass surfaces, page transitions, scroll reveals, button sheen, reduced-motion respected).
- **Guide copy**: rewrite cards are now Keep my voice / Clearer / Direct / NVC style; Reply says "What we can tell from this message"; "Use this"; "Keep what matters"; mobile bar says Analyze; landing hero uses "Try it with your words".
- **Dataset**: 1,000,000 rows, retrained; see `/model.html` for the new scores.

## If Practice / Analyze says "could not reach the AI" (502)
1. Open http://localhost:8080/api/llm-test in the browser. It shows whether `GROQ_API_KEY` is set and the exact Groq error for each model (wrong key, model not enabled for your account, rate limit).
2. The backend terminal also prints a `[llm] <model> Groq <status>: <message>` line for every failed call.
3. If a model is not enabled for your key, set `GROQ_MODEL=<a model from console.groq.com/docs/models>` in `backend/.env` and restart `npm run dev`. On Render, add the same variable and redeploy.
