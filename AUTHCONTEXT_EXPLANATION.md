# How AuthContext Works with Cookies

## Overview
The AuthContext **does NOT directly access cookies**. Instead, it uses the backend's `/auth/me` endpoint to verify authentication. The browser automatically sends cookies with the request via `withCredentials: true`.

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          USER BROWSER                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Frontend (React/AuthContext)                     │  │
│  │                                                          │  │
│  │  • isAuthenticated (state)                             │  │
│  │  • loading (state)                                     │  │
│  │  • user (state)                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          ▲                                      │
│                          │                                      │
│                    axios.get()                                 │
│        withCredentials: true ←─── Sends cookies auto          │
│                    (on app load)                               │
│                          │                                      │
│                          ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          Browser Cookies (httpOnly)                      │  │
│  │  • token: "eyJhbGc...jwt...token..."                    │  │
│  │  (Set by backend during login/signup)                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                          │                                      │
└──────────────────────────┼──────────────────────────────────────┘
                           │
        ┌──────────────────┴──────────────────┐
        │                                     │
        ▼                                     ▼
┌──────────────────────┐          ┌──────────────────────┐
│   BACKEND SERVER     │          │   GOOGLE OAUTH       │
│   (localhost:3000)   │          │   (Google's servers) │
├──────────────────────┤          └──────────────────────┘
│                      │
│ POST /auth/login     │ ← Email/Password login
│ ↓                    │
│ Check credentials    │
│ ↓                    │
│ setAuthCookie()      │ ← Sets httpOnly cookie
│ ↓                    │
│ Return 200 OK        │
│                      │
├──────────────────────┤
│                      │
│ GET /auth/me         │ ← Frontend checks auth status
│ (with cookie)        │
│ ↓                    │
│ Verify JWT in cookie │
│ ↓                    │
│ Return user data     │
│                      │
└──────────────────────┘
```

## Step-by-Step: How Token is Retrieved

### 1. **App Loads** → AuthContext's useEffect runs

```jsx
useEffect(() => {
  const checkAuth = async () => {
    // Called once when app mounts
  };
  checkAuth();
}, []); // Empty dependency array = runs once on mount
```

### 2. **Frontend Makes Request to `/auth/me`**

```jsx
const response = await axios.get(
  "http://localhost:3000/auth/me",
  {
    withCredentials: true, // IMPORTANT: This tells axios to send cookies
  }
);
```

**What happens:**
- Browser automatically includes the `token` cookie in the request
- Developer doesn't need to manually add the token - it's automatic!
- Cookie is httpOnly, so JavaScript can't access it (security feature)

### 3. **Backend Receives Request with Cookie**

```javascript
// Backend middleware/auth.middleware.js
exports.authMiddleware = (req, res, next) => {
    const token = req.cookies?.token;  // ← Extracts token from cookie
    
    try {
        const decoded = jwt.verify(token, "SECRET-KEY-ME");
        req.user = decoded;
        next();
    } catch(error) {
        return res.status(401).json({ message: "Invalid token" });
    }
};
```

### 4. **Backend Sends User Data Back**

```javascript
// Backend auth.controller.js
exports.me = async (req, res) => {
    const user_id = req.user.user_id; // From decoded JWT
    
    const [users] = await pool.query(
        'SELECT id, name, email FROM users WHERE id = ?',
        [user_id]
    );
    
    return res.status(200).json({ user: users[0] });
};
```

### 5. **Frontend Updates State**

```jsx
if (response.status === 200) {
    setIsAuthenticated(true);  // User is authenticated!
    setUser(response.data.user); // Store user data
}
```

## Key Points

### ✅ How Cookies are Passed

| Step | What Happens |
|------|-------------|
| **User logs in** | Backend sets httpOnly cookie with `setAuthCookie(res, token)` |
| **Cookie storage** | Browser stores cookie automatically (httpOnly prevents JS access) |
| **Frontend request** | `withCredentials: true` tells axios to include cookies |
| **Browser behavior** | Browser automatically sends cookie with any request to same domain |
| **Backend receives** | `req.cookies.token` contains the token |
| **Verification** | JWT is decoded and verified against SECRET-KEY |
| **Response** | User data is sent back if token is valid |

### 🔐 Security Features

1. **httpOnly Cookie**: JavaScript cannot access `document.cookie.token`
   - Prevents XSS attacks from stealing token

2. **Secure Flag**: Cookie only sent over HTTPS in production
   - Prevents man-in-the-middle attacks

3. **SameSite=strict**: Cookie only sent to same site
   - Prevents CSRF attacks

4. **JWT Expiration**: Token expires after 2 hours
   - Limits damage if token is leaked

### 📊 AuthContext State Management

```
┌─────────────────────────────────────┐
│        AuthContext States            │
├─────────────────────────────────────┤
│ loading: true                        │
│ ↓ (after checkAuth completes)       │
│ loading: false                       │
│                                     │
│ isAuthenticated: false (if no cookie)│
│ isAuthenticated: true  (if valid JWT)│
│                                     │
│ user: null (if not authenticated)   │
│ user: { id, name, email } (if auth) │
└─────────────────────────────────────┘
```

## Complete Flow: Login → Redirect → Auth Check

```
1. User enters email/password on LoginPage
   ↓
2. handleLogin() sends POST /auth/login with credentials
   ↓
3. Backend verifies password, creates JWT, calls setAuthCookie()
   ↓
4. setAuthCookie() sets httpOnly cookie named "token"
   ↓
5. Frontend calls login(null) to update state
   ↓
6. Frontend navigates to /movieguess
   ↓
7. App loads, AuthContext's useEffect runs
   ↓
8. axios.get(/auth/me, { withCredentials: true })
   ↓
9. Browser automatically includes "token" cookie in request
   ↓
10. Backend's authMiddleware extracts token from req.cookies.token
   ↓
11. JWT is verified with SECRET-KEY
   ↓
12. User data is returned (user ID, email, name)
   ↓
13. AuthContext sets isAuthenticated=true, user={...}
   ↓
14. ProtectedRoute checks isAuthenticated and allows access
   ↓
15. MovieGuessPage renders ✓
```

## Debugging: Where's My Token?

### Check 1: Is Cookie Being Set?
```
DevTools → Application → Cookies → localhost:3000
Look for: "token" cookie with JWT value
```

### Check 2: Is Cookie Being Sent?
```
DevTools → Network → Find /auth/me request
Click it → Cookies tab
Check "Request Cookies" includes "token"
```

### Check 3: Is Backend Receiving It?
```
// Add logging in auth.middleware.js
const token = req.cookies?.token;
console.log("Token received:", token); // Should show JWT
```

### Check 4: Is JWT Valid?
```
// Add logging in auth middleware
try {
    const decoded = jwt.verify(token, "SECRET-KEY-ME");
    console.log("Decoded JWT:", decoded); // Should show { user_id, email }
} catch(error) {
    console.log("JWT verification failed:", error.message);
}
```

## Summary

- **Frontend doesn't read cookies directly** - it asks the backend
- **`withCredentials: true`** = "include cookies with this request"
- **Browser handles cookies automatically** - you don't see them in JS
- **Backend verifies JWT** from the cookie
- **AuthContext stores the response** (user data) in React state
- **ProtectedRoute uses state** to decide if user can access page

This is a **stateless authentication system**:
- Frontend sends no state
- Backend uses JWT in cookie to verify
- No session storage needed
- Scales well across multiple servers
