<!-- @format -->

# PureChat: Chat Semplice con System Prompt

**Versione:** 0.3.2 (Payload & UI Update)
**Data Ultimo Aggiornamento:** 02 Marzo 2026

**PureChat** è un'applicazione web minimale per conversare con modelli LLM (Gemini, Groq, Mistral, OpenRouter, Cerebras) utilizzando un **System Prompt** personalizzato. Tutto avviene nel tuo browser: nessuna elaborazione server, massima privacy.

---

## 🌟 Caratteristiche Principali

- ✅ **Supporto Multi-Provider** - Gemini, Groq, Mistral, OpenRouter, Cerebras.
- ✅ **Configurazione Payload** - Controllo granulare su Temperatura, Max Tokens e Penalty prima di ogni richiesta.
- ✅ **System Prompt Dinamico** - Definisci il ruolo dell'AI per ogni sessione.
- ✅ **Contesto Esteso** - Caricamento di file (TXT, PDF, DOCX) come base di conoscenza.
- ✅ **UI Alta Visibilità** - Interfaccia a badge colorati ("Pillole") per un accesso rapido ai comandi principali.
- ✅ **Archiviazione Locale** - Salvataggio persistente in IndexedDB.
- ✅ **Privacy by Design** - Dati e chiavi API restano esclusivamente nel browser.

---

## 🚀 Novità Versione 0.3.2

### ⚙️ Gestione Payload
È ora possibile regolare i parametri tecnici della richiesta LLM tramite il nuovo comando **Payload** nel menu:
- **Temperatura**: Regola la creatività delle risposte (0.0 - 2.0).
- **Max Tokens**: Limita la lunghezza massima della risposta.
- **Penalty**: Controllo raffinato su ripetizioni e presenza di nuovi concetti.
- *I parametri vengono salvati localmente e applicati automaticamente a ogni invio.*

### 🎨 UI Refined
- **LLM Badge**: Ora più visibile (Verde) con icona chevron per indicare il selettore di modelli.
- **Help & Log**: Badge colorati distinti (Rosso e Giallo) per un'identificazione immediata.
- **Payload Controls**: Pulsanti `[+]` e `[-]` di grandi dimensioni per una regolazione fisica e precisa dei valori.

---

## 🛠️ Architettura e Sviluppo

Il progetto segue rigorosamente le linee guida definite in `docs/BEST_PRACTICES_JS.md`.

### Validazione
- **Moduli**: Integrità verificata con `npm run check`.
- **Stili**: Sintassi LESS validata con `node tools/check_less.js`.
- **Log Request**: Ogni richiesta genera un log `console.info` dettagliato con il payload utilizzato.

---

## 📁 Struttura del Progetto

```
purechat/
├── index.html          # Entry point (Redirect a static/index.html)
├── static/
│   ├── index.html      # Applicazione principale
│   ├── less/           # Fogli di stile (LESS)
│   ├── data/           # Configurazioni modelli (TXT/JSON)
│   └── js/
│       ├── app.js      # Boot dell'applicazione
│       ├── app_mgr.js  # Core Manager (Stato, LLM, Payload Log)
│       ├── app_ui.js   # UI handler (Dialoghi Payload con pulsanti +/-)
│       ├── llm_provider.js 
│       └── services/   # DB, Uploader, Finestre, Log, Help
├── docs/               # Documentazione tecnica e Best Practices
└── tools/              # Script di validazione e test
```

---

## 🔒 Privacy e Sicurezza

- **Zero Server**: Non esiste un backend proprietario. Le chiamate API vanno dal tuo browser ai server dei provider.
- **Dati Locali**: Conversazioni e chiavi sono memorizzate in IndexedDB.
- **Codice Trasparente**: Nessun pacchetto offuscato o telemetria nascosta.

---

## 📄 Licenza e Autore

PureChat è un progetto sperimentale per uso personale e test di prompt.

**Autore:** Giuseppe Materni
**Revisione Qualità:** Marzo 2026 (Gemini CLI Refactoring)
