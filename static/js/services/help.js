/** @format */
"use strict";

/**
 * HTML per la finestra di aiuto dei comandi (Help).
 * Descrive le funzionalità dell'interfaccia e dei pulsanti principali.
 */
export const help0_html = `
<div class="text">
    <p class="center">Istruzioni Comandi</p>

    <!-- Barra Superiore -->
    <p class="center">Barra Superiore (Pillole Colorate)</p>
    <div style="margin-bottom: 8px;">
        <strong>Menu Laterale (☰)</strong>
        <p>Apre i comandi per gestire Contesti, System Prompt, Conversazioni e Configurazione Payload.</p>
    </div>
    <div style="margin-bottom: 8px;">
        <strong style="color: #ef4444;">? (Rosso)</strong>
        <p>Mostra questa guida rapida all'interfaccia.</p>
    </div>
    <div style="margin-bottom: 8px;">
        <strong style="color: #10b981;">LLM (Verde)</strong>
        <p>Seleziona il provider (Gemini, Groq, ecc.) e il modello AI attivo tramite il menu a tendina.</p>
    </div>
    <div style="margin-bottom: 8px;">
        <strong style="color: #f59e0b;">Log (Giallo)</strong>
        <p>Mostra i dettagli tecnici delle richieste inviate e delle risposte ricevute dall'LLM.</p>
    </div>

    <hr>

    <!-- Barra Laterale Verticale (Output) -->
    <p class="center">Azioni Conversazione (destra output)</p>
    <div>
        <strong>Copia Output</strong>
        <p>Copia l'intera conversazione corrente negli appunti.</p>
    </div>
    <div>
        <strong>Cancella Conversazione</strong>
        <p>Inizia un nuovo thread mantenendo il Contesto attuale.</p>
    </div>
    <div>
        <strong>Cancella Conversazione & Contesto</strong>
        <p>Svuota sia la conversazione che il contesto caricato.</p>
    </div>

    <hr>

    <!-- Pulsanti Inserimento -->
    <p class="center">Pulsanti Input (destra input)</p>
    <div>
        <strong>Invia Request (Freccia)</strong>
        <p>Invia il messaggio includendo System Prompt, Contesto e i parametri Payload attivi.</p>
    </div>
    <div>
        <strong>Cancella (Cestino)</strong>
        <p>Svuota il campo di testo dell'input.</p>
    </div>
</div>
`;


/**
 * HTML per il README.
 */
export const help1_html = `
<div class="text">
    <p class="center" style="font-size: 1.4em; font-weight: bold; margin-bottom: 15px;">PureChat: L'AI al tuo servizio, nel tuo browser</p>
    <p>
        PureChat non è solo una chat, ma un ambiente di lavoro locale per interagire con i più avanzati modelli di linguaggio (LLM) garantendo la massima privacy e controllo sui tuoi dati.
    </p>

    <hr>

    <div style="margin-top: 15px;">
        <strong>La Filosofia Local-First</strong>
        <p>A differenza di altre piattaforme, PureChat opera interamente sul tuo browser. Le tue Chiavi API, i documenti che carichi e le tue conversazioni vengono salvati esclusivamente in <strong>IndexedDB</strong> (un database locale sicuro). Nessun server intermedio legge i tuoi dati: la comunicazione avviene direttamente tra il tuo browser e i provider AI (Gemini, Groq, Mistral, ecc.).</p>
    </div>

    <div style="margin-top: 15px;">
        <strong>I Quattro Pilastri della Richiesta</strong>
        <p>Per ottenere risultati ottimali, PureChat combina quattro flussi informativi distinti:</p>
        <ul>
            <li><strong style="color: #ef4444;">System Prompt:</strong> L'identità dell'AI (es. "Sei un programmatore esperto").</li>
            <li><strong style="color: #3b82f6;">Contesto:</strong> La base di conoscenza (documenti caricati o testi incollati).</li>
            <li><strong style="color: #10b981;">Payload:</strong> I parametri tecnici (Temperatura, Max Tokens) che regolano la creatività e la lunghezza.</li>
            <li><strong style="color: #f59e0b;">Conversazione:</strong> La memoria dei messaggi precedenti nel thread corrente.</li>
        </ul>
    </div>

    <div style="margin-top: 15px;">
        <strong>Privacy Totale</strong>
        <p>L'applicazione non ha un database centrale. Tutto ciò che vedi è memorizzato nel <em>tuo</em> browser e non lascia mai il <em>tuo</em> dispositivo se non per raggiungere i server API dei provider selezionati.</p>
    </div>
</div>
`;


/**
 * HTML per il QuickStart.
 */
export const help2_html = `
<div class="text">
    <p class="center" style="font-size: 1.4em; font-weight: bold; margin-bottom: 15px;">Guida Rapida</p>

    <div style="margin-bottom: 15px;">
        <strong style="display: block; margin-bottom: 5px;">1. API Key</strong>
        <p>Vai su <strong>Gestione Api Key</strong> nel menu. Aggiungi la chiave per il provider che intendi usare. È il requisito fondamentale per iniziare.</p>
    </div>

    <div style="margin-bottom: 15px;">
        <strong style="display: block; margin-bottom: 5px;">2. Modello e Payload</strong>
        <p>Seleziona il modello cliccando sul badge <strong>LLM</strong> in alto. Se vuoi regolare la "creatività" dell'AI, usa la voce <strong>Payload</strong> nel menu per modificare la Temperatura.</p>
    </div>

    <div style="margin-bottom: 15px;">
        <strong style="display: block; margin-bottom: 5px;">3. Carica Contesto</strong>
        <p>Usa <strong>CONTESTO > Upload file</strong> per caricare PDF, DOCX o TXT. L'AI risponderà basandosi principalmente su questi documenti se presenti.</p>
    </div>

    <div style="margin-bottom: 15px;">
        <strong style="display: block; margin-bottom: 5px;">4. Chatta e Salva</strong>
        <p>Invia le tue domande. Se ottieni un risultato utile, usa <strong>Archivia</strong> nel menu per salvare la conversazione o il prompt corrente nella tua libreria locale.</p>
    </div>

    <p class="center" style="font-style: italic; font-size: 0.9em; margin-top: 20px;">Suggerimento: Usa pulsanti grandi [+] e [-] nel pannello Payload per regolare i valori con precisione.</p>
</div>
`;
