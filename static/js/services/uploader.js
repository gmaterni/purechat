/** @format */
"use strict";

import { UaWindowAdm } from "./uawindow.js";
import { UaDb } from "./uadb.js";
import { DATA_KEYS } from "./data_keys.js";

/**
 * Gestore base per il caricamento dei file.
 * Implementa la logica di drag & drop e l'elaborazione dei file.
 */
const BaseUploader = function(options = {}) {
  // 1. STATO PRIVATO
  const _id = options.id || "id_upload";
  const _title = options.title || "Caricamento File";
  const _description = options.description || "Trascina i file qui.";
  const _supportedExtensions = options.supportedExtensions || ["txt", "pdf", "docx"];
  const _onSave = options.onSave;
  
  let _uploadMode = "single";
  let _dragoverHandler = null;
  let _dropHandler = null;

  // 2. FUNZIONI PRIVATE

  /**
   * Esplora ricorsivamente l'albero dei file (per le directory).
   */
  const _traverseFileTree = async function(item, files) {
    // Fail Fast
    if (!item || !files) return;

    if (item.isFile) {
      await new Promise(resolve => item.file(f => { 
        files.push(f); 
        resolve(); 
      }));
    } else if (item.isDirectory) {
      const entries = await new Promise(resolve => item.createReader().readEntries(resolve));
      for (const entry of entries) {
        await _traverseFileTree(entry, files);
      }
    }
  };

  /**
   * Gestisce il caricamento di più file.
   */
  const _handleMultipleFiles = async function(files) {
    if (!files || files.length === 0) return false;

    const validFiles = files.filter(f => _supportedExtensions.includes(f.name.split(".").pop().toLowerCase()));
    if (validFiles.length === 0) {
      await alert(`Nessun file valido trovato. Formati: ${_supportedExtensions.join(", ")}`);
      return false;
    }

    const wnd = UaWindowAdm.get(_id);
    const element = wnd ? wnd.getElement() : null;
    if (!element) return false;

    const progressContainer = element.querySelector(`#progress-container-${_id}`);
    const progressBar = element.querySelector(`#progress-bar-${_id}`);
    const progressText = element.querySelector(`#progress-text-${_id}`);
    const fileList = element.querySelector(`#file-list-${_id}`);

    if (progressContainer) progressContainer.style.display = "block";
    if (fileList) fileList.innerHTML = "";

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const perc = Math.round(((i + 1) / validFiles.length) * 100);
      
      if (progressBar) {
        progressBar.style.width = `${perc}%`;
        progressBar.textContent = `${perc}%`;
      }
      if (progressText) {
        progressText.textContent = `${i + 1} / ${validFiles.length} file processati`;
      }

      try {
        let text = "";
        const ext = file.name.split(".").pop().toLowerCase();
        
        if (ext === "pdf") {
          const ph = PdfHandler();
          await ph.loadPdfJs();
          text = await ph.extractTextFromPDF(file);
          ph.cleanup();
        } else if (ext === "docx") {
          const dh = DocxHandler();
          await dh.loadMammoth();
          text = await dh.extractTextFromDocx(file);
          dh.cleanup();
        } else {
          text = await file.text();
        }
        
        if (_onSave) {
          await _onSave(file.name, text);
        }
        _addFileItem(fileList, file.name, "success");
      } catch (err) {
        console.error("BaseUploader._handleMultipleFiles error:", err);
        _addFileItem(fileList, file.name, "error", err.message);
      }
    }

    setTimeout(() => { 
      if (progressContainer) progressContainer.style.display = "none"; 
    }, 2000);

    return true;
  };

  /**
   * Aggiunge un elemento alla lista dei file caricati nella UI.
   */
  const _addFileItem = function(container, name, status, error = "") {
    if (!container) return;

    const div = document.createElement("div");
    div.className = `file-list-item ${status}`;
    div.style.padding = "4px 8px";
    div.style.marginBottom = "2px";
    div.style.borderRadius = "4px";
    div.style.fontSize = "12px";
    div.style.background = status === "success" ? "rgba(76, 175, 80, 0.2)" : "rgba(244, 67, 54, 0.2)";
    div.textContent = `${name} - ${status === "success" ? "OK" : "Errore: " + error}`;
    
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  };

  // 3. FUNZIONI PUBBLICHE

  /**
   * Apre la finestra di caricamento.
   */
  const open = function() {
    const htmlContent = `
      <div class="window-text">
        <div class="btn-wrapper">
         <button class="btn-close tt-left" data-tt="Chiudi">X</button>
        </div>
        <div class="upload-dialog-content">
          <h4>${_title}</h4>
          <p class="upload-description">${_description}</p>
          
          <div class="upload-mode-selector">
            <label>
              <input type="radio" name="upload-mode-${_id}" value="single" checked> <span>File singoli</span>
            </label>
            <label>
              <input type="radio" name="upload-mode-${_id}" value="directory"> <span>Intera directory</span>
            </label>
          </div>
          
          <div id="drop-zone-${_id}" class="drop-zone">
            <p id="drop-zone-text-${_id}">Trascina i file qui o clicca per selezionare</p>
            <input type="file" id="file-input-${_id}" style="display: none;" multiple>
          </div>
          
          <div id="progress-container-${_id}" style="display: none;">
            <div style="width: 100%; background: #444; border-radius: 4px; overflow: hidden;">
              <div id="progress-bar-${_id}" style="width: 0%; height: 20px; background: #4caf50; text-align: center; line-height: 20px; color: white; font-size: 12px;">0%</div>
            </div>
            <p id="progress-text-${_id}" style="margin-top: 5px; font-size: 12px;">0 / 0 file processati</p>
          </div>
          <div id="file-list-${_id}" class="file-list-container" style="margin-top: 15px; max-height: 200px; overflow-y: auto;"></div>        
        </div>
      </div>
    `;

    const wnd = UaWindowAdm.create(_id);
    wnd.drag().setZ(12).vw_vh().setXY(16.5, 5, -1).setHtml(htmlContent).show();

    const element = wnd.getElement();
    const btnClose = element.querySelector(".btn-close");
    if (btnClose) {
      btnClose.onclick = () => close();
    }

    const dropZone = element.querySelector(`#drop-zone-${_id}`);
    const dropZoneText = element.querySelector(`#drop-zone-text-${_id}`);
    const fileInput = element.querySelector(`#file-input-${_id}`);
    const modeRadios = element.querySelectorAll(`input[name="upload-mode-${_id}"]`);

    modeRadios.forEach(radio => {
      radio.onchange = (e) => {
        _uploadMode = e.target.value;
        if (_uploadMode === "directory") {
          fileInput.setAttribute("webkitdirectory", "");
          fileInput.setAttribute("directory", "");
          if (dropZoneText) dropZoneText.textContent = "Trascina una directory qui o clicca per selezionare";
        } else {
          fileInput.removeAttribute("webkitdirectory");
          fileInput.removeAttribute("directory");
          if (dropZoneText) dropZoneText.textContent = "Trascina i file qui o clicca per selezionare";
        }
      };
    });

    if (dropZone) {
      dropZone.onclick = () => fileInput.click();
      dropZone.ondragover = (e) => { 
        e.preventDefault(); 
        dropZone.classList.add("drag-over"); 
      };
      dropZone.ondragleave = () => dropZone.classList.remove("drag-over");
      dropZone.ondrop = async (e) => {
        e.preventDefault();
        dropZone.classList.remove("drag-over");
        const files = [];
        if (e.dataTransfer.items) {
          for (let i = 0; i < e.dataTransfer.items.length; i++) {
            const item = e.dataTransfer.items[i].webkitGetAsEntry();
            if (item) await _traverseFileTree(item, files);
          }
        } else {
          for (const file of e.dataTransfer.files) {
            files.push(file);
          }
        }
        if (files.length > 0) {
          await _handleMultipleFiles(files);
        }
      };
    }

    if (fileInput) {
      fileInput.onchange = async (e) => {
        if (e.target.files.length > 0) {
          await _handleMultipleFiles(Array.from(e.target.files));
        }
      };
    }

    _dragoverHandler = (e) => e.preventDefault();
    _dropHandler = (e) => e.preventDefault();
    window.addEventListener("dragover", _dragoverHandler);
    window.addEventListener("drop", _dropHandler);

    return true;
  };

  /**
   * Chiude la finestra e rimuove i listener globali.
   */
  const close = function() {
    window.removeEventListener("dragover", _dragoverHandler);
    window.removeEventListener("drop", _dropHandler);
    UaWindowAdm.close(_id);
    return true;
  };

  // 4. API PUBBLICA
  const api = {
    open: open,
    close: close
  };
  return api;
};

/**
 * Gestore per il caricamento di documenti di contesto.
 */
export const documentUploader = BaseUploader({
  id: "id_upload_docs",
  title: "Upload Documenti",
  description: "I file verranno caricati e archiviati nella knowledge base.",
  onSave: async (name, text) => {
    const cleanName = name.split('.').slice(0, -1).join('.') || name;
    
    // Aggiorna la lista dei nomi
    const list = await UaDb.readArray(DATA_KEYS.KEY_ARCHIVED_CONTEXTS_LIST);
    if (!list.includes(cleanName)) {
      list.push(cleanName);
      await UaDb.saveArray(DATA_KEYS.KEY_ARCHIVED_CONTEXTS_LIST, list);
    }
    
    // Salva il contenuto
    await UaDb.save(`${DATA_KEYS.PREFIX_ARCHIVED_CONTEXT}${cleanName}`, text);
    
    // Imposta come contesto attivo
    const { TextInput } = await import("../app_ui.js");
    if (TextInput) {
      TextInput.contextText = text;
    }
    const result = true;
    return result;
  }
});

/**
 * Gestore per il caricamento di system prompt.
 */
export const systemUploader = BaseUploader({
  id: "id_upload_system",
  title: "Upload System Prompt",
  description: "Trascina file (TXT, PDF, DOCX) da archiviare come System Prompt.",
  supportedExtensions: ["txt", "pdf", "docx"],
  onSave: async (name, text) => {
    const cleanName = name.split('.').slice(0, -1).join('.') || name;
    
    // Aggiorna la lista dei nomi
    const list = await UaDb.readArray(DATA_KEYS.KEY_ARCHIVED_SYSTEMS_LIST);
    if (!list.includes(cleanName)) {
      list.push(cleanName);
      await UaDb.saveArray(DATA_KEYS.KEY_ARCHIVED_SYSTEMS_LIST, list);
    }

    await UaDb.save(`${DATA_KEYS.PREFIX_ARCHIVED_SYSTEM}${cleanName}`, text);
    
    // Aggiorna il prompt corrente
    const { TextInput } = await import("../app_ui.js");
    if (TextInput) {
      TextInput.systemPrompt = text;
    }
    await alert(`System Prompt "${cleanName}" archiviato.`);
    
    const result = true;
    return result;
  }
});

/**
 * Gestore per l'estrazione di testo da file PDF.
 */
const PdfHandler = function() {
  let _pdfjsLib = null;

  const loadPdfJs = async function() {
    if (window["pdfjsLib"]) {
      _pdfjsLib = window["pdfjs-dist/build/pdf"];
      return true;
    }
    
    const s1 = document.createElement("script");
    s1.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.min.js";
    document.body.appendChild(s1);
    
    await new Promise(resolve => s1.onload = async () => {
      const s2 = document.createElement("script");
      s2.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js";
      document.body.appendChild(s2);
      s2.onload = resolve;
    });
    
    _pdfjsLib = window["pdfjs-dist/build/pdf"];
    if (_pdfjsLib) {
      _pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js";
    }
    return true;
  };

  const extractTextFromPDF = async function(file) {
    if (!file || !_pdfjsLib) return "";
    
    let text = "";
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await _pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str).join(" ") + "\n";
      }
    } catch (error) {
      console.error("PdfHandler.extractTextFromPDF error:", error);
      text = "";
    }
    return text;
  };

  const cleanup = function() {
    const result = true;
    return result;
  };

  const api = {
    loadPdfJs: loadPdfJs,
    extractTextFromPDF: extractTextFromPDF,
    cleanup: cleanup
  };
  return api;
};

/**
 * Gestore per l'estrazione di testo da file DOCX.
 */
const DocxHandler = function() {
  let _mammoth = null;

  const loadMammoth = async function() {
    if (window["mammoth"]) {
      _mammoth = window["mammoth"];
      return true;
    }
    
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.4.11/mammoth.browser.min.js";
    document.body.appendChild(s);
    
    await new Promise(resolve => s.onload = () => {
      _mammoth = window["mammoth"];
      resolve();
    });
    return true;
  };

  const extractTextFromDocx = async function(file) {
    if (!file || !_mammoth) return "";
    
    let text = "";
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await _mammoth.extractRawText({ arrayBuffer });
      text = result.value;
    } catch (error) {
      console.error("DocxHandler.extractTextFromDocx error:", error);
      text = "";
    }
    return text;
  };

  const cleanup = function() {
    const result = true;
    return result;
  };

  const api = {
    loadMammoth: loadMammoth,
    extractTextFromDocx: extractTextFromDocx,
    cleanup: cleanup
  };
  return api;
};

/**
 * Utilità per la lettura dei file.
 */
export const FileReaderUtil = (function() {
  const readTextFile = async function(file) {
    if (!file) return "";
    const result = await file.text();
    return result;
  };

  const api = {
    readTextFile: readTextFile
  };
  return api;
})();
