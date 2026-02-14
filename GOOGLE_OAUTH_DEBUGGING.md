# Google OAuth Debugging Guide

## Issues Fixed

### 1. **Backend Google Callback Error Handling**
- Added proper connection cleanup in error cases
- Added validation for authorization code
- Changed error response to redirect (instead of JSON) so users see meaningful feedback
- Improved error logging

### 2. **Frontend Error Handling**
- LoginPage now displays Google auth errors from URL parameter
- AuthContext handles `?error=auth_failed` query param
- Both LoginPage and SignUpPage have better error feedback

## Testing Google OAuth

### Prerequisites
1. **Backend running**: `npm run dev` (from backend-2 folder)
2. **Frontend running**: `npm run dev` (from frontend folder)
3. **Google OAuth credentials configured**: 
   - Client ID: `265094258473-dk4rqre1u96car0d8effb4aoims7rhgc.apps.googleusercontent.com`
   - Redirect URI: `http://localhost:3000/auth/google/callback`

### Test Steps

1. **From LoginPage:**
   - Click "Sign in with Google" button
   - You'll be redirected to Google login
   - After authorizing, should redirect to `/movieguess?auth=success`
   - AuthContext checks `/auth/me` and verifies authentication

2. **From SignUpPage:**
   - Click "Sign up with Google" button
   - Same flow as login
   - New users are created automatically

### Debugging Checklist

- [ ] **Check Browser Console** (DevTools → Console)
  - Look for "Google login clicked - redirecting to backend"
  - Look for any network errors

- [ ] **Check Network Tab** (DevTools → Network)
  - First request should be to `http://localhost:3000/auth/google`
  - Should redirect to Google
  - After auth, callback to `http://localhost:3000/auth/google/callback`
  - Should then redirect to `http://localhost:5173/movieguess?auth=success`

- [ ] **Check Backend Console**
  - Look for token response from Google
  - Look for "Google user info" log
  - Check for any database errors

- [ ] **Check Application Cookies** (DevTools → Application → Cookies)
  - After successful redirect, should have `token` cookie
  - Cookie should have values from `localhost:3000`

### Common Issues & Solutions

#### Issue: Blank page or infinite redirect
**Solution:**
- Check that `http://localhost:5173` is in your Google OAuth console
- Verify CORS is configured with `credentials: true`
- Check backend logs for database errors

#### Issue: Shows "auth_failed" on LoginPage
**Solution:**
- Check backend console for error messages
- Verify database connection is working
- Check that auth_accounts table exists

#### Issue: No token cookie set
**Solution:**
- Backend might have failed silently
- Check backend logs for errors in createAuthAccount
- Verify Google user info is being fetched correctly

#### Issue: `/auth/me` returns 401
**Solution:**
- Token wasn't set in cookie
- Check setAuthCookie function is being called
- Verify JWT signing is working (SECRET-KEY-ME)

### Backend Error Log Examples

```
// Missing code parameter
Authorization code not provided

// Google token exchange failed
Error during Google OAuth callback: [error details]

// User creation failed
Database error during transaction rollback

// Auth account creation failed
Error in createAuthAccount
```

### Frontend Error Display

- If any error occurs, user is redirected to `/login?error=auth_failed`
- LoginPage displays: "Google authentication failed. Please try again."
- Users can retry or use email/password login

## Files Modified

1. **Backend**: [auth.controller.js](../backend-2/controller/auth.controller.js)
   - Improved error handling
   - Better logging
   - Proper connection cleanup

2. **Frontend**: [AuthContext.jsx](src/context/AuthContext.jsx)
   - Handle error query parameter
   - Prevent auth check if error occurred

3. **Frontend**: [LoginPage.jsx](src/pages/LoginPage.jsx)
   - Display Google auth errors
   - Enhanced logging

4. **Frontend**: [SignUpPage.jsx](src/pages/SignUpPage.jsx)
   - Enhanced logging
