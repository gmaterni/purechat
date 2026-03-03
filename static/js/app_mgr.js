/** @format */
"use strict";

import { LlmProvider } from "./llm_provider.js";
import { promptBuilder } from "./llm_prompts.js";
import { idbMgr } from "./services/idb_mgr.js";
import { DATA_KEYS } from "./services/data_keys.js";
import { UaLog } from "./services/ualog3.js";
import { UaDb } from "./services/uadb.js";

/**
 * Gestore dell'applicazione.
 * Gestisce la logica di comunicazione con l'LLM e lo stato dei messaggi.
 */
export const AppMgr = (function() {

  // 1. STATO PRIVATO
  let _configLLM = null;
  let _clientLLM = null;
  let _promptSize = 0;
  let _messages = [];

  // Configurazione predefinita del payload
  const DEFAULT_PAYLOAD = {
    temperature: 0.7,
    max_tokens: 8000,
    top_p: 1.0,
    frequency_penalty: 0.0,
    presence_penalty: 0.0
  };

  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 5000;

  // 2. FUNZIONI PRIVATE

  /**
   * Attende per un numero specificato di millisecondi.
   * @param {number} ms Millisecondi di attesa.
   */
  const _sleep = function(ms) {
    if (!ms) return Promise.resolve();
    const result = new Promise((resolve) => setTimeout(resolve, ms));
    return result;
  };

  /**
   * Invia una richiesta con logica di retry in caso di errore.
   * @param {object} client Client LLM.
   * @param {object} payload Payload della richiesta.
   * @param {string} errorTag Etichetta per l'errore.
   */
  const _sendRequestWithRetry = async function(client, payload, errorTag) {
    // Fail Fast
    if (!client) {
      console.error("AppMgr._sendRequestWithRetry: client mancante");
      return null;
    }
    if (!payload) {
      console.error("AppMgr._sendRequestWithRetry: payload mancante");
      return null;
    }

    let result = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const rr = await client.sendRequest(payload, 90);
      
      if (!rr) {
        result = rr;
        break;
      }

      if (rr.ok) {
        result = rr;
        break;
      }

      const err = rr.error;
      console.error("****\n", `${errorTag} (Attempt ${attempt}/${MAX_RETRIES}):`, err);

      if (err && err.code === 413) {
        await alert("Il messaggio (incluso il contesto) è troppo grande per questo modello AI.");
        client.cancelRequest();
        result = rr;
        break;
      }

      // Errori transitori che meritano un tentativo di retry
      if (err && (err.code === 408 || err.code === 429 || [500, 502, 503, 504].includes(err.code))) {
        UaLog.log(`Errore transitorio ${err.code}. Nuovo tentativo tra ${RETRY_DELAY_MS / 1000}s...`);
        await _sleep(RETRY_DELAY_MS);
      } else {
        result = rr;
        break;
      }
    }
    
    return result;
  };

  /**
   * Recupera i parametri del payload dal database.
   */
  const _getPayloadSettings = async function() {
    let settings = await UaDb.readJson(DATA_KEYS.KEY_ACTIVE_PAYLOAD);
    if (!settings) {
      settings = DEFAULT_PAYLOAD;
      await UaDb.saveJson(DATA_KEYS.KEY_ACTIVE_PAYLOAD, settings);
    }
    const result = settings;
    return result;
  };

  // 3. FUNZIONI PUBBLICHE

  /**
   * Restituisce i messaggi correnti.
   */
  const getMessages = function() {
    const result = _messages;
    return result;
  };

  /**
   * Imposta i messaggi.
   * @param {Array} ms Messaggi da impostare.
   */
  const setMessages = function(ms) {
    _messages = Array.isArray(ms) ? ms : [];
    const result = _messages;
    return result;
  };

  /**
   * Pulisce i messaggi.
   */
  const clearMessages = function() {
    _messages = [];
    const result = _messages;
    return result;
  };

  /**
   * Converte i token in byte stimati.
   * @param {number} nk Numero di token in k.
   */
  const tokensToBytes = function(nk = 32) {
    const nc = 1024 * nk * 3;
    const sp = nc * 0.1;
    const mlr = Math.trunc(nc + sp);
    const result = mlr;
    return result;
  };

  /**
   * Inizializza l'applicazione.
   */
  const initApp = async function() {
    let result = true;
    try {
      await LlmProvider.init();
      await initConfig();

      // Carica la cronologia iniziale da IndexedDB
      const savedThread = await idbMgr.read(DATA_KEYS.KEY_ACTIVE_THREAD);
      if (savedThread) {
        setMessages(savedThread);
      }
    } catch (error) {
      console.error("AppMgr.initApp:", error);
      result = false;
    }
    return result;
  };

  /**
   * Inizializza la configurazione dell'LLM.
   */
  const initConfig = async function() {
    let result = null;
    try {
      await LlmProvider.initConfig();
      _configLLM = LlmProvider.getConfig();
      
      // Il windowSize nel config è già espresso in k (es: 1024)
      _promptSize = tokensToBytes(_configLLM.windowSize);
      
      console.info("=============================");
      console.info(`*** PROVIDER    : ${_configLLM.provider}`);
      console.info(`*** MODEL       : ${_configLLM.model}`);
      console.info(`*** WINDOW_SIZE : ${_configLLM.windowSize}k`);
      console.info(`*** PROMPT_SIZE : ${_promptSize} bytes`);
      console.info(`*** CLIENT      : ${_configLLM.client}`);
      
      _clientLLM = LlmProvider.getclient();
      result = _configLLM;
    } catch (error) {
      console.error("AppMgr.initConfig:", error);
      result = null;
    }
    return result;
  };

  /**
   * Procedura di invio richiesta.
   * @param {string} query Testo dell'utente.
   * @param {string} systemPrompt Prompt di sistema.
   * @param {string} contextText Testo di contesto.
   */
  const sendMessage = async function(query, systemPrompt, contextText) {
    // Fail Fast
    if (!query) {
      console.error("AppMgr.sendMessage: query mancante");
      return false;
    }

    let result = false;

    try {
      // 1. Assicura configurazione aggiornata
      await initConfig();

      // 2. Recupera i parametri del payload
      const payloadSettings = await _getPayloadSettings();

      // 3. Recupera la cronologia corrente
      const savedThread = await idbMgr.read(DATA_KEYS.KEY_ACTIVE_THREAD);
      const thread = savedThread || [];

      // 4. Aggiunge il messaggio utente alla cronologia temporanea
      const currentThread = [...thread, { role: 'user', content: query }];

      // 5. Costruzione del prompt (System + Contesto + Cronologia)
      const messages = promptBuilder.answerPrompt(contextText, currentThread, systemPrompt);

      // 6. Preparazione payload (unione config modello + parametri payload)
      const payload = {
        model: _configLLM.model,
        messages: messages,
        ...payloadSettings
      };

      console.info("--- LLM REQUEST PAYLOAD ---");
      console.info(`Model       : ${payload.model}`);
      console.info(`Temperature : ${payload.temperature}`);
      console.info(`Max Tokens  : ${payload.max_tokens}`);
      console.info(`Top P       : ${payload.top_p}`);
      console.info(`Freq Penalty: ${payload.frequency_penalty}`);
      console.info(`Pres Penalty: ${payload.presence_penalty}`);
      console.info("---------------------------");

      UaLog.log("Generazione risposta LLM...");

      // 7. Invio con logica di retry
      const rr = await _sendRequestWithRetry(_clientLLM, payload, "ERR_SEND_MESSAGE");

      if (rr && rr.ok) {
        const answer = rr.data;

        // 8. Aggiorna la cronologia reale
        thread.push({ role: 'user', content: query });
        thread.push({ role: 'assistant', content: answer });

        // 9. Persistenza su IndexedDB
        await idbMgr.create(DATA_KEYS.KEY_ACTIVE_THREAD, thread);

        // 10. Aggiorna stato interno per la UI
        setMessages(thread);

        result = true;
      } else {
        const errorMsg = rr?.error?.message || "Errore sconosciuto nella risposta LLM";
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error("AppMgr.sendMessage Error:", error);
      result = false;
      throw error; // Rilancia l'errore per la gestione nella UI
    }
    
    return result;
  };

  // 4. API PUBBLICA
  const api = {
    getMessages: getMessages,
    setMessages: setMessages,
    clearMessages: clearMessages,
    tokensToBytes: tokensToBytes,
    initApp: initApp,
    initConfig: initConfig,
    sendMessage: sendMessage
  };

  return api;
})();
