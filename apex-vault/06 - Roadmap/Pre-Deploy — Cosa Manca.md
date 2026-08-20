# Pre-Deploy — Cosa Manca

tags: #roadmap #deploy #inbox

> **Come si usa.** Scrivi qui tutto quello che secondo te manca o non va, prima di mettere l'app online.
> Anche a mezza frase, anche in disordine: ci passo io e le trasformo in fix.
> Non serve che tu sappia se è un bug o una feature — mettila dove ti sembra e la smisto.
>
> Convenzioni:
> - `- [ ]` = da fare · `- [x]` = fatto · `~~barrato~~` + link = diventato issue/PR
> - se puoi, aggiungi **dove** l'hai visto (pagina) e **cosa ti aspettavi** invece
> - `🔴` = blocca il deploy · `🟡` = fastidioso ma si può andare online · `🔵` = idea per dopo

---

## 🖥️ Schermata per schermata
_Un blocco per pagina, così quando fixo so dove guardare. Cancella quelli che non ti servono._


### Analytics
- ~~mancano le performance mensili in percentuale o in dollari scambiabile.~~ ✅ **Fatto**
  Nuovo pannello **Month by Month** sopra il calendario, con filtro per strategia. Una riga per mese: trade, win rate %, expectancy per trade, netto in R (con barra col segno) e netto in dollari.
  **Deciso sulla percentuale:** il rendimento % vorrebbe un capitale di riferimento, che la [#106](https://github.com/wrld777/apex-trading-journal/issues/106) ha tolto di proposito. Le percentuali che restano sono il **win rate**; il risultato è in **R**, coi dollari accanto. Se un giorno servisse la % vera, va rimesso un capitale opzionale nel Profilo — è una decisione, non una svista.
  BE: nuovo `GET /api/analytics/monthly?strategyId=` (con ownership come la [#68](https://github.com/wrld777/apex-trading-journal/issues/68)).

### Strategy Insights
- ~~in realta non so penso che ci siamo se hai qualche dato importante che puo aiutarmi nel improvmeent implementa.~~ ✅ **Fatto (in parte)**
  Aggiunta la frase secca sopra le barre: *«Saltare "attendi la conferma" ti costa 18 punti di win rate — rispettata su 11 trade, saltata su 7»*. Nessun dato nuovo: è `RuleImpactDto`, che il BE già calcolava e che solo il grafico leggeva. Soglia minima di 3 occorrenze per lato, altrimenti è rumore spacciato per scoperta.
  **Rimaste nel cassetto** (proposte, non fatte — dimmi se le vuoi):
  - curva per **numero di trade al giorno**: l'overtrading si vede solo così
  - **performance per strumento dentro la strategia**: la stessa strategia su MNQ e su GC spesso non è la stessa strategia

### Trade Log
- ~~non posso modificare tutte le info tipo lottaggi ecc serve se ho sbagliao che faccio cancello tutto?~~ ✅ **Fatto**
  Era anche backend: `UpdateTradeRequest` portava solo il "dopo" (uscita, note, tag) — strumento, direzione, livelli, size e orario d'ingresso **non esistevano proprio** nel corpo della PUT. Ora la PUT rimpiazza il trade per intero, con le stesse regole di convalida della create (estratte in un validator generico, non duplicate), e il PnL si ricalcola col `PointValue` giusto se cambi strumento.
  Il modale sparisce: si modifica in `/trades/:id/edit`, che è **lo stesso modulo** con cui il trade è stato scritto.
  Corretto anche il controller: rispondeva 404 a tutto, anche ai contratti che non tornavano. Ora 404 solo se il trade non esiste, 400 per il resto.
  Verificato sul DB reale: MES→ES con qty 1→3 ricalcola il PnL da $50 a $1.500, R invariato a 1.


---

## 🎨 Grafica e identità
_Colori, spaziature, font, logo, nome, icone, cose che "sembrano fuori posto"._
- ~~manca una pagina dove posso aprire i trade e vederli tipo, io adesso se voglio vedere un vecchio trade regoistrato devo fare modifica dal trade log.~~ ✅ **Fatto** _(era una feature, non grafica)_
  Nuova pagina `/trades/:id`, sola lettura: R / P&L / RR / durata in cima, esecuzione, tabella delle uscite, contesto, **aderenza alla checklist con le etichette delle regole**, screenshot, note. Ci si arriva **cliccando la riga** del Trade Log (più l'icona 👁 accanto a matita e cestino).
  L'aderenza per-trade era registrata dalla [#85](https://github.com/wrld777/apex-trading-journal/issues/85) e non è **mai stata mostrata**: il tipo del frontend dichiarava `label`/`order`/`required` e `strategyName`, ma il backend non li ha mai spediti. Ora sì.

---

## 🐛 Comportamenti sbagliati
_Numeri che non tornano, salvataggi che non salvano, errori poco chiari._
- [ ]

---

## 📱 Mobile / schermi piccoli
- [ ]

---

## ❓ Features possibili

> **La lista numerata è stata scartata** (deciso il 21/08/2026). Era una checklist SEO per un **sito vetrina**: mappa e indicazioni, recensioni, foto del team, case study, sticky CTA, breadcrumb, schema locale, "promessa sui tempi di risposta". Rubric è un'app privata dietro login — Google non vedrà mai niente oltre accesso e registrazione, e non vendi un servizio locale. Applicarla sarebbe stato lavoro buttato.
>
> **Salvato e fatto:** ✅ pagina **404** vera (prima era una riga di testo centrata, senza una via d'uscita) · ✅ **titoli di pagina unici** (`document.title` non veniva mai aggiornato: la scheda diceva sempre "Rubric — Trading Journal" su tutte le pagine) · ✅ **robots.txt** (`Disallow: /`).
>
> **Salvato e non fatto:** ⬜ **pagina Privacy Policy** — serve davvero se in produzione raccogli email, ma il testo dipende da chi sei e da cosa dichiari, quindi lo scrivi tu · ⬜ **immagine di social share** (`og:image`) · ⬜ **alt sulle immagini** (gli screenshot ce l'hanno già) · ⬜ **analytics d'uso** — se li vuoi, per un'app così ha senso Plausible o Umami, non Google Analytics.

~~ci manca una feture dove implementiamo un servuzui email, per fare reimposta password, email di benvenuto, email di accesso.~~ ✅ **Fatto — era il vero blocco del deploy**

Nel backend non c'era **niente**: nessun invio, nessun endpoint di reset. Chi dimenticava la password non rientrava più, e la registrazione è aperta a chiunque.
- `IEmailSender` + **MailKit**. Con `Email:Enabled = false` (default) le email finiscono nel **log** invece che in rete — così si lavora senza SMTP a portata di mano. L'invio **non solleva mai**: una registrazione riuscita non deve diventare un errore perché la posta è giù.
- **Reset:** `PasswordResetToken` salva l'**hash** del token, mai il token. 32 byte da `RandomNumberGenerator` (non un GUID: comodo, e non imprevedibile per costruzione). Vale **una volta sola**, scade in un'ora, e chiederne uno nuovo chiude i precedenti.
- `POST /api/auth/forgot-password` risponde **200 anche per un indirizzo che non esiste** — altrimenti diventa un modo di scoprire chi è iscritto, provando indirizzi uno a uno.
- **Avviso di accesso** solo sugli accessi riusciti (avvisare dei falliti insegnerebbe che l'indirizzo esiste), spegnibile da configurazione (`NotifyOnLogin`): su un'app usata ogni giorno diventa rumore.
- FE: `/forgot-password`, `/reset-password?token=`, link dal login.
- Verificato end-to-end sul DB di sviluppo: benvenuto → link → password debole respinta → token inventato respinto → reset → riuso dello stesso token respinto → vecchia password 401 → nuova password OK.

⚠️ **Da fare tu prima del deploy:** scegliere il provider SMTP e riempire la sezione `Email` di `appsettings` (`Enabled: true`, host, porta, credenziali, `FromAddress`, e soprattutto **`AppBaseUrl` col dominio vero** — è la base dei link dentro le email).

---

## 🧭 Già sul tavolo (lo so io, non serve che lo riscrivi)
_Filoni aperti da chiudere o dichiarare "va bene così" prima del deploy._

- [x] 🔴 **Verifica visiva della #116** — otto tappe di redesign mai guardate schermata per schermata con un account reale. È il motivo per cui questo file esiste. → [[../08 - Learnings/Learnings]], branch `feature/AJ-116`
- [ ] 🔴 **PR della #116 su `develop`** — il branch è pushato ma non ancora in PR. I fix di questo file stanno su `feature/pre-deploy`, che parte da `feature/AJ-116`: vanno in PR **dopo** la #116, o insieme a lei.
- [ ] 🔴 **Prerequisiti del deploy sulla VM** — dominio, HTTPS/certificato, PostgreSQL di produzione, variabili d'ambiente (connection string, `Jwt:Key`), CORS con l'origin vero, migration applicate. → [[../05 - Deploy/Infrastructure]]
- [ ] 🟡 **Vulnerabilità npm** — `npm audit` del frontend mai azzerato.
- [ ] 🟡 **Vulnerabilità NuGet** — `Microsoft.OpenApi 2.4.1` ha un avviso di **gravità alta** (`NU1903`, GHSA-v5pm-xwqc-g5wc). Compare a ogni build del backend.
- [ ] 🟡 **`.gitattributes` mancante** — fine riga CRLF/LF non normalizzati nel repo.
- [ ] 🟡 **Dati demo nel DB** — i trade seminati per i test non devono finire in produzione.
- [ ] 🟡 **Registrazione aperta a chiunque** — decidere se in prod resta libera o va chiusa/limitata. Ora almeno chi si registra riceve un'email e può recuperare la password da solo.
- [ ] 🟡 **Rate limit su `/api/auth/*`** — login e `forgot-password` non hanno alcun freno: su un dominio pubblico è un invito a provare password in serie e a farsi spedire email a raffica.

---

## Link Correlati
- [[Da Discutere]] — inbox generale (non solo pre-deploy)
- [[Current Sprint]] · [[Backlog]]
- [[../05 - Deploy/Infrastructure]] — dove va scritto il *come* del deploy
- [[../🏠 Home]]
