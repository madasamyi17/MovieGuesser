import { useNavigate } from "react-router-dom";
import '../css/overlay.css'

function ScoreCard(props) {
  const navigate = useNavigate();

  function handlegetLeaderboard(name, score) {
    navigate("/leaderboard", {
      state: {
        name: name,
        currentScore: score,
        totalScore: props.totalScore || score,
        maxScore: props.maxScore || score,
      },
    });
  }

  const handleQuit = () => {
    navigate("/");
  };

  return (
    <div className="score-overlay">
      <div className="gameover-title">GAME OVER</div>
      <p className="score">Your score is: {props.score}</p>
      <div className="score-card-actions">
        <button
          className="score-action-btn leaderboard-btn"
          onClick={() => handlegetLeaderboard(props.name, props.score)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="7"></circle>
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
          </svg>
          Leaderboard
        </button>
        <button
          className="score-action-btn quit-btn"
          onClick={handleQuit}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          Quit
        </button>
      </div>
    </div>
  );
}

export default ScoreCard;
