# Service — AuthService

tags: #service #backend #domain #auth

> **Layer:** [[../Components#1.2 Services Apex.DomainServices|Domain / Services]] · **File:** `Apex.Domain/Services/AuthService.cs` · **Interfaccia:** `IAuthService`
> Indice servizi: [[Services|🗂 Service Map]] · Architettura: [[../Components]] · [[../Overview]]

---

## Responsabilità
Gestione credenziali: **registrazione** (con unicità email + hash BCrypt) e **validazione login**. Ritorna **solo `UserDto`** — non genera token né conosce JWT (separazione voluta, vedi connessioni).

## API pubblica (`IAuthService`)
```csharp
Task<Result<UserDto>> RegisterAsync(RegisterRequest request, CancellationToken ct);
Task<Result<UserDto>> LoginAsync(string email, string password, CancellationToken ct);
```

## Logica chiave
- **Register**: se email già presente → `AuthErrors.EmailAlreadyRegistered`; altrimenti `BCrypt.HashPassword` → crea `User` (no auto-login, nessun token).
- **Login**: cerca per email, verifica con `BCrypt.Verify`; credenziali errate → `AuthErrors.InvalidCredentials` (stesso errore per email inesistente o password sbagliata → no user enumeration).

## Dipendenze (uscenti)
| Dipende da | Tipo | Uso |
|-----------|------|-----|
| `IUserRepository` | repository | `GetByEmailAsync`, `CreateUserAsync` |
| `IMapper` (AutoMapper) | mapping | `User` → `UserDto` |
| `BCrypt.Net` | libreria | hash/verify password |

## Usato da (entranti)
- **`AuthController`** → HTTP: [[../../03 - API/Auth API]]
- Lato FE: `authService` → scrive in [[../../04 - Frontend/State#authStore srcstoreauthstorets|authStore]]

## Connessioni con altri service
- **[[ManageTokenService]]** — **collaborazione orchestrata dal controller**, non DI diretta: in `Login` l'`AuthController` prima chiama `AuthService.LoginAsync` (valida) → poi passa lo `UserDto` a `ManageTokenService.GenerateTokenAsync` per emettere il JWT. AuthService resta ignaro dei token.
  ```
  AuthController.Login → AuthService.LoginAsync → UserDto
                       → ManageTokenService.GenerateTokenAsync(UserDto) → AuthResponse
  ```
- Indirettamente abilita tutti i service `[Authorize]` ([[TradeService]], [[StatsService]]) perché produce l'utente di cui viene poi firmato il `userId`.

## Link Correlati
- [[../../03 - API/Auth API]] · [[ManageTokenService]] · [[../../04 - Frontend/State]] · [[../Components]]
