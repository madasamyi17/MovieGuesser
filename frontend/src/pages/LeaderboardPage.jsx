import { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./css/leaderboard.css";

function LeaderboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const name = location.state?.name || "";
  const currentScore = location.state?.currentScore || 0;
  const totalScore = location.state?.totalScore || 0;
  const maxScore = location.state?.maxScore || 0;
  const totalGames = location.state?.totalGames || 0;

  useEffect(() => {
    let isMounted = true;

    const fetchLeaderboard = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await axios.get("http://localhost:3000/api/leaderboard?limit=50");
        if (isMounted) {
          setData(response.data?.data || []);
        }
      } catch (fetchError) {
        if (isMounted) {
          setData([]);
          setError("Failed to load leaderboard. Please try again.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchLeaderboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePlayAgain = () => {
    navigate("/movieguess", {
      state: {
        name: name,
        totalScore: totalScore,
        maxScore: maxScore,
        totalGames: totalGames,
      },
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-container">
        <h2 className="leaderboard-title">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{marginRight: '10px', display: 'inline-block', verticalAlign: 'middle'}}>
            <circle cx="12" cy="8" r="7"></circle>
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
          </svg>
          Leaderboard
        </h2>
        
        <div className="current-game-stats">
          <div className="stat-box">
            <span className="stat-label">This Game</span>
            <span className="stat-value">{currentScore}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Total Score</span>
            <span className="stat-value">{totalScore}</span>
          </div>
          <div className="stat-box">
            <span className="stat-label">Max Score</span>
            <span className="stat-value">{maxScore}</span>
          </div>
        </div>

        {loading ? (
          <div className="no-data-message">Loading leaderboard...</div>
        ) : error ? (
          <div className="no-data-message">{error}</div>
        ) : data.length > 0 ? (
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Name</th>
                <th>Total Score</th>
                <th>Max Score</th>
                <th>Games</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={item.user_id} className={item.username === name ? 'current-player' : ''}>
                  <td className="rank">{index + 1}</td>
                  <td className="name">{item.username}</td>
                  <td className="score">{item.total_score}</td>
                  <td className="score">{item.max_score}</td>
                  <td className="games">{item.total_games}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-data-message">No leaderboard data available</div>
        )}

        <div className="leaderboard-actions">
          <button className="action-btn play-again-btn" onClick={handlePlayAgain}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            Play Again
          </button>
          <button className="action-btn quit-btn" onClick={handleLogout}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

export default LeaderboardPage;
