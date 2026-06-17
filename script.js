const groups = {
  favorites: [
    app('Google','https://www.google.com/','google.com'),
    app('YouTube','https://www.youtube.com/','youtube.com'),
    app('Gmail','https://mail.google.com/','gmail.com'),
    app('Hotmail','https://outlook.live.com/mail/','outlook.live.com'),
    app('WhatsApp Web','https://web.whatsapp.com/','whatsapp.com'),
    app('Instagram','https://www.instagram.com/','instagram.com'),
    app('TikTok','https://www.tiktok.com/','tiktok.com', true),
    app('Facebook','https://www.facebook.com/','facebook.com'),
    app('Maps','https://www.google.com/maps','maps.google.com'),
    app('Traductor','https://translate.google.com/','translate.google.com'),
    app('Clima','https://www.google.com/search?q=clima+buenos+aires','weather.com'),
    app('X.com','https://x.com/','x.com', true),
    app('Calendario','https://calendar.google.com/','calendar.google.com'),
    app('Calculadora','https://www.google.com/search?q=calculadora','calculator.net', true)
  ],
  content: [
    app('Mercado Libre','https://www.mercadolibre.com.ar/','mercadolibre.com.ar'),
    app('Mercado Pago','https://www.mercadopago.com.ar/','mercadopago.com.ar'),
    app('Amazon','https://www.amazon.com/','amazon.com', true),
    app('Wikipedia','https://es.wikipedia.org/','wikipedia.org'),
    app('Netflix','https://www.netflix.com/','netflix.com', true),
    app('Spotify','https://open.spotify.com/','spotify.com', true),
    app('Flow','https://www.flow.com.ar/','flow.com.ar', true),
    app('Bloc de notas','#notes','', true, '▤')
  ],
  ai: [
    app('Gemini','https://gemini.google.com/','gemini.google.com'),
    app('ChatGPT','https://chatgpt.com/','chatgpt.com'),
    app('Claude','https://claude.ai/','claude.ai'),
    app('Microsoft 365','https://www.office.com/','office.com'),
    app('Drive','https://drive.google.com/','drive.google.com'),
    app('Aerolíneas Argentinas','https://www.aerolineas.com.ar/','aerolineas.com.ar'),
    app('Ualá','https://www.uala.com.ar/','uala.com.ar'),
    app('Despegar','https://www.despegar.com.ar/','despegar.com.ar')
  ],
  tramites: [
    app('ARCA','https://www.arca.gob.ar/','arca.gob.ar', true, 'ARCA'),
    app('Mi Argentina','https://www.argentina.gob.ar/miargentina','argentina.gob.ar'),
    app('ANSES','https://www.anses.gob.ar/','anses.gob.ar', true, 'ANSES'),
    app('Monotributo','https://monotributo.afip.gob.ar/','afip.gob.ar', false, 'M')
  ],
  noticias: [
    app('Clarín','https://www.clarin.com/','clarin.com'),
    app('Infobae','https://www.infobae.com/','infobae.com'),
    app('La Nación','https://www.lanacion.com.ar/','lanacion.com.ar'),
    app('Telefé','https://mitelefe.com/','telefe.com'),
    app('El Cronista','https://www.cronista.com/','cronista.com'),
    app('TyC Sports','https://www.tycsports.com/','tycsports.com')
  ],
  bancos: [
    app('Nación','https://www.bna.com.ar/','bna.com.ar'),
    app('Provincia','https://www.bancoprovincia.com.ar/','bancoprovincia.com.ar'),
    app('Macro','https://www.macro.com.ar/','macro.com.ar'),
    app('Santander','https://www.santander.com.ar/','santander.com.ar'),
    app('Banco Ciudad','https://www.bancociudad.com.ar/','bancociudad.com.ar'),
    app('BBVA','https://www.bbva.com.ar/','bbva.com.ar'),
    app('Brubank','https://www.brubank.com/','brubank.com'),
    app('Ualá','https://www.uala.com.ar/','uala.com.ar')
  ],
  negocio: [
    app('Muebles','https://www.google.com/search?q=muebles+mayorista+argentina','google.com', true, '▰'),
    app('Papelera','https://www.google.com/search?q=papelera+mayorista+argentina','google.com', true, '⌘'),
    app('Contadoras de Billetes','https://www.google.com/search?q=contadoras+de+billetes','google.com', true, '▣'),
    app('Tecnología','https://www.puntosmart.com.ar/','puntosmart.com.ar', true, '▦')
  ]
};

const folderNames = {
  tramites:'Trámites', noticias:'Noticias y Deportes', bancos:'Bancos', negocio:'Negocio / Proveedores'
};
let editMode = false;
let currentCustomIndex = null;

function app(name,url,domain,dark=false,fallback=''){
  return { id: slug(name), name, url, domain, dark, fallback };
}
function slug(s){ return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
function favicon(domain){ return domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128` : ''; }
function normalizeUrl(url){
  if(!url) return '#';
  if(url.startsWith('#')) return url;
  if(!/^https?:\/\//i.test(url)) return 'https://' + url;
  return url;
}

function tileHTML(item, opts={}){
  const img = item.icon || favicon(item.domain);
  const fallback = item.fallback || (item.name || '?').slice(0,2).toUpperCase();
  const dark = item.dark ? ' dark' : '';
  return `<button class="tile ${editMode ? 'editing' : ''}" data-id="${item.id}" data-url="${item.url}" ${opts.draggable?'draggable="true"':''} title="${item.name}">
    <span class="tile-icon${dark}">${img ? `<img src="${img}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'letter',textContent:'${fallback.replace(/'/g,'')}'}))">` : `<span class="letter">${fallback}</span>`}</span>
    <span class="tile-name">${item.name}</span>
  </button>`;
}

function renderGroup(key, elId, mini=false){
  const el = document.getElementById(elId);
  if(!el) return;
  const items = groups[key];
  el.innerHTML = items.map(i => tileHTML(i,{draggable: !mini})).join('');
}

function renderAll(){
  renderGroup('favorites','favoritesGrid');
  renderGroup('content','contentGrid');
  renderGroup('ai','aiGrid');
  renderGroup('tramites','tramitesGrid',true);
  renderGroup('noticias','noticiasGrid',true);
  renderGroup('bancos','bancosGrid',true);
  renderGroup('negocio','negocioGrid',true);
  renderCustom();
  bindTiles();
  bindDrag();
  document.body.classList.toggle('editing-mode', editMode);
  document.getElementById('editBtn').textContent = editMode ? '✓ Listo' : '✎ Editar';
}

function getCustom(){
  try{return JSON.parse(localStorage.getItem('ps_custom_tiles')||'[]')}catch(e){return []}
}
function setCustom(arr){localStorage.setItem('ps_custom_tiles',JSON.stringify(arr));}
function renderCustom(){
  const data = getCustom();
  const grid = document.getElementById('customGrid');
  grid.innerHTML = '';
  for(let i=0;i<5;i++){
    const item = data[i];
    const btn = document.createElement('button');
    btn.className = 'custom-tile' + (item ? ' filled' : '');
    btn.dataset.index = i;
    if(item){
      const img = item.icon || favicon(domainFromUrl(item.url));
      const letter = (item.name || '?').slice(0,2).toUpperCase();
      btn.innerHTML = `<span class="tile-icon"><img src="${img}" alt="" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'letter',textContent:'${letter}'}))"></span><span>${item.name}</span>`;
    }else{
      btn.innerHTML = `<span class="plus">+</span><span>Agregar<br>acceso</span>`;
    }
    grid.appendChild(btn);
  }
}
function domainFromUrl(url){
  try{return new URL(normalizeUrl(url)).hostname.replace(/^www\./,'')}catch(e){return ''}
}

function bindTiles(){
  document.querySelectorAll('.tile').forEach(btn => {
    btn.onclick = () => {
      const url = btn.dataset.url;
      if(editMode) return;
      if(url === '#notes') return openNotes();
      window.open(normalizeUrl(url),'_blank','noopener');
    };
  });
  document.querySelectorAll('.custom-tile').forEach(btn => {
    btn.onclick = () => {
      const idx = Number(btn.dataset.index);
      const item = getCustom()[idx];
      if(item && !editMode){ window.open(normalizeUrl(item.url),'_blank','noopener'); return; }
      openCustom(idx);
    };
  });
}
function openNotes(){
  alert('Bloc de notas: en la próxima versión se puede agregar un bloc editable guardado en el navegador.');
}

function openCustom(index){
  currentCustomIndex = index;
  const arr = getCustom();
  const item = arr[index] || {};
  customName.value = item.name || '';
  customUrl.value = item.url || '';
  customIcon.value = item.icon || '';
  deleteCustomBtn.style.visibility = item.name ? 'visible':'hidden';
  customDialog.showModal();
}

customForm.addEventListener('submit', e => {
  e.preventDefault();
  const arr = getCustom();
  arr[currentCustomIndex] = { name: customName.value.trim(), url: normalizeUrl(customUrl.value.trim()), icon: customIcon.value.trim() };
  setCustom(arr);
  customDialog.close();
  renderAll();
});
cancelCustomBtn.onclick = () => customDialog.close();
deleteCustomBtn.onclick = () => {
  const arr = getCustom();
  arr.splice(currentCustomIndex,1);
  setCustom(arr);
  customDialog.close();
  renderAll();
};

function bindDrag(){
  document.querySelectorAll('.wide .tile[draggable="true"]').forEach(tile => {
    tile.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', tile.dataset.id));
    tile.addEventListener('dragover', e => { e.preventDefault(); tile.classList.add('drag-over'); });
    tile.addEventListener('dragleave', () => tile.classList.remove('drag-over'));
    tile.addEventListener('drop', e => {
      e.preventDefault(); tile.classList.remove('drag-over');
      const fromId = e.dataTransfer.getData('text/plain');
      const toId = tile.dataset.id;
      swapItems(fromId,toId);
    });
  });
}
function swapItems(fromId,toId){
  let aK,aI,bK,bI;
  for(const [k,arr] of Object.entries(groups)){
    arr.forEach((it,i)=>{ if(it.id===fromId){aK=k;aI=i} if(it.id===toId){bK=k;bI=i} });
  }
  if(aK && bK){
    const temp = groups[aK][aI]; groups[aK][aI] = groups[bK][bI]; groups[bK][bI] = temp; renderAll();
  }
}

editBtn.onclick = () => { editMode = !editMode; renderAll(); };
resetBtn.onclick = () => {
  if(confirm('¿Restaurar accesos personalizados y recargar la maqueta?')){ localStorage.removeItem('ps_custom_tiles'); location.reload(); }
};
howBtn.onclick = () => infoDialog.showModal();
closeInfoBtn.onclick = () => infoDialog.close();
supportBtn.onclick = () => window.open('https://wa.me/5491148706501?text=Hola%2C%20necesito%20soporte%20con%20Punto%20Smart%20OS','_blank','noopener');
suggestBtn.onclick = () => window.open('https://wa.me/5491148706501?text=Hola%2C%20quiero%20sugerir%20un%20acceso%20para%20Punto%20Smart%20OS','_blank','noopener');

Object.keys(folderNames).forEach(key => {
  document.querySelector(`[data-folder="${key}"] .folder-open`)?.addEventListener('click', () => openFolder(key));
});
function openFolder(key){
  folderTitle.textContent = folderNames[key];
  folderModalGrid.innerHTML = groups[key].map(i => tileHTML(i)).join('');
  folderDialog.showModal();
  bindTiles();
}
closeFolderBtn.onclick = () => folderDialog.close();

searchInput.addEventListener('input', e => {
  const q = e.target.value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  document.querySelectorAll('.tile,.custom-tile').forEach(el => {
    const text = el.textContent.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    el.classList.toggle('hidden-search', q && !text.includes(q));
  });
});

function tick(){
  const now = new Date();
  clock.textContent = now.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'});
  dateText.textContent = now.toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long'}).replace(/^./,c=>c.toUpperCase());
}
setInterval(tick,1000); tick(); renderAll();
