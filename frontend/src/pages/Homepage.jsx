import { useNavigate } from "react-router-dom";

import "../css/HomePage.css";
function Homepage() {
  const navigate = useNavigate();
  const handlegetstarted = async () => {
    navigate("/login");
    // navigate('/movieguess')
  };
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
