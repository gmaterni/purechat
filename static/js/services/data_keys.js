/** @format */
"use strict";

/**
 * Chiavi di archiviazione centralizzate per PureChat.
 * Prefisso 'pc_' per evitare collisioni.
 * 
 * Logica:
 * - ACTIVE: Dati della sessione corrente (volatile o persistente solo per ricaricamento)
 * - ARCHIVED: Dati salvati esplicitamente dall'utente per uso futuro
 */
export const DATA_KEYS = {
    // ===========================
    // CONFIGURAZIONE GLOBALE
    // ===========================
    KEY_THEME: "pc_theme",
    KEY_API_KEYS: "pc_api_keys",
    KEY_PROVIDER: "pc_llm_config", // Configurazione attiva (Provider/Modello)
    KEY_ACTIVE_PAYLOAD: "pc_active_payload", // Parametri payload (temperature, max_tokens, ecc.)

    // ===========================
    // STATO ATTIVO (SESSIONE)
    // ===========================
    KEY_ACTIVE_SYSTEM: "pc_active_system",   // Il System Prompt attualmente in uso
    KEY_ACTIVE_CONTEXT: "pc_active_context", // Il Contesto attualmente in uso
    KEY_ACTIVE_THREAD: "pc_active_thread",   // La Conversazione attualmente visualizzata

    // ===========================
    // ARCHIVIO (DATI SALVATI)
    // ===========================

    // System Prompts
    KEY_ARCHIVED_SYSTEMS_LIST: "pc_archived_systems_list", // Array di nomi: ["Pirata", "Traduttore"]
    PREFIX_ARCHIVED_SYSTEM: "pc_archived_sys_",            // Dato: pc_archived_sys_Pirata

    // Contesti
    KEY_ARCHIVED_CONTEXTS_LIST: "pc_archived_contexts_list", // Array di nomi
    PREFIX_ARCHIVED_CONTEXT: "pc_archived_ctx_",             // Dato

    // Conversazioni
    KEY_ARCHIVED_THREADS_LIST: "pc_archived_threads_list",   // Array di nomi
    PREFIX_ARCHIVED_THREAD: "pc_archived_thread_"            // Dato
};

const KEY_DESCRIPTIONS = {
    [DATA_KEYS.KEY_THEME]: "Preferenza Tema",
    [DATA_KEYS.KEY_API_KEYS]: "Chiavi API",
    [DATA_KEYS.KEY_PROVIDER]: "Configurazione LLM Attiva",
    [DATA_KEYS.KEY_ACTIVE_PAYLOAD]: "Parametri Payload Attivi",
    [DATA_KEYS.KEY_ACTIVE_SYSTEM]: "System Prompt Attivo",
    [DATA_KEYS.KEY_ACTIVE_CONTEXT]: "Contesto Attivo",
    [DATA_KEYS.KEY_ACTIVE_THREAD]: "Conversazione Attiva",
    [DATA_KEYS.KEY_ARCHIVED_SYSTEMS_LIST]: "Indice System Prompt Archiviati",
    [DATA_KEYS.KEY_ARCHIVED_CONTEXTS_LIST]: "Indice Contesti Archiviati",
    [DATA_KEYS.KEY_ARCHIVED_THREADS_LIST]: "Indice Conversazioni Archiviate"
};

export const getDescriptionForKey = (key) => {
    if (KEY_DESCRIPTIONS[key]) return KEY_DESCRIPTIONS[key];

    if (key.startsWith(DATA_KEYS.PREFIX_ARCHIVED_SYSTEM)) {
        return `System Prompt Archiviato: ${key.slice(DATA_KEYS.PREFIX_ARCHIVED_SYSTEM.length)}`;
    }
    if (key.startsWith(DATA_KEYS.PREFIX_ARCHIVED_CONTEXT)) {
        return `Contesto Archiviato: ${key.slice(DATA_KEYS.PREFIX_ARCHIVED_CONTEXT.length)}`;
    }
    if (key.startsWith(DATA_KEYS.PREFIX_ARCHIVED_THREAD)) {
        return `Conversazione Archiviata: ${key.slice(DATA_KEYS.PREFIX_ARCHIVED_THREAD.length)}`;
    }
    return "-";
};
