const fs=require("fs");
const D=require("docx");
const {Document,Packer,Paragraph,TextRun,ImageRun,Table,TableRow,TableCell,WidthType,ShadingType,BorderStyle,AlignmentType,HeadingLevel,LevelFormat,Header,Footer,PageNumber,PageBreak,TableOfContents,TabStopType}=D;
const GOLD="B8923A",INK="1A1A1A",GRAY="6B6B6B",LIGHT="F4EFE6",RED="C0392B",GREEN="2E7D4F";
const FONT="Calibri";
const W=9638; // A4 com margens 2cm: 11906-2*1134
const P=(t,o={})=>new Paragraph({spacing:{after:o.after??120,line:300},alignment:o.align,keepNext:o.keepNext,children:runs(t,o)});
function runs(t,o={}){ // **negrito**
  return String(t).split(/(\*\*[^*]+\*\*)/).filter(Boolean).map(s=>s.startsWith("**")?new TextRun({text:s.slice(2,-2),bold:true,font:FONT,size:o.size||22,color:o.color}):new TextRun({text:s,font:FONT,size:o.size||22,color:o.color,italics:o.italics,bold:o.bold}));
}
const H1=(t)=>new Paragraph({heading:HeadingLevel.HEADING_1,pageBreakBefore:true,children:[new TextRun({text:t,font:FONT})]});
const H2=(t)=>new Paragraph({heading:HeadingLevel.HEADING_2,children:[new TextRun({text:t,font:FONT})]});
const H3=(t)=>new Paragraph({heading:HeadingLevel.HEADING_3,children:[new TextRun({text:t,font:FONT})]});
const B=(t,l=0)=>new Paragraph({numbering:{reference:"bul",level:l},spacing:{after:60,line:290},children:runs(t)});
let numCount=0;
const N=(items)=>{const ref="num"+(numCount++);NUMS.push(ref);return items.map(t=>new Paragraph({numbering:{reference:ref,level:0},spacing:{after:80,line:290},children:runs(t)}));};
const NUMS=[];
const CK=(items)=>items.map(t=>new Paragraph({spacing:{after:50},indent:{left:360},children:[new TextRun({text:"☐  ",font:"Segoe UI Symbol",size:22,color:GOLD}),...runs(t)]}));
const bd=(c="D9C28A")=>({style:BorderStyle.SINGLE,size:6,color:c});
const borders=(c)=>({top:bd(c),bottom:bd(c),left:bd(c),right:bd(c)});
function callout(title,lines,color=GOLD,fill=LIGHT){
  const kids=[new Paragraph({spacing:{after:60},children:[new TextRun({text:title,bold:true,font:FONT,size:22,color})]}),...lines.map(l=>new Paragraph({spacing:{after:50,line:280},children:runs(l)}))];
  return new Table({width:{size:W,type:WidthType.DXA},columnWidths:[W],rows:[new TableRow({cantSplit:true,children:[new TableCell({width:{size:W,type:WidthType.DXA},shading:{type:ShadingType.CLEAR,fill},borders:{top:bd(fill),bottom:bd(fill),right:bd(fill),left:{style:BorderStyle.SINGLE,size:30,color}},margins:{top:100,bottom:100,left:200,right:160},children:kids})]})]});
}
const sp=()=>new Paragraph({spacing:{after:80},children:[]});
const OBJ=(t)=>callout("🎯 OBJETIVO DESTA ETAPA",[t],GOLD,LIGHT);
const ATENCAO=(l)=>callout("⚠ ATENÇÃO — ERROS COMUNS",l,RED,"FDECEA");
const MSG=(t,l)=>callout("💬 "+t,l,GREEN,"EAF4EE");
function img(file,wpx){ // largura em px a 96dpi
  const buf=fs.readFileSync("img/"+file);
  const w=buf.readUInt32BE(16),h=buf.readUInt32BE(20);
  const width=Math.min(wpx,610),height=Math.round(width*h/w);
  return new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:120,after:60},keepNext:true,children:[new ImageRun({type:"png",data:buf,transformation:{width,height},altText:{title:file,description:file,name:file}})]});
}
const cap=(t)=>new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:200},children:[new TextRun({text:t,italics:true,size:18,color:GRAY,font:FONT})]});
function table(cols,rows,head=true){
  const sum=cols.reduce((a,b)=>a+b,0);
  const mk=(c,i,h)=>new TableCell({width:{size:cols[i],type:WidthType.DXA},borders:borders(),shading:{type:ShadingType.CLEAR,fill:h?INK:(i===0?LIGHT:"FFFFFF")},margins:{top:70,bottom:70,left:110,right:110},children:String(c).split("\n").map(l=>new Paragraph({spacing:{after:20},children:h?[new TextRun({text:l,bold:true,color:"FFFFFF",font:FONT,size:20})]:runs(l,{size:20})}))});
  return new Table({width:{size:sum,type:WidthType.DXA},columnWidths:cols,rows:rows.map((r,ri)=>new TableRow({tableHeader:head&&ri===0,cantSplit:true,children:r.map((c,i)=>mk(c,i,head&&ri===0))}))});
}
// ===== CONTEÚDO =====
const c=[];
// CAPA
c.push(new Paragraph({spacing:{before:2200,after:100},alignment:AlignmentType.CENTER,children:[new TextRun({text:"FREITAS HUB",font:FONT,size:30,bold:true,color:GOLD,characterSpacing:120})]}));
c.push(new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:80},children:[new TextRun({text:"MANUAL OPERACIONAL",font:FONT,size:56,bold:true,color:INK})]}));
c.push(new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:80},border:{bottom:{style:BorderStyle.SINGLE,size:12,color:GOLD,space:12}},children:[new TextRun({text:"PROCESSO DE CRIAÇÃO DE LOGOMARCA",font:FONT,size:36,color:INK})]}));
c.push(new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:300,after:200},children:[new TextRun({text:"Do primeiro contato à entrega final",font:FONT,size:28,italics:true,color:GRAY})]}));
c.push(new Paragraph({alignment:AlignmentType.CENTER,spacing:{before:600,after:60},children:[new TextRun({text:"GUIA PASSO A PASSO PARA INICIANTES",font:FONT,size:24,bold:true,color:GOLD})]}));
c.push(new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:"Feito para você executar o processo completo sem precisar de ajuda ou supervisão.",font:FONT,size:22,color:GRAY})]}));
c.push(new Paragraph({children:[new PageBreak()]}));
// SUMÁRIO
c.push(new Paragraph({heading:HeadingLevel.HEADING_1,children:[new TextRun({text:"Sumário",font:FONT})]}));
c.push(new TableOfContents("Sumário",{hyperlink:true,headingStyleRange:"1-2"}));
c.push(P("Dica: ao abrir no Word, clique com o botão direito no sumário e escolha “Atualizar campo” para preencher os números de página.",{italics:true,color:GRAY,size:18}));

// 01
c.push(H1("01 — Como usar este manual"));
c.push(OBJ("Entender como o manual funciona e como ele vai te guiar até a entrega de uma logomarca profissional, mesmo que seja o seu primeiro projeto."));
c.push(sp());
c.push(H2("O que você vai aprender"));
["o que fazer, em qual ordem;","o que perguntar ao cliente;","como analisar as referências;","como desenvolver a marca;","como apresentar e receber alterações;","como organizar e nomear os arquivos;","quais arquivos entregar e como conferir;","como finalizar o atendimento."].forEach(t=>c.push(B(t)));
c.push(sp());
c.push(H2("Como ler cada etapa"));
c.push(P("Todas as etapas seguem o mesmo formato. Assim você nunca se perde:"));
c.push(table([2300,7338],[["Quadro","Para que serve"],["🎯 OBJETIVO","Diz o que você precisa conseguir naquela etapa."],["PASSO A PASSO","Lista numerada. Faça na ordem, um item por vez."],["💬 MODELO DE MENSAGEM","Texto pronto para copiar, adaptar e enviar ao cliente."],["⚠ ATENÇÃO","Erros comuns. Leia antes de começar."],["☐ CHECKLIST","Só avance quando todos os itens estiverem marcados."]]));
c.push(sp());
c.push(callout("REGRA PRINCIPAL",["**Não pule etapas.** Cada etapa existe para reduzir retrabalho e melhorar a qualidade da entrega. Se estiver com dúvida, volte e releia a etapa — a resposta está aqui."],RED,"FDECEA"));
c.push(sp());
c.push(H2("Material que você precisa ter em mãos"));
[ "Computador com programa de desenho vetorial (Illustrator, CorelDRAW ou equivalente usado pela equipe);","Acesso ao Drive da Freitas Hub;","Acesso ao WhatsApp/canal de atendimento com o cliente;","Este manual aberto (ou impresso) ao lado."].forEach(t=>c.push(B(t)));
c.push(sp());
c.push(H2("Glossário rápido (palavras que você vai ouvir)"));
c.push(table([2300,7338],[["Palavra","Significado simples"],["Logomarca","O conjunto completo da marca: nome + símbolo + (às vezes) slogan."],["Logotipo","O nome da marca escrito com uma tipografia desenhada."],["Símbolo / Ícone","O desenho da marca, sem o nome."],["Slogan","Frase curta que acompanha a marca."],["Briefing","Conversa/questionário para entender o que o cliente quer."],["Referência","Imagem que o cliente gostou e que mostra o gosto dele."],["Conceito","A ideia por trás do desenho. Justifica as escolhas visuais."],["Tipografia","As fontes (letras) usadas na marca."],["Vetor","Desenho que pode ser ampliado sem perder qualidade (AI, SVG, PDF vetorial)."],["Mockup","Montagem que mostra a logo aplicada em cartão, sacola, perfil, etc."],["Rodada de ajustes","Cada vez que o cliente pede alterações e você devolve."]]));

// 02
c.push(H1("02 — O processo completo"));
c.push(OBJ("Ter a visão geral das 17 etapas, do primeiro contato até o pós-venda."));
c.push(img("01_fluxo.png",600));c.push(cap("Figura 1 — Fluxo oficial da Freitas Hub. Siga os números em ordem."));
c.push(P("Resumo do que acontece em cada fase:"));
c.push(table([1700,2500,5438],[["Fase","Etapas","Em uma frase"],["Preparação","1 a 5","Contrato, pagamento, briefing, referências e análise. Aqui você entende o cliente."],["Criação","6 a 10","Conceito, estudos, escolha, desenvolvimento, tipografia e slogan."],["Validação","11 a 13","Apresentar, ajustar (até 3 rodadas) e conseguir a aprovação."],["Entrega","14 a 16","Finalizar, conferir e entregar os arquivos organizados."],["Relacionamento","17","Pós-venda: confirmar que o cliente está satisfeito."]]));

// 03
c.push(H1("03 — Etapa 1: Recebimento do projeto"));
c.push(OBJ("Verificar se o projeto está liberado antes de desenhar qualquer coisa."));
c.push(sp());
c.push(H2("Passo a passo"));
c.push(...N(["Abra o registro do cliente (planilha, CRM ou grupo — o que a equipe usar).","Confira se o **pagamento foi confirmado**. Sem pagamento confirmado, o projeto não começa.","Anote o **prazo**: o desenvolvimento é de até **7 dias após a confirmação do pagamento**. Marque a data final no calendário.","Confirme a **escrita exata do nome da empresa** (acentos, maiúsculas, abreviações). Pergunte ao cliente se tiver qualquer dúvida.","Veja se o slogan já foi definido ou se ficou pendente. Se estiver pendente, anote “slogan a definir”.","Registre telefone, e-mail e o nome da pessoa responsável pelo projeto (você)."]));
c.push(sp());
c.push(H3("Checklist de liberação"));
c.push(...CK(["Cliente contratado","Pagamento confirmado","Prazo registrado","Nome da empresa confirmado","Briefing recebido","Referências recebidas","Slogan definido ou pendente","Informações de contato registradas","Responsável pelo projeto definido"]));
c.push(sp());
c.push(callout("REGRA",["Pagamento confirmado → projeto entra oficialmente em produção."],GOLD));
c.push(sp());
c.push(MSG("MODELO — Início do projeto",["Olá, [NOME]! Tudo bem? Confirmamos o seu pagamento, e o seu projeto de logomarca já está oficialmente em produção. 🎉","O prazo de desenvolvimento é de até 7 dias a partir de hoje ([DATA]). Para começarmos com o pé direito, vou te enviar um breve questionário e te pedir algumas referências. Pode ser?"]));

// 04
c.push(H1("04 — Etapa 2: Entender o que o cliente quer (briefing)"));
c.push(OBJ("Descobrir tudo o que você precisa saber antes de desenhar. Nunca comece desenhando só porque o cliente disse: “Quero uma logo bonita”."));
c.push(img("02_briefing.png",600));c.push(cap("Figura 2 — Os seis grupos de perguntas do briefing."));
c.push(H2("Perguntas que você deve fazer"));
c.push(table([1700,7938],[["Tema","Perguntas"],["Marca","Qual é o nome? Existe abreviação? Existe significado? O nome deve aparecer completo?"],["Segmento","O que a empresa vende? Para quem? Qual o posicionamento (popular, premium, luxo)?"],["Estilo","Sofisticado? Moderno? Delicado? Forte? Minimalista? Luxuoso? Divertido?"],["Cores","Quais você gosta? Quais NÃO gosta? Já tem alguma cor definida?"],["Referências","O que você gostou? O que não gostou? Por que escolheu aquela referência?"],["Extras","Já tem slogan? Onde a logo será usada (Instagram, embalagem, fachada)?"]]));
c.push(sp());
c.push(MSG("MODELO — Envio do briefing",["Para criarmos algo com a sua cara, me responda estas perguntas (pode ser por áudio):","1) Qual é o nome exato da marca? 2) O que vocês vendem e para quem? 3) Quais 3 palavras definem a marca? 4) Que cores você ama? E quais não quer de jeito nenhum? 5) Me envie 3 a 5 logos que você gosta e me diga o que gostou em cada uma. 6) Já tem um slogan?"]));
c.push(sp());
c.push(H2("Se o cliente não souber responder"));
c.push(P("É normal. Ofereça opções fechadas: “Você imagina a marca mais **delicada** ou mais **forte**?”, “Mais **clara** ou mais **escura**?”. Perguntas com duas opções são mais fáceis de responder do que perguntas abertas."));
c.push(sp());
c.push(H3("Checklist"));
c.push(...CK(["Nome da marca confirmado por escrito","Segmento e público entendidos","Estilo definido em pelo menos 3 palavras","Cores gostadas e não gostadas anotadas","Referências recebidas com explicação","Tudo salvo na pasta 01_BRIEFING"]));

// 05
c.push(H1("05 — Etapa 3: Transformar a referência em direção criativa"));
c.push(OBJ("Entender o gosto do cliente a partir das referências e transformar isso em uma direção clara para o desenho."));
c.push(sp());
c.push(callout("REGRA DE OURO",["**REFERÊNCIA NÃO É MODELO PARA COPIAR.** É direção para entender o gosto do cliente. Nunca copie a referência: isso é ruim para o cliente (marca igual à de outra pessoa) e para a Freitas Hub."],RED,"FDECEA"));
c.push(img("03_referencia.png",600));c.push(cap("Figura 3 — Como a referência vira direção criativa."));
c.push(H2("Passo a passo para analisar uma referência"));
c.push(...N(["Salve a imagem na pasta 02_REFERENCIAS.","Olhe para ela e responda em voz alta: **que tipo de letra é?** (assinatura, serifada, moderna, bold…)","**Quais cores aparecem?** (ex.: preto e dourado)","**Existe símbolo?** Se sim, o que ele representa?","**Qual é a sensação?** (luxo, delicadeza, força, diversão…)","Escreva uma frase de direção com tudo isso."]));
c.push(sp());
c.push(callout("EXEMPLO REAL — Mari Figueiredo",["A cliente trouxe uma referência criada por IA. A equipe identificou:","• estilo caligráfico/assinatura;","• combinação preto e dourado;","• intenção de incluir um elemento ligado à moda íntima.","**Direção definida:** logotipo caligráfico/assinatura + preto e dourado + detalhe delicado relacionado à moda íntima."]));
c.push(sp());
c.push(H3("Checklist"));
c.push(...CK(["Referências analisadas uma a uma","Estilo de letra identificado","Cores identificadas","Frase de direção criativa escrita","Direção salva no registro do projeto"]));

// 06
c.push(H1("06 — Etapa 4: Criar os primeiros estudos"));
c.push(OBJ("Explorar caminhos visuais diferentes e deixar o cliente indicar qual deve continuar. Não é necessário chegar logo na logo definitiva."));
c.push(img("04_estudos.png",600));c.push(cap("Figura 4 — Vários estudos → um caminho escolhido."));
c.push(H2("Passo a passo"));
c.push(...N(["Faça de **3 a 4 estudos de símbolo**. Eles precisam ser realmente **diferentes** entre si (não variações mínimas da mesma ideia).","Para cada opção, escreva **uma ou duas frases explicando a ideia**.","Monte uma imagem (ou prancha) com as opções numeradas: Opção 01, 02, 03, 04.","Envie ao cliente e peça que **indique qual caminho deve continuar**. Se ele ficar entre duas, tudo bem: pergunte o que ele gosta em cada uma.","Registre qual foi escolhida e salve tudo em 03_ESTUDOS."]));
c.push(sp());
c.push(MSG("MODELO — Envio dos estudos",["Oi, [NOME]! Preparamos [4] caminhos iniciais para o símbolo da sua marca. Ainda não é a logo final: é para você nos dizer qual direção quer que a gente aprofunde. 💛","Abaixo explico a ideia de cada um. Qual deles mais combina com você? Se ficar entre dois, me diga o que gostou em cada um."]));
c.push(sp());
c.push(callout("POR QUE EXPLICAR? (Etapa 4 → Etapa 5)",["Nunca mostre opções sem explicar. No projeto da Mari, a equipe explicou: o traço fluido remete ao caimento da seda e da renda; a borboleta traz leveza, conforto e a ideia de “segunda pele”, além de esconder as iniciais da marca.","O designer não diz só “escolha uma”. Ele sabe responder: **“por que essa opção existe?”**"]));
c.push(sp());
c.push(ATENCAO(["Mandar opções demais (mais de 4) deixa o cliente perdido.","Mandar opções quase iguais desperdiça a rodada.","Mandar sem explicação faz o cliente escolher só pelo gosto do momento."]));

// 07
c.push(H1("07 — Etapa 5: Definir o conceito"));
c.push(OBJ("Depois que o cliente escolhe o caminho, aprofundar a ideia que justifica o desenho."));
c.push(img("05_conceito.png",560));c.push(cap("Figura 5 — Exemplo: conceito da borboleta (projeto Mari)."));
c.push(H2("Como construir o conceito"));
c.push(...N(["Escreva o que o símbolo é (ex.: borboleta).","Liste de 4 a 6 palavras que ele representa (ex.: delicadeza, transformação, feminilidade, liberdade, confiança, segunda pele, sofisticação).","Escreva um pequeno texto de 3 a 5 linhas ligando o desenho ao negócio do cliente.","Guarde este texto: ele será usado na apresentação e para criar o slogan."]));
c.push(sp());
c.push(callout("REGRA",["O conceito deve justificar as escolhas visuais. Se você não consegue explicar por que um traço está ali, ele provavelmente não deveria estar."],GOLD));
c.push(sp());
c.push(P("No projeto da Mari, a equipe chegou a desenvolver uma analogia completa de metamorfose para orientar a construção do slogan e da identidade."));

// 08
c.push(H1("08 — Etapa 6: Tipografia"));
c.push(OBJ("Escolher as fontes da marca e mostrar ao cliente aplicadas na própria marca."));
c.push(H2("Passo a passo"));
c.push(...N(["Com o símbolo definido, escreva o nome da marca em **3 fontes diferentes** (Fonte 01, 02, 03).","Escreva embaixo o **nome de cada fonte**.","Aplique cada fonte **junto do símbolo**, não solta numa página em branco.","Envie ao cliente para escolher. Se ele pedir, mostre o slogan usando as fontes escolhidas.","Verifique a **licença** da fonte (uso comercial permitido?). Anote para o documento final."]));
c.push(sp());
c.push(H2("Nome da marca × Slogan: mesma fonte ou fontes diferentes?"));
c.push(P("É uma dúvida comum dos clientes (aconteceu no projeto da Mari). Apresente sempre as duas possibilidades:"));
c.push(img("06_tipografia.png",560));c.push(cap("Figura 6 — Opção A: mesma tipografia. Opção B: tipografias diferentes."));
c.push(callout("REGRA",["Quando a escolha tipográfica ainda estiver aberta, apresente visualmente as alternativas. Não tente explicar apenas por texto."],GOLD));
c.push(sp());
c.push(H3("Checklist"));
c.push(...CK(["3 opções de fonte criadas","Nome de cada fonte anotado","Fontes aplicadas na marca","Opções A e B (nome × slogan) mostradas, se houver dúvida","Licença das fontes conferida"]));

// 09
c.push(H1("09 — Etapa 7: Slogan"));
c.push(OBJ("Criar um slogan baseado no conceito — nunca de forma aleatória."));
c.push(H2("Passo a passo"));
c.push(...N(["Releia o conceito (Etapa 5).","Escreva **de 8 a 10 frases curtas** (até 5 palavras). Pode ser de forma bruta.","Escolha as **3 a 4 melhores**.","Teste cada uma: conversa com a **marca + público + posicionamento + conceito visual**?","Mostre ao cliente as alternativas e deixe-o escolher."]));
c.push(sp());
c.push(callout("EXEMPLO REAL — Alternativas apresentadas à Mari",["“Delicadeza que transforma”  ✔ (escolhido)","“Sensualidade com sofisticação”","“Vista sua confiança”","“Liberdade que transforma”","Note como todos ligam com a ideia de transformação (a borboleta) e com o produto (moda íntima)."]));
c.push(sp());
c.push(ATENCAO(["Slogan longo demais não cabe na logo reduzida.","Slogan genérico (“Qualidade e confiança”) serve para qualquer empresa e não diz nada.","Conferir a ortografia ANTES de enviar."]));

// 10
c.push(H1("10 — Etapa 8: Construção final"));
c.push(OBJ("Reunir todos os elementos em uma composição final bem equilibrada."));
c.push(img("07_anatomia.png",560));c.push(cap("Figura 7 — Anatomia da logomarca."));
c.push(table([2100,7538],[["Elemento","O que fazer"],["Logotipo","Escrever o nome da marca na fonte escolhida e ajustar o espaçamento entre as letras (kerning)."],["Símbolo","Posicionar o símbolo com tamanho proporcional ao nome."],["Slogan","Se contratado/definido, posicionar abaixo ou ao lado, sempre menor que o nome."],["Cores","Aplicar a paleta oficial (máx. 2 a 3 cores principais)."],["Tipografia","Fonte principal e secundária definidas."],["Composição","Definir espaçamento, alinhamento, proporção, hierarquia e relação símbolo/nome/slogan."]]));
c.push(sp());
c.push(H2("Dicas para a composição ficar profissional"));
["Alinhe tudo com a grade/guias do programa. Nada de “ajustar no olho” sem conferir.","Use o mesmo espaço entre símbolo e nome em todas as versões.","Dê **hierarquia**: primeiro o olho vê o nome, depois o símbolo, depois o slogan (ou o contrário, se esse for o conceito).","Afaste-se da tela (ou diminua o zoom) e veja se a marca ainda funciona."].forEach(t=>c.push(B(t)));

// 11
c.push(H1("11 — Medidas, tamanho mínimo e área de proteção"));
c.push(OBJ("Preparar o arquivo tecnicamente para funcionar em qualquer tamanho."));
c.push(callout("IMPORTANTE",["Não existe uma única medida física que sirva para todas as logomarcas. O importante é **trabalhar em vetor** e definir os tamanhos de aplicação conforme a necessidade. Não use uma medida universal como regra absoluta."],RED,"FDECEA"));
c.push(sp());
c.push(H2("Padrão interno de trabalho"));
c.push(table([3000,6638],[["Item","Padrão"],["Prancheta principal","1920 × 1080 px"],["Unidade","px (desenvolvimento digital)"],["Tipo de arquivo de trabalho","Vetorial (pode ser redimensionado sem perda de qualidade)"]]));
c.push(sp());
c.push(H2("Como testar o tamanho mínimo"));
c.push(img("09_minimo.png",600));c.push(cap("Figura 8 — Reduza até o texto/detalhe deixar de ser legível."));
c.push(...N(["**Digital:** reduza a marca aos poucos. Observe quando (a) o texto deixa de ser legível, (b) os detalhes somem, (c) o símbolo perde definição.","**Impressão:** teste em milímetros (imprima ou simule). Veja até que tamanho ainda dá para ler.","Anote o menor tamanho em que a marca ainda funciona. Esse é o **tamanho mínimo** daquela logo.","Se o slogan fica ilegível primeiro, crie uma versão sem slogan para tamanhos pequenos."]));
c.push(sp());
c.push(H2("Área de proteção"));
c.push(P("É uma margem mínima ao redor da marca. Impede que textos, imagens, bordas ou outros logos fiquem colados nela."));
c.push(img("08_protecao.png",420));c.push(cap("Figura 9 — X é a unidade de medida (ex.: altura de uma letra da marca)."));
c.push(...N(["Escolha uma unidade X (ex.: altura da letra inicial do nome).","Desenhe um retângulo ao redor da logo com margem de X em cada lado.","Mostre essa área no documento final."]));

// 12
c.push(H1("12 — Versões que devem ser criadas"));
c.push(OBJ("Entregar a marca preparada para qualquer situação de uso."));
c.push(img("10_versoes.png",600));c.push(cap("Figura 10 — Entrega padrão: versões da logomarca (modelo ilustrativo)."));
c.push(table([2900,6738],[["Versão","Quando usar"],["01 — Logo principal","Nome + símbolo (+ slogan). A versão oficial."],["02 — Logo reduzida","Aplicações menores, sem o slogan."],["03 — Ícone/símbolo","Foto de perfil, favicon, etiquetas, espaços pequenos."],["04 — Fundo claro","Quando o fundo é branco ou claro."],["05 — Fundo escuro","Quando o fundo é preto ou escuro."],["06 — Monocromática","Uma única cor (carimbo, bordado, fax, impressão simples)."],["07 — Reversa (branca)","Totalmente branca para fundos coloridos ou fotos."],["08 — Variações de composição","Horizontal/vertical, quando fizer sentido para aquela marca."]]));
c.push(sp());
c.push(P("No projeto da Mari, o pacote vendido incluía: logotipo principal, versão reduzida/ícone, versões para fundo claro e escuro, PNG transparente, PDF vetorial, SVG, paleta de cores, fontes e 1 mockup. **Sempre confira no contrato o que foi vendido e entregue exatamente isso (e nunca menos).**"));

// 13
c.push(H1("13 — Formatos de arquivo"));
c.push(OBJ("Exportar cada formato corretamente e saber para que serve."));
c.push(img("11_formatos.png",600));c.push(cap("Figura 11 — Os formatos e seus usos."));
c.push(table([1500,3800,4338],[["Formato","Deve conter","Utilização"],["PNG","Fundo transparente (quando solicitado), alta resolução, composição correta.","Instagram, WhatsApp, apresentações, materiais digitais."],["PDF","Versão vetorial preservada, exportada a partir do arquivo vetorial.","Impressão, gráfica, fornecedores, arquivo oficial da marca."],["SVG","Vetor limpo, sem imagens incorporadas desnecessárias.","Sites, aplicações digitais, interfaces, sistemas compatíveis."],["Editável","CDR, AI, EPS ou formato de trabalho da equipe.","Somente se faz parte do que foi contratado."]]));
c.push(sp());
c.push(H3("Antes de entregar o arquivo editável, confira"));
c.push(...CK(["Elementos organizados (camadas nomeadas, sem sobras)","Fontes tratadas adequadamente (convertidas em curvas, se for o caso)","Imagens incorporadas quando necessário","Objetos vetoriais corretos","O arquivo abre normalmente em outro computador"]));
c.push(sp());
c.push(callout("COMO EXPORTAR (resumo para quem está começando)",["**PNG:** Exportar → PNG → marque “fundo transparente” → resolução alta (ex.: 300 dpi ou largura mínima de 3000 px).","**PDF:** Salvar como → PDF → mantenha a opção de preservar a edição vetorial.","**SVG:** Exportar/Salvar como → SVG → abra no navegador para ver se está igual."],GOLD));

// 14
c.push(H1("14 — Cores e tipografias do documento final"));
c.push(OBJ("Entregar a paleta e as fontes com valores exatos, para que qualquer pessoa reproduza a marca igual."));
c.push(img("12_cores.png",600));c.push(cap("Figura 12 — Modelo de apresentação da paleta (valores de exemplo)."));
c.push(table([2400,2400,2400,2438],[["Cor","HEX","RGB","CMYK"],["Principal","#000000","0 / 0 / 0","0 / 0 / 0 / 100"],["Secundária","#XXXXXX","XXX / XXX / XXX","XX / XX / XX / XX"]]));
c.push(sp());
c.push(callout("REGRA",["Os valores reais devem sempre ser retirados do arquivo final (conta-gotas / painel de cores). **Não copie valores aproximados.**"],RED,"FDECEA"));
c.push(sp());
c.push(H2("Tipografias"));
c.push(table([3500,6138],[["Uso","Nome da fonte"],["Tipografia principal","(nome da fonte)"],["Tipografia secundária","(nome da fonte)"],["Tipografia do slogan","(nome da fonte)"],["Licença","Informar se há alguma condição de licença"]]));

// 15
c.push(H1("15 — Mockup"));
c.push(OBJ("Mostrar ao cliente como a identidade funciona na vida real."));
c.push(img("13_mockups.png",600));c.push(cap("Figura 13 — Exemplos de mockups: cartão, sacola e perfil de Instagram."));
c.push(callout("LEMBRE-SE",["O mockup **não substitui a logo final**. Ele serve para o cliente visualizar a marca em uso. No projeto da Mari, mockups também ajudaram a cliente a comparar as opções."],GOLD));
c.push(sp());
c.push(P("Exemplos: cartão, sacola, embalagem, fachada, etiqueta, perfil de Instagram."));
c.push(H2("Passo a passo"));
c.push(...N(["Escolha a aplicação mais importante para o negócio do cliente (ex.: loja de roupa → sacola/etiqueta).","Use um modelo de mockup (PSD/Canva) de boa qualidade.","Insira a logo (use a versão certa para o fundo).","Exporte em JPG/PNG e salve em 09_MOCKUPS."]));

// 16
c.push(H1("16 — Revisão interna (antes de enviar ao cliente)"));
c.push(OBJ("Pegar os erros antes que o cliente os veja. Esta revisão é obrigatória."));
c.push(img("17_revisao.png",600));c.push(cap("Figura 14 — Os três grupos de conferência."));
c.push(H3("DESIGN"));
c.push(...CK(["Logo está equilibrada","Símbolo está alinhado","Tipografia está correta","Slogan está correto","Cores corretas","Espaçamentos revisados","Proporções corretas"]));
c.push(H3("TEXTO"));
c.push(...CK(["Nome da empresa correto","Slogan correto","Sem erro ortográfico"]));
c.push(H3("ARQUIVO"));
c.push(...CK(["Vetorizado","Arquivo organizado","Versões criadas","Fundo claro","Fundo escuro","Reduzida","Símbolo"]));
c.push(sp());
c.push(callout("DICA DE OURO",["Leia o nome da empresa letra por letra, em voz alta. Erro de nome é o erro mais caro e mais vergonhoso."],GOLD));

// 17
c.push(H1("17 — Apresentação ao cliente"));
c.push(OBJ("Mostrar a logo de forma profissional, contando a história por trás dela."));
c.push(P("A apresentação final deve seguir esta ordem:"));
c.push(table([900,2600,6138],[["Nº","Slide/Página","O que mostrar"],["01","Logo","A marca final, grande, em fundo limpo."],["02","Conceito","O texto curto da Etapa 5."],["03","Símbolo","O símbolo isolado e a ideia dele."],["04","Tipografia","Nome das fontes e exemplo de uso."],["05","Cores","Paleta com HEX/RGB/CMYK."],["06","Variações","Fundo claro, escuro, reduzida, mono."],["07","Aplicações","A logo em uso."],["08","Mockup","Montagem realista."]]));
c.push(sp());
c.push(MSG("MODELO — Envio da apresentação",["Oi, [NOME]! Aqui está a apresentação da sua logomarca. 💛 Preparei para te mostrar o conceito, as cores, as fontes e como ela fica na prática.","Dê uma olhada com calma. Se quiser algum ajuste, me diga exatamente o que gostaria de mudar. Você tem direito a até 3 rodadas de ajustes. Se estiver tudo certo, é só me dizer “aprovado”!"]));

// 18
c.push(H1("18 — Alterações (rodadas de ajustes)"));
c.push(OBJ("Receber os pedidos do cliente com organização e nunca perder o controle de quantas rodadas já foram usadas."));
c.push(img("15_rodadas.png",600));c.push(cap("Figura 15 — Até 3 rodadas de ajustes, depois aprovação."));
c.push(H2("Passo a passo para cada pedido de alteração"));
c.push(...N(["Peça ao cliente que **liste tudo o que quer alterar de uma vez** (e não aos poucos).","Releia o pedido e **confirme por escrito** o que você entendeu.","Marque a rodada no controle abaixo.","Faça as alterações e salve como nova versão (v2, v3).","Envie com um resumo do que mudou.","Se o pedido for muito diferente do contrato (ex.: trocar totalmente o conceito aprovado), avise gentilmente que é um novo trabalho."]));
c.push(sp());
c.push(H3("Planilha de controle das rodadas"));
c.push(table([1200,5338,1600,1500],[["Rodada","O que o cliente pediu","Data","Status"],["01","","","☐"],["02","","","☐"],["03","","","☐"]]));
c.push(sp());
c.push(callout("REGRA",["Nunca perca o controle das rodadas. Se o cliente pedir uma 4ª rodada, consulte o responsável comercial antes de fazer."],RED,"FDECEA"));
c.push(sp());
c.push(MSG("MODELO — Confirmação de pedido",["Entendi, [NOME]! Vou fazer estes ajustes: 1) [...] 2) [...] 3) [...]. Essa é a sua rodada [1] de 3. Está tudo certo ou quer incluir mais alguma coisa antes de eu começar?"]));

// 19
c.push(H1("19 — Aprovação"));
c.push(OBJ("Registrar a aprovação do cliente de forma clara."));
c.push(...N(["Quando o cliente disser “está aprovado” (ou equivalente), **tire print da mensagem** e salve em 05_APROVADO.","Responda confirmando: “Aprovação registrada! Vou finalizar os arquivos.”","Anote a **data da aprovação** no controle do projeto.","Avance para a finalização. **Depois da aprovação, não altere mais o desenho.**"]));
c.push(sp());
c.push(callout("FLUXO",["APROVAÇÃO → FINALIZAÇÃO"],GOLD));
c.push(sp());
c.push(P("No projeto da Mari, a entrega final foi encaminhada por um link do Drive e a cliente confirmou posteriormente que estava tudo certo."));

// 20
c.push(H1("20 — Organização do Drive"));
c.push(OBJ("Deixar tudo em pastas padronizadas para que qualquer pessoa da equipe encontre qualquer arquivo."));
c.push(img("14_pastas.png",400));c.push(cap("Figura 16 — Estrutura padrão de pastas."));
c.push(...N(["Crie a pasta principal com o nome: **CLIENTE - LOGOMARCA**.","Crie as 6 subpastas (01 a 06).","Dentro de 06_ENTREGA, crie as 10 subpastas.","Coloque cada arquivo na pasta certa.","Confira o compartilhamento: o cliente deve ter acesso apenas à pasta 06_ENTREGA (não aos estudos internos)."]));

// 21
c.push(H1("21 — Nomenclatura dos arquivos"));
c.push(OBJ("Dar nomes claros, sempre no mesmo padrão."));
c.push(table([4819,4819],[["❌ NUNCA USE","✔ USE"],["logo final.png\nlogo final 2.png\nlogo certa.png\nlogo nova.png","NOME_CLIENTE_TIPO.extensão\nTudo em maiúsculas, com underline (_), sem acento e sem espaços."]]));
c.push(sp());
c.push(H2("Modelo (exemplo: Mari Figueiredo)"));
c.push(table([6000,3638],[["Nome do arquivo","Conteúdo"],["MARI_FIGUEIREDO_LOGO_PRINCIPAL.png / .pdf / .svg","Logo principal"],["MARI_FIGUEIREDO_LOGO_REDUZIDA.png","Logo reduzida"],["MARI_FIGUEIREDO_SIMBOLO.png","Símbolo/ícone"],["MARI_FIGUEIREDO_LOGO_FUNDO_CLARO.png","Para fundo claro"],["MARI_FIGUEIREDO_LOGO_FUNDO_ESCURO.png","Para fundo escuro"],["MARI_FIGUEIREDO_LOGO_BRANCA.png","Versão branca"],["MARI_FIGUEIREDO_LOGO_PRETA.png","Versão preta"]]));

// 22
c.push(H1("22 — Conferência e entrega"));
c.push(OBJ("Garantir que o cliente receba tudo certo, aberto e organizado."));
c.push(H2("Conferência final (faça sozinho, com calma)"));
c.push(...CK(["Abri TODOS os arquivos (PNG, PDF, SVG, editáveis)","Os PNG têm fundo transparente (testei sobre um fundo colorido)","O PDF abre e não perde qualidade ao dar zoom","O SVG abre no navegador igual ao original","Nomes de arquivo no padrão (sem “final2”)","Cada arquivo na pasta certa","Link do Drive abre em aba anônima (sem estar logado)","O pacote entregue é igual ao que foi contratado"]));
c.push(sp());
c.push(MSG("MODELO — Mensagem de entrega",["Oi, [NOME]! Chegou o grande dia! 🎉 Sua logomarca está finalizada. Aqui está o link com todos os arquivos organizados em pastas: [LINK]","Dentro você encontra: logo principal, versões para fundo claro/escuro, ícone, PNG, PDF, SVG, paleta e fontes.","Dê uma olhada e me confirme se conseguiu abrir tudo, tá? Qualquer dúvida de como usar, me pergunte! 💛"]));
c.push(sp());
c.push(P("**Peça sempre a confirmação de recebimento.** Só considere entregue quando o cliente responder."));

// 23
c.push(H1("23 — Pós-venda"));
c.push(OBJ("Garantir que o cliente está satisfeito e conseguir indicações e novos trabalhos."));
c.push(...N(["Dois a três dias depois, pergunte como está sendo a experiência de usar a logo.","Ofereça ajuda com dúvidas de uso (ex.: “quer o arquivo em outro tamanho?”).","Peça um depoimento curto (pode ser áudio).","Peça uma indicação.","Se houver necessidade nova (ex.: versão dourada), analise com o responsável e atualize o Drive."]));
c.push(sp());
c.push(callout("APRENDIZADO DO CASO MARI",["A entrega não necessariamente encerra a comunicação. O cliente pode identificar uma necessidade de aplicação depois de ver os arquivos. No caso da Mari, a cliente percebeu a necessidade de uma versão dourada e a equipe atualizou o material no Drive."],GREEN,"EAF4EE"));
c.push(sp());
c.push(MSG("MODELO — Pós-venda",["Oi, [NOME]! Passando para saber como está sendo usar a sua nova logo. Conseguiu aplicar nas redes? Se precisar de qualquer versão ou formato extra, me avise. E se puder, me conte o que achou do nosso trabalho — seu depoimento ajuda muito! 💛"]));

// 24
c.push(H1("24 — Estudo de caso: Mari Figueiredo"));
c.push(OBJ("Ver como todas as etapas se conectaram em um projeto real."));
c.push(img("16_caso_mari.png",600));c.push(cap("Figura 17 — Linha do tempo do projeto."));
c.push(table([2300,7338],[["Fase","O que aconteceu"],["Início","Cliente apresentou uma referência criada por IA."],["Direção","Caligráfico/assinatura + preto/dourado + moda íntima."],["Exploração","A equipe desenvolveu diferentes símbolos."],["Seleção","A cliente escolheu entre os estudos."],["Conceito","Foi desenvolvido o conceito da borboleta."],["Tipografia","Foram apresentadas diferentes fontes."],["Slogan","Alternativas criadas; escolhido “Delicadeza que transforma”."],["Finalização","Logo aprovada e arquivos disponibilizados."],["Pós-entrega","Nova necessidade (versão dourada): material atualizado no Drive."]]));

// 25
c.push(H1("25 — Checklist final do funcionário"));
c.push(P("Imprima esta página e marque a cada projeto. O projeto só termina quando tudo estiver marcado."));
const group=(t,items)=>{c.push(H3(t));c.push(...CK(items));};
group("PROJETO",["Contrato","Pagamento","Briefing","Referências"]);
group("CRIAÇÃO",["Pesquisa","Conceito","Estudos","Símbolo","Tipografia","Slogan","Cores"]);
group("CLIENTE",["Apresentação","Feedback","Rodada 01","Rodada 02","Rodada 03","Aprovação"]);
group("ENTREGA",["Logo principal","Logo reduzida","Símbolo","Fundo claro","Fundo escuro","Preto","Branco","PNG","PDF","SVG","Paleta","Tipografia","Mockup","Editáveis, se contratado"]);
group("FINAL",["Drive organizado","Nomes dos arquivos conferidos","Arquivos abrem","Cliente recebeu","Cliente confirmou recebimento","Pós-venda realizado"]);

// 26
c.push(H1("26 — Perguntas frequentes e o que fazer em caso de dúvida"));
c.push(table([3600,6038],[["Situação","O que fazer"],["O cliente some depois do briefing.","Envie lembrete educado após 24 h e outro após 72 h. Anote no registro. O prazo só conta com as informações recebidas."],["O cliente não gostou de nenhuma opção.","Pergunte o que exatamente não agradou (cor, letra, símbolo, sensação). Peça uma nova referência. Isso conta como rodada, se for após a escolha do caminho."],["O cliente pede para copiar uma logo de outra marca.","Explique que a marca precisa ser única. Use a referência só como direção de estilo."],["O cliente quer algo que não está no contrato.","Seja gentil, explique que não está incluído e consulte o responsável comercial."],["Passou da 3ª rodada.","Consulte o responsável comercial antes de continuar."],["Não sei se a fonte é gratuita para uso comercial.","Pesquise a licença no site oficial. Na dúvida, escolha outra fonte."],["O arquivo não abre no computador do cliente.","Reenvie em PDF e PNG, e explique como abrir os demais formatos."],["Errei o nome da empresa na logo entregue.","Assuma o erro, corrija imediatamente, reenvie e atualize o Drive. Não cobre rodada."]]));
c.push(sp());
c.push(callout("SE NADA AQUI RESOLVER",["Pare, anote exatamente o que aconteceu, o que o cliente disse e o que você já tentou. Leve isso ao responsável da Freitas Hub. Nunca invente uma resposta para o cliente."],RED,"FDECEA"));

// ===== DOC =====
const numbering={config:[{reference:"bul",levels:[{level:0,format:LevelFormat.BULLET,text:"•",alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:540,hanging:270}}}},{level:1,format:LevelFormat.BULLET,text:"–",alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:1000,hanging:270}}}}]}]};
// numeração nums
for(const r of NUMS) numbering.config.push({reference:r,levels:[{level:0,format:LevelFormat.DECIMAL,text:"%1.",alignment:AlignmentType.LEFT,style:{paragraph:{indent:{left:540,hanging:360}},run:{bold:true,color:GOLD}}}]});
const doc=new Document({
  creator:"Freitas Hub",title:"Manual Operacional — Criação de Logomarca",
  styles:{default:{document:{run:{font:FONT,size:22}}},paragraphStyles:[
    {id:"Heading1",name:"Heading 1",basedOn:"Normal",next:"Normal",quickFormat:true,run:{size:38,bold:true,color:INK,font:FONT},paragraph:{spacing:{before:0,after:200},outlineLevel:0,border:{bottom:{style:BorderStyle.SINGLE,size:12,color:GOLD,space:6}}}},
    {id:"Heading2",name:"Heading 2",basedOn:"Normal",next:"Normal",quickFormat:true,run:{size:28,bold:true,color:GOLD,font:FONT},paragraph:{spacing:{before:260,after:120},outlineLevel:1,keepNext:true}},
    {id:"Heading3",name:"Heading 3",basedOn:"Normal",next:"Normal",quickFormat:true,run:{size:24,bold:true,color:INK,font:FONT},paragraph:{spacing:{before:200,after:80},outlineLevel:2,keepNext:true}}]},
  numbering,
  sections:[{properties:{page:{size:{width:11906,height:16838},margin:{top:1304,bottom:1134,left:1134,right:1134}}},
    headers:{default:new Header({children:[new Paragraph({tabStops:[{type:TabStopType.RIGHT,position:W}],border:{bottom:{style:BorderStyle.SINGLE,size:4,color:"D9C28A",space:4}},children:[new TextRun({text:"FREITAS HUB",bold:true,color:GOLD,size:18,font:FONT}),new TextRun({text:"\tManual Operacional — Criação de Logomarca",color:GRAY,size:18,font:FONT})]})]})},
    footers:{default:new Footer({children:[new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:"Página ",size:18,color:GRAY,font:FONT}),new TextRun({children:[PageNumber.CURRENT],size:18,color:GRAY,font:FONT})]})]})},
    children:c}]
});
Packer.toBuffer(doc).then(b=>{fs.writeFileSync("Manual_Operacional_Criacao_de_Logomarca_Freitas_Hub.docx",b);console.log("ok")});
