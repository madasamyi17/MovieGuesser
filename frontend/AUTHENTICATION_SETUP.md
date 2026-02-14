# Authentication System Setup - Summary

## Overview
A complete authentication system has been implemented with route protection, global auth state management, and conditional navigation based on user login status.

## Files Created

### 1. [src/context/AuthContext.jsx](src/context/AuthContext.jsx)
Global authentication context that manages:
- **`isAuthenticated`**: Boolean state for login status
- **`loading`**: Loading state during auth check
- **`login(token)`**: Function to save token and mark user as authenticated
- **`logout()`**: Function to clear token and log out user
- **`getToken()`**: Function to retrieve stored token
- Automatically checks localStorage for existing token on app load

### 2. [src/components/ProtectedRoute.jsx](src/components/ProtectedRoute.jsx)
Route wrapper component that:
- Checks if user is authenticated
- Redirects unauthenticated users to `/login`
- Shows loading state while checking auth
- Wraps protected pages (MovieGuessPage, LeaderboardPage)

## Files Updated

### 3. [src/App.jsx](src/App.jsx)
- Wrapped app with `<AuthProvider>` to provide global auth context
- Protected `/movieguess` and `/leaderboard` routes with `<ProtectedRoute>`
- Unprotected routes: `/`, `/login`, `/signup`, `/instructions`, `/readname`

### 4. [src/pages/Homepage.jsx](src/pages/Homepage.jsx)
- Added `useAuth()` hook to check authentication status
- Button now conditionally navigates:
  - **If logged in**: Goes to `/movieguess`
  - **If not logged in**: Goes to `/login`

### 5. [src/pages/LoginPage.jsx](src/pages/LoginPage.jsx)
- Added `useAuth()` and `useNavigate()` hooks
- On successful login:
  - Saves token via `login()` function
  - Navigates to `/movieguess`
- Fixed async/await syntax for axios call

### 6. [src/pages/SignUpPage.jsx](src/pages/SignUpPage.jsx)
- Added `useAuth()` hook
- On successful signup:
  - Saves token via `login()` function
  - Navigates to `/movieguess`

## How It Works

### User Flow
1. **First Visit**: User lands on homepage
2. **Click Button on Homepage**:
   - If has valid token → Goes to movie guess page
   - If no token → Goes to login page
3. **Login/Signup**:
   - Token is saved to localStorage
   - User is marked as authenticated
   - Redirects to movie guess page
4. **Access Protected Routes**:
   - Only authenticated users can access `/movieguess` and `/leaderboard`
   - Unauthenticated users are automatically redirected to `/login`
5. **Page Refresh**:
   - Auth context checks localStorage for token
   - User remains logged in if token exists

## Token Storage
- Tokens are stored in `localStorage` with key `"authToken"`
- Alternative: If your backend uses cookies, you can store a simple `"authenticated"` flag
- Modify `login()` function in AuthContext.jsx if using cookies instead

## Usage in Components
```jsx
import { useAuth } from "../context/AuthContext";

function MyComponent() {
  const { isAuthenticated, login, logout, getToken } = useAuth();
  
  // Use these in your component
}
```

## Security Notes
- Tokens are currently stored in localStorage (suitable for non-sensitive apps)
- For production, consider using secure httpOnly cookies if supported by backend
- Always validate tokens on the backend before granting access
- Implement token refresh logic if tokens expire
