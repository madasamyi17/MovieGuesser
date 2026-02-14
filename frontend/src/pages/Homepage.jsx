import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "../css/HomePage.css";

function Homepage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.post(
          "http://localhost:3000/auth/me",
          {},
          { withCredentials: true }
        );
        if (response.status === 200) {
          navigate("/movieguess");
          return;
        }
      } catch (error) {
        // Not logged in, stay on homepage
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handlegetstarted = () => {
    if (user) {
      // If user is logged in, go to movieguess
      navigate("/movieguess");
    } else {
      // If not logged in, go to login
      navigate("/login");
    }
  };

  if (checkingAuth) {
    return (
      <div className="movie-guess-container">
        <h1>Movie Guesser</h1>
        <p>Checking login...</p>
      </div>
    );
  }

  console.log(import.meta.env.VITE_BACKEND_URL);
  return (
    <>
      <div className="movie-guess-container">
        <h1>Movie Guesser</h1>
        <button className="start-button" onClick={handlegetstarted}>
          Aarambikalaama <span className="dots"></span>
        </button>
      </div>
    </>
  );
}


export default Homepage;
