# API — Auth

tags: #api #auth #jwt

Base path: `/api/auth`  
Autenticazione: **nessuna** (endpoint pubblici)

---

## POST /api/auth/register

Registra un nuovo utente.

**Request body:**
```json
{
  "name": "Ahmed",
  "email": "ahmed@example.com",
  "password": "minimo6caratteri"
}
```

**Response 200** — ⚠️ **niente token**: l'utente deve poi fare login.
```json
{
  "message": "Registrazione completata. Effettua il login per continuare.",
  "userId": "uuid-...",
  "email": "ahmed@example.com"
}
```

**Errori:**
- `400` — Email già registrata
- `400` — Validazione fallita (FluentValidation)

**Cosa fa internamente:**
1. Verifica che `email` non esista già (IUserRepository.GetByEmailAsync)
2. Hash della password con `BCrypt.Net.BCrypt.HashPassword`
3. Salva `User` nel DB
4. Ritorna `Result<UserDto>` (**no token**) → il controller risponde col messaggio
> (Futuro: email di conferma alla registrazione.)

---

## POST /api/auth/login

Autentica un utente esistente.

**Request body:**
```json
{
  "email": "ahmed@example.com",
  "password": "latuapassword"
}
```

**Response 200:**
```json
{
  "userId": "uuid-...",
  "name": "Ahmed",
  "email": "ahmed@example.com",
  "token": "eyJhbGci...",
  "expirationDate": "2026-06-08T20:08:20Z"
}
```

**Errori:**
- `401` — Credenziali non valide
- `400` — Validazione fallita

**Cosa fa internamente:**
1. `AuthService.LoginAsync(email, password)` valida le credenziali e ritorna `Result<UserDto>` (**solo DTO**, niente token nel service)
2. Verifica password con `BCrypt.Net.BCrypt.Verify`
3. Il **controller** genera il token via `IManageTokenService.GenerateTokenAsync(userDto)` e assembla l'`AuthResponse`

---

## JWT Token

```json
// JwtSettings (appsettings.json)
{
  "Secret": "chiave-minimo-32-caratteri",
  "Issuer": "apex-api",
  "Audience": "apex-client",
  "ExpiryDays": 7
}
```

Il token contiene i claims:
- `NameIdentifier` = userId (UUID)
- `Email` = email utente
- `Name` = nome utente

**Scadenza:** ⚠️ **30 minuti** — `ManageTokenService` usa `AddMinutes(30)` hardcoded e **ignora `JwtSettings.ExpiryDays` (7)**: incongruenza da sistemare.  
**Generazione:** estratta in `ManageTokenService` (`IManageTokenService`), chiamato dal controller.  
**Uso:** Header `Authorization: Bearer <token>` — `Trade` e `Stats` sono `[Authorize]`, lo `userId` viene dal claim (#52).

---

## Frontend — Flow Auth

```typescript
// REGISTER → niente auto-login
await authService.register({ name, email, password })
navigate('/login', { state: { registered: true } })  // LoginPage mostra un banner

// LOGIN
const res = await authService.login({ email, password })
useAuthStore.getState().setAuth(res.token, res.userId, res.name, res.email)
navigate('/')
```

Il token viene aggiunto automaticamente a ogni richiesta Axios dall'`apiClient` (request interceptor).  
Se la risposta è `401`, il `apiClient` chiama `clearAuth()` e redirige al login.

---

## Link Correlati
- [[../01 - Architecture/Services/AuthService]] — service di registrazione/login
- [[../01 - Architecture/Services/ManageTokenService]] — emissione del JWT
- [[../04 - Frontend/State]] — authStore Zustand
- [[Trade API]] — endpoint protetti che richiedono JWT
- [[../02 - Database/Schema#USERS]] — tabella utenti
