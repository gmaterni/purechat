/** @format */
"use strict";

import { UaJtfh } from "./services/uajtfh.js";
import { getApiKey, fetchApiKeys } from "./services/key_retriever.js";
import { GeminiClient } from './llmclient/gemini_client.js';
import { GroqClient } from './llmclient/groq_client.js';
import { MistralClient } from './llmclient/mistral_client.js';
import { OpenRouterClient } from './llmclient/openrouter_client.js';
import { CerebrasClient } from './llmclient/cerebras_client.js';
import { UaWindowAdm } from "./services/uawindow.js";
import { DATA_KEYS } from "./services/data_keys.js";
import { UaDb } from "./services/uadb.js";

/**
 * Gestore dei provider LLM.
 * Gestisce la configurazione dei modelli e i client di comunicazione.
 */
export const LlmProvider = (function() {

  // 1. STATO PRIVATO
  const _providerConfig = {};
  const _clients = {};
  let _isTreeVisible = false;
  let _config = {
    provider: "",
    model: "",
    windowSize: 0,
    client: "",
  };
  const _containerId = "provvider_id";

  const DEFAULT_PROVIDER_CONFIG = {
    provider: "gemini",
    model: "gemini-2.5-flash-lite",
    windowSize: 1024,
    client: "gemini",
  };

  // 2. FUNZIONI PRIVATE

  /**
   * Carica i modelli dai file di configurazione.
   */
  const _loadModels = async function() {
    if (Object.keys(_providerConfig).length > 0) return true;
    
    let result = false;
    try {
      console.info("**** load models *******");
      const providers = ["gemini", "groq", "mistral", "openrouter", "cerebras"];
      
      for (const p of providers) {
        try {
          const response = await fetch(`./data/models/${p}_wnd.txt`);
          if (response.ok) {
            const text = await response.text();
            const lines = text.split("\n").filter(line => line.trim() !== "");
            
            _providerConfig[p] = {
              client: p,
              models: {}
            };
            
            lines.forEach(line => {
              const parts = line.split("|");
              const name = parts[0];
              const windowSizeTokens = parts[1];
              
              if (name && windowSizeTokens) {
                // Convertiamo i token in "k" (es: 1048576 -> 1024)
                _providerConfig[p].models[name] = {
                  windowSize: Math.round(parseInt(windowSizeTokens) / 1024)
                };
              }
            });
            
            if (Object.keys(_providerConfig[p].models).length > 0) {
              _clients[p] = null;
            }
          }
        } catch (e) {
          console.warn(`Impossibile caricare i modelli per ${p}:`, e);
        }
      }
      result = true;
    } catch (error) {
      console.error("Eccezione durante il caricamento dei modelli:", error);
      result = false;
    }
    return result;
  };

  /**
   * Valida la configurazione del provider.
   */
  const _isValidConfig = function(config) {
    if (!config || typeof config !== "object" || Object.keys(config).length === 0) return false;
    
    const provider = config.provider;
    const model = config.model;
    
    if (!provider || !_providerConfig[provider]) return false;
    if (!model || !_providerConfig[provider].models[model]) return false;
    
    const result = true;
    return result;
  };

  /**
   * Aggiorna la visualizzazione del modello attivo nella UI.
   */
  const _updateActiveModelDisplay = function() {
    const displayElement = document.getElementById("active-model-display");
    if (displayElement) {
      displayElement.textContent = `${_config.provider} / ${_config.model} (${_config.windowSize}k)`;
    }
    const result = true;
    return result;
  };

  /**
   * Costruisce la visualizzazione ad albero dei provider e modelli.
   */
  const _buildTreeView = function() {
    const wnd = UaWindowAdm.get(_containerId);
    const container = wnd ? wnd.getElement() : null;
    if (!container) return false;
    
    let treeHtml = `
      <div class="provider-tree-header">
        <span>Seleziona Modello</span>
        <button class="provider-tree-close-btn">&times;</button>
      </div>
      <ul class="provider-tree">
    `;
    
    for (const providerName in _providerConfig) {
      const provider = _providerConfig[providerName];
      const isActiveProvider = providerName === _config.provider;
      treeHtml += `
        <li class="provider-node">
          <span class="${isActiveProvider ? "active" : ""}" data-provider="${providerName}">
            ${isActiveProvider ? "&#9660;" : "&#9658;"} ${providerName}
          </span>
          <ul class="model-list" style="display: ${isActiveProvider ? "block" : "none"};">
      `;
      
      Object.keys(provider.models).forEach((modelName) => {
        const modelData = provider.models[modelName];
        const isActiveModel = isActiveProvider && modelName === _config.model;
        treeHtml += `
          <li class="model-node ${isActiveModel ? "active" : ""}" 
              data-provider="${providerName}" 
              data-model="${modelName}">
            ${modelName} (${modelData.windowSize}k)
          </li>`;
      });
      treeHtml += `</ul></li>`;
    }
    treeHtml += `</ul>`;
    wnd.setHtml(treeHtml);
    _addTreeEventListeners();
    
    const result = true;
    return result;
  };

  /**
   * Aggiunge i listener agli elementi della visualizzazione ad albero.
   */
  const _addTreeEventListeners = function() {
    const wnd = UaWindowAdm.get(_containerId);
    const container = wnd ? wnd.getElement() : null;
    if (!container) return false;
    
    const closeBtn = container.querySelector(".provider-tree-close-btn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => api.toggleTreeView());
    }
    
    // Click sui provider (per aprire/chiudere)
    container.querySelectorAll(".provider-node > span").forEach((span) => {
      span.addEventListener("click", (e) => {
        const modelList = e.target.nextElementSibling;
        const isOpening = modelList.style.display === "none";
        // Chiudi tutti i menu
        container.querySelectorAll(".model-list").forEach((ml) => (ml.style.display = "none"));
        container.querySelectorAll(".provider-node > span").forEach((s) => {
          s.innerHTML = `&#9658; ${s.dataset.provider}`;
        });
        // Se stavo aprendo, mostra il menu
        if (isOpening) {
          modelList.style.display = "block";
          e.target.innerHTML = `&#9660; ${e.target.dataset.provider}`;
        }
      });
    });
    
    // Click sui modelli (per selezionare)
    container.querySelectorAll(".model-node").forEach((node) => {
      node.addEventListener("click", (e) => {
        const providerName = e.target.dataset.provider;
        const modelName = e.target.dataset.model;
        _setProviderAndModel(providerName, modelName);
      });
    });
    
    const result = true;
    return result;
  };

  /**
   * Imposta il provider e il modello selezionati.
   */
  const _setProviderAndModel = async function(provider, model) {
    // Fail Fast
    if (!provider || !model) return false;

    _config = {
      provider: provider,
      model: model,
      windowSize: _providerConfig[provider].models[model].windowSize,
      client: _providerConfig[provider].client,
    };

    await UaDb.saveJson(DATA_KEYS.KEY_PROVIDER, _config);

    // Aggiorna il display
    _updateActiveModelDisplay();

    // Ricostruisci il tree per aggiornare gli stati attivi
    if (_isTreeVisible) {
      _buildTreeView();
    }

    // Chiudi il tree
    api.toggleTreeView();
    
    const result = true;
    return result;
  };

  // 3. FUNZIONI PUBBLICHE

  /**
   * Inizializza i client LLM.
   */
  const init = async function() {
    await _loadModels();
    await fetchApiKeys();

    // Popola dinamicamente i client in base alla configurazione
    for (const providerName in _providerConfig) {
      const provider = _providerConfig[providerName];
      const clientName = provider.client;
      const apiKey = await getApiKey(clientName);

      switch (clientName) {
        case "gemini":
          _clients[clientName] = new GeminiClient(apiKey);
          break;
        case "groq":
          _clients[clientName] = new GroqClient(apiKey);
          break;
        case "mistral":
          _clients[clientName] = new MistralClient(apiKey);
          break;
        case "openrouter":
          _clients[clientName] = new OpenRouterClient(apiKey);
          break;
        case "cerebras":
          _clients[clientName] = new CerebrasClient(apiKey);
          break;
        default:
          _clients[clientName] = null;
          console.warn(`Client non supportato: ${clientName}`);
          break;
      }
    }
    const result = true;
    return result;
  };

  /**
   * Inizializza la configurazione.
   */
  const initConfig = async function() {
    await _loadModels(); // Assicura che i modelli siano caricati
    const savedConfig = await UaDb.readJson(DATA_KEYS.KEY_PROVIDER);
    
    if (_isValidConfig(savedConfig)) {
      _config = savedConfig;
    } else {
      // Se savedConfig non è valido, non allertiamo ma resettiamo al default
      _config = { ...DEFAULT_PROVIDER_CONFIG };
      await UaDb.saveJson(DATA_KEYS.KEY_PROVIDER, _config);
    }
    
    _updateActiveModelDisplay();
    const result = _config;
    return result;
  };

  /**
   * Restituisce il client LLM corrente.
   */
  const getclient = function() {
    const currentclientName = _config.client;
    const result = _clients[currentclientName] || null;
    return result;
  };

  /**
   * Mostra/nasconde la visualizzazione ad albero dei provider.
   */
  const toggleTreeView = function() {
    const wnd = UaWindowAdm.create(_containerId);
    const container = wnd.getElement();
    if (!container) return false;
    
    wnd.addClassStyle("provider-tree-container");
    _isTreeVisible = !_isTreeVisible;
    container.style.display = _isTreeVisible ? "block" : "none";
    
    if (_isTreeVisible) {
      _buildTreeView();
    }
    const result = _isTreeVisible;
    return result;
  };

  /**
   * Restituisce la configurazione corrente.
   */
  const getConfig = function() {
    const result = _config;
    return result;
  };

  /**
   * Mostra la configurazione corrente in una finestra informativa.
   */
  const showConfig = async function() {
    const llmConfig = getConfig();

    const jfh = UaJtfh();
    jfh.append('<div class="config-confirm">');
    jfh.append('<table class="table-data">');
    jfh.append(`<tr><td>Provider</td><td>${llmConfig.provider}</td></tr>`);
    jfh.append(`<tr><td>Modello</td><td>${llmConfig.model}</td></tr>`);
    jfh.append(`<tr><td>Prompt Size</td><td>${llmConfig.windowSize}k</td></tr>`);
    jfh.append(`<tr><td>client</td><td>${llmConfig.client}</td></tr>`);
    jfh.append('</table></div>');

    // Import dinamico per evitare dipendenze circolari
    const { wnds } = await import("./app_ui.js");
    wnds.winfo.show(jfh.html());
    
    const result = true;
    return result;
  };

  /**
   * Restituisce la configurazione dei provider (per usi esterni).
   */
  const getProviderConfig = function() {
    const result = _providerConfig;
    return result;
  };

  // 4. API PUBBLICA
  const api = {
    init: init,
    initConfig: initConfig,
    getclient: getclient,
    toggleTreeView: toggleTreeView,
    getConfig: getConfig,
    showConfig: showConfig,
    getProviderConfig: getProviderConfig
  };

  return api;
})();

/**
 * Esportazione per compatibilità con altri moduli.
 */
export const PROVIDER_CONFIG = LlmProvider.getProviderConfig();
