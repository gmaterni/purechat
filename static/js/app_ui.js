/** @format */
"use strict";

import { UaWindowAdm } from "./services/uawindow.js";
import { UaJtfh } from "./services/uajtfh.js";
import { UaLog } from "./services/ualog3.js";
import { help0_html, help1_html, help2_html } from "./services/help.js";
import { AppMgr } from "./app_mgr.js";
import { UaDb } from "./services/uadb.js";
import { LlmProvider } from "./llm_provider.js";
import { textFormatter, messages2html, messages2text } from "./history_utils.js";
import { DATA_KEYS, getDescriptionForKey } from "./services/data_keys.js";
import { idbMgr } from "./services/idb_mgr.js";
// import { requestGet } from "./services/http_request.js";
import { addApiKey } from "./services/key_retriever.js";
import { UaSender } from "./services/sender.js";
import { WebId } from "./services/webuser_id.js";
import { documentUploader, systemUploader } from "./services/uploader.js";
import "./services/uadialog.js";

// #region UTILS
/**
 * Gestore dello spinner di caricamento.
 */
const Spinner = (function () {
  const _getEl = function () {
    const result = document.getElementById("spinner");
    return result;
  };

  const show = function () {
    const el = _getEl();
    if (el) el.classList.add("show-spinner");
  };

  const hide = function () {
    const el = _getEl();
    if (el) el.classList.remove("show-spinner");
  };

  const api = {
    show: show,
    hide: hide
  };
  return api;
})();
// #endregion

// #region WINDOW FACTORIES
/**
 * Crea una finestra per la visualizzazione di testo preformattato.
 */
const WndPre = function (id) {
  // Fail Fast
  if (!id) {
    console.error("WndPre: id mancante");
    return null;
  }

  const _w = UaWindowAdm.create(id);

  const show = function (s, delAll = true) {
    if (delAll) wnds.closeAll();
    _w.drag().setZ(12);
    _w.vw_vh().setXY(21, 5, 1);
    const html = `
      <div class="window-text">
        <div class="btn-wrapper">
          <button class="btn-copy wcp tt-left" data-tt="Copia" onclick="wnds.wpre.copy()">
            <svg class="copy-icon" viewBox="0 0 20 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
          </button>
          <button class="btn-close wcl tt-left" data-tt="chiudi" onclick="wnds.wpre.close()">X</button>
        </div>
        <pre class="pre-text">${s}</pre>
      </div>`;
    _w.setHtml(html);
    _w.show();
  };

  const close = function () {
    _w.close();
  };

  const copy = async function () {
    let result = false;
    try {
      const el = _w.getElement().querySelector(".pre-text");
      if (el) {
        const t = el.textContent;
        await navigator.clipboard.writeText(t);
        result = true;
      }
    } catch (error) {
      console.error("WndPre.copy:", error);
      result = false;
    }
    return result;
  };

  const api = {
    show: show,
    close: close,
    copy: copy
  };
  return api;
};

/**
 * Crea una finestra per la visualizzazione di contenuti HTML generici.
 */
const WndDiv = function (id) {
  if (!id) {
    console.error("WndDiv: id mancante");
    return null;
  }

  const _w = UaWindowAdm.create(id);

  const show = function (s, delAll = true) {
    if (delAll) wnds.closeAll();
    _w.drag().setZ(12);
    _w.vw_vh().setXY(21, 5, 1);
    const html = `
      <div class="window-text">
        <div class="btn-wrapper">
          <button class="btn-close wcl tt-left" data-tt="chiudi" onclick="wnds.wdiv.close()">X</button>
        </div>
        <div class="div-text">${s}</div>
      </div>`;
    _w.setHtml(html);
    _w.show();
  };

  const close = function () {
    _w.close();
  };

  const api = {
    show: show,
    close: close
  };
  return api;
};

/**
 * Crea una finestra informativa con diverse modalità di visualizzazione.
 */
const WndInfo = function (id) {
  if (!id) {
    console.error("WndInfo: id mancante");
    return null;
  }

  const _w = UaWindowAdm.create(id);

  const show = function (s, delAll = true) {
    if (delAll) wnds.closeAll();
    _w.drag().setZ(12);
    const xPos = document.body.classList.contains("menu-open") ? 21 : 1;
    _w.vw_vh().setXY(xPos, 5, 1);

    const html = `
      <div class="window-info">
        <div class="btn-wrapper">
          <button class="btn-close wcl tt-left" data-tt="chiudi" onclick="wnds.winfo.close()">X</button>
        </div>
        <div class="div-info">${s}</div>
      </div>
    `;
    _w.setHtml(html);
    _w.show();
  };

  const showFull = function (s, delAll = true) {
    if (delAll) wnds.closeAll();
    _w.drag().setZ(12);
    const xPos = document.body.classList.contains("menu-open") ? 21 : 1;
    const width = document.body.classList.contains("menu-open") ? 78 : 98;
    _w.vw_vh().setXY(xPos, 5, 1).setWH(width, 90);

    const html = `
      <div class="window-info full-size">
        <div class="btn-wrapper">
          <button class="btn-close wcl tt-left" data-tt="chiudi" onclick="wnds.winfo.close()">X</button>
        </div>
        <div class="div-info">${s}</div>
      </div>
    `;
    _w.setHtml(html);
    _w.show();
  };

  const showWide = function (s, delAll = true) {
    if (delAll) wnds.closeAll();
    _w.drag().setZ(12);
    const xPos = document.body.classList.contains("menu-open") ? 21 : 5;
    const width = document.body.classList.contains("menu-open") ? 60 : 70;
    _w.vw_vh().setXY(xPos, 10, 1).setWH(width, 70);

    const html = `
      <div class="window-info">
        <div class="btn-wrapper">
          <button class="btn-close wcl tt-left" data-tt="chiudi" onclick="wnds.winfo.close()">X</button>
        </div>
        <div class="div-info">${s}</div>
      </div>
    `;
    _w.setHtml(html);
    _w.show();
  };

  const close = function () {
    _w.close();
  };

  const api = {
    show: show,
    showFull: showFull,
    showWide: showWide,
    close: close
  };
  return api;
};
// #endregion

/**
 * Gestore globale delle finestre dell'applicazione.
 */
export const wnds = (function () {
  let _wpre = null;
  let _wdiv = null;
  let _winfo = null;

  const init = function () {
    _wpre = WndPre("id-wnd-pre");
    _wdiv = WndDiv("id-wnd-div");
    _winfo = WndInfo("id-wnd-info");

    const api = {
      wpre: _wpre,
      wdiv: _wdiv,
      winfo: _winfo,
      init: init,
      closeAll: closeAll
    };

    // Espone su window per compatibilità con HTML inline
    window.wnds = api;
    return api;
  };

  const closeAll = function () {
    if (_wpre) _wpre.close();
    if (_wdiv) _wdiv.close();
    if (_winfo) _winfo.close();
    const result = true;
    return result;
  };

  const api = {
    get wpre() { return _wpre; },
    get wdiv() { return _wdiv; },
    get winfo() { return _winfo; },
    init: init,
    closeAll: closeAll
  };

  return api;
})();

/**
 * Aggiorna la visualizzazione HTML della conversazione.
 */
export const showHtmlThread = async function () {
  const messages = AppMgr.getMessages();
  const html = messages2html(messages);
  setResponseHtml(html);
  const result = true;
  return result;
};

/**
 * Imposta il contenuto HTML nel contenitore della risposta.
 */
const setResponseHtml = function (html) {
  const p = document.querySelector("#id-text-out .div-text");
  if (p) {
    p.innerHTML = html;
    p.scrollTop = p.scrollHeight;
  }
  const result = true;
  return result;
};

/**
 * Gestore dell'input di testo e dei parametri di sessione (System, Context).
 */
export const TextInput = (function () {
  let _inp = null;
  let _systemPrompt = "";
  let _contextText = "";

  const getSystemPrompt = function () {
    const result = _systemPrompt;
    return result;
  };

  const setSystemPrompt = function (v) {
    _systemPrompt = v;
    UaDb.save(DATA_KEYS.KEY_ACTIVE_SYSTEM, v);
    const result = _systemPrompt;
    return result;
  };

  const getContextText = function () {
    const result = _contextText;
    return result;
  };

  const setContextText = function (v) {
    _contextText = v;
    UaDb.save(DATA_KEYS.KEY_ACTIVE_CONTEXT, v);
    const result = _contextText;
    return result;
  };

  const init = async function () {
    _inp = document.querySelector(".text-input");
    _systemPrompt = await UaDb.read(DATA_KEYS.KEY_ACTIVE_SYSTEM) || "";
    _contextText = await UaDb.read(DATA_KEYS.KEY_ACTIVE_CONTEXT) || "";

    const api = {
      get systemPrompt() { return getSystemPrompt(); },
      set systemPrompt(v) { setSystemPrompt(v); },
      get contextText() { return getContextText(); },
      set contextText(v) { setContextText(v); },
      init: init,
      sendMessage: sendMessage,
      handleEnter: handleEnter,
      clear: clear,
      systemInput: systemInput,
      saveSystem: saveSystem,
      contextInput: contextInput,
      saveContext: saveContext
    };

    // Espone su window per compatibilità con HTML inline
    window.TextInput = api;
    return api;
  };

  const sendMessage = async function () {
    if (!_inp) return false;
    const text = _inp.value.trim();
    if (!text) return false;

    let result = false;
    Spinner.show();
    UaSender.sendEventAsync("purechat", "startConversation");
    try {
      await AppMgr.sendMessage(text, getSystemPrompt(), getContextText());
      await showHtmlThread();
      _inp.value = "";
      result = true;
    } catch (err) {
      console.error(err);
      await alert("Errore durante l'invio del messaggio: " + err.message);
      result = false;
    } finally {
      Spinner.hide();
    }
    return result;
  };

  const handleEnter = function (e) {
    if (!e) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clear = function () {
    if (_inp) _inp.value = "";
    const result = true;
    return result;
  };

  const systemInput = function () {
    const html = `
      <div class="system-input-dialog full-height">
        <h4>Imposta System Prompt</h4>
        <p class="system-prompt-desc">Definisci il ruolo dell'AI per questa sessione.</p>
        <textarea id="system-prompt-textarea" class="system-prompt-textarea">${getSystemPrompt()}</textarea>
        <div class="system-prompt-buttons" style="margin-top:15px; display:flex; gap:10px; justify-content:flex-end;">
          <button class="btn-save" onclick="TextInput.saveSystem()">Archivia</button>
          <button class="btn-cancel" onclick="wnds.winfo.close()">Chiudi</button>
        </div>
      </div>
    `;
    wnds.winfo.showFull(html);
  };

  const saveSystem = async function () {
    const el = document.getElementById("system-prompt-textarea");
    if (!el) return;

    const val = el.value;
    setSystemPrompt(val);
    const name = await prompt("Inserisci un nome per questo System Prompt:");
    if (name) {
      const list = await UaDb.readArray(DATA_KEYS.KEY_ARCHIVED_SYSTEMS_LIST);
      if (!list.includes(name)) {
        list.push(name);
        await UaDb.saveArray(DATA_KEYS.KEY_ARCHIVED_SYSTEMS_LIST, list);
      }
      await UaDb.save(`${DATA_KEYS.PREFIX_ARCHIVED_SYSTEM}${name}`, val);
      await alert("System Prompt archiviato con successo.");
    }
    wnds.winfo.close();
  };

  const contextInput = function () {
    const html = `
      <div class="system-input-dialog full-height">
        <h4>Inserimento Manuale Contesto</h4>
        <p class="system-prompt-desc">Incolla qui il testo da usare come riferimento per l'AI.</p>
        <textarea id="context-input-textarea" class="system-prompt-textarea">${getContextText()}</textarea>
        <div class="system-prompt-buttons" style="margin-top:15px; display:flex; gap:10px; justify-content:flex-end;">
          <button class="btn-save" onclick="TextInput.saveContext()">Archivia</button>
          <button class="btn-cancel" onclick="wnds.winfo.close()">Chiudi</button>
        </div>
      </div>
    `;
    wnds.winfo.showFull(html);
  };

  const saveContext = async function () {
    const el = document.getElementById("context-input-textarea");
    if (!el) return;

    const val = el.value;
    setContextText(val);
    const name = await prompt("Inserisci un nome per questo Contesto:");
    if (name) {
      const list = await UaDb.readArray(DATA_KEYS.KEY_ARCHIVED_CONTEXTS_LIST);
      if (!list.includes(name)) {
        list.push(name);
        await UaDb.saveArray(DATA_KEYS.KEY_ARCHIVED_CONTEXTS_LIST, list);
      }
      await UaDb.save(`${DATA_KEYS.PREFIX_ARCHIVED_CONTEXT}${name}`, val);
      await alert("Contesto archiviato con successo.");
    }
    wnds.winfo.close();
  };

  const api = {
    get systemPrompt() { return getSystemPrompt(); },
    set systemPrompt(v) { setSystemPrompt(v); },
    get contextText() { return getContextText(); },
    set contextText(v) { setContextText(v); },
    init: init,
    sendMessage: sendMessage,
    handleEnter: handleEnter,
    clear: clear,
    systemInput: systemInput,
    saveSystem: saveSystem,
    contextInput: contextInput,
    saveContext: saveContext
  };
  return api;
})();

/**
 * Gestore dell'output di testo e delle azioni sulla cronologia.
 */
export const TextOutput = (function () {
  const init = function () {
    const result = true;
    return result;
  };

  const copy = async function () {
    const messages = AppMgr.getMessages();
    const text = messages2text(messages);
    let result = false;
    try {
      await navigator.clipboard.writeText(textFormatter(text));
      UaLog.log("Conversazione copiata negli appunti.");
      result = true;
    } catch (err) {
      console.error("TextOutput.copy:", err);
      result = false;
    }
    return result;
  };

  const clearHistory = async function () {
    let result = false;
    if (await confirm("Sei sicuro di voler cancellare la conversazione attiva?")) {
      AppMgr.clearMessages();
      await idbMgr.delete(DATA_KEYS.KEY_ACTIVE_THREAD);
      setResponseHtml("");
      result = true;
    }
    return result;
  };

  const clearHistoryContext = async function () {
    let result = false;
    if (await confirm("Sei sicuro di voler cancellare conversazione E contesto?")) {
      AppMgr.clearMessages();
      await idbMgr.delete(DATA_KEYS.KEY_ACTIVE_THREAD);
      TextInput.contextText = "";
      setResponseHtml("");
      result = true;
    }
    return result;
  };

  const api = {
    init: init,
    copy: copy,
    clearHistory: clearHistory,
    clearHistoryContext: clearHistoryContext
  };
  return api;
})();

/**
 * Applica il tema salvato.
 */
export const getTheme = async function () {
  const t = await UaDb.read(DATA_KEYS.KEY_THEME);
  document.body.classList.toggle("theme-light", t === "light");
  document.body.classList.toggle("theme-dark", t !== "light");
  const result = t;
  return result;
};

/**
 * Imposta e salva il tema.
 */
export const setTheme = async function (theme) {
  // Fail Fast
  if (!theme) return null;

  document.body.classList.toggle("theme-light", theme === "light");
  document.body.classList.toggle("theme-dark", theme !== "light");
  await UaDb.save(DATA_KEYS.KEY_THEME, theme);
  const result = theme;
  return result;
};

// #region PRIVATE HELPER FUNCTIONS (Refactored to Return Strict)

/**
 * Mostra il dialogo di configurazione del payload.
 */
const _payloadSettingsDialog = async function () {
  const settings = await UaDb.readJson(DATA_KEYS.KEY_ACTIVE_PAYLOAD) || {
    temperature: 0.7,
    max_tokens: 8000,
    top_p: 1.0,
    frequency_penalty: 0.0,
    presence_penalty: 0.0
  };

  const html = `
    <div class="payload-settings-dialog">
      <h4>Configurazione Payload</h4>
      <p class="desc">Regola i parametri della richiesta LLM usando i pulsanti.</p>
      
      <div class="payload-grid">
        ${_createPayloadField("Temperature", "payload-temperature", settings.temperature, 0.1, 0, 2)}
        ${_createPayloadField("Max Tokens", "payload-max-tokens", settings.max_tokens, 100, 1, 128000)}
        ${_createPayloadField("Top P", "payload-top-p", settings.top_p, 0.05, 0, 1)}
        ${_createPayloadField("Freq. Penalty", "payload-frequency-penalty", settings.frequency_penalty, 0.1, 0, 2)}
        ${_createPayloadField("Pres. Penalty", "payload-presence-penalty", settings.presence_penalty, 0.1, 0, 2)}
      </div>

      <div class="buttons" style="margin-top:25px; display:flex; gap:10px; justify-content:flex-end;">
        <button class="btn-save" onclick="wnds.savePayload()">Salva Configurazione</button>
        <button class="btn-cancel" onclick="wnds.winfo.close()">Annulla</button>
      </div>
    </div>
  `;

  wnds.winfo.showWide(html);

  // Espone le funzioni di controllo su wnds
  window.wnds.stepVal = (id, delta, min, max) => {
    const el = document.getElementById(id);
    if (!el) return;
    let val = parseFloat(el.value) + delta;
    if (min !== undefined && val < min) val = min;
    if (max !== undefined && val > max) val = max;
    // Arrotondamento per evitare problemi di precisione float (0.1 + 0.2 = 0.30000000000000004)
    el.value = delta % 1 === 0 ? val : parseFloat(val.toFixed(2));
  };

  window.wnds.savePayload = async () => {
    const newSettings = {
      temperature: parseFloat(document.getElementById("payload-temperature").value),
      max_tokens: parseInt(document.getElementById("payload-max-tokens").value),
      top_p: parseFloat(document.getElementById("payload-top-p").value),
      frequency_penalty: parseFloat(document.getElementById("payload-frequency-penalty").value),
      presence_penalty: parseFloat(document.getElementById("payload-presence-penalty").value)
    };

    await UaDb.saveJson(DATA_KEYS.KEY_ACTIVE_PAYLOAD, newSettings);
    await alert("Configurazione payload salvata ed applicata alle prossime richieste.");
    wnds.winfo.close();
  };

  return true;
};

/**
 * Helper per creare un campo di input con pulsanti +/- grandi.
 */
const _createPayloadField = function (label, id, value, step, min, max) {
  const html = `
    <div class="payload-field">
      <label>${label}</label>
      <div class="payload-control">
        <button class="btn-step" onclick="wnds.stepVal('${id}', -${step}, ${min}, ${max})">−</button>
        <input type="number" id="${id}" step="${step}" min="${min}" max="${max}" value="${value}">
        <button class="btn-step" onclick="wnds.stepVal('${id}', ${step}, ${min}, ${max})">+</button>
      </div>
    </div>
  `;
  return html;
};

const _showReadme = function () {
  wnds.wdiv.show(help1_html);
  return true;
};

const _showQuickstart = function () {
  wnds.wdiv.show(help2_html);
  return true;
};

const _viewConversation = function () {
  const messages = AppMgr.getMessages();
  const html = `<h4>Cronologia Conversazione</h4><pre>${messages2text(messages)}</pre>`;
  wnds.wdiv.show(html);
  return true;
};

const _saveConversation = async function () {
  const messages = AppMgr.getMessages();
  if (messages.length === 0) {
    await alert("Nessuna conversazione da archiviare.");
    return false;
  }

  let result = false;
  const name = await prompt("Inserisci un nome per la conversazione:");
  if (name) {
    const list = await UaDb.readArray(DATA_KEYS.KEY_ARCHIVED_THREADS_LIST);
    if (!list.includes(name)) {
      list.push(name);
      await UaDb.saveArray(DATA_KEYS.KEY_ARCHIVED_THREADS_LIST, list);
    }
    await UaDb.saveJson(`${DATA_KEYS.PREFIX_ARCHIVED_THREAD}${name}`, messages);
    await alert(`Conversazione "${name}" archiviata.`);
    result = true;
  }
  return result;
};

const _elencoConversations = async function () {
  const names = await UaDb.readArray(DATA_KEYS.KEY_ARCHIVED_THREADS_LIST);
  let html = "<h4>Gestione Conversazioni Archiviate</h4>";
  html += '<table class="table-data table-manage"><thead><tr><th>Nome Conversazione</th><th>Azioni</th></tr></thead><tbody>';
  names.forEach(n => {
    html += `<tr><td>${n}</td><td class="actions">
      <button class="btn-table-action btn-load" onclick="wnds.loadConvo('${n}')">Carica</button>
      <button class="btn-table-action btn-delete" onclick="wnds.deleteConvo('${n}')">Elimina</button>
    </td></tr>`;
  });
  html += "</tbody></table>";
  wnds.winfo.showWide(html);

  window.wnds.loadConvo = async (name) => {
    const messages = await UaDb.readJson(`${DATA_KEYS.PREFIX_ARCHIVED_THREAD}${name}`);
    AppMgr.setMessages(messages);
    await idbMgr.create(DATA_KEYS.KEY_ACTIVE_THREAD, messages);
    await showHtmlThread();
    await alert(`Conversazione "${name}" caricata.`);
    wnds.winfo.close();
  };

  window.wnds.deleteConvo = async (name) => {
    if (await confirm(`Eliminare "${name}"?`)) {
      const list = await UaDb.readArray(DATA_KEYS.KEY_ARCHIVED_THREADS_LIST);
      const newList = list.filter(item => item !== name);
      await UaDb.saveArray(DATA_KEYS.KEY_ARCHIVED_THREADS_LIST, newList);
      await UaDb.delete(`${DATA_KEYS.PREFIX_ARCHIVED_THREAD}${name}`);
      _elencoConversations();
    }
  };

  return true;
};

const _elencoContesti = async function () {
  const names = await UaDb.readArray(DATA_KEYS.KEY_ARCHIVED_CONTEXTS_LIST);
  let html = "<h4>Gestione Contesti Archiviati</h4>";
  html += '<table class="table-data table-manage"><thead><tr><th>Nome Contesto</th><th>Azioni</th></tr></thead><tbody>';
  names.forEach(n => {
    html += `<tr><td>${n}</td><td class="actions">
      <button class="btn-table-action btn-load" onclick="wnds.loadContext('${n}')">Carica</button>
      <button class="btn-table-action btn-delete" onclick="wnds.deleteContext('${n}')">Elimina</button>
    </td></tr>`;
  });
  html += "</tbody></table>";
  wnds.winfo.showWide(html);

  window.wnds.loadContext = async (name) => {
    const text = await UaDb.read(`${DATA_KEYS.PREFIX_ARCHIVED_CONTEXT}${name}`);
    TextInput.contextText = text;
    await alert(`Contesto "${name}" caricato.`);
    wnds.winfo.close();
  };

  window.wnds.deleteContext = async (name) => {
    if (await confirm(`Eliminare "${name}"?`)) {
      const list = await UaDb.readArray(DATA_KEYS.KEY_ARCHIVED_CONTEXTS_LIST);
      const newList = list.filter(item => item !== name);
      await UaDb.saveArray(DATA_KEYS.KEY_ARCHIVED_CONTEXTS_LIST, newList);
      await UaDb.delete(`${DATA_KEYS.PREFIX_ARCHIVED_CONTEXT}${name}`);
      _elencoContesti();
    }
  };

  return true;
};

const _viewContext = function () {
  if (TextInput.contextText) {
    wnds.wpre.show(TextInput.contextText);
  } else {
    alert("Nessun contesto attivo.");
  }
  return true;
};

const _elencoSystems = async function () {
  const names = await UaDb.readArray(DATA_KEYS.KEY_ARCHIVED_SYSTEMS_LIST);
  let html = "<h4>Gestione System Prompt Archiviati</h4>";
  html += '<table class="table-data table-manage"><thead><tr><th>Nome System Prompt</th><th>Azioni</th></tr></thead><tbody>';
  names.forEach(n => {
    html += `<tr><td>${n}</td><td class="actions">
      <button class="btn-table-action btn-load" onclick="wnds.loadSystem('${n}')">Carica</button>
      <button class="btn-table-action btn-delete" onclick="wnds.deleteSystem('${n}')">Elimina</button>
    </td></tr>`;
  });
  html += "</tbody></table>";
  wnds.winfo.showWide(html);

  window.wnds.loadSystem = async (name) => {
    const text = await UaDb.read(`${DATA_KEYS.PREFIX_ARCHIVED_SYSTEM}${name}`);
    TextInput.systemPrompt = text;
    await alert(`System Prompt "${name}" caricato.`);
    wnds.winfo.close();
  };

  window.wnds.deleteSystem = async (name) => {
    if (await confirm(`Eliminare "${name}"?`)) {
      const list = await UaDb.readArray(DATA_KEYS.KEY_ARCHIVED_SYSTEMS_LIST);
      const newList = list.filter(item => item !== name);
      await UaDb.saveArray(DATA_KEYS.KEY_ARCHIVED_SYSTEMS_LIST, newList);
      await UaDb.delete(`${DATA_KEYS.PREFIX_ARCHIVED_SYSTEM}${name}`);
      _elencoSystems();
    }
  };

  return true;
};

const _viewSystem = function () {
  if (TextInput.systemPrompt) {
    wnds.wpre.show(TextInput.systemPrompt);
  } else {
    alert("Nessun System Prompt attivo.");
  }
  return true;
};

const _elencoDati = async function () {
  const keys = await UaDb.selectKeys("pc_");
  const items = [];
  for (const k of keys) {
    const v = await UaDb.read(k);
    items.push({ key: k, desc: getDescriptionForKey(k), size: JSON.stringify(v).length });
  }

  window.wnds.showData = async (key) => {
    const data = await UaDb.read(key);
    const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    wnds.wpre.show(content, false);
  };

  const jfh = UaJtfh();
  jfh.append('<div><table class="table-data"><thead><tr><th>Chiave</th><th>Descrizione</th><th>Dimensione</th></tr></thead><tbody>');
  items.forEach(item => {
    jfh.append(`<tr><td><a href="#" onclick="event.preventDefault(); wnds.showData('${item.key}')">${item.key}</a></td>`);
    jfh.append(`<td>${item.desc}</td><td class="size">${(item.size / 1024).toFixed(2)} KB</td></tr>`);
  });
  jfh.append('</tbody></table></div>');
  wnds.winfo.show(jfh.html());

  return true;
};

const _deleteAllData = async function () {
  const keys = await UaDb.selectKeys("pc_");
  const jfh = UaJtfh();
  jfh.append('<div class="delete-dialog">');
  jfh.append('<h4>Seleziona Dati da Cancellare</h4>');

  if (keys.length > 0) {
    jfh.append('<div style="display:flex; justify-content: space-between; align-items: center; margin-bottom:10px">');
    jfh.append('<label style="font-size: 0.8em; cursor:pointer"><input type="checkbox" onclick="document.querySelectorAll(\'.del-cb\').forEach(cb => cb.checked = this.checked)"> Seleziona tutto</label>');
    jfh.append('</div>');
    jfh.append('<table class="table-data"><thead><tr><th>Chiave</th><th>Descrizione</th></tr></thead><tbody>');

    for (const k of keys) {
      jfh.append(`<tr>
        <td><input type="checkbox" class="del-cb" data-key="${k}"> ${k}</td>
        <td>${getDescriptionForKey(k)}</td>
      </tr>`);
    }
    jfh.append('</tbody></table>');
  } else {
    jfh.append('<p>Nessun dato trovato.</p>');
  }

  jfh.append('<div style="margin-top:20px; display:flex; gap:10px">');
  jfh.append('<button class="btn-table-action btn-delete" onclick="wnds.deleteSelectedData()">Cancella Selezionati</button>');
  jfh.append('<button class="btn-table-action" style="background:#666; color:#fff" onclick="wnds.deleteAllEverything()">Svuota Tutto</button>');
  jfh.append('</div></div>');

  window.wnds.deleteSelectedData = async () => {
    const selected = Array.from(document.querySelectorAll(".del-cb:checked"));
    if (selected.length === 0) return alert("Nessun elemento selezionato.");
    if (await confirm(`Confermi la cancellazione di ${selected.length} elementi?`)) {
      for (const cb of selected) {
        const key = cb.dataset.key;
        // Aggiorna le liste rimuovendo l'elemento
        if (key.startsWith(DATA_KEYS.PREFIX_ARCHIVED_CONTEXT)) {
          const name = key.slice(DATA_KEYS.PREFIX_ARCHIVED_CONTEXT.length);
          const list = await UaDb.readArray(DATA_KEYS.KEY_ARCHIVED_CONTEXTS_LIST);
          await UaDb.saveArray(DATA_KEYS.KEY_ARCHIVED_CONTEXTS_LIST, list.filter(n => n !== name));
        }
        if (key.startsWith(DATA_KEYS.PREFIX_ARCHIVED_SYSTEM)) {
          const name = key.slice(DATA_KEYS.PREFIX_ARCHIVED_SYSTEM.length);
          const list = await UaDb.readArray(DATA_KEYS.KEY_ARCHIVED_SYSTEMS_LIST);
          await UaDb.saveArray(DATA_KEYS.KEY_ARCHIVED_SYSTEMS_LIST, list.filter(n => n !== name));
        }
        if (key.startsWith(DATA_KEYS.PREFIX_ARCHIVED_THREAD)) {
          const name = key.slice(DATA_KEYS.PREFIX_ARCHIVED_THREAD.length);
          const list = await UaDb.readArray(DATA_KEYS.KEY_ARCHIVED_THREADS_LIST);
          await UaDb.saveArray(DATA_KEYS.KEY_ARCHIVED_THREADS_LIST, list.filter(n => n !== name));
        }
        await UaDb.delete(key);
      }
      alert("Dati selezionati cancellati.");
      wnds.winfo.close();
    }
  };

  window.wnds.deleteAllEverything = async () => {
    if (await confirm("Questa azione cancellerà OGNI DATO dell'applicazione. Sei veramente sicuro?")) {
      await idbMgr.clearAll();
      localStorage.clear();
      location.reload();
    }
  };

  wnds.winfo.showWide(jfh.html());
  return true;
};

// #endregion

/**
 * Comandi rapidi richiamabili dall'interfaccia.
 */
export const Commands = (function () {
  const init = function () {
    const result = true;
    return result;
  };

  const help = function () {
    wnds.wdiv.show(help0_html);
    const result = true;
    return result;
  };

  const upload = function () {
    documentUploader.open();
    const result = true;
    return result;
  };

  const uploadSystem = function () {
    systemUploader.open();
    const result = true;
    return result;
  };

  const contextInput = function () {
    TextInput.contextInput();
    const result = true;
    return result;
  };

  const log = function () {
    UaLog.toggle();
    const result = true;
    return result;
  };

  const providerSettings = function () {
    LlmProvider.toggleTreeView();
    const result = true;
    return result;
  };

  const systemInput = function () {
    TextInput.systemInput();
    const result = true;
    return result;
  };

  const payloadSettings = async function () {
    await _payloadSettingsDialog();
    const result = true;
    return result;
  };

  const api = {
    init: init,
    help: help,
    upload: upload,
    uploadSystem: uploadSystem,
    contextInput: contextInput,
    log: log,
    providerSettings: providerSettings,
    systemInput: systemInput,
    payloadSettings: payloadSettings
  };
  return api;
})();

/**
 * Collega gli eventi DOM agli handler corrispondenti.
 */
export const bindEventListener = function () {
  const elHelp = document.getElementById("btn-help");
  if (elHelp) elHelp.onclick = Commands.help;

  const elLog = document.getElementById("id_log");
  if (elLog) elLog.onclick = Commands.log;

  const elProvider = document.getElementById("btn-provider-settings");
  if (elProvider) elProvider.onclick = Commands.providerSettings;

  const elDark = document.getElementById("btn-dark-theme");
  if (elDark) elDark.onclick = () => setTheme("dark");

  const elLight = document.getElementById("btn-light-theme");
  if (elLight) elLight.onclick = () => setTheme("light");

  const elReadme = document.getElementById("menu-readme");
  if (elReadme) elReadme.onclick = _showReadme;

  const elQuickstart = document.getElementById("menu-quickstart");
  if (elQuickstart) elQuickstart.onclick = _showQuickstart;

  const elPayload = document.getElementById("menu-payload");
  if (elPayload) elPayload.onclick = Commands.payloadSettings;

  // CONTESTO
  const elCtxInput = document.getElementById("menu-input-context");
  if (elCtxInput) elCtxInput.onclick = Commands.contextInput;

  const elUpload = document.getElementById("menu-upload");
  if (elUpload) elUpload.onclick = Commands.upload;

  const elGestCtx = document.getElementById("menu-gestione-contesto");
  if (elGestCtx) elGestCtx.onclick = _elencoContesti;

  const elViewCtx = document.getElementById("menu-view-context");
  if (elViewCtx) elViewCtx.onclick = _viewContext;

  // SYSTEM
  const elSysInp = document.getElementById("menu-system-input");
  if (elSysInp) elSysInp.onclick = Commands.systemInput;

  const elUpSys = document.getElementById("menu-upload-system");
  if (elUpSys) elUpSys.onclick = Commands.uploadSystem;

  const elGestSys = document.getElementById("menu-gestione-system");
  if (elGestSys) elGestSys.onclick = _elencoSystems;

  const elViewSys = document.getElementById("menu-view-system");
  if (elViewSys) elViewSys.onclick = _viewSystem;

  // CONVERSAZIONE
  const elArchConvo = document.getElementById("menu-archivia-convo");
  if (elArchConvo) elArchConvo.onclick = _saveConversation;

  const elElencoConvo = document.getElementById("menu-elenco-convo");
  if (elElencoConvo) elElencoConvo.onclick = _elencoConversations;

  const elViewConvo = document.getElementById("menu-view-convo");
  if (elViewConvo) elViewConvo.onclick = _viewConversation;

  // GESTIONE DATI
  const elElencoDati = document.getElementById("menu-elenco-dati");
  if (elElencoDati) elElencoDati.onclick = _elencoDati;

  const elDelAll = document.getElementById("menu-delete-all");
  if (elDelAll) elDelAll.onclick = _deleteAllData;

  const elAddKey = document.getElementById("menu-add-api-key");
  if (elAddKey) elAddKey.onclick = addApiKey;

  const elLogout = document.getElementById("menu-logout");
  if (elLogout) elLogout.onclick = () => { WebId.clear(); location.reload(); };

  const textInput = document.querySelector(".text-input");
  if (textInput) {
    textInput.onkeydown = (e) => TextInput.handleEnter(e);
  }

  const elCopyOut = document.getElementById("btn-copy-output");
  if (elCopyOut) elCopyOut.onclick = () => TextOutput.copy();

  const elContConvo = document.getElementById("btn-action3-continue-convo");
  if (elContConvo) elContConvo.onclick = () => TextInput.sendMessage();

  const elClearInp = document.querySelector(".clear-input");
  if (elClearInp) elClearInp.onclick = () => TextInput.clear();

  const elClearHist1 = document.querySelector("#clear-history1");
  if (elClearHist1) elClearHist1.onclick = () => TextOutput.clearHistory();

  const elClearHist2 = document.querySelector("#clear-history2");
  if (elClearHist2) elClearHist2.onclick = () => TextOutput.clearHistoryContext();

  const btn = document.querySelector("#id-menu-btn");
  if (btn) {
    btn.onchange = () => document.body.classList.toggle("menu-open", btn.checked);
  }

  return true;
};
