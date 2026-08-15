let gender='female',language='en-IN',profile={},timer,seconds=0;
const $=id=>document.getElementById(id);

function selectGender(g){
 gender=g;
 $('female').classList.toggle('selected',g==='female');
 $('male').classList.toggle('selected',g==='male');
 updateVoiceStatus();
}
function initials(n){return n.split(/\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase()}

function selectLanguage(l){
 language=l;
}
function languagePack(){
 const n=profile.name;
 const packs={
  'en-IN':`Hey, it's ${n}. Are you okay? I was just calling to check on you.`,
  'hi-IN':`हाय, मैं ${n} बोल रही हूँ। तुम ठीक हो ना? मैं बस तुम्हें चेक करने के लिए फोन कर रही हूँ।`,
  'kn-IN':`ಹಾಯ್, ನಾನು ${n} ಮಾತನಾಡುತ್ತಿದ್ದೇನೆ. ನೀನು ಚೆನ್ನಾಗಿದ್ದೀಯಾ? ನಿನ್ನನ್ನು ವಿಚಾರಿಸಲು ಕರೆ ಮಾಡಿದೆ.`,
  'ta-IN':`ஹாய், நான் ${n} பேசுகிறேன். நீ நலமாக இருக்கிறாயா? உன்னைப் பற்றி தெரிந்துகொள்ள அழைத்தேன்.`,
  'te-IN':`హాయ్, నేను ${n} మాట్లాడుతున్నాను. నువ్వు బాగున్నావా? నిన్ను పలకరించడానికి కాల్ చేశాను.`,
  'ml-IN':`ഹായ്, ഇത് ${n} ആണ്. നിനക്ക് സുഖമാണോ? നിന്നെ ഒന്ന് അന്വേഷിക്കാൻ വിളിച്ചതാണ്.`,
  'mr-IN':`हाय, मी ${n} बोलतेय. तू ठीक आहेस ना? तुझी चौकशी करायला फोन केला.`,
  'bn-IN':`হাই, আমি ${n} বলছি। তুমি ঠিক আছো তো? তোমার খোঁজ নিতে ফোন করেছি।`,
  'gu-IN':`હાય, હું ${n} બોલું છું. તું ઠીક છે ને? તારી ખબર લેવા ફોન કર્યો.`,
  'pa-IN':`ਹਾਇ, ਮੈਂ ${n} ਬੋਲ ਰਹੀ ਹਾਂ। ਤੂੰ ਠੀਕ ਹੈਂ ਨਾ? ਤੇਰਾ ਹਾਲ ਪੁੱਛਣ ਲਈ ਫ਼ੋਨ ਕੀਤਾ।`,
  'or-IN':`ହାଏ, ମୁଁ ${n} କହୁଛି। ତୁମେ ଠିକ୍ ଅଛ କି? ତୁମର ଖବର ନେବା ପାଇଁ ଫୋନ୍ କରିଛି।`
 };
 return packs[language] || packs['en-IN'];
}

function getContacts(){return JSON.parse(localStorage.getItem('tutelarContacts')||'[]')}
function saveContacts(a){localStorage.setItem('tutelarContacts',JSON.stringify(a))}
function renderContacts(){
 const a=getContacts();$('savedArea').style.display=a.length?'block':'none';
 $('contacts').innerHTML=a.map((c,i)=>`<div class="contact" onclick="useContact(${i})"><div class="circle">${initials(c.name)}</div><div><b>${c.name}</b><small>${c.relation} • ${c.gender}</small></div><button class="delete" onclick="event.stopPropagation();deleteContact(${i})">×</button></div>`).join('');
}
function useContact(i){
 profile=getContacts()[i];
 gender=profile.gender;
 language=profile.language || 'en-IN';
 if($('language')) $('language').value=language;
 startIncoming();
}
function deleteContact(i){let a=getContacts();a.splice(i,1);saveContacts(a);renderContacts()}
function getFormProfile(){
 const name=$('name').value.trim()||'Mom';
 const relation=$('relation').value.trim()||'Relative';
 language=$('language')?.value || language;
 return {name,relation,gender,language};
}
function saveRelative(){
 profile=getFormProfile();
 let a=getContacts();
 const idx=a.findIndex(c=>c.name.toLowerCase()===profile.name.toLowerCase());
 if(idx>=0)a[idx]=profile;else a.unshift(profile);
 saveContacts(a);renderContacts();
 $('saveStatus').textContent='✓ Relative saved for future emergencies';
}
function startFromForm(){
 profile=getFormProfile();
 startIncoming();
}
function startIncoming(){
 $('avatar').textContent=initials(profile.name);$('avatar2').textContent=initials(profile.name);
 $('caller').textContent=profile.name;$('caller2').textContent=profile.name;$('rel').textContent=profile.relation;
 show('incoming');
}
function show(id){document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));$(id).classList.add('active')}
function answer(){
 show('connected');seconds=0;clearInterval(timer);
 timer=setInterval(()=>{$('timer').textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');seconds++},1000);
 speak();
}
let availableVoices = [];

function loadVoices(){
  if(!('speechSynthesis' in window)) return;
  availableVoices = speechSynthesis.getVoices() || [];
  updateVoiceStatus();
}
if('speechSynthesis' in window){
  speechSynthesis.onvoiceschanged = loadVoices;
  loadVoices();
}

function selectBestVoice(g){
  const voices = availableVoices;
  const langCode = language || 'en-IN';
  if(!voices.length) return null;

  const femaleWords = ['female','woman','zira','samantha','karen','moira','victoria','susan','hazel','sara','aria','jenny','libby'];
  const maleWords = ['male','man','david','mark','daniel','alex','george','ryan','guy','fred','arthur','liam'];

  const preferred = g === 'female' ? femaleWords : maleWords;

  // Prefer English voices, then score by likely gender/name.
  const matching = voices.filter(v => v.lang && v.lang.toLowerCase().replace('_','-') === langCode.toLowerCase());
  const sameFamily = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith(langCode.split('-')[0].toLowerCase()));
  const pool = matching.length ? matching : (sameFamily.length ? sameFamily : voices);

  let best = pool.find(v => preferred.some(w => v.name.toLowerCase().includes(w)));
  if(best) return best;

  // Prefer high-quality/native-looking English voices if gender is not exposed.
  return pool.find(v => /Google|Microsoft|Natural|Premium|Enhanced/i.test(v.name)) || pool[0];
}

function updateVoiceStatus(){
  const el = $('voiceStatus');
  if(!el) return;
  const voice = selectBestVoice(gender);
  el.textContent = voice
    ? `Voice: ${gender === 'female' ? 'Female' : 'Male'} • ${voice.name}`
    : `Voice: ${gender === 'female' ? 'Female' : 'Male'} • Browser default`;
}

function speak(){
 const text=languagePack();
 $('spoken').textContent=text;
 if(!('speechSynthesis' in window)) return;
 speechSynthesis.cancel();
 const u=new SpeechSynthesisUtterance(text);
 u.lang=profile.language || language || 'en-IN';
 const voice=selectBestVoice(profile.gender);
 if(voice) u.voice=voice;
 u.rate=profile.gender==='female'?0.92:0.90;
 u.pitch=profile.gender==='female'?1.03:0.94;
 u.volume=1;
 setTimeout(()=>speechSynthesis.speak(u),180);
}
function reset(){clearInterval(timer);if('speechSynthesis'in window)speechSynthesis.cancel();show('setup');renderContacts()}
selectGender('female'); if($('language')) $('language').value='en-IN'; renderContacts();
