import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Rectangle, Circle, Polygon, FancyArrowPatch, Ellipse
OUT="img/"
GOLD="#B8923A"; INK="#1A1A1A"; GRAY="#6B6B6B"; LIGHT="#F4EFE6"; RED="#C0392B"; GREEN="#2E7D4F"; BLUE="#2F5D8A"
plt.rcParams["font.family"]="DejaVu Sans"

def fig(w,h):
    f,a=plt.subplots(figsize=(w,h)); a.set_xlim(0,w*10); a.set_ylim(0,h*10); a.axis("off"); return f,a
def box(a,x,y,w,h,t,fc=LIGHT,ec=GOLD,tc=INK,fs=10,bold=False,lw=1.8,r=2):
    a.add_patch(FancyBboxPatch((x,y),w,h,boxstyle=f"round,pad=0,rounding_size={r}",fc=fc,ec=ec,lw=lw))
    a.text(x+w/2,y+h/2,t,ha="center",va="center",fontsize=fs,color=tc,fontweight="bold" if bold else "normal",linespacing=1.3)
def arrow(a,x1,y1,x2,y2,c=GOLD,lw=2):
    a.add_patch(FancyArrowPatch((x1,y1),(x2,y2),arrowstyle="-|>",mutation_scale=16,color=c,lw=lw))
def save(f,n):
    f.savefig(OUT+n,dpi=170,bbox_inches="tight",facecolor="white"); plt.close(f)
def logo(a,cx,cy,s=1,dark=False,mono=None,sym=True,name=True,slogan=True):
    fg="white" if dark else INK; ac=GOLD if mono is None else mono
    if mono: fg=mono
    if sym:
        # butterfly simples
        for sx in (-1,1):
            a.add_patch(Ellipse((cx+sx*3.6*s,cy+9*s),6.5*s,9.5*s,angle=sx*-35,fc=ac,ec="none"))
            a.add_patch(Ellipse((cx+sx*2.8*s,cy+2.5*s),4.5*s,6.5*s,angle=sx*25,fc=ac,ec="none",alpha=.8))
    if name: a.text(cx,cy-5*s if sym else cy,"Marca",ha="center",va="center",fontsize=22*s,fontstyle="italic",color=fg,family="DejaVu Serif")
    if slogan and name: a.text(cx,cy-13*s if sym else cy-8*s,"SLOGAN DA MARCA",ha="center",va="center",fontsize=6.5*s,color=ac,fontweight="bold")

# 1 fluxo oficial
f,a=fig(10,7.4)
steps=["CLIENTE","CONTRATAÇÃO","BRIEFING","REFERÊNCIAS","ANÁLISE","CONCEITO","PRIMEIROS\nESTUDOS","ESCOLHA DO\nCAMINHO","DESENVOLVI-\nMENTO","TIPOGRAFIA\n+ SLOGAN","APRESENTAÇÃO","AJUSTES","APROVAÇÃO","FINALIZAÇÃO","CONFERÊNCIA","ENTREGA","PÓS-VENDA"]
cols=4; bw=20; bh=10
pos=[]
for i,s in enumerate(steps):
    r=i//cols; c=i%cols
    if r%2==1: c=cols-1-c
    x=4+c*24; y=64-r*14; pos.append((x,y))
    box(a,x,y,bw,bh,f"{i+1}\n{s}",fc=INK if i in(0,16) else LIGHT,tc="white" if i in(0,16) else INK,fs=8.5,bold=True)
for i in range(len(pos)-1):
    (x1,y1),(x2,y2)=pos[i],pos[i+1]
    if y1==y2:
        d=1 if x2>x1 else -1
        arrow(a,x1+(bw if d>0 else 0),y1+bh/2,x2+(0 if d>0 else bw),y2+bh/2)
    else: arrow(a,x1+bw/2,y1,x2+bw/2,y2+bh)
a.text(50,3,"Siga sempre a ordem dos números. Nunca pule uma etapa.",ha="center",fontsize=10,color=RED,fontweight="bold")
save(f,"01_fluxo.png")

# 2 briefing perguntas (mapa)
f,a=fig(10,6)
box(a,38,26,24,8,"BRIEFING\nO que perguntar",fc=INK,tc="white",bold=True,fs=10)
items=[("MARCA","Nome? Abreviação?\nSignificado?\nNome completo?",4,40),("SEGMENTO","O que vende?\nPara quem?\nPosicionamento?",38,44),("ESTILO","Sofisticado? Moderno?\nDelicado? Forte?\nMinimalista? Luxuoso?",68,40),("CORES","Quais gosta?\nQuais NÃO gosta?\nJá tem cor definida?",4,8),("REFERÊNCIAS","O que gostou?\nO que não gostou?\nPor quê?",38,6),("EXTRAS","Slogan? Prazo?\nOnde a logo será usada?",68,8)]
for t,tx,x,y in items:
    box(a,x,y,28,16,"",fc="white"); a.text(x+14,y+12.5,t,ha="center",fontsize=9.5,fontweight="bold",color=GOLD); a.text(x+14,y+6,tx,ha="center",va="center",fontsize=8.2)
    cx=x+14; cy=y+(0 if y>26 else 16)
    arrow(a,cx,cy,50,34 if y<26 else 26,c=GRAY,lw=1.2) if False else None
save(f,"02_briefing.png")

# 3 referência -> direção
f,a=fig(10,4.8)
box(a,2,18,26,24,"REFERÊNCIA\nDO CLIENTE\n\nassinatura\npreto + dourado\nsofisticado",fs=9.5,bold=True)
arrow(a,29,30,38,30)
box(a,39,22,22,16,"VOCÊ\nANALISA",fc=INK,tc="white",bold=True,fs=11)
arrow(a,62,30,71,30)
box(a,72,14,26,32,"DIREÇÃO CRIATIVA\n\nlogotipo caligráfico\n+ preto e dourado\n+ detalhe delicado\ndo segmento",fc=GOLD,ec=GOLD,tc="white",fs=9.5,bold=True)
a.text(50,6,"REFERÊNCIA NÃO É MODELO PARA COPIAR. É DIREÇÃO PARA ENTENDER O GOSTO DO CLIENTE.",ha="center",fontsize=9,color=RED,fontweight="bold")
save(f,"03_referencia.png")

# 4 estudos -> escolha
f,a=fig(10,4.6)
for i in range(4):
    x=3+i*14
    box(a,x,22,12,16,"",fc="white"); logo(a,x+6,31,.34,sym=True,name=False,slogan=False); a.text(x+6,24.5,f"Opção {i+1}",ha="center",fontsize=8,fontweight="bold")
arrow(a,60,30,70,30)
box(a,71,20,26,20,"CLIENTE\nESCOLHE 1\nCAMINHO",fc=GOLD,ec=GOLD,tc="white",bold=True,fs=11)
a.text(30,14,"Mostre 3 a 4 estudos DIFERENTES e explique cada um",ha="center",fontsize=9,color=GRAY)
save(f,"04_estudos.png")

# 5 conceito
f,a=fig(10,6)
box(a,38,24,24,12,"CONCEITO\nBorboleta",fc=GOLD,ec=GOLD,tc="white",bold=True,fs=12)
words=[("delicadeza",8,46),("transformação",38,50),("feminilidade",70,46),("liberdade",8,6),("confiança",38,2),("segunda pele",70,6)]
for w,x,y in words:
    box(a,x,y,22,8,w,fc="white",fs=10)
    arrow(a,x+11,y+(0 if y>25 else 8),50,36 if y>25 else 24,c=GRAY,lw=1.2)
a.text(50,57,"Cada escolha visual precisa ter uma justificativa",ha="center",fontsize=9,color=GRAY)
save(f,"05_conceito.png")

# 6 tipografia A/B
f,a=fig(10,5)
for x,t,sub,ft in((3,"OPÇÃO A","Mesma tipografia\n(nome e slogan)",("DejaVu Serif","DejaVu Serif")),(52,"OPÇÃO B","Tipografias diferentes\n(nome ≠ slogan)",("DejaVu Serif","DejaVu Sans"))):
    box(a,x,10,45,34,"",fc="white"); a.text(x+22.5,40,t,ha="center",fontweight="bold",color=GOLD,fontsize=11)
    a.text(x+22.5,29,"Marca",ha="center",fontsize=26,fontstyle="italic",family=ft[0])
    a.text(x+22.5,20,"Delicadeza que transforma",ha="center",fontsize=9.5,family=ft[1],fontstyle="italic" if ft[1]==ft[0] else "normal")
    a.text(x+22.5,13.5,sub,ha="center",fontsize=7.5,color=GRAY,va="center")
a.text(50,3,"Mostre as duas VISUALMENTE. Não explique só por texto.",ha="center",fontsize=9,color=RED,fontweight="bold")
save(f,"06_tipografia.png")

# 7 anatomia
f,a=fig(10,5.4)
box(a,20,6,60,44,"",fc="white",ec=GRAY,lw=1)
logo(a,50,27,1.3)
for y,t in((38,"SÍMBOLO — o desenho"),(22,"LOGOTIPO — o nome da marca"),(14,"SLOGAN — a frase")):
    a.text(84,y,t,fontsize=8.5,fontweight="bold",color=BLUE,va="center"); arrow(a,83,y,64 if y>30 else 62,y,c=BLUE,lw=1.3)
a.text(50,1.5,"Cores + Tipografia + Composição (espaços e alinhamento) completam a marca",ha="center",fontsize=8.5,color=GRAY)
save(f,"07_anatomia.png")

# 8 area de protecao
f,a=fig(8,5.4)
a.add_patch(Rectangle((8,6),64,42,fc="#FDECEA",ec=RED,lw=1.5,ls="--"))
a.add_patch(Rectangle((24,12),32,28,fc="white",ec=INK,lw=1.5))
logo(a,40,26,.8)
for (x,y,w,h) in((24,38,32,10),(24,6,32,10),(8,16,16,22),(56,16,16,22)):
    pass
a.text(40,43,"X",ha="center",va="center",fontsize=14,color=RED,fontweight="bold")
a.text(40,11,"X",ha="center",va="center",fontsize=14,color=RED,fontweight="bold")
a.text(16,27,"X",ha="center",va="center",fontsize=14,color=RED,fontweight="bold")
a.text(64,27,"X",ha="center",va="center",fontsize=14,color=RED,fontweight="bold")
a.text(40,2.5,"X = altura de uma letra da marca. Nada entra na zona vermelha.",ha="center",fontsize=8.5,color=RED)
save(f,"08_protecao.png")

# 9 tamanho minimo
f,a=fig(10,3.8)
for i,s in enumerate([1.0,.7,.45,.28,.18]):
    cx=10+i*19
    logo(a,cx,18,s*0.9)
    a.text(cx,3,["100%","70%","45%","28%","18%"][i],ha="center",fontsize=8.5,color=GRAY)
a.text(84,32,"✗ ilegível\nanote o tamanho\nminimo antes disso",fontsize=8,color=RED,ha="left",va="center") if False else None
a.text(50,34,"Reduza até o texto ficar ilegível. O ponto ANTES disso é o tamanho mínimo.",ha="center",fontsize=9,color=RED,fontweight="bold")
save(f,"09_minimo.png")

# 10 versões
f,a=fig(10,7.6)
vers=[("01 Principal",0,"white",None,True,True),("02 Reduzida",0,"white",None,True,False),("03 Ícone",0,"white",None,False,False),("04 Fundo claro",0,"#F4EFE6",None,True,True),("05 Fundo escuro",1,INK,None,True,True),("06 Monocromática",0,"white",INK,True,True),("07 Reversa (branca)",1,"#444444","white",True,True),("08 Vertical/Horizontal",0,"white",None,True,True)]
for i,(t,dark,bg,mono,nm,sl) in enumerate(vers):
    r=i//4; c=i%4; x=2+c*24.5; y=44-r*38
    a.add_patch(FancyBboxPatch((x,y),22,32,boxstyle="round,pad=0,rounding_size=1.5",fc=bg,ec=GOLD,lw=1.5))
    logo(a,x+11,y+17,.72,dark=bool(dark),mono=mono,sym=not(i==7),name=nm,slogan=sl)
    if i==2: pass
    a.text(x+11,y+3,t,ha="center",fontsize=8,fontweight="bold",color="white" if dark else INK)
save(f,"10_versoes.png")

# 11 formatos
f,a=fig(10,5)
fm=[("PNG","fundo transparente\nalta resolução","Instagram, WhatsApp,\napresentações"),("PDF","vetorial\n(não perde qualidade)","gráfica, impressão,\narquivo oficial"),("SVG","vetor para web","sites, sistemas,\ninterfaces"),("EDITÁVEL","AI / CDR / EPS","só se foi\ncontratado")]
for i,(t,d,u) in enumerate(fm):
    x=2+i*24.5
    box(a,x,34,22,12,t,fc=INK,tc="white",bold=True,fs=14)
    box(a,x,20,22,12,d,fc="white",fs=8.5); box(a,x,5,22,13,"USO:\n"+u,fc=LIGHT,fs=8.5)
save(f,"11_formatos.png")

# 12 cores
f,a=fig(10,3.6)
for i,(n,h,rgb,cm) in enumerate([("COR PRINCIPAL","#1A1A1A","26 / 26 / 26","0/0/0/90"),("COR SECUNDÁRIA","#B8923A","184 / 146 / 58","25/40/90/5"),("APOIO CLARO","#F4EFE6","244 / 239 / 230","3/4/9/0")]):
    x=3+i*32
    a.add_patch(FancyBboxPatch((x,14),28,22,boxstyle="round,pad=0,rounding_size=2",fc=h,ec=GRAY,lw=1))
    a.text(x+14,8,f"{n}\nHEX {h}   RGB {rgb}\nCMYK {cm}",ha="center",va="center",fontsize=7.8)
a.text(50,1.5,"EXEMPLO. Retire os valores reais do arquivo final. Nunca use valores aproximados.",ha="center",fontsize=8.5,color=RED,fontweight="bold")
save(f,"12_cores.png")

# 13 mockups
f,a=fig(10,4.4)
a.add_patch(FancyBboxPatch((3,10),18,28,boxstyle="round,pad=0,rounding_size=2",fc=INK,ec=INK)); logo(a,12,24,.6,dark=True); a.text(12,5,"Cartão",ha="center",fontsize=8.5)
a.add_patch(Polygon([[30,10],[56,10],[54,34],[32,34]],fc=LIGHT,ec=GOLD,lw=1.5)); a.add_patch(Rectangle((38,34),10,5,fc="none",ec=GOLD,lw=1.5)); logo(a,43,22,.6); a.text(43,5,"Sacola",ha="center",fontsize=8.5)
a.add_patch(FancyBboxPatch((66,6),22,34,boxstyle="round,pad=0,rounding_size=3",fc="white",ec=INK,lw=2)); a.add_patch(Circle((77,32),5,fc=INK)); logo(a,77,32,.2,dark=True,name=False,slogan=False); a.text(77,23,"@suamarca",ha="center",fontsize=8,fontweight="bold"); a.text(77,2,"Perfil Instagram",ha="center",fontsize=8.5)
save(f,"13_mockups.png")

# 14 pastas
f,a=fig(8,7.4)
tree=[(0,"CLIENTE - LOGOMARCA"),(1,"01_BRIEFING"),(1,"02_REFERENCIAS"),(1,"03_ESTUDOS"),(1,"04_APRESENTACAO"),(1,"05_APROVADO"),(1,"06_ENTREGA"),(2,"01_LOGO_PRINCIPAL"),(2,"02_LOGO_REDUZIDA"),(2,"03_SIMBOLO"),(2,"04_FUNDO_CLARO"),(2,"05_FUNDO_ESCURO"),(2,"06_MONOCROMATICA"),(2,"07_PALETA"),(2,"08_TIPOGRAFIA"),(2,"09_MOCKUPS"),(2,"10_EDITAVEIS")]
for i,(l,t) in enumerate(tree):
    y=71-i*4.1; x=3+l*9
    a.add_patch(FancyBboxPatch((x,y),4.5,2.6,boxstyle="round,pad=0,rounding_size=.4",fc=GOLD if l!=2 else "#D9C28A",ec="none"))
    a.text(x+6.5,y+1.3,t,va="center",fontsize=9.5,fontweight="bold" if l<2 else "normal",family="DejaVu Sans Mono")
save(f,"14_pastas.png")

# 15 rodadas
f,a=fig(10,3.6)
for i in range(3):
    x=3+i*24
    box(a,x,16,20,16,f"RODADA {i+1}\n\nanotar o pedido\nfazer · enviar",fc="white",fs=8.5,bold=True); 
    if i<2: arrow(a,x+20.5,24,x+23.5,24)
arrow(a,75,24,79,24); box(a,80,16,18,16,"APROVAÇÃO\n✔ registrar",fc=GREEN,ec=GREEN,tc="white",bold=True,fs=9)
a.text(50,6,"Contrato: até 3 rodadas. Anote qual rodada está usando SEMPRE.",ha="center",fontsize=9,color=RED,fontweight="bold")
save(f,"15_rodadas.png")

# 16 timeline mari
f,a=fig(10,4.4)
ev=["Referência\nde IA","Direção:\nassinatura\npreto/dourado","Estudos de\nsímbolo","Cliente\nescolhe","Conceito\nborboleta","Fontes +\nslogan","Aprovação +\nDrive","Pós-venda:\nversão\ndourada"]
a.plot([5,95],[24,24],color=GOLD,lw=3)
for i,t in enumerate(ev):
    x=7+i*12.3; a.add_patch(Circle((x,24),2,fc=INK,ec=GOLD,lw=2)); a.text(x,24,str(i+1),color="white",ha="center",va="center",fontsize=8,fontweight="bold")
    a.text(x,(33 if i%2==0 else 12),t,ha="center",va="center",fontsize=8)
save(f,"16_caso_mari.png")

# 17 checklist visual de revisão
f,a=fig(10,3.8)
for i,(t,c) in enumerate([("DESIGN\nequilíbrio · alinhamento\nespaços · proporção",BLUE),("TEXTO\nnome certo · slogan certo\nsem erro de português",GOLD),("ARQUIVO\nvetor · organizado\nversões · abre normal",GREEN)]):
    box(a,3+i*32,12,29,22,t,fc="white",ec=c,fs=9,bold=True,lw=2.5)
a.text(50,5,"Só envie ao cliente depois dos 3 quadros conferidos.",ha="center",fontsize=9,color=RED,fontweight="bold")
save(f,"17_revisao.png")
