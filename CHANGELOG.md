# SAYWELL v2: product audit implementation

Kept from v1: Firebase Google sign-in, Firestore per-user data, Groq backend, trained classifier + model card, OCR screenshots, export/delete, Hinglish support, the dark editorial look (Fraunces + Inter + gold).

## New / changed
- Information architecture: Home · Communicate (Analyze, Reply, Repair) · Practice (Conversations, Learn, Guide) · Library · Insights · Settings. Sidebar on desktop, bottom nav on mobile. Explore + Learn/Drill merged into Learn (lessons) and Guide (reference).
- Landing: new hero with live example card, before/after demo, scroll story of the four NVC steps, four "moments" cards, trust section (honest "Don't save to history" wording), labelled example feedback, no-account Try Saywell.
- Onboarding (3 questions + done), Home dashboard.
- Analyze: chips for context/tone/goal, editor with Example/Paste/Clear, inline underlines with explanations, What happened → underneath → ask hierarchy, four rewrites each with Copy/Save/Edit/Use/Practice and "Why this changed", before/after, rewrite-controls drawer (presets + sliders), voice/length/language/keep-my-Hinglish, Keep boundary/emotion/meaning, relationship detail, staged loading, error state that keeps your text, saved draft.
- Edge cases: "Am I wrong?", manipulation reframe, angry-but-legitimate ("Clearer doesn't mean softer"), calm safety interruption with helpline info (server-side self-harm check added).
- Reply: goal cards, "what their message might be doing", "Before you reply" options (reply now / pause / ask / boundary / don't engage), four drafts.
- Repair (lens): "pattern intensity" instead of "tension", turning point + before/here/after, clickable timeline with per-message rewrite, screenshot validation step (edit, ignore, delete, join, set speaker).
- Practice: 8 scenarios + custom, level descriptions, full-screen simulator, live checklist, post-conversation review, "Practice saying it" from Analyze.
- Learn: 8 lessons, progress, adaptive suggestion. Guide: feelings, needs (+request builder), requests, patterns, boundaries, listening, repair.
- Library (search, filters, edit) separated from History. Insights with try-this actions and weekly reflection. Settings in sections, theme, reduce motion, delete account.
- Extension 2.0: card on page, keyboard shortcut, popup with patterns and Make this clearer.
- Static pages: model card restyled, privacy and terms drafts.

## Not built (needs more than a code change, or the guide said "later")
- Voice input, boundary builder, apology builder, conversation templates, notifications, learned personal style, an always-on typing indicator in the extension (kept user-triggered on purpose).
- Real testimonials.

## v3
- Groq: gpt-oss-120b with gpt-oss-20b fallback (llama-3.3-70b retired).
- Dataset 200k -> 1,000,000 rows (5 gz shards), wider vocabulary, retrained classifier and model card.
- Video background on all pages and sections, crossfading.
- New pages: Features, Method, Extension; new in-app Toolkit; extension download links everywhere.
- Animations and glass surfaces (polish.css); copy updates from the product guide.

## v4 (extension 4.0 + background)
- Extension 4.0: new popup ("What are you about to send?"), status dot, Paste/Clear, Clearer/Kinder/Firmer/Shorter, patterns you can tap for an explanation, a suggested version with Copy / Edit / Open full Saywell / Why this changed, quick "Hard conversation" buttons (Set a boundary, Say no, Start the conversation open the web Toolkit with your text), clear empty / typing / analyzing / result / error states, calm wording for no / one / many patterns, long-text note, safety-sensitive wording notice, and "Analyze automatically after I pause" (off by default).
- On-page card (Shadow DOM): patterns, "Make this clearer", suggested version with mode pills, Copy, Edit, and Replace text (asks first and only replaces if the box is unchanged). Right-click menu: SAYWELL > Analyze selection / Rewrite selection / Open full editor. First-use shortcut tip. Alt+Shift+S kept.
- Backend: new POST /api/ext (no login, 15 requests/minute) returning patterns + one suggested rewrite; /api/pexels now falls back to any orientation (phone clips are often vertical).
- Web app: opens Analyze or Toolkit from the extension (#t=...&go=toolkit&tool=boundary|no|opener).
- Background video: one Pexels clip of a person chatting on their phone on the landing page and every other page (stays loaded between pages, dimmed inside the app for readability).
