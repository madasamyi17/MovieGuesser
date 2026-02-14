import { useEffect, useState } from "react";
import "../css/MovieguessPage.css";
import axios from "axios";
import "../css/overlay.css";
import Clue from "./Clue";
import ScoreCard from "../components/ScoreCard";
import { useLocation, useNavigate } from "react-router-dom";
import UserProfileCard from "../components/UserProfileCard";
import { profileCache } from "../utils/profileCache";
import defaultPic from "../images/default-pic.png";

function MovieGuessPage() {
  const [question, setQuestion] = useState("");
  const [questionNo, setQuestionNo] = useState("");
  const [inputText, setInputText] = useState("");
  const [clueNo, setClueNo] = useState(0);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showClue, setShowClue] = useState(false);
  const [clueText, setClueText] = useState("");
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [checkdisablebutton, setCheckdisablebutton] = useState(true);
  const [disablecluebutton, setDisablecluebutton] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [error, setError] = useState("");
  const [showProfileCard, setShowProfileCard] = useState(false);
  const [userId, setUserId] = useState(null);
  const [totalScore, setTotalScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [totalGames, setTotalGames] = useState(0);
  const [navbarImage, setNavbarImage] = useState(defaultPic);

  const location = useLocation();
  const navigate = useNavigate();
  const name = location.state?.name || "";
  const userProfile = location.state?.userProfile || null; // Google user profile data

  // Load profile image for navbar from cache
  useEffect(() => {
    const cached = profileCache.get();
    if (cached && cached.profileImage) {
      setNavbarImage(cached.profileImage);
    } else {
      setNavbarImage(userProfile?.picture || defaultPic);
    }
  }, [userProfile]);

  async function handleAnswerCheck() {
    try {
      setCheckdisablebutton(false);
      const response = await axios.post(
        `http://localhost:3000/api/movieguess`,
        {
          id: questionNo,
          userAnswer: inputText.trim(),
        },
        {
          params: { type: "answerCheck" },
        }
      );
      console.log(response.data);
      if (response.data.answer.trim() === "1") {
        setFeedbackMessage(
          `Correct! ${response.data.originalAnswer} is the Right Answer`
        );
        setIsCorrect(true);
        setScore((s) => s + 10 - clueNo * 2);
        setInputText("");
        setCheckdisablebutton(true);
        setTimeout(() => {
          setIsCorrect(false);
          setFeedbackMessage("");
          fetchQuestion();
        }, 3000);
      } else {
        setFeedbackMessage(
          `Wrong Answer, Original Answer is ${response.data.originalAnswer}`
        );
        // Submit score to leaderboard and navigate
        await submitScoreToLeaderboard(score);
        setTimeout(async () => {
          setFeedbackMessage("");
          await handleViewLeaderboard();
        }, 3000);
      }
    } catch (error) {
      console.error(error);
      setError("Failed to check answer. Please try again.");
    }
  }

  const handlegetClue = async () => {
    setDisablecluebutton(true);
    try {
      setClueNo((c) => c + 1);
      if (clueNo >= 3) {
        setFeedbackMessage("No more clues available");
        return;
      }
      const response = await axios.post(
        `http://localhost:3000/api/movieguess`,
        {
          clueNo: clueNo,
          imdb_id: questionNo,
        },
        { params: { type: "clue" } }
      );
      setClueText(response.data.clue);
      setShowClue(true);
      setTimeout(() => {
        setDisablecluebutton(false);
      }, 5000);
    } catch (error) {
      console.error(error);
      setError("Failed to fetch clue. Please try again.");
    }
  };

  const fetchQuestion = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:3000/api/movieguess`
      );
      setQuestion(response.data.description);
      setQuestionNo(response.data.imdb_id);
      setClueNo(0);
    } catch (error) {
      console.error(error);
      setError("Failed to load question. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch user stats from leaderboard
  const fetchUserStats = async () => {
    if (!userId) return;
    try {
      const response = await axios.get(
        `http://localhost:3000/api/leaderboard/user/${userId}`
      );
      if (response.data) {
        setTotalScore(response.data.stats.total_score);
        setMaxScore(response.data.stats.max_score);
        setTotalGames(response.data.stats.total_games);
      }
    } catch (error) {
      console.log("User not in leaderboard yet");
    }
  };

  // Submit score to leaderboard
  const submitScoreToLeaderboard = async (currentScore) => {
    try {
      const response = await axios.post(
        `http://localhost:3000/api/leaderboard`,
        {
          user_id: userId || Date.now(), // Use timestamp as temp ID if no userId
          username: name,
          current_score: currentScore,
        }
      );
      // Update local stats
      if (response.data) {
        setTotalScore(response.data.total_score);
        setMaxScore(response.data.max_score);
        setTotalGames(response.data.total_games);
      }
    } catch (error) {
      console.error("Error submitting score to leaderboard:", error);
    }
  };

  useEffect(() => {
    fetchQuestion();
    // Set userId from userProfile or generate one
    if (userProfile?.sub) {
      setUserId(userProfile.sub);
    } else {
      setUserId(Date.now());
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchUserStats();
    }
  }, [userId]);

  useEffect(() => {
    if (showClue) {
      const timeout = setTimeout(() => {
        setShowClue(false);
      }, 8000);
      return () => clearTimeout(timeout);
    }
  }, [showClue]);

  const handleProfileClick = () => {
    setShowProfileCard(!showProfileCard);
  };

  const handleViewLeaderboard = async () => {
    try {
      // Fetch full leaderboard
      const response = await axios.get(
        `http://localhost:3000/api/leaderboard?limit=50`
      );
      navigate("/leaderboard", {
        state: { 
          name: name, 
          leaderboard: response.data.data || [],
          currentScore: score,
          totalScore: totalScore,
          maxScore: maxScore
        },
      });
      // Reset score after navigating
      setScore(0);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      // Navigate anyway with empty leaderboard
      navigate("/leaderboard", {
        state: { 
          name: name, 
          leaderboard: [],
          currentScore: score,
          totalScore: totalScore,
          maxScore: maxScore
        },
      });
      // Reset score after navigating
      setScore(0);
    }
  };

  const handleQuit = async () => {
    // Submit score to leaderboard and navigate
    await submitScoreToLeaderboard(score);
    await handleViewLeaderboard();
  };

  const handleProfileUpdate = (updatedData) => {
    // Handle profile updates (username or picture)
    console.log("Profile updated:", updatedData);
    // Update navbar image if picture was updated
    if (updatedData.picture) {
      setNavbarImage(updatedData.picture);
    }
    if (updatedData.name) {
      // Update name in local state if needed
    }
  };

  return (
    <>
      {/* Navbar */}
      <nav className="movieguess-navbar">
        <div className="navbar-title">Movie Guesser</div>
        <div className="navbar-profile" onClick={handleProfileClick}>
          <img
            src={navbarImage}
            alt="Profile"
            className="profile-image"
          />
        </div>
      </nav>

      {/* User Profile Card */}
      {showProfileCard && (
        <UserProfileCard
          userProfile={userProfile}
          name={name}
          currentScore={score}
          totalScore={totalScore}
          maxScore={maxScore}
          onClose={() => setShowProfileCard(false)}
          onViewLeaderboard={handleViewLeaderboard}
          onProfileUpdate={handleProfileUpdate}
        />
      )}

      {feedbackMessage && (
        <div className="feedback-message">{feedbackMessage}</div>
      )}

      {error && <div className="error-message">{error}</div>}

      {showClue && (
        <Clue clueText={clueText} clueNo={clueNo} setShowClue={setShowClue} />
      )}

      {showScore && <ScoreCard score={score} name={name} totalScore={totalScore} maxScore={maxScore} />}

      <div
        className={`question-page-container ${
          isCorrect ? "correct-blink" : ""
        }`}
      >
        {loading ? (
          <div className="loading-spinner">Loading question...</div>
        ) : (
          <>
            <div className="question-box">
              <div className="question-title">Guess the Movie?</div>
              <div className="underline"></div>
              <div className="question-text">{question}</div>
            </div>
            <div className="input-clues-container">
              <input
                type="text"
                className="answer-input"
                value={inputText}
                placeholder="Your guess here..."
                onChange={(e) => setInputText(e.target.value)}
                disabled={isCorrect}
              />
              <button
                className="bulb-button"
                onClick={handlegetClue}
                disabled={disablecluebutton}
              ></button>
            </div>
            <div className="check-and-quit-button">
              <button
                className="AnswerCheckButton"
                onClick={handleAnswerCheck}
                disabled={!(inputText.trim() && checkdisablebutton)}
              >
                Check
              </button>
              <button
                className="AnswerCheckButton quit-btn"
                onClick={handleQuit}
              >
                Quit
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default MovieGuessPage;
