/** @format */
"use strict";

import { UaLog } from "./services/ualog3.js";
import { bindEventListener, showHtmlThread, wnds, Commands, TextInput, TextOutput, getTheme } from "./app_ui.js";
import { AppMgr } from "./app_mgr.js";
import { UaSender } from "./services/sender.js"
import { WebId } from "./services/webuser_id.js";

import "./services/uadialog.js";

/**
 * Punto di ingresso dell'applicazione PureChat.
 */
(function () {
  const VERSIONE = "0.1.0";
  console.info("*** PureChat Versione:", VERSIONE);

  //AAA const WORKER_URL = "https://ragindex.workerua.workers.dev";
  const WORKER_URL = "https://ragindex.workerua.workers.dev";

  /**
   * Inizializza e apre l'applicazione.
   */
  const openApp = async function () {
    let result = true;
    try {
      wnds.init();
      Commands.init();
      UaLog.setXY(40, 6).setZ(111).new();

      await AppMgr.initApp();
      await TextInput.init();
      await TextOutput.init();

      bindEventListener();

      const elMenu = document.querySelector(".menu-btn");
      if (elMenu) {
        elMenu.checked = false;
      }

      try {
        await showHtmlThread();
      } catch (e) {
        console.error("Impossibile caricare la cronologia:", e);
      }

      await getTheme();

      const userId = WebId.get();
      UaSender.init({
        workerUrl: WORKER_URL,
        userId: userId
      });
      UaSender.sendEventAsync("purechat", "open");
      result = true;
    } catch (error) {
      console.error("Errore openApp:", error);
      result = false;
    }
    return result;
  };

  window.addEventListener("load", openApp);
})();
