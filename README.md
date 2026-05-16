# APEX — Trading Journal

Personal trading journal with analytics. Built with React + TypeScript (frontend) and C# Clean Architecture + ASP.NET Core (backend).

## Stack

| Layer      | Technology                     |
|------------|--------------------------------|
| Frontend   | React + TypeScript + Vite      |
| Styling    | Tailwind CSS                   |
| State      | Zustand                        |
| API calls  | TanStack Query                 |
| Backend    | C# ASP.NET Core                |
| Arch.      | Clean Architecture             |
| Database   | PostgreSQL                     |
| ORM        | Entity Framework Core          |

## Getting started

### 1. Start the database
```bash
docker-compose up -d
```

### 2. Run the backend
```bash
cd backend
dotnet restore
dotnet run --project src/Apex.API
```

### 3. Run the frontend
```bash
cd frontend
npm install
npm run dev
```

## Structure

```
apex-trading-journal/
├── frontend/        # React + TypeScript
├── backend/         # C# Clean Architecture
├── docker-compose.yml
└── README.md
```
