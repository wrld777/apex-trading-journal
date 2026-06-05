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

**Response 200:**
```json
{
  "userId": "uuid-...",
  "name": "Ahmed",
  "email": "ahmed@example.com",
  "token": "eyJhbGci..."
}
```

**Errori:**
- `400` — Email già registrata
- `400` — Validazione fallita (FluentValidation)

**Cosa fa internamente:**
1. Verifica che `email` non esista già (IUserRepository.GetByEmailAsync)
2. Hash della password con `BCrypt.Net.BCrypt.HashPassword`
3. Salva `User` nel DB
4. Genera JWT con claims: `NameIdentifier`, `Email`, `Name`
5. Ritorna `AuthResponse`

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
  "token": "eyJhbGci..."
}
```

**Errori:**
- `401` — Credenziali non valide
- `400` — Validazione fallita

**Cosa fa internamente:**
1. Trova utente per email
2. Verifica password con `BCrypt.Net.BCrypt.Verify`
3. Se valida → genera JWT token
4. Ritorna `AuthResponse`

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

**Scadenza:** 7 giorni  
**Uso:** Header `Authorization: Bearer <token>` su tutte le chiamate protette

---

## Frontend — Flow Auth

```typescript
// 1. Login
const res = await authService.login({ email, password })
// 2. Salva in Zustand + localStorage
useAuthStore.getState().setAuth(res.token, res.userId, res.name, res.email)
// 3. Navigate to /
```

Il token viene aggiunto automaticamente a ogni richiesta Axios dall'`apiClient` (request interceptor).  
Se la risposta è `401`, il `apiClient` chiama `clearAuth()` e redirige al login.

---

## Link Correlati
- [[../04 - Frontend/State]] — authStore Zustand
- [[Trade API]] — endpoint protetti che richiedono JWT
- [[../02 - Database/Schema#USERS]] — tabella utenti
