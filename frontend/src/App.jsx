import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepage from "./pages/Homepage";
import MovieGuessPage from "./pages/MovieguessPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import Instructions from "./components/instructions";
import ReadName from "./components/readName";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route
            path="/movieguess"
            element={
              <ProtectedRoute>
                <MovieGuessPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <LeaderboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="/instructions" element={<Instructions />} />
          <Route path="/readname" element={<ReadName />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
