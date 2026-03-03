/** @format */
"use strict";

import Dexie from './vendor/dexie.js';

/**
 * idbMgr - Gestore IndexedDB isolato per PureChat.
 * Database: PureChatDB.
 */
export const idbMgr = (function() {

  // 1. STATO PRIVATO
  const _db = new Dexie("PureChatDB");

  // Utilizziamo una singola tabella per tutto lo stato dell'app
  _db.version(1).stores({
    settings: 'id' 
  });

  // 2. FUNZIONI PRIVATE (Nessuna)

  // 3. FUNZIONI PUBBLICHE

  /**
   * Restituisce l'istanza del database.
   */
  const getDb = function() {
    const result = _db;
    return result;
  };

  /**
   * Crea o aggiorna un record nel database.
   * @param {string} key Chiave del record.
   * @param {any} value Valore del record.
   */
  const create = async function(key, value) {
    // Fail Fast
    if (!key) {
      console.error("idbMgr.create: key mancante");
      return false;
    }

    let result = false;
    try {
      await _db.settings.put({ id: key, value: value });
      result = true;
    } catch (error) {
      console.error('Dexie: Errore durante la creazione:', error);
      result = false;
    }
    return result;
  };

  /**
   * Legge un record dal database.
   * @param {string} key Chiave del record.
   */
  const read = async function(key) {
    if (!key) {
      console.error("idbMgr.read: key mancante");
      return undefined;
    }

    let result = undefined;
    try {
      const record = await _db.settings.get(key);
      result = record ? record.value : undefined;
    } catch (error) {
      console.error('Dexie: Errore durante la lettura:', error);
      result = undefined;
    }
    return result;
  };

  /**
   * Elimina un record dal database.
   * @param {string} key Chiave del record.
   */
  const remove = async function(key) {
    if (!key) {
      console.error("idbMgr.delete: key mancante");
      return false;
    }

    let result = false;
    try {
      await _db.settings.delete(key);
      result = true;
    } catch (error) {
      console.error('Dexie: Errore durante l\'eliminazione:', error);
      result = false;
    }
    return result;
  };

  /**
   * Verifica se un record esiste.
   * @param {string} key Chiave del record.
   */
  const exists = async function(key) {
    if (!key) return false;

    let result = false;
    try {
      const count = await _db.settings.where('id').equals(key).count();
      result = count > 0;
    } catch (error) {
      console.error('Dexie: Errore durante exists:', error);
      result = false;
    }
    return result;
  };

  /**
   * Seleziona le chiavi che iniziano con un prefisso.
   * @param {string} prefix Prefisso delle chiavi.
   */
  const selectKeys = async function(prefix) {
    if (prefix === undefined || prefix === null) return [];

    let result = [];
    try {
      result = await _db.settings
        .where('id')
        .startsWith(prefix)
        .primaryKeys();
    } catch (error) {
      console.error('Dexie: Errore durante selectKeys:', error);
      result = [];
    }
    return result;
  };

  /**
   * Pulisce tutta la tabella delle impostazioni.
   */
  const clearAll = async function() {
    let result = false;
    try {
      await _db.settings.clear();
      result = true;
    } catch (error) {
      console.error('Dexie: Errore durante la pulizia totale:', error);
      result = false;
    }
    return result;
  };

  // 4. API PUBBLICA
  const api = {
    db: getDb,
    create: create,
    read: read,
    delete: remove,
    exists: exists,
    selectKeys: selectKeys,
    clearAll: clearAll
  };
  return api;
})();
