# Service — ManageTokenService

tags: #service #backend #domain #auth #jwt

> **Layer:** [[../Components#1.2 Services Apex.DomainServices|Domain / Services]] · **File:** `Apex.Domain/Services/ManageTokenService.cs` · **Interfaccia:** `IManageTokenService`
> Indice servizi: [[Services|🗂 Service Map]] · Architettura: [[../Components]] · [[../Overview]]

---

## Responsabilità
Emettere il **JWT** a partire da uno `UserDto`: costruisce i claims, firma HMAC-SHA256 e restituisce un `AccessToken` (token + scadenza). Unico punto che conosce i dettagli del token.

## API pubblica (`IManageTokenService`)
```csharp
Task<Result<AccessToken>> GenerateTokenAsync(UserDto user, CancellationToken ct);
```

## Logica chiave — claims & firma
```
Claims: NameIdentifier = userId · Email · GivenName (name)
Firma:  SymmetricSecurityKey(JwtSettings.Secret) + HmacSha256
Issuer/Audience: da JwtSettings
```
Lo stesso `JwtSettings.Secret/Issuer/Audience` è usato dal middleware JWT in `Program.cs` per **validare** il token in arrivo → il claim `NameIdentifier` diventa lo `userId` letto da [[TradeService]] e [[StatsService]].

## Dipendenze (uscenti)
| Dipende da | Tipo | Uso |
|-----------|------|-----|
| `JwtSettings` | config (singleton) | Secret, Issuer, Audience |
| `System.IdentityModel.Tokens.Jwt` | libreria | costruzione/serializzazione token |

> ℹ️ Consuma `JwtSettings` **direttamente** (registrato come singleton in `Program.cs`), non via `IOptions`.

## Usato da (entranti)
- **`AuthController`** (solo nel `Login`) — vedi orchestrazione in [[AuthService#Connessioni con altri service]].

## Connessioni con altri service
- **[[AuthService]]** — a valle: riceve lo `UserDto` validato da AuthService (composizione nel controller, no DI diretta).
- **[[TradeService]]** / **[[StatsService]]** — a monte logico: il token qui emesso è ciò che, validato dal middleware, fornisce lo `userId` ai service `[Authorize]`.

## ⚠️ Rischi
- **Scadenza incoerente**: usa `DateTime.UtcNow.AddMinutes(30)` **hardcoded** e ignora `JwtSettings.ExpiryDays (7)`. Da allineare. Vedi [[../../03 - API/Auth API#JWT Token]] e [[../Components#5. ⚠️ Rischi & debito architetturale]].

## Link Correlati
- [[../../03 - API/Auth API]] · [[AuthService]] · [[TradeService]] · [[../Components]]
