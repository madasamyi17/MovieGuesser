import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./css/LoginPage.css";
import { buildApiUrl } from "../utils/apiConfig";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.post(
          "/auth/me",
          {},
          { withCredentials: true }
        );
        if (response.status === 200) {
          navigate("/movieguess", { replace: true });
        }
      } catch (error) {
        // Not authenticated, stay on login page
      }
    };

    checkAuth();
  }, [navigate]);

  // Check for auth errors from Google OAuth
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authError = urlParams.get('error');
    
    if (authError) {
      setErrors({ form: "Google authentication failed. Please try again." });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    return newErrors;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const resp = await axios.post(
        "/auth/login",
        { email, password },
        {
          withCredentials: true, // This ensures cookies are sent and received
        }
      );
      if (resp.status === 200) {
        console.log("Login successful:", resp.data);
        login(null);
        navigate("/movieguess");
      }
      else if(resp.data && resp.data.message ==="User not found"){
        setErrors({ form: "User not found. Please check your email." });
      }
       else {
        setErrors({ form: "Invalid email or password" });
      }
    } catch (err) {
      console.error("Login error:", err);
      const status = err?.response?.status;
      const message = err?.response?.data?.message;

      if (status === 401) {
        if (message === "User not found") {
          setErrors({ form: "User not found. Please check your email." });
        } else {
          setErrors({ form: "Invalid email or password" });
        }
      } else if (status === 400) {
        setErrors({ form: message || "Please enter valid credentials." });
      } else {
        setErrors({ form: "Server error. Try again later." });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    console.log("Google login clicked - redirecting to backend");
    try {
      window.location.href = buildApiUrl("/auth/google");
    } catch (error) {
      console.error("Error initiating Google login:", error);
      setErrors({ form: "Failed to initiate Google login" });
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">Movie Guesser</h1>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: "" });
              }}
              className={errors.email ? "input-error" : ""}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors({ ...errors, password: "" });
                }}
                className={errors.password ? "input-error" : ""}
              />
              <button
                type="button"
                className="eye-toggle"
                onClick={togglePasswordVisibility}
                aria-label="Toggle password visibility"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {showPassword ? (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </>
                  ) : (
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </>
                  )}
                </svg>
              </button>
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          {errors.form && <span className="error-message form-error">{errors.form}</span>}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* <div className="forgot-password">
          <a href="/forgot-password">Forgot Password?</a>
        </div> */}

        {/* <div className="divider-text">or you can sign in with</div>

        <div className="social-buttons">
          <button className="social-btn google-btn" onClick={handleGoogleLogin} title="Sign in with Google">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"></path>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"></path>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"></path>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"></path>
            </svg>
          </button>
        </div> */}

        <div className="auth-links">
          <span>Don't have an account? </span>
          <a href="/signup" className="signup-link">Sign up</a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;