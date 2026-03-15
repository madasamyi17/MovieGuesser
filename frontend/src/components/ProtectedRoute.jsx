import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";

const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    console.log("Checking authentication status...");
    const checkAuth = async () => {
      try {
        const response = await axios.post(
          "/auth/me",{},
          {
            withCredentials: true, // Send cookies with request
          }
        );
        console.log("Auth check response:", response);

        if (response.status === 200) {
          // User is authenticated
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.log("Authentication failed:", error.message);
        // User is not authenticated
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // While checking authentication, show loading screen
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  // If not authenticated after check completes, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If authenticated, show the protected content
  return children;
};

export default ProtectedRoute;
