const galaxy = document.getElementById('galaxy-bg');
for(let i=0; i<150; i++){
  const s = document.createElement('div');
  s.classList.add('star');
  const size = Math.random()*3+'px';
  s.style.width=size; s.style.height=size;
  s.style.top=Math.random()*100+'%';
  s.style.left=Math.random()*100+'%';
  s.style.animationDuration=(2+Math.random()*3)+'s';
  galaxy.appendChild(s);
}

const enterBtn = document.getElementById('enterBtn');
const welcome = document.getElementById('welcome-screen');
const studio = document.getElementById('studio');
enterBtn.addEventListener('click',()=>{
  welcome.classList.add('hidden');
  studio.classList.remove('hidden');
  speak('Bienvenido al estudio de arte anime. Soy tu profesora, calmada y elegante. Estoy aquí para ayudarte a crear arte con emoción.');
});

const canvas = document.getElementById('drawBoard');
const ctx = canvas.getContext('2d');
let drawing=false, color='#000000', erasing=false;

document.getElementById('colorPicker').addEventListener('input',e=>{ color=e.target.value; });
canvas.addEventListener('mousedown',()=>{drawing=true;});
canvas.addEventListener('mouseup',()=>{drawing=false;ctx.beginPath();});
canvas.addEventListener('mousemove',draw);

function draw(e){
  if(!drawing) return;
  ctx.lineWidth=3;
  ctx.lineCap='round';
  ctx.strokeStyle=erasing?'#FFFFFF':color;
  ctx.lineTo(e.offsetX,e.offsetY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(e.offsetX,e.offsetY);
}

document.getElementById('eraseBtn').addEventListener('click',()=>{ erasing=!erasing; });
document.getElementById('clearBtn').addEventListener('click',()=>{ ctx.clearRect(0,0,canvas.width,canvas.height); });
document.getElementById('saveBtn').addEventListener('click',()=>{
  const link=document.createElement('a');
  link.download='dibujo.png';
  link.href=canvas.toDataURL();
  link.click();
});

// Chat + voz
const chatBox=document.getElementById('chat-box');
const sendBtn=document.getElementById('sendBtn');
const userInput=document.getElementById('userInput');

sendBtn.addEventListener('click',sendMessage);
userInput.addEventListener('keypress',e=>{ if(e.key==='Enter') sendMessage(); });

function sendMessage(){
  const text=userInput.value.trim();
  if(!text) return;
  appendMessage('Usuario',text);
  userInput.value='';
  handleBotResponse(text.toLowerCase());
}

function appendMessage(sender,text){
  const msg=document.createElement('div');
  msg.textContent=`${sender}: ${text}`;
  msg.style.margin='5px 0';
  chatBox.appendChild(msg);
  chatBox.scrollTop=chatBox.scrollHeight;
}

function speak(text){
  const utter=new SpeechSynthesisUtterance(text);
  utter.lang='es-ES';
  utter.pitch=1; utter.rate=1; utter.volume=1;
  speechSynthesis.speak(utter);
}

function handleBotResponse(msg){
  let response='';
  if(msg.includes('tutorial')){
    response='Bien, haremos un boceto suave en tonos grises y azulados. Observa el centro del tablero.';
    drawSketch();
  } else if(msg.includes('dibuja')||msg.includes('haz')||msg.includes('pinta')){
    response='Perfecto, dibujaré algo con estilo anime clásico y colores vivos.';
    drawAnimeArt();
  } else {
    response='Estoy aquí para ayudarte a crear o aprender arte anime. Puedes pedirme un tutorial o que dibuje algo.';
  }
  appendMessage('DiseñaArte IA',response);
  speak(response);
}

function drawSketch(){
  ctx.strokeStyle='rgba(100,150,255,0.5)';
  ctx.lineWidth=2;
  ctx.beginPath();
  ctx.moveTo(400,300);
  for(let i=0;i<10;i++){
    ctx.lineTo(400+Math.random()*100-50,300+Math.random()*100-50);
  }
  ctx.stroke();
}

function drawAnimeArt(){
  const gradient=ctx.createLinearGradient(350,250,450,350);
  gradient.addColorStop(0,'#ff7f50');
  gradient.addColorStop(1,'#1e90ff');
  ctx.fillStyle=gradient;
  ctx.beginPath();
  ctx.arc(400,300,80,0,Math.PI*2);
  ctx.fill();
}
