# JWT Authentication System - 2026 Security Best Practices

## Overview

This document describes the complete JWT authentication system implemented for this YouTube clone project, following 2026 security best practices.

## Architecture

### Dual Token System

1. **Access Token** (Short-lived: 15 minutes)
   - Contains user info (userId, email, username, role)
   - Used for authenticating API requests
   - Stored in httpOnly cookie
   - Signed with HS256 using `JWT_ACCESS_SECRET_KEY`

2. **Refresh Token** (Long-lived: 7 days)
   - Contains only user ID + random component
   - Used to obtain new access tokens
   - Stored in httpOnly cookie AND database (hashed with SHA-256)
   - Signed with HS256 using `JWT_REFRESH_SECRET_KEY`

### Security Features

#### 1. Token Rotation
- Every time a refresh token is used, a NEW refresh token is issued
- The old refresh token is immediately marked as "used" in the database
- This limits the window of vulnerability if a token is stolen

#### 2. Token Reuse Detection
- If a "used" or "revoked" refresh token is presented, this indicates potential theft
- **Response**: ALL tokens for that user are immediately invalidated
- User must re-login on all devices
- Security event is logged

#### 3. httpOnly Cookies
- Tokens are stored ONLY in httpOnly cookies
- JavaScript cannot access these cookies (XSS protection)
- Cookies are automatically sent with requests
- No tokens in localStorage or sessionStorage

#### 4. Rate Limiting
- Login: 5 attempts per 15 minutes (per IP + username)
- Refresh: 30 attempts per 15 minutes (per IP)
- General API: 100 requests per 15 minutes (per IP)
- Account lockout after 5 failed login attempts (15 minutes)

#### 5. Account Security
- Password hashed with bcrypt (cost factor 12)
- Account status tracking (active, suspended, banned)
- Failed login attempt tracking
- Password change invalidates all tokens

## API Endpoints

### Authentication Routes (`/auth/*`)

| Method | Endpoint | Description | Rate Limit |
|--------|----------|-------------|------------|
| POST | `/auth/login` | Login with username/password | 5/15min |
| POST | `/auth/refresh` | Refresh access token | 30/15min |
| POST | `/auth/logout` | Logout current session | - |
| POST | `/auth/logout-all` | Logout all devices | 100/15min |
| GET | `/auth/me` | Get current user info | 100/15min |
| GET | `/auth/sessions` | List active sessions | 100/15min |
| DELETE | `/auth/sessions/:id` | Revoke specific session | 100/15min |

### Request/Response Examples

#### Login
```javascript
// Request
POST /auth/login
Content-Type: application/json

{
  "username": "john_doe",  // or "email": "john@example.com"
  "password": "SecurePassword123"
}

// Response (200 OK)
// Cookies: AccessToken, RefreshToken (httpOnly)
{
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "...",
      "username": "john_doe",
      "email": "john@example.com",
      "fullname": "John Doe",
      "role": "user"
      // ... other safe user fields
    }
  },
  "success": true
}
```

#### Refresh Token
```javascript
// Request
POST /auth/refresh
// Cookies: RefreshToken (sent automatically)

// Response (200 OK)
// Cookies: New AccessToken, New RefreshToken (httpOnly)
{
  "statusCode": 200,
  "message": "Token refreshed successfully",
  "data": {
    "user": { /* user info */ }
  },
  "success": true
}
```

#### Logout
```javascript
// Request
POST /auth/logout
// Cookies: RefreshToken (sent automatically)

// Response (200 OK)
// Cookies: Cleared
{
  "statusCode": 200,
  "message": "Logged out successfully",
  "data": null,
  "success": true
}
```

## Database Models

### RefreshToken Model
```javascript
{
  userId: ObjectId,        // Reference to User
  tokenHash: String,       // SHA-256 hash of token
  tokenFamily: String,     // Rotation tracking
  expiresAt: Date,        // Expiration timestamp
  isRevoked: Boolean,     // Manual revocation
  isUsed: Boolean,        // Used for rotation
  userAgent: String,      // Audit trail
  ipAddress: String,      // Audit trail
  createdAt: Date
}
```

### User Model Updates
```javascript
{
  // ... existing fields
  role: String,                    // "user", "creator", "moderator", "admin"
  accountStatus: String,           // "active", "suspended", "banned"
  failedLoginAttempts: Number,     // For account lockout
  lockoutUntil: Date,             // Lockout expiration
  lastLoginAt: Date,              // Audit trail
  passwordChangedAt: Date         // Token invalidation
}
```

## Frontend Implementation

### AuthContext

The `AuthContext` provides:
- `user`: Current authenticated user (null if not authenticated)
- `loading`: Initial auth check in progress
- `isAuthenticated`: Boolean flag
- `login(username, password)`: Login function
- `logout()`: Logout function
- `checkAuth()`: Verify session

### Protected Routes

Use `<PrivateRoute>` to protect routes:
```jsx
<Route 
  path="/dashboard" 
  element={
    <PrivateRoute>
      <Dashboard />
    </PrivateRoute>
  } 
/>
```

### Automatic Token Refresh

The axios interceptor automatically:
1. Detects 401 responses
2. Calls `/auth/refresh`
3. Retries the original request
4. Redirects to login if refresh fails

## Environment Variables

### Backend (.env)
```env
NODE_ENV=production
JWT_ACCESS_SECRET_KEY=<64+ char random string>
JWT_REFRESH_SECRET_KEY=<64+ char random string>
ACCESS_TOKEN_EXPIRES=15m
REFRESH_TOKEN_EXPIRES=7d
REFRESH_TOKEN_EXPIRES_DAYS=7
FRONTEND_URL=https://your-frontend.com
```

### Frontend (.env)
```env
VITE_BACKEND_URL=https://your-backend.com
```

## Security Checklist

### Production Deployment
- [ ] Use HTTPS only (required for secure cookies)
- [ ] Set `NODE_ENV=production`
- [ ] Use unique, random secrets (64+ characters)
- [ ] Access and refresh token secrets are DIFFERENT
- [ ] CORS allows only your frontend domain
- [ ] Rate limiting is enabled
- [ ] MongoDB uses SSL/TLS
- [ ] All console.log statements removed in production

### Code Security
- [ ] Never log tokens
- [ ] Never return tokens in response body (only cookies)
- [ ] Input sanitization on all endpoints
- [ ] Proper error messages (don't leak info)
- [ ] RBAC for sensitive operations

## Flow Diagrams

### Login Flow
```
User                    Frontend              Backend                  Database
  |                         |                     |                        |
  |--Enter credentials----->|                     |                        |
  |                         |--POST /auth/login-->|                        |
  |                         |                     |--Verify credentials--->|
  |                         |                     |<--User data------------|
  |                         |                     |--Store refresh token-->|
  |                         |<--Set cookies-------|                        |
  |                         |   + user info       |                        |
  |<--Show dashboard--------|                     |                        |
```

### Token Refresh Flow
```
Frontend                    Backend                         Database
  |                            |                                |
  |--401 on API call---------->|                                |
  |<--401 Unauthorized---------|                                |
  |                            |                                |
  |--POST /auth/refresh------->|                                |
  |   (RefreshToken cookie)    |--Find token by hash----------->|
  |                            |<--Token doc + user-------------|
  |                            |--Mark token as used----------->|
  |                            |--Store new refresh token------>|
  |<--New cookies + user-------|                                |
  |                            |                                |
  |--Retry original request--->|                                |
```

### Token Reuse Detection
```
Attacker                   Backend                          Database
  |                            |                                |
  |--Present stolen token----->|                                |
  |                            |--Check if token used---------->|
  |                            |<--Token already used!----------|
  |                            |                                |
  |                            |--REVOKE ALL USER TOKENS------->|
  |                            |--Log security event----------->|
  |<--401 + Force re-login-----|                                |
```

## Troubleshooting

### Common Issues

1. **Cookies not being set**
   - Ensure `withCredentials: true` in axios
   - Check CORS `credentials: true`
   - Verify `sameSite` and `secure` settings match environment

2. **Token refresh loop**
   - Check if refresh token cookie is being sent
   - Verify refresh endpoint isn't returning 401

3. **CORS errors**
   - Frontend URL must be in CORS allowed origins
   - Both `credentials` settings must be true

4. **Rate limit hit**
   - Wait 15 minutes or contact admin
   - Check for automated scripts making requests

## Migration from Old System

If you were using localStorage for tokens:
1. Old tokens will not work with new system
2. Users will need to login again
3. Clear localStorage tokens on logout
4. Update all API calls to not send Authorization header

The new system handles everything via cookies automatically!
