"""Synthetic labeled corpus (English + Hinglish) for SAYWELL v3: 1,000,000 rows. Template-composed; see model card for limits."""
import random, csv
random.seed(7)
L = ["judgment","blame","absolute","demand","vague_request","sarcasm","threat"]
A = dict(en=["interrupt me","ignore my texts","forget what I said","show up late","leave the dishes","cancel our plans","change the subject","check your phone while I talk","take forever to reply","make plans without me","skip our calls","talk over me","promise and then forget","leave me on read","bring up old stuff","joke about my problems","miss deadlines","never share the work","come home late","spend all day gaming","dodge my questions","raise your voice","hang up on me","ignore my boundaries"],
 hi=["mujhe beech mein rok dete ho","mere messages ignore karte ho","meri baat bhool jaate ho","late aate ho","bartan chhod dete ho","plans cancel kar dete ho","baat badal dete ho","meri baat ke beech phone dekhte ho","reply karne mein ghanta laga dete ho","mere bina plan bana lete ho","call skip kar dete ho","meri baat kaat dete ho","promise karke bhool jaate ho","seen karke chhod dete ho","purani baatein le aate ho","meri problem ka mazaak udaate ho","deadline miss kar dete ho","kaam share nahi karte ho","der raat ghar aate ho","din bhar game khelte ho","sawaal taal dete ho","chillate ho","phone kaat dete ho","meri limits ignore karte ho"])
J = dict(en=["selfish","careless","lazy","rude","immature","irresponsible","clueless","inconsiderate","toxic","dramatic","two-faced","pathetic","spoiled","cold","fake","stubborn","childish"],
 hi=["selfish","careless","lazy","badtameez","immature","laparwah","bekaar","ghatiya","toxic","dramebaaz","do-muhe","pathetic","bigda hua","pattharo jaisa","nakli","ziddi","bachkana"])
F = dict(en=["worried","hurt","tired","confused","disappointed","anxious"], hi=["chinta","dukh","thakaan","confusion","nirasha","ghabrahat"])
B = {
"absolute":(["You always {a}.","Every single time, you {a}.","It's always the same, you {a}.","Why do you always {a}?","You literally never stop, you {a}."],
 ["Tum hamesha {a}.","Har baar tum {a}.","Tum toh roz hi {a}.","Kyun tum hamesha {a}?","Tum kabhi nahi sudhroge, {a}."]),
"judgment":(["You're so {j}.","You are such a {j} person.","Honestly, you're {j}.","Only a {j} person would do that.","That was {j} of you."],
 ["Tum bahut {j} ho.","Tum ekdum {j} insaan ho.","Sach mein tum {j} ho.","Aisa kaam sirf {j} log karte hain.","Ye harkat bilkul {j} thi."]),
"blame":(["It's your fault.","This happened because of you.","You made me feel like this.","You ruined everything.","Look what you did."],
 ["Ye sab tumhari wajah se hua.","Tumhari galti hai.","Tumne sab kharab kar diya.","Tumne mera mood kharab kiya.","Dekho tumne kya kiya."]),
"demand":(["Stop it right now.","Reply to me immediately.","You have to fix this today.","Just do what I say.","Apologize, now."],
 ["Abhi band karo ye sab.","Turant reply karo.","Aaj hi ye theek karo.","Jo bol raha hoon bas wahi karo.","Abhi sorry bolo."]),
"vague_request":(["I just want you to understand.","Be better.","Just try harder.","I need you to care more.","Please just be more considerate."],
 ["Bas tum samjho.","Thoda better bano.","Thoda zyada care karo.","Bas thodi koshish karo.","Mujhe bas itna chahiye ki tum badlo."]),
"sarcasm":(["Wow, thanks so much for caring.","Great job, really.","Oh sure, because you're so helpful.","Nice, love being ignored.","Amazing, another brilliant idea."],
 ["Waah, kya baat hai, bahut care karte ho.","Bahut badhiya, ek aur late.","Haan haan, tum toh bahut helpful ho.","Shabash, ekdum perfect kaam.","Mast, phir se ignore kar diya."]),
"threat":(["You'll regret this.","I'll make you pay for this.","Don't test me.","You'll see what happens to you.","Do that again and find out."],
 ["Tujhe dekh lunga.","Tujhe iska anjaam bhugatna padega.","Mujhe aazmana mat.","Dekhna aage kya hota hai tumhare saath.","Phir kiya toh pata chal jayega."]),
"neutral":(["When the plan changed without a message, I felt {f}. Could you tell me earlier next time?","I felt {f} when I couldn't finish speaking. Would you be willing to let me finish?","We agreed on 8 and you arrived at 9. I'd like us to pick a time we can both keep.","When I don't hear back for a day, I feel {f}. Could you send a quick note when you're busy?","I need some space tonight. Can we talk tomorrow at 6?"],
 ["Jab plan bina bataye badla, mujhe {f} hui. Kya agli baar pehle bata sakte ho?","Meri baat poori nahi hui toh mujhe {f} hui. Kya tum mujhe poora bolne doge?","Humne 8 baje ka kaha tha aur tum 9 baje aaye. Kya hum aisa time rakh sakte hain jo dono nibha saken?","Jab ek din tak jawab nahi aata, mujhe {f} hoti hai. Busy ho toh ek chhota message bhej doge?","Aaj raat mujhe thoda space chahiye. Kal 6 baje baat kar sakte hain?"])}
PRE = dict(en=["","","","Listen,","Honestly,","Seriously,","Okay so","Look,","Dude,","Ugh,","Wow.","Come on,","Right,","No but","Babe,","Sorry but"], hi=["","","","Yaar,","Bhai,","Suno,","Dekh,","Arre,","Sun na,","Haan toh,","Ek baat bol dun,","Bas kar yaar,","Oye,","Matlab,","Bol raha hoon,"])
POST = dict(en=["","","","","I'm done.","Just saying.","Think about it.","Whatever.","I'm tired of this.","This is exhausting.","Anyway.","Don't start.","Enough."], hi=["","","","","Main thak gaya.","Bas bol raha hoon.","Soch lo.","Jo bhi.","Ab bas.","Thak gaya hoon is sab se.","Chhodo.","Shuru mat karo.","Bahut ho gaya."])
SUF = ["","",""," !!"," ..."," 😡"," yaar"," 🙄"," ??"," bro"," 😤"," !"]
def make(lang):
    cats = ["neutral"] if random.random() < .12 else random.sample(L[:-1], random.choice([1,1,2,2,3]))
    if cats != ["neutral"] and random.random() < .07: cats.append("threat")
    parts, test, lab = [], False, set()
    for c in cats:
        i = random.randrange(5); t = B[c][0 if lang == "en" else 1][i]; test |= i == 4
        parts.append(t.format(a=random.choice(A[lang]), j=random.choice(J[lang]), f=random.choice(F[lang])))
        if c != "neutral": lab.add(c)
    s = (random.choice(PRE[lang]) + " " + " ".join(parts) + " " + random.choice(POST[lang]) + random.choice(SUF)).strip()
    s = " ".join(s.split())
    if random.random() < .2: s = s.lower()
    if random.random() < .1: s = s.replace(".", "").replace(",", "")
    if random.random() < .06: s = s.replace("you", "u").replace("You", "U").replace("tum", "tu").replace("Tum", "Tu")
    return s, [int(l in lab) for l in L], test
TARGET, SHARDS = 1_000_000, 5
import gzip, os
os.makedirs("data", exist_ok=True)
for f in os.listdir("data"):
    if f.startswith("saywell_dataset"): os.remove(os.path.join("data", f))
seen, rows, n = set(), [], 0
while len(rows) < TARGET:
    n += 1
    lang = "en" if n % 2 == 0 else "hinglish"
    s, y, t = make("en" if lang == "en" else "hi")
    if s in seen: continue
    seen.add(s); rows.append([s, lang, *y, "test" if t else "train"])
per = TARGET // SHARDS
for k in range(SHARDS):  # shards stay under GitHub's 100 MB file limit
    with gzip.open(f"data/saywell_dataset_part{k+1}.csv.gz", "wt", newline="", encoding="utf-8") as f:
        w = csv.writer(f); w.writerow(["text","lang",*L,"split"]); w.writerows(rows[k*per:(k+1)*per])
print(len(rows), "rows in", SHARDS, "shards")
