"""Makes the made-up demo photos: the ATP page now, the learners' exercise books later. No real learners."""
import sys, random
from PIL import Image, ImageDraw, ImageFont, ImageFilter
ARIAL="/System/Library/Fonts/Supplemental/Arial.ttf"
ARIALB="/System/Library/Fonts/Supplemental/Arial Bold.ttf"

def atp():
    W,H=1100,900
    img=Image.new("RGB",(W,H),(236,232,222))
    d=ImageDraw.Draw(img)
    d.rectangle((60,50,W-60,H-50),fill=(253,252,248),outline=(200,196,186),width=2)
    f=ImageFont.truetype(ARIALB,30); f2=ImageFont.truetype(ARIAL,28); fh=ImageFont.truetype(ARIALB,26)
    d.text((100,85),"ANNUAL TEACHING PLAN  Mathematics  Grade 6  Term 4",font=f,fill=(20,20,20))
    rows=[("1-2","Common fractions: equivalent fractions"),("3","Add, subtract: same denominators"),("4","Add, subtract: related denominators"),("5","Mixed numbers"),("6","Fractions of whole numbers"),("7","Fractions and decimals"),("8","Revision, Test"),("9","Exam")]
    y=160; d.rectangle((100,y,W-100,y+50),fill=(228,236,228)); d.text((120,y+10),"Week",font=fh,fill=(20,20,20)); d.text((260,y+10),"Topic",font=fh,fill=(20,20,20))
    y+=50
    for wk,t in rows:
        d.rectangle((100,y,W-100,y+70),outline=(150,150,150),width=2); d.line((230,y,230,y+70),fill=(150,150,150),width=2)
        d.text((120,y+20),wk,font=f2,fill=(20,20,20)); d.text((255,y+20),t,font=f2,fill=(20,20,20)); y+=70
    img=img.rotate(-1.2,expand=False,fillcolor=(236,232,222),resample=Image.BICUBIC).filter(ImageFilter.GaussianBlur(0.4))
    img.save("demo/atp-gr6-t4.jpg",quality=88)
if __name__=="__main__":
    atp()

# ---------- exercise-book pages (made-up learners, scripted answers) ----------
import random, json
HAND="/System/Library/Fonts/Supplemental/Bradley Hand Bold.ttf"
QS=["1/2 = ?/6","3/4 = ?/8","2/7 + 3/7","5/9 - 2/9","1/2 + 1/4","2/3 + 1/6","1 1/2 + 2 1/4","2 1/3 + 1 1/3","3/4 of 12","1/5 of 20"]
RIGHT=["3/6","6/8","5/7","3/9","3/4","5/6","3 3/4","3 2/3","9","4"]
WRONG=["1/6","3/8","5/14","7/9","2/6","3/9","3 2/6","3 2/6","16","100"]
TOPIC=[0,0,1,1,2,2,3,3,4,4]   # eq, same, related, mixed, ofwhole
# which questions each learner gets wrong (design heat map: red=both, amber=one)
PROFILE={
 1:("Thandi Mokoena",{0,1,4,5,6}), 2:("Sipho Ndlovu",{4,7} ), 3:("Lerato Khumalo",{8}), 4:("Johan van Wyk",{0,4,5,6,7,8}) ,
 5:("Ayesha Patel",{6}), 6:("Kagiso Dlamini",{2,4,5}), 7:("Naledi Sithole",set()),
 14:("Tebogo Molefe",{4,8}), 22:("Palesa Tau",{9}), 31:("Jaco Smit",{6})}
SPECIAL={14:{5:"5/8"}, 31:{1:"6/8"}}   # clear writing that a marker might misread: 014 Q6 is 5/8, 031 Q2 is 6/8
UNCLEAR={4:{1},22:{4}}          # Johan, Q2 numerator scribbled
EQUALVALUE={2:{3}}       # Sipho writes 1/3 for 5/9-2/9 (correct, simplified)
def book(num):
    name,wrong=PROFILE[num]; random.seed(num*7)
    W,H=1000,1400
    img=Image.new("RGB",(W,H),(250,248,240)); d=ImageDraw.Draw(img)
    for y in range(230,H-40,100): d.line((0,y,W,y),fill=(170,196,226),width=2)
    d.line((90,0,90,H),fill=(224,130,130),width=3)
    ink=random.choice([(25,40,110),(20,20,30),(30,60,140)])
    f=ImageFont.truetype(HAND,44); fs=ImageFont.truetype(HAND,36); fn=ImageFont.truetype(ARIAL,26)
    d.text((110,40),f"Name: {name}",font=f,fill=ink); d.text((110,100),"Class: 6B",font=fs,fill=ink)
    d.text((470,100),"Fractions check   Fri 13 Nov",font=fs,fill=ink)
    d.line((90,170,W,170),fill=(120,120,120),width=3)
    for i,(q,r,w) in enumerate(zip(QS,RIGHT,WRONG)):
        y=190+i*100+ (H-1400)//2
        ans = SPECIAL.get(num,{}).get(i) or (w if i in wrong else ("1/3" if i in EQUALVALUE.get(num,set()) else r))
        txt=f"{i+1})  {q}  =  {ans}" if i>=2 else f"{i+1})  {q}"
        if i<2: txt=f"{i+1})  {q.split('=')[0].strip()} = {ans.split('/')[0]}/{q.split('?/')[1]}"
        if i in UNCLEAR.get(num,set()):
            pre=f"{i+1})  {q} = " if i>=2 else f"{i+1})  {q.split('=')[0].strip()} = "
            d.text((120,y+random.randint(-3,3)),pre,font=f,fill=ink)
            x=120+d.textlength(pre,font=f)
            for k in range(60): d.line((x+random.randint(0,40),y+random.randint(8,52),x+random.randint(0,40),y+random.randint(8,52)),fill=ink,width=random.randint(2,5))
            d.text((x+46,y),"/"+r.split("/")[1],font=f,fill=ink)
        else:
            d.text((120,y+random.randint(-3,3)),txt,font=f,fill=ink)
    img=img.rotate(random.uniform(-1.6,1.6),fillcolor=(214,208,196),resample=Image.BICUBIC,expand=False)
    img=img.filter(ImageFilter.GaussianBlur(0.5))
    img.save(f"demo/books/6B-{num:03d}.jpg",quality=86)
if __name__=="__main__":
    for n in PROFILE: book(n)
    json.dump({"questions":QS,"right":RIGHT,"topic":TOPIC,"wrong":{f"6B-{n:03d}":sorted(w) for n,(nm,w) in PROFILE.items()},"unclear":{f"6B-{n:03d}":sorted(s) for n,s in UNCLEAR.items()}},open("demo/books/answers.json","w"))

# ---- v2: made-up photo of a class list (demo/class-list-6b.jpg), six made-up names ----
def make_class_list(path="demo/class-list-6b.jpg"):
    from PIL import Image, ImageDraw, ImageFont
    names = ["Nomsa Dube", "Ethan Pillay", "Karabo Mthembu", "Hannah de Beer", "Sizwe Radebe", "Amira Hendricks"]
    im = Image.new("RGB", (900, 1100), (250, 247, 238)); d = ImageDraw.Draw(im)
    def f(sz):
        for p in ["/System/Library/Fonts/Supplemental/Arial.ttf", "/Library/Fonts/Arial.ttf"]:
            try: return ImageFont.truetype(p, sz)
            except Exception: pass
        return ImageFont.load_default()
    d.text((60, 50), "Class list - Grade 6B (made-up names for demo)", fill=(20, 20, 20), font=f(34)); d.line((60, 110, 840, 110), fill=(60, 60, 60), width=3)
    y = 150
    for i, n in enumerate(names, 1):
        d.text((70, y), f"{i}.", fill=(20, 20, 20), font=f(40)); d.text((140, y), n, fill=(25, 25, 60), font=f(40)); d.line((60, y + 62, 840, y + 62), fill=(190, 190, 190), width=2); y += 100
    im.rotate(1.2, fillcolor=(250, 247, 238)).save(path, quality=88)
