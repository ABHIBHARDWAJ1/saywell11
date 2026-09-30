/* Static content: lessons, drills, guide, practice scenarios. Wording is possibilities, never diagnoses. */

export const SAMPLES = [
  "You never care about what I say.",
  "Seriously? You always do this. I can't believe I have to remind you again.",
  "Yaar tum hamesha last minute pe cancel kar dete ho, kabhi socha hai mujhe kaisa lagta hoga?",
  "This is the third time your part is late. Do your job."
];

export const EXAMPLES = [
  "You never listen to me and I'm honestly done repeating myself.",
  "Tum hamesha phone mein busy rehte ho, meri koi value hi nahi hai.",
  "I can't believe you told everyone about that after I asked you not to.",
  "Why do I always have to do everything around here?"
];

/* ---------- Learn: 8 modules ---------- */
export const MODULES = [
  { id: 'm1', title: 'Observation vs judgment', skill: 'Observation', intro: 'An observation is what a camera could record. A judgment is the verdict you add on top of it.',
    bad: 'You are so irresponsible.', good: 'You were 30 minutes late.',
    drills: [
      ['You were 30 minutes late.', ['Observation', 'Judgment'], 0, 'It says what happened, with no verdict.'],
      ['You are so irresponsible.', ['Observation', 'Judgment'], 1, '"Irresponsible" is a verdict about the person.'],
      ['You never listen to me.', ['Observation', 'Judgment'], 1, '"Never" turns one moment into a verdict.'],
      ['When I was mid-sentence, the topic changed.', ['Observation', 'Judgment'], 0, 'It describes the moment and nothing more.']] },
  { id: 'm2', title: 'Feeling vs thought', skill: 'Feelings', intro: 'A feeling is an emotion you experience. A thought about what someone did often hides behind the words "I feel".',
    bad: 'I feel ignored.', good: 'I feel lonely.',
    drills: [
      ['I feel ignored.', ['Feeling', 'Thought'], 1, '"Ignored" is what you think someone did. "Lonely" or "hurt" would be a feeling.'],
      ['I feel worried.', ['Feeling', 'Thought'], 0, '"Worried" is an emotion you experience.'],
      ["I feel like you don't respect me.", ['Feeling', 'Thought'], 1, '"I feel like..." usually introduces a thought. The feeling could be hurt or discouraged.']] },
  { id: 'm3', title: 'Need vs strategy', skill: 'Needs', intro: 'A need is what matters to you. A strategy is one specific way to meet it. Many strategies can meet one need.',
    bad: 'I need you to text me every hour.', good: 'I need reassurance that we are okay.',
    drills: [
      ['I need you to text me every hour.', ['Need', 'Strategy'], 1, 'Hourly texts are one way to meet a need. The need may be reassurance.'],
      ['I need reassurance that we are okay.', ['Need', 'Strategy'], 0, 'Reassurance is a need. Many actions could meet it.'],
      ['I need you to quit that group.', ['Need', 'Strategy'], 1, 'Quitting the group is one strategy. The need might be belonging or trust.'],
      ['I need to be heard.', ['Need', 'Strategy'], 0, 'Being heard is a need. It does not say how it must happen.']] },
  { id: 'm4', title: 'Request vs demand', skill: 'Requests', intro: 'A request leaves room for a real "no". A demand carries a penalty for saying it, spoken or not.',
    bad: 'Reply to me right now or else.', good: 'Would you be willing to reply within a day?',
    drills: [
      ['Would you be willing to reply within a day?', ['Request', 'Demand'], 0, 'A request leaves room for a real no.'],
      ['Reply to me right now or else.', ['Request', 'Demand'], 1, 'A demand carries a penalty for saying no.'],
      ["You'd better apologize.", ['Request', 'Demand'], 1, 'It leaves no room for a no.'],
      ['Could you tell me by Friday if this works?', ['Request', 'Demand'], 0, 'It is specific, doable and open to a no.']] },
  { id: 'm5', title: 'Blame vs responsibility', skill: 'Feelings', intro: 'You can own your feeling without handing its cause to the other person. Owning does not mean excusing.',
    bad: 'You made me angry.', good: 'I felt angry when the plan changed.',
    drills: [
      ['You made me angry.', ['Owning a feeling', 'Blaming'], 1, 'It hands your feeling to them. "I felt angry when..." keeps it yours.'],
      ['I felt angry when the plan changed.', ['Owning a feeling', 'Blaming'], 0, 'It names your feeling and the moment.'],
      ["It's your fault I'm stressed.", ['Owning a feeling', 'Blaming'], 1, 'It assigns the cause of your stress to them.'],
      ["I'm stressed, and I'd like help planning this.", ['Owning a feeling', 'Blaming'], 0, 'It owns the feeling and asks for something.']] },
  { id: 'm6', title: 'Boundaries', skill: 'Boundaries', intro: 'A boundary says what you will do or what you are not available for. It is not an order about what someone else must do.',
    bad: "You can't text me after 10 pm.", good: "I won't reply to messages after 10 pm.",
    drills: [
      ["I won't reply to messages after 10 pm.", ['A boundary', 'An order'], 0, 'It says what you will do. You control it.'],
      ["You can't text me after 10 pm.", ['A boundary', 'An order'], 1, 'It tries to control them. A boundary describes your own action.'],
      ["I'm not comfortable with jokes about my family. I'll leave if they continue.", ['A boundary', 'An order'], 0, 'It states a limit and what you will do.'],
      ['Stop being such a jerk about my family.', ['A boundary', 'An order'], 1, 'It attacks the person and gives no limit you can hold.']] },
  { id: 'm7', title: 'Listening', skill: 'Listening', intro: 'Listening is showing someone what you heard before you answer. It is not agreeing.',
    bad: "You're overreacting, it was nothing.", good: 'What I hear is that you felt left out. Is that right?',
    drills: [
      ['What I hear is that you felt left out. Is that right?', ['Listening', 'Defending'], 0, 'It reflects what they said and checks.'],
      ["You're overreacting, it was nothing.", ['Listening', 'Defending'], 1, 'It dismisses the feeling instead of hearing it.'],
      ['Tell me more about what happened for you.', ['Listening', 'Defending'], 0, 'It stays curious and gives them space.'],
      ['Well, I only did that because you did it first.', ['Listening', 'Defending'], 1, 'It turns the moment back onto them.']] },
  { id: 'm8', title: 'Repair after conflict', skill: 'Repair', intro: 'Repair names what you did, says what it may have cost, and offers a way forward. It does not ask them to feel differently.',
    bad: "I'm sorry you feel that way.", good: "I'm sorry I raised my voice. I want to try again.",
    drills: [
      ["I'm sorry I raised my voice. I want to try again.", ['Repair', 'Not repair'], 0, 'It owns a specific action and offers a next step.'],
      ["I'm sorry you feel that way.", ['Repair', 'Not repair'], 1, 'It puts the problem in their feeling, not in your action.'],
      ['I said it because you started it.', ['Repair', 'Not repair'], 1, 'It blames instead of owning your part.'],
      ['I want to hear what happened for you, then tell you what happened for me.', ['Repair', 'Not repair'], 0, 'It makes room for both sides.']] }
];
export const MOD_BY_ID = Object.fromEntries(MODULES.map(m => [m.id, m]));
export const PATTERN_MODULE = { judgment: 'm1', absolute: 'm1', blame: 'm5', demand: 'm4', vague_request: 'm4', sarcasm: 'm2', threat: 'm6' };
export const SKILLS = [['m1', 'Observation'], ['m2', 'Feelings'], ['m3', 'Needs'], ['m4', 'Requests'], ['m6', 'Boundaries'], ['m7', 'Listening'], ['m8', 'Repair']];

export const TRY_THIS = {
  absolute: 'Replace "always" or "never" with one specific example of when it happened.',
  judgment: 'Turn one judgment into a plain description of what happened.',
  blame: 'Swap "you made me feel" for "I felt ... when ...".',
  demand: 'Turn one demand into a question the other person could say no to.',
  vague_request: 'Name one specific, doable thing, with a time if it helps.',
  sarcasm: 'Say the plain feeling once, even if it is short.',
  threat: 'Pause before sending. Give it an hour, then read it again.'
};

/* ---------- Guide ---------- */
export const FEEL = {
  Hurt: { like: ['hurt', 'disappointed', 'let down', 'lonely', 'rejected'], needs: ['Connection', 'Care', 'Understanding', 'Trust'], say: 'I felt hurt when the plan changed without me knowing.' },
  Angry: { like: ['frustrated', 'irritated', 'resentful', 'annoyed', 'furious'], needs: ['Respect', 'Fairness', 'Autonomy', 'Consistency'], say: 'I felt frustrated when my part was left out of the decision.' },
  Anxious: { like: ['worried', 'nervous', 'overwhelmed', 'uneasy', 'tense'], needs: ['Safety', 'Reassurance', 'Clarity', 'Rest'], say: 'I feel uneasy when I do not hear back, and I would like to know where we stand.' },
  Sad: { like: ['sad', 'discouraged', 'grieving', 'drained', 'hopeless'], needs: ['Comfort', 'Meaning', 'Connection', 'Support'], say: 'I feel drained lately, and I would like some company this weekend.' },
  Confused: { like: ['confused', 'torn', 'puzzled', 'unsure', 'hesitant'], needs: ['Clarity', 'Understanding', 'Consistency', 'Trust'], say: 'I feel unsure about what you meant, and I would like to check I understood.' },
  Hopeful: { like: ['hopeful', 'relieved', 'grateful', 'calm', 'connected'], needs: ['Appreciation', 'Connection', 'Meaning', 'Play'], say: 'I felt grateful when you stayed to help, and it mattered to me.' }
};
export const FEEL_NOTE = 'These are possibilities, not diagnoses. Words like "ignored" or "betrayed" describe what someone did, not how you feel. Try "lonely" or "hurt" instead.';

export const NEEDS = {
  Connection: { what: 'Wanting closeness, presence or belonging.', reqs: ['Could we have one hour together this weekend, phones away?', 'Would you text me when you get home?'] },
  Autonomy: { what: 'Wanting to choose how you do things.', reqs: ['Could I decide how I do this part and check in with you on Friday?', 'Would you be okay with me choosing this one?'] },
  Respect: { what: 'Wanting to be taken seriously and treated with consideration.', reqs: ['Could we agree to let each other finish a sentence?', 'Would you be willing to give me feedback in private?'] },
  Understanding: { what: 'Wanting to be understood, not just answered.', reqs: ['Could I explain my side for two minutes, then you tell me what you heard?', 'Would you tell me what you understood from that?'] },
  Safety: { what: 'Wanting to feel physically and emotionally secure.', reqs: ['Could we pause this if either of us raises our voice?', 'Would you tell me before you share this with others?'] },
  Rest: { what: 'Wanting space and energy to recover.', reqs: ['Could we talk about this tomorrow morning instead?', 'Can I take an hour to myself tonight?'] },
  Meaning: { what: 'Wanting what you do to matter.', reqs: ['Could we pick one thing this month that matters to both of us?', 'Would you help me see how this task connects to the bigger goal?'] },
  Trust: { what: 'Wanting to rely on what is said and done.', reqs: ['Would you tell me if plans might change, even if it is uncomfortable?', 'Could we check in on this on Sunday?'] },
  Reliability: { what: 'Wanting things to happen when they were agreed.', reqs: ['Could we agree on one way to remind each other?', 'Would you tell me by Thursday if you cannot finish this?'] },
  Appreciation: { what: 'Wanting effort to be noticed.', reqs: ['Would you tell me one thing that worked in this?', 'Could we start our meeting with what went well?'] }
};

export const PATTERNS = [
  ['Judgment', 'A verdict about a person instead of a description of what happened.', '"You are so lazy."', '"The dishes were still in the sink this morning."'],
  ['Blame', 'Handing the cause of your feeling to someone else.', '"You made me feel stupid."', '"I felt embarrassed when the mistake was pointed out in the meeting."'],
  ['Absolute language', 'Always, never, everyone, no one. One moment turned into a rule.', '"You never help."', '"Last week and today I did the cooking alone."'],
  ['Demand', 'A request that carries a penalty for saying no.', '"Call me back now."', '"Would you be able to call me back this evening?"'],
  ['Unclear request', 'A wish that does not say what would help.', '"I just want more effort."', '"Could you send your draft by Wednesday so I can review it?"'],
  ['Possible sarcasm', 'Wit that hides the real feeling underneath.', '"Great, thanks for the warning."', '"I was disappointed when I found out at the last minute."']
];

export const GUIDE_PROSE = {
  Requests: `<p>A request is something another person could say yes or no to. Most stuck conversations are missing one.</p>
<h3>A good request is</h3><ul><li><b>Specific.</b> "Text me when you arrive" instead of "be more considerate".</li><li><b>Doable.</b> Something they can do soon, not a change in who they are.</li><li><b>Positive.</b> What you would like, not only what you want them to stop.</li><li><b>Open to a no.</b> If a no would make you angry, it is a demand.</li></ul>
<h3>Try the difference</h3><p><b>Demand:</b> "Stop being late."<br><b>Request:</b> "Would you text me if you are going to be more than ten minutes late?"</p>`,
  Boundaries: `<p>A boundary describes what you will do, or what you are not available for. You can hold it without anyone's permission.</p>
<h3>A simple shape</h3><ol><li>Name the situation.</li><li>Say what you are not okay with, in your own terms.</li><li>Say what you will do.</li></ol>
<p><b>Example:</b> "When the jokes about my family continue, I am not comfortable. I will leave the room if it happens again."</p>
<h3>Common slips</h3><ul><li>Hedging: "maybe", "if that is okay". It softens the limit.</li><li>Ordering: "You can't...". A boundary is about your action.</li><li>Threatening: a consequence you would not actually follow through on.</li></ul>`,
  Listening: `<p>Listening is showing someone what you heard before you respond. It does not mean you agree.</p>
<h3>Three moves</h3><ol><li><b>Reflect.</b> "What I hear is that you felt left out."</li><li><b>Check.</b> "Is that right?"</li><li><b>Ask.</b> "Is there more?"</li></ol>
<h3>Before defending yourself</h3><p>The urge to explain comes fast. Try one reflection first, then say your side.</p>`,
  'Conflict repair': `<p>Repair is what you do after a conversation went badly. It does not need to wait for them.</p>
<h3>Steps</h3><ol><li><b>Name your part.</b> Something specific you did or said.</li><li><b>Acknowledge the impact.</b> What it may have cost them.</li><li><b>Say what you want.</b> Usually to talk again, calmer.</li><li><b>Offer what you will do differently.</b> Small and real.</li></ol>
<p><b>Example:</b> "I raised my voice earlier and cut you off. I think that made it hard to say what you meant. I would like to try again tomorrow, and I will let you finish first."</p>`
};
export const GUIDE_TABS = ['Feelings', 'Needs', 'Requests', 'Patterns', 'Boundaries', 'Listening', 'Conflict repair'];

/* ---------- Practice ---------- */
export const SCENARIOS = [
  { id: 'bound', t: 'Set a boundary', b: 'A friend calls late at night when you need to sleep.', s: 'A friend keeps calling you late at night when you need to sleep' },
  { id: 'feed', t: 'Give feedback', b: 'A teammate keeps submitting their part late.', s: 'A teammate keeps submitting their part late' },
  { id: 'supp', t: 'Ask for support', b: 'You are overwhelmed and want help from family.', s: 'You are overwhelmed and want help with household work from a family member' },
  { id: 'crit', t: 'Handle criticism', b: 'A senior criticizes your work in front of others.', s: 'A senior criticizes your work in front of others' },
  { id: 'disa', t: 'Deal with disappointment', b: 'A friend cancels plans at the last minute.', s: 'A friend cancels plans at the last minute' },
  { id: 'no', t: 'Say no', b: 'A colleague asks you to take on one more task.', s: 'A colleague asks you to take on one more task when you are already full' },
  { id: 'unc', t: 'Bring up something uncomfortable', b: 'Your roommate leaves the kitchen messy.', s: 'Your roommate leaves the kitchen messy' },
  { id: 'hear', t: 'Be heard', b: 'A family member interrupts you when you speak.', s: 'A family member interrupts you when you speak' }
];
export const LEVELS = [
  ['Beginner', 'They listen.'], ['Intermediate', 'They become defensive.'], ['Advanced', 'They push back, disagree, say no, misunderstand, or change the subject.']
];

/* ---------- Landing ---------- */
export const DEMOS = [
  { tab: 'After an argument', before: "Seriously? You always do this. I can't believe I have to remind you again.", after: "When this keeps happening, I feel frustrated, because reliability matters to me. Could we agree on one way to remind each other?", ch: ['Specific instead of absolute', 'Feeling owned instead of assigned', 'Need made visible', 'Request made actionable'] },
  { tab: 'At work', before: 'This is the third time your part is late. Do your job.', after: "Your part came in after the deadline for the third time this month. I'm worried about the handoff. Could you tell me by Thursday what would help you finish on time?", ch: ['Fact instead of verdict', 'Worry named', 'Request has a time'] },
  { tab: 'With family (Hinglish)', before: 'Aap kabhi meri baat sunte hi nahi ho, hamesha beech mein bol dete ho.', after: 'Jab main baat kar raha hota hu aur aap beech mein bol dete ho, mujhe bura lagta hai. Mere liye zaroori hai ki meri baat poori suni jaye. Kya aap pehle meri baat poori sun sakte hain?', ch: ['Hinglish kept', 'Specific moment', 'Need made visible'] }
];
export const FEEDBACK = [
  ['I stopped sending 1 AM texts I would regret. The "why" behind each change taught me more than the rewrite.', 'Example feedback'],
  ['Hinglish stays Hinglish. That is the reason I would keep using it.', 'Example feedback'],
  ['It never tells me what I feel. It gives options and lets me pick.', 'Example feedback']
];
