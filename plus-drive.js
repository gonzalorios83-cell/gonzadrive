/* Punto Smart OS Plus - Google Drive sync
   Guarda SOLO configuración: accesos, orden, categorías, iconos y preferencias.
   No guarda claves, documentos ni datos bancarios. */
(function(){
  const cfg = window.PS_PLUS_CONFIG || {};
  const CLIENT_ID = cfg.GOOGLE_CLIENT_ID || "";
  const FILE_NAME = cfg.DRIVE_FILE_NAME || "puntosmart-config.json";
  const SCOPE = cfg.DRIVE_SCOPE || "https://www.googleapis.com/auth/drive.appdata";
  const LS_FILE_ID = "ps_plus_drive_file_id";
  const LS_LAST_SYNC = "ps_plus_last_sync";
  const LS_GROUPS = "ps_groups_state";
  const LS_CONNECTED = "ps_plus_connected";

  let tokenClient = null;
  let accessToken = null;
  let driveFileId = localStorage.getItem(LS_FILE_ID) || "";
  let saveTimer = null;
  let busy = false;

  function ready(fn){
    if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  ready(initPlus);

  function initPlus(){
    injectUI();
    restoreLocalGroups();
    patchCoreSaves();
    refreshPlusUI();
  }

  function injectUI(){
    const status = document.querySelector(".status-zone");
    if(status && !document.getElementById("plusBtn")){
      const btn = document.createElement("button");
      btn.id = "plusBtn";
      btn.className = "status-pill plus-pill";
      btn.innerHTML = `<span id="plusDot" class="plus-dot"></span><span><b>Plus</b><small id="plusSmall">Drive</small></span>`;
      btn.onclick = () => document.getElementById("plusDialog").showModal();
      status.insertBefore(btn, status.lastElementChild || null);
    }

    if(!document.getElementById("plusDialog")){
      const dialog = document.createElement("dialog");
      dialog.id = "plusDialog";
      dialog.className = "modal";
      dialog.innerHTML = `
        <div class="plus-panel">
          <button class="modal-close" id="closePlusBtn">×</button>
          <h3>Punto Smart OS Plus</h3>
          <p>Sincronización del escritorio usando el Google Drive del usuario.</p>
          <div class="plus-status" id="plusStatus">Plus sin conectar.</div>
          <button class="wide-btn primary" id="connectDriveBtn">Entrar con Google Drive</button>
          <div class="plus-actions">
            <button id="saveDriveBtn">Guardar en Drive</button>
            <button id="loadDriveBtn">Cargar desde Drive</button>
            <button id="exportJsonBtn">Exportar JSON</button>
            <button id="importJsonBtn">Importar JSON</button>
            <button class="danger" id="disconnectDriveBtn">Desconectar</button>
          </div>
          <input class="plus-file-input" id="plusImportInput" type="file" accept="application/json,.json" />
          <small>Se guarda configuración: accesos, orden, categorías, iconos y preferencias. No se guardan claves ni datos bancarios.</small>
        </div>`;
      document.body.appendChild(dialog);

      closePlusBtn.onclick = () => plusDialog.close();
      connectDriveBtn.onclick = connectDrive;
      saveDriveBtn.onclick = () => requireToken().then(saveNow).catch(showError);
      loadDriveBtn.onclick = () => requireToken().then(loadFromDrive).catch(showError);
      disconnectDriveBtn.onclick = disconnectDrive;
      exportJsonBtn.onclick = exportJson;
      importJsonBtn.onclick = () => plusImportInput.click();
      plusImportInput.onchange = importJson;
    }
  }

  function patchCoreSaves(){
    if(window.__psPlusPatched) return;
    window.__psPlusPatched = true;

    if(typeof window.setCustom === "function"){
      const originalSetCustom = window.setCustom;
      window.setCustom = function(arr){
        originalSetCustom(arr);
        saveGroupsLocal();
        queueCloudSave();
      };
    }

    if(typeof window.swapItems === "function"){
      const originalSwapItems = window.swapItems;
      window.swapItems = function(fromId,toId){
        originalSwapItems(fromId,toId);
        saveGroupsLocal();
        queueCloudSave();
      };
    }

    const reset = document.getElementById("resetBtn");
    if(reset){
      const originalReset = reset.onclick;
      reset.onclick = function(){
        localStorage.removeItem(LS_GROUPS);
        if(originalReset) originalReset.call(this);
      };
    }
  }

  function cleanItem(item){
    return {
      id: item.id || slugSafe(item.name || "acceso"),
      name: item.name || "Acceso",
      url: item.url || "#",
      domain: item.domain || "",
      dark: !!item.dark,
      fallback: item.fallback || "",
      icon: item.icon || ""
    };
  }

  function desktopConfig(){
    const outGroups = {};
    if(typeof groups === "object"){
      Object.keys(groups).forEach(k => outGroups[k] = (groups[k] || []).map(cleanItem));
    }
    let custom = [];
    try{ custom = JSON.parse(localStorage.getItem("ps_custom_tiles") || "[]"); }catch(e){}
    return {
      product: "Punto Smart OS Plus",
      version: 1,
      updatedAt: new Date().toISOString(),
      groups: outGroups,
      custom: Array.isArray(custom) ? custom : []
    };
  }

  function applyConfig(data){
    if(!data || typeof data !== "object") return;

    if(data.groups && typeof groups === "object"){
      Object.keys(data.groups).forEach(k => {
        if(Array.isArray(data.groups[k]) && Array.isArray(groups[k])){
          groups[k].length = 0;
          data.groups[k].forEach(item => groups[k].push(cleanItem(item)));
        }
      });
      saveGroupsLocal();
    }

    if(Array.isArray(data.custom)){
      localStorage.setItem("ps_custom_tiles", JSON.stringify(data.custom));
    }

    if(typeof renderAll === "function") renderAll();
    refreshPlusUI("Configuración cargada.");
  }

  function saveGroupsLocal(){
    try{
      if(typeof groups === "object"){
        const obj = {};
        Object.keys(groups).forEach(k => obj[k] = (groups[k] || []).map(cleanItem));
        localStorage.setItem(LS_GROUPS, JSON.stringify(obj));
      }
    }catch(e){}
  }

  function restoreLocalGroups(){
    try{
      const saved = JSON.parse(localStorage.getItem(LS_GROUPS) || "null");
      if(saved && typeof groups === "object"){
        Object.keys(saved).forEach(k => {
          if(Array.isArray(saved[k]) && Array.isArray(groups[k])){
            groups[k].length = 0;
            saved[k].forEach(item => groups[k].push(cleanItem(item)));
          }
        });
        if(typeof renderAll === "function") renderAll();
      }
    }catch(e){}
  }

  function queueCloudSave(){
    if(!accessToken || !localStorage.getItem(LS_CONNECTED)) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveNow().catch(showError), 900);
  }

  async function connectDrive(){
    if(!isClientConfigured()){
      refreshPlusUI("Falta configurar GOOGLE_CLIENT_ID en plus-config.js.", "warn");
      return;
    }
    await requireToken();
    await loadFromDrive();
    localStorage.setItem(LS_CONNECTED, "1");
    refreshPlusUI("Conectado a Drive.", "ok");
  }

  function isClientConfigured(){
    return CLIENT_ID && !CLIENT_ID.includes("PEGAR_CLIENT_ID");
  }

  async function requireToken(){
    if(accessToken) return accessToken;
    if(!isClientConfigured()) throw new Error("Falta GOOGLE_CLIENT_ID en plus-config.js.");
    await waitForGoogle();
    return new Promise((resolve,reject) => {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPE,
        callback: resp => {
          if(resp && resp.access_token){
            accessToken = resp.access_token;
            resolve(accessToken);
          }else{
            reject(new Error("Google no devolvió token."));
          }
        },
        error_callback: err => reject(new Error((err && err.message) || "No se pudo iniciar sesión con Google."))
      });
      tokenClient.requestAccessToken({prompt:"consent"});
    });
  }

  function waitForGoogle(){
    return new Promise((resolve,reject) => {
      let tries = 0;
      const t = setInterval(() => {
        tries++;
        if(window.google && google.accounts && google.accounts.oauth2){ clearInterval(t); resolve(); }
        if(tries > 80){ clearInterval(t); reject(new Error("No cargó Google Identity Services.")); }
      },100);
    });
  }

  async function driveFetch(url, options={}){
    if(!accessToken) await requireToken();
    const res = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${accessToken}`
      }
    });
    if(!res.ok){
      const text = await res.text().catch(()=>"");
      throw new Error(`Drive error ${res.status}: ${text || res.statusText}`);
    }
    return res;
  }

  async function findConfigFile(){
    if(driveFileId) return driveFileId;
    const q = encodeURIComponent(`name='${FILE_NAME}' and trashed=false`);
    const fields = encodeURIComponent("files(id,name,modifiedTime)");
    const url = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=${fields}`;
    const data = await (await driveFetch(url)).json();
    const file = data.files && data.files[0];
    if(file && file.id){
      driveFileId = file.id;
      localStorage.setItem(LS_FILE_ID, driveFileId);
      return driveFileId;
    }
    return "";
  }

  async function createConfigFile(config){
    const boundary = "psos_plus_" + Math.random().toString(36).slice(2);
    const metadata = {name: FILE_NAME, parents:["appDataFolder"], mimeType:"application/json"};
    const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(config,null,2)}\r\n--${boundary}--`;
    const res = await driveFetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id", {
      method:"POST",
      headers:{"Content-Type":`multipart/related; boundary=${boundary}`},
      body
    });
    const data = await res.json();
    driveFileId = data.id;
    localStorage.setItem(LS_FILE_ID, driveFileId);
    return driveFileId;
  }

  async function saveNow(){
    if(busy) return;
    busy = true;
    refreshPlusUI("Guardando en Drive...", "warn");
    try{
      const config = desktopConfig();
      const id = await findConfigFile();
      if(!id){
        await createConfigFile(config);
      }else{
        await driveFetch(`https://www.googleapis.com/upload/drive/v3/files/${id}?uploadType=media`, {
          method:"PATCH",
          headers:{"Content-Type":"application/json; charset=UTF-8"},
          body: JSON.stringify(config,null,2)
        });
      }
      localStorage.setItem(LS_LAST_SYNC, new Date().toISOString());
      localStorage.setItem(LS_CONNECTED, "1");
      refreshPlusUI("Guardado en Drive.", "ok");
    }finally{ busy = false; }
  }

  async function loadFromDrive(){
    refreshPlusUI("Cargando desde Drive...", "warn");
    const id = await findConfigFile();
    if(!id){
      await saveNow();
      return;
    }
    const data = await (await driveFetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`)).json();
    applyConfig(data);
    localStorage.setItem(LS_CONNECTED, "1");
    localStorage.setItem(LS_LAST_SYNC, new Date().toISOString());
    refreshPlusUI("Cargado desde Drive.", "ok");
  }

  function disconnectDrive(){
    accessToken = null;
    localStorage.removeItem(LS_CONNECTED);
    refreshPlusUI("Desconectado. La configuración local queda en este dispositivo.", "warn");
  }

  function exportJson(){
    const blob = new Blob([JSON.stringify(desktopConfig(),null,2)], {type:"application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = FILE_NAME;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function importJson(){
    const file = plusImportInput.files && plusImportInput.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try{
        const data = JSON.parse(reader.result);
        applyConfig(data);
        queueCloudSave();
      }catch(e){ showError(e); }
      plusImportInput.value = "";
    };
    reader.readAsText(file);
  }

  function refreshPlusUI(msg="", mode=""){
    const connected = !!localStorage.getItem(LS_CONNECTED);
    const dot = document.getElementById("plusDot");
    const small = document.getElementById("plusSmall");
    const status = document.getElementById("plusStatus");
    if(dot){ dot.className = "plus-dot " + (mode || (connected ? "ok" : "")); }
    if(small){ small.textContent = connected ? "Drive conectado" : "Drive"; }
    if(status){
      const last = localStorage.getItem(LS_LAST_SYNC);
      status.textContent = msg || (connected ? `Conectado. Última sync: ${last ? new Date(last).toLocaleString("es-AR") : "sin dato"}` : "Plus sin conectar.");
    }
  }

  function showError(err){
    console.error(err);
    refreshPlusUI((err && err.message) ? err.message : "Error en Plus.", "warn");
  }

  function slugSafe(s){
    return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") || "acceso";
  }
})();
