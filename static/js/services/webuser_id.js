

import { DATA_KEYS } from './data_keys.js';

/**
 * Costante per il valore di default dell'ID Utente.
 */
//  FIXME purechat_id 
const USER_WEB_ID = "purechat_id";

export const WebId = (() => {
    //AAA const storageKey = DATA_KEYS.KEY_WEB_ID;
    const storageKey = USER_WEB_ID;

    const get = () => {
        let userId = localStorage.getItem(storageKey);
        if (!userId) {
            userId = `${USER_WEB_ID}_${Date.now()}`;
            localStorage.setItem(storageKey, userId);
        }
        return userId;
    };

    const clear = () => {
        localStorage.removeItem(storageKey);
    };

    return {
        get,
        clear
    };
})();
