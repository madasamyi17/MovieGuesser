import { useEffect, useState } from "react";
import "../css/MovieguessPage.css";
import axios from "axios";
import "../css/overlay.css";
import Clue from "./Clue";
import ScoreCard from "./ScoreCard";
import { useLocation } from "react-router-dom";

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
  // const [name, setName] = useState("");
  // const [showNameCard, setshowNameCard] = useState(true);
  const[checkdisablebutton,setCheckdisablebutton] = useState(true);
  const[disablecluebutton,setDisablecluebutton] = useState(false);
  const [loading, setLoading] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [error, setError] = useState("");

const location = useLocation();
// console.log(location.state);
const name = location.state?.name || "";
// console.log("Name at MovieGuessPage", name);
  async function handleAnswerCheck() {
    try {
      setCheckdisablebutton(false);
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/movieguess`,
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
        
        setFeedbackMessage(`✅ Correct! ${response.data.originalAnswer} is the Right Answer`);
        setIsCorrect(true); 
       // setIsCorrect(true);// Trigger the blink
        setScore((s) => s + 10 - clueNo * 2);
        setInputText("");
        setCheckdisablebutton(true);
        setTimeout(() => {
          setIsCorrect(false); // Reset the "correct" state after 1 second
          setFeedbackMessage(""); // Clear the feedback message
          fetchQuestion(); // Fetch the next question
        }, 3000);
      } else {
        setFeedbackMessage(`Wrong Answer, Original Answer is ${response.data.originalAnswer}`);
        setTimeout(() => {setFeedbackMessage("");setShowScore(true)}, 3000);
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
        // alert("No more clues available");
        setFeedbackMessage("No more clues available");
        return;
      }
      // console.log(clueNo, questionNo);
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/movieguess`,
        {
          clueNo: clueNo,
          imdb_id: questionNo,
        },
        { params: { type: "clue" } }
      );
      // console.log(response.data);
      setClueText(response.data.clue);
      setShowClue(true);
      setTimeout(() => {
        setDisablecluebutton(false);
      }, 5000); // Re-enable the clue button after 8 seconds)
      // console.log("question no at time of clue", questionNo);
    } catch (error) {
      console.error(error);
      setError("Failed to fetch clue. Please try again.");
    }
  };

  const fetchQuestion = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/movieguess`);
      // console.log(response.data);
      setQuestion(response.data.description);
      setQuestionNo(response.data.imdb_id);
      setClueNo(0);
      // console.log("Question no at time of question", questionNo);
    } catch (error) {
      console.error(error);
      setError("Failed to load question. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchQuestion();
  }, []);

  

  useEffect(() => {
    if (showClue) {
      const timeout = setTimeout(() => {
        setShowClue(false);
      }, 8000); // 5000ms = 5 seconds
      return () => clearTimeout(timeout); // Cleanup if component unmounts or showClue changes
    }
  }, [showClue]);
 


  return (
    <>
      {feedbackMessage && (
        <div className="feedback-message">{feedbackMessage}</div>
      )}

      {error && <div className="error-message">{error}</div>}

      {showClue && (
        <Clue
          clueText={clueText}
          clueNo={clueNo}
          setShowClue={setShowClue}
        ></Clue>
      )}
      {showScore && <ScoreCard score={score} name={name}></ScoreCard>}
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
              <button className="bulb-button" onClick={handlegetClue}  disabled={disablecluebutton}></button>
            </div>
            <div className="check-and-quit-button">
              <button
                className="AnswerCheckButton"
                onClick={() => {
                  setShowScore(true);
                }}
              >
                Quit
              </button>
              <button
                className="AnswerCheckButton"
                onClick={handleAnswerCheck}
                disabled={!(inputText.trim() && checkdisablebutton)}
              >
                Check
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default MovieGuessPage;
