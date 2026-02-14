# Frontend Authentication Updates - Backend Integration

## Changes Made

All frontend authentication logic has been updated to work with the **backend-2** httpOnly cookie authentication system.

### Key Update: httpOnly Cookies Instead of localStorage

Your backend uses **httpOnly cookies** (key: `token`) set by the `setAuthCookie()` function. The frontend has been updated to work seamlessly with this approach.

## Files Updated

### 1. [src/context/AuthContext.jsx](src/context/AuthContext.jsx)
**Major Change: Switched from localStorage to httpOnly cookies**

- Removed localStorage token management
- Added automatic authentication check via `/auth/me` endpoint on app load
- Uses `withCredentials: true` to automatically send/receive httpOnly cookies
- Returns `user` object to store user data
- `login()` function now just marks user as authenticated (backend handles cookies)
- `logout()` function calls `/auth/logout` endpoint to clear cookies

### 2. [src/pages/LoginPage.jsx](src/pages/LoginPage.jsx)
- Added `useAuth()` hook import
- Added `useNavigate()` hook import
- Fixed missing `await` on axios call
- Uses `withCredentials: true` when making login request
- Calls `login(null)` after successful login (backend cookie is automatic)
- Removed duplicate export statement (fixed error)

### 3. [src/pages/SignUpPage.jsx](src/pages/SignUpPage.jsx)
- Added `useAuth()` hook
- Added `withCredentials: true` to axios signup call
- Calls `login(null)` after successful signup
- Cleaned up console logs

### 4. [src/main.jsx](src/main.jsx)
- Added global axios configuration: `axios.defaults.withCredentials = true`
- This ensures **all** axios requests automatically send/receive httpOnly cookies
- Eliminates need to add `withCredentials: true` to every individual request

## How It Works Now

### Authentication Flow
1. **App loads** → AuthContext checks `/auth/me` endpoint
2. **User logs in** → Backend sets httpOnly cookie with JWT token
3. **Cookie sent automatically** → All subsequent requests include the cookie via `withCredentials: true`
4. **Protected routes** → Check authentication status and redirect if needed
5. **Page refresh** → AuthContext re-checks `/auth/me`, user stays logged in if cookie exists

### Backend Compatibility
✅ Works with `setAuthCookie()` function in backend
✅ Works with httpOnly cookie (key: `token`)
✅ Works with `/auth/me` endpoint for auth verification
✅ Works with `/auth/logout` endpoint for cookie clearing
✅ Works with Google OAuth (backend redirects after setting cookie)

## Security Advantages of httpOnly Cookies

- ✅ **XSS Protection**: JavaScript cannot access httpOnly cookies
- ✅ **CSRF Protection**: Browser automatically sends cookies with requests
- ✅ **Auto Refresh**: No token expiration issues on frontend
- ✅ **Server Control**: Backend controls all token/cookie logic

## Important: CORS Configuration

Make sure your backend has proper CORS configuration:

```javascript
// In your backend app.js or similar
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:5173', // Your frontend URL
  credentials: true // REQUIRED for cookies
}));
```

If CORS is not configured with `credentials: true`, cookies won't be sent/received.

## Testing the Authentication

1. Start backend: `npm run dev` (from backend-2 folder)
2. Start frontend: `npm run dev` (from frontend folder)
3. Navigate to homepage
4. Click "Aarambikalaama" button → Should go to login page
5. Sign up with email/password
6. Check browser DevTools → Application → Cookies → Should see `token` cookie
7. Refresh page → Should stay logged in (AuthContext checks `/auth/me`)
8. Log out → Cookie should be cleared

## No Changes Needed in MovieguessPage

The MovieguessPage and other protected routes automatically work because:
- `ProtectedRoute` component checks `isAuthenticated` from AuthContext
- AuthContext syncs with backend via `/auth/me` endpoint
- httpOnly cookies are automatically sent with all requests
