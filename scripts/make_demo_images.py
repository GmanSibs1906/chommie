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
