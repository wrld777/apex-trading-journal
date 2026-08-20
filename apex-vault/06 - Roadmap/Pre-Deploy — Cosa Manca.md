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
- mancano le performance mensili in percentuale o in dollari scambiabile.

### Strategy Insights
- in realta non so penso che ci siamo se hai qualche dato importante che puo aiutarmi nel improvmeent implementa.

### Trade Log
-  non posso modificare tutte le info tipo lottaggi ecc serve se ho sbagliao che faccio cancello tutto?


---

## 🎨 Grafica e identità
_Colori, spaziature, font, logo, nome, icone, cose che "sembrano fuori posto"._
- manca una pagina dove posso aprire i trade e vederli tipo, io adesso se voglio vedere un vecchio trade regoistrato devo fare modifica dal trade log.

---

## 🐛 Comportamenti sbagliati
_Numeri che non tornano, salvataggi che non salvano, errori poco chiari._
- [ ]

---

## 📱 Mobile / schermi piccoli
- [ ]

---

## ❓ Features possibili

1. custom 404 page 11. unique page titles
2. CTA above the fold 12, meta descriptions
3. internal links
4. social share img
5. thank you page
6. maps + directions
7. breadcrumbs
8. real reviews
9. case studies
10. alt txt on images
	7.5 FAQ'S
11. local schema
12. response time promise 18. PP page
13. sticky mobile CTA 19. google analytics
14. robots.txt
15. team photo

ci manca una feture dove implementiamo un servuzui email, per fare reimposta password, email di benvenuto, email di accesso.

---

## 🧭 Già sul tavolo (lo so io, non serve che lo riscrivi)
_Filoni aperti da chiudere o dichiarare "va bene così" prima del deploy._

- [x] 🔴 **Verifica visiva della #116** — otto tappe di redesign mai guardate schermata per schermata con un account reale. È il motivo per cui questo file esiste. → [[../08 - Learnings/Learnings]], branch `feature/AJ-116`
- [ ] 🔴 **PR della #116 su `develop`** — il branch è pushato ma non ancora in PR.
- [ ] 🔴 **Prerequisiti del deploy sulla VM** — dominio, HTTPS/certificato, PostgreSQL di produzione, variabili d'ambiente (connection string, `Jwt:Key`), CORS con l'origin vero, migration applicate. → [[../05 - Deploy/Infrastructure]]
- [ ] 🟡 **Vulnerabilità npm** — `npm audit` del frontend mai azzerato.
- [ ] 🟡 **`.gitattributes` mancante** — fine riga CRLF/LF non normalizzati nel repo.
- [ ] 🟡 **Dati demo nel DB** — i trade seminati per i test non devono finire in produzione.
- [ ] 🟡 **Registrazione aperta a chiunque** — decidere se in prod resta libera o va chiusa/limitata.

---

## Link Correlati
- [[Da Discutere]] — inbox generale (non solo pre-deploy)
- [[Current Sprint]] · [[Backlog]]
- [[../05 - Deploy/Infrastructure]] — dove va scritto il *come* del deploy
- [[../🏠 Home]]
