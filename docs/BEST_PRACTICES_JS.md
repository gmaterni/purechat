# JS VANILLA — REGOLE CODICE

> **VINCOLANTE:** Queste regole si applicano sempre, salvo richiesta esplicita contraria.

---

## FILOSOFIA

> "Il codice è un testo che descrive un processo secondo regole formali, destinato a essere letto da altri programmatori. Solo in secondo luogo è un insieme di istruzioni per una macchina."

**Principio operativo:** in caso di dubbio, scegli sempre l'opzione più esplicita e verbosa.

---

## REGOLE

### 1. LINGUA

| Elemento | Lingua |
|---|---|
| Commenti e docstring | **Italiano** |
| Variabili, funzioni, classi | **Inglese** |

```javascript
// ✅ Recupera i dati utente dal server
const fetchUserData = async (userId) => { ... };

// ❌ Misto: commento inglese e nome italiano
// Fetch user data
const recuperaDati = async (id) => { ... };
```

---

### 2. RETURN STRICT

Ogni `return` deve restituire una **variabile nominata**, mai un'espressione diretta.

```javascript
// ✅ Corretto — la variabile rende esplicito cosa si restituisce
const result = calculate(a) + b;
return result;

const api = { doAction: doAction };
return api;

// ❌ Vietato — il return nasconde cosa viene restituito
return calculate(a) + b;
return doSomething();
return { key: value };
return isValid ? data : null;
```

---

### 3. ASYNC/AWAIT

Le Promise chain con `.then()` sono vietate. Usare sempre `async/await`.

```javascript
// ✅ Corretto
const response = await fetch(url);
const json     = await response.json();

// ❌ Vietato
fetch(url)
    .then(r => r.json())
    .then(data => { ... });
```

---

### 4. DICHIARAZIONE VARIABILI

| Keyword | Quando usarla |
|---|---|
| `const` | **Default** — tutto ciò che non viene riassegnato |
| `let` | Solo se la variabile viene riassegnata |
| `var` | **Mai** |

---

### 5. FUNZIONI FRECCIA

Usare sempre la sintassi arrow `() => {}`. La keyword `function` è vietata salvo eccezioni esplicite (es. generatori, metodi di oggetti che usano `this`).

```javascript
// ✅ Corretto
const greet = (name) => {
    const message = `Ciao, ${name}`;
    return message;
};

const fetchUserData = async (userId) => {
    const response = await fetch(`/api/users/${userId}`);
    const data     = await response.json();
    return data;
};

// ❌ Vietato
const greet = function(name) { ... };
const fetchUserData = async function(userId) { ... };
```

---

### 6. ANTI-PATTERN VIETATI

#### One-liner complessi

```javascript
// ❌ Vietato — difficile da leggere e debuggare
return users.filter(u => u.active).map(u => u.name);

// ✅ Corretto — ogni passaggio è esplicito
const activeUsers = users.filter(u => u.active);
const names       = activeUsers.map(u => u.name);
return names;
```

#### Ternari annidati

```javascript
// ❌ Vietato
const x = a ? (b ? c : d) : e;

// ✅ Corretto
let x = e;
if (a) {
    x = b ? c : d;
}
return x;
```

#### Magic numbers

```javascript
// ❌ Vietato — il numero non ha contesto
setTimeout(fn, 5000);

// ✅ Corretto — la costante spiega il significato
const TIMEOUT_MS = 5000;
setTimeout(fn, TIMEOUT_MS);
```

---

## STRUTTURA MODULO — FACTORY PATTERN

Una **factory** è una funzione che, ogni volta che viene chiamata, costruisce e restituisce
un oggetto nuovo. Ogni oggetto ha il proprio stato privato, invisibile dall'esterno.

Il meccanismo che rende lo stato privato si chiama **closure**: le funzioni interne
"ricordano" le variabili del contesto in cui sono state create, anche dopo che la factory
ha terminato l'esecuzione.

L'esempio usa un contatore volutamente semplice: l'obiettivo è mostrare
l'**architettura** (le 4 sezioni), non la logica di business.

```javascript
"use strict";

/**
 * Contatore con soglia massima.
 * Esempio minimo per illustrare la struttura factory/closure.
 *
 * @param {number} maxValue - Valore massimo raggiungibile
 */
const UaCounter = (maxValue) => {

    // -------------------------
    // 1. STATO PRIVATO
    //
    // Queste variabili esistono solo all'interno di questa chiamata.
    // Il codice esterno non può leggerle né modificarle direttamente:
    // può farlo solo attraverso le funzioni pubbliche qui sotto.
    // -------------------------
    let _count = 0;


    // -------------------------
    // 2. FUNZIONI PRIVATE
    //
    // Funzioni di supporto, usate solo internamente.
    // Non compaiono nell'API pubblica e non sono accessibili dall'esterno.
    // -------------------------

    /**
     * Controlla se il contatore ha raggiunto il massimo.
     * @returns {boolean}
     */
    const _isAtMax = () => {
        const atMax = _count >= maxValue;
        return atMax;
    };


    // -------------------------
    // 3. FUNZIONI PUBBLICHE
    //
    // Queste funzioni saranno esposte nell'API.
    // Possono leggere e modificare lo stato privato (closure),
    // ma chi le chiama dall'esterno non vede lo stato direttamente.
    // -------------------------

    /**
     * Incrementa il contatore di uno, se non ha raggiunto il massimo.
     * @returns {number} Il valore corrente dopo l'operazione
     */
    const increment = () => {
        if (!_isAtMax()) {      // chiama una funzione privata
            _count += 1;        // modifica lo stato privato
        }
        const current = _count;
        return current;
    };

    /**
     * Restituisce il valore corrente senza modificare lo stato.
     * @returns {number}
     */
    const getValue = () => {
        const current = _count;
        return current;
    };

    /**
     * Azzera il contatore.
     * @returns {number} Sempre 0
     */
    const reset = () => {
        _count = 0;
        const current = _count;
        return current;
    };


    // -------------------------
    // 4. API PUBBLICA
    //
    // L'unico oggetto che viene restituito all'esterno.
    // Tutto ciò che non è qui è inaccessibile: stato privato
    // e funzioni private rimangono "intrappolati" nella closure.
    // -------------------------
    const api = {
        increment: increment,
        getValue:  getValue,
        reset:     reset,
    };
    return api;
};
```

**Quando usarlo:** ogni volta che lo stesso modulo deve esistere in più copie
indipendenti nella pagina, ciascuna con il proprio stato.

```javascript
// counterA e counterB sono oggetti separati con stato separato.
// Modificare lo stato di uno non influenza l'altro.
const counterA = UaCounter(10);
const counterB = UaCounter(10);

counterA.increment(); // → 1
counterA.increment(); // → 2
counterB.increment(); // → 1  (stato separato)

const valueA = counterA.getValue(); // → 2
const valueB = counterB.getValue(); // → 1

// _count e _isAtMax sono invisibili dall'esterno:
// questa riga restituisce undefined, non è un errore ma una conferma
// che l'incapsulamento funziona.
console.log(counterA._count); // → undefined
```

---

## STRUTTURA MODULO — SINGLETON (ES MODULE)

Per logica condivisa e unica nell'applicazione (configurazione, autenticazione, cache).
Grazie agli ES Module ogni file ha già uno **scope privato**: non serve un wrapper IIFE.

```javascript
// -------------------------
// 1. STATO PRIVATO
// (visibile solo in questo file)
// -------------------------
const _config = "value";
let _state    = 0;


// -------------------------
// 2. FUNZIONI PRIVATE
// -------------------------

/**
 * Combina i dati con la configurazione corrente.
 * @param  {*} data
 * @returns {*}
 */
const _helper = (data) => {
    const result = data + _config;
    return result;
};


// -------------------------
// 3. API PUBBLICA
// (solo ciò che viene esportato è accessibile dall'esterno)
// -------------------------

/**
 * Restituisce il valore elaborato dello stato corrente.
 * @returns {*}
 */
export const method1 = () => {
    const value = _helper(_state);
    return value;
};

/**
 * Incrementa lo stato e restituisce il nuovo valore.
 * @returns {number}
 */
export const method2 = () => {
    _state += 1;
    const current = _state;
    return current;
};
```

**Quando usarlo:** moduli importati una volta sola, con stato globale condiviso.

```javascript
import { method1, method2 } from "./module.js";
// Chiunque importi questo file usa lo stesso stato
```

> **IIFE vs ES Module:** il wrapper `(() => { ... })()` crea uno scope privato eseguendosi immediatamente. Con gli ES Module questo scope è già garantito dal file stesso, quindi l'IIFE è ridondante nei progetti moderni con bundler. Rimane però la scelta giusta in contesti **legacy**: codice senza bundler, pagine con `<script>` tradizionali, o librerie che devono girare ovunque senza dipendenze. In termini di memoria i due approcci sono equivalenti: entrambi producono un singleton eseguito una volta sola e cachato per tutta la vita dell'applicazione.

---

## DOM

```javascript
// Selezione
const el  = document.getElementById("id");
const els = document.querySelectorAll(".class");

// Creazione elementi
const div       = document.createElement("div");
div.className   = "item";
div.textContent = text;

// Eventi
button.addEventListener("click", handleClick);

// Stili
element.classList.add("active");
element.style.backgroundColor = "#fff";
```

---

## GESTIONE ERRORI ASYNC

Schema standard per qualsiasi operazione asincrona.

```javascript
/**
 * Esegue un'operazione rischiosa in modo sicuro.
 * @param  {string}       param - Parametro richiesto
 * @returns {Object|null}        Risultato, o null in caso di errore
 */
const riskyOp = async (param) => {

    let result = null;

    try {
        const data = await fetchData(param);
        result = data;

    } catch (error) {
        console.error("riskyOp:", error);
        result = null;
    }

    return result;
};
```

---

## CHECKLIST

Prima di consegnare il codice:

- [ ] Ogni `return` restituisce una variabile nominata (mai un'espressione diretta)?
- [ ] Commenti in italiano, nomi di variabili/funzioni in inglese?
- [ ] Usato `async/await` ovunque, niente `.then()`?
- [ ] `const` di default, `let` solo se necessario, `var` mai?
- [ ] `try/catch` per ogni operazione asincrona, con `console.error`?
- [ ] Nessun one-liner complesso, nessun ternario annidato, nessun magic number?
- [ ] Tutte le funzioni usano la sintassi arrow `() => {}`?

---

## PRIORITÀ

1. **Return Strict** — nessuna eccezione
2. **Async/Await** — niente Promise chain
3. **Esplicitezza** — 10 righe chiare valgono più di 3 eleganti
