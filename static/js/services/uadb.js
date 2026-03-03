/** @format */
"use strict";

import { idbMgr } from "./idb_mgr.js";

/**
 * UaDb - Wrapper semplificato su idbMgr per PureChat.
 * Gestisce tutto lo stato persistente dell'app.
 */
export const UaDb = (function() {

  // 1. STATO PRIVATO (Wrapper puro)

  // 2. FUNZIONI PRIVATE (Nessuna)

  // 3. FUNZIONI PUBBLICHE

  /**
   * Legge un valore dal database.
   * @param {string} id Identificativo del dato.
   */
  const read = async function(id) {
    // Fail Fast
    if (!id) {
      console.error("UaDb.read: id mancante");
      return null;
    }
    const result = await idbMgr.read(id);
    return result;
  };

  /**
   * Salva un valore nel database.
   * @param {string} id Identificativo del dato.
   * @param {any} value Valore da salvare.
   */
  const save = async function(id, value) {
    if (!id) {
      console.error("UaDb.save: id mancante");
      return null;
    }
    const result = await idbMgr.create(id, value);
    return result;
  };

  /**
   * Elimina un valore dal database.
   * @param {string} id Identificativo del dato.
   */
  const remove = async function(id) {
    if (!id) {
      console.error("UaDb.delete: id mancante");
      return null;
    }
    const result = await idbMgr.delete(id);
    return result;
  };

  /**
   * Salva un oggetto in formato JSON.
   * @param {string} id Identificativo del dato.
   * @param {object} obj Oggetto da salvare.
   */
  const saveJson = async function(id, obj) {
    const result = await save(id, JSON.stringify(obj));
    return result;
  };

  /**
   * Legge un oggetto dal formato JSON.
   * @param {string} id Identificativo del dato.
   */
  const readJson = async function(id) {
    const str = await read(id);
    if (!str) return null;
    
    let result = null;
    try {
      result = JSON.parse(str);
    } catch (e) {
      console.error("UaDb.readJson error:", e);
      result = null;
    }
    return result;
  };

  /**
   * Salva un array.
   * @param {string} id Identificativo del dato.
   * @param {Array} arr Array da salvare.
   */
  const saveArray = async function(id, arr) {
    const result = await saveJson(id, arr);
    return result;
  };

  /**
   * Legge un array.
   * @param {string} id Identificativo del dato.
   */
  const readArray = async function(id) {
    const arr = await readJson(id);
    const result = Array.isArray(arr) ? arr : [];
    return result;
  };

  /**
   * Seleziona le chiavi che iniziano con un prefisso.
   * @param {string} prefix Prefisso delle chiavi.
   */
  const selectKeys = async function(prefix) {
    const result = await idbMgr.selectKeys(prefix);
    return result;
  };

  /**
   * Pulisce tutto il database.
   */
  const clear = async function() {
    const result = await idbMgr.clearAll();
    return result;
  };

  // 4. API PUBBLICA
  const api = {
    read: read,
    save: save,
    delete: remove,
    saveJson: saveJson,
    readJson: readJson,
    saveArray: saveArray,
    readArray: readArray,
    selectKeys: selectKeys,
    clear: clear
  };
  return api;
})();
