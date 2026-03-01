import "./css/readName.css";
import { Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";
function ReadName() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  //const [showNameCard, setshowNameCard] = useState(true);
  const handleNameSubmit = () => {
    console.log("Name at ReadName", name);
    navigate("/movieguess", {
      state: { name: name }
    });
  };

  return (
    <>
      <div className="name-card">
        <input
          type="text"
          placeholder="Type your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="Username"
        />
        <button
          className="submit-name-button"
          //onClick={() => setshowNameCard(false)}
          onClick={handleNameSubmit}
          disabled={!name.trim()}
        >
          Submit
        </button>
      </div>
    </>
  );
}

export default ReadName;
