import { useNavigate } from "react-router-dom";
import "./css/instructions.css";

function Instructions({ onClose }) {
  const navigate = useNavigate();

  const instructions = [
    "1. A plot of the movie will appear on the screen.",
    "2. Type the correct movie name and check your answer.",
    "3. If correct on the first try, you get 10 points.",
    "4. You can use up to 3 clues if you're stuck — each clue reduces 2 points and can be used only once.",
    "5. A wrong answer or clicking quit ends the game. You'll then see your score and the leaderboard.",
  ];

  if (onClose) {
    return (
      <div className="instructions-modal-overlay" onClick={onClose}>
        <div className="instructions-modal-card" onClick={(e) => e.stopPropagation()}>
          <button className="instructions-close-btn" onClick={onClose} aria-label="Close instructions">
            ×
          </button>
          <div className="instructions-box instructions-modal-box">
            <div className="instructions-heading">Instructions</div>
            <div className="underline"></div>
            {instructions.map((instruction, index) => (
              <p className="instruction-text" key={index + 1}>
                {instruction}
              </p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="instruction-container">
      <div className="instructions-box">
        <div className="instructions-heading">Instructions</div>
        <div className="underline"></div>
        {instructions.map((instruction, index) => (
          <p className="instruction-text" key={index + 1}>
            {instruction}
          </p>
        ))}
      </div>
      <button className="Get-Started-button" onClick={() => navigate("/readname")}>
        Get Started
      </button>
    </div>
  );
}

export default Instructions;
