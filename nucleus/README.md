# Nucleus - Server Management System

A complete server management system with user authentication, Proxmox integration, and test server creation capabilities.

## Architecture

The system consists of three main services:
- **Frontend**: Next.js application (port 3000)
- **Auth Service**: Go/Fiber authentication API (port 9872)
- **Prox Service**: Go/Fiber Proxmox management API (port 7790)

## Prerequisites

1. **Go** (version 1.21+)
2. **Node.js** (version 18+)
3. **MySQL Database**
4. **Environment Variables**

## Setup Instructions

### 1. Database Setup

Create a MySQL database and note the connection details. You'll need:
- Database host
- Database name
- Username and password

### 2. Environment Variables

Create `.env` files for each service:

**Auth Service** (`/auth-service/.env`):
```env
DSN=username:password@tcp(localhost:3306)/nucleus_auth?charset=utf8mb4&parseTime=True&loc=Local
JWT_SECRET=your-super-secret-jwt-key-here
```

**Prox Service** (`/prox-service/.env`):
```env
DSN=username:password@tcp(localhost:3306)/nucleus_prox?charset=utf8mb4&parseTime=True&loc=Local
JWT_SECRET=your-super-secret-jwt-key-here
```

**Note**: Use the same `JWT_SECRET` for both services!

### 3. Install Dependencies

**Frontend dependencies:**
```bash
cd /home/talfaza/dev/Nucleus/nucleus
npm install
```

**Go dependencies:**
```bash
# Auth Service
cd auth-service
go mod tidy

# Prox Service
cd ../prox-service
go mod tidy
```

## Running the Services

### Option 1: Run All Services Manually

**Terminal 1 - Auth Service:**
```bash
cd /home/talfaza/dev/Nucleus/nucleus/auth-service
go run main.go
```

**Terminal 2 - Prox Service:**
```bash
cd /home/talfaza/dev/Nucleus/nucleus/prox-service
go run main.go
```

**Terminal 3 - Frontend:**
```bash
cd /home/talfaza/dev/Nucleus/nucleus
npm run dev
```

### Option 2: Use the Startup Script

I'll create a startup script for easier management:

```bash
chmod +x scripts/start-all.sh
./scripts/start-all.sh
```

## Accessing the Application

1. **Frontend**: http://localhost:3000
2. **Auth API**: http://localhost:9872
3. **Prox API**: http://localhost:7790

## User Flow

1. **Registration/Login**: Go to http://localhost:3000/auth
2. **Create Test Servers**: http://localhost:3000/create-server
3. **Manage Servers**: http://localhost:3000/manage

## Features Implemented

### Authentication System
- ✅ User registration and login
- ✅ JWT-based authentication with HTTP-only cookies
- ✅ Protected routes on frontend and backend
- ✅ User session verification

### Prox Service Integration
- ✅ User-specific Proxmox server configurations
- ✅ Store user ID with each configuration
- ✅ Authenticated API endpoints
- ✅ Real-time data loading in frontend

### Frontend Protection
- ✅ AuthGuard component for route protection
- ✅ Automatic redirect to login if not authenticated
- ✅ Loading states during authentication verification
- ✅ Integration with Proxmox server management

### API Endpoints

**Auth Service (port 9872):**
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/logout` - User logout
- `GET /auth/verify` - Verify current user session
- `GET /auth/mailcheck` - Check if email exists

**Prox Service (port 7790):**
- `POST /prox` - Add new Proxmox configuration (authenticated)
- `GET /prox` - Get user's Proxmox configurations (authenticated)

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify MySQL is running
   - Check DSN in `.env` files
   - Ensure databases exist

2. **JWT Verification Failed**
   - Ensure same JWT_SECRET in both services
   - Clear browser cookies and re-login

3. **CORS Issues**
   - Frontend runs on port 3000
   - CORS is configured for localhost:3000

4. **Port Already in Use**
   - Check if services are already running
   - Kill existing processes: `lsof -ti:PORT | xargs kill`

### Debug Mode

Add debug logging by setting environment variable:
```bash
export DEBUG=true
```

## Development Notes

- Frontend uses Next.js 13+ with App Router
- Backend services use Go Fiber v3
- Database ORM: GORM
- Authentication: JWT with HTTP-only cookies
- Styling: Tailwind CSS with custom components
