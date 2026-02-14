import PropTypes from 'prop-types';
import '../css/clueCard.css'

function Clue({clueNo, clueText, setShowClue}){
    return (
        <div className="clue-container">
          <button className="clue-close-btn" onClick={() => setShowClue(false)}>
            ×
          </button>
          <div className="cluecard">
            <h1 className="clue-heading">CLUE {clueNo}</h1>
            <div className="clue-underline"></div>
            <p className="clue-text">{clueText}</p>
          </div>
        </div>
    )
}

Clue.propTypes = {
  clueNo: PropTypes.number,
  clueText: PropTypes.string,
  setShowClue: PropTypes.func
};

export default Clue;
