export default function QuizNavigation({ questionNumber, allQuestionsNumber, setSelectedQuestion, endQuiz }) {
  return (
    <div className="navigation-box">
      {questionNumber > 1 && (
      <div
          className="quiz-back-button"
          onClick={() => setSelectedQuestion(questionNumber - 2)}
      >
          Back
      </div>
      )}
      {questionNumber === allQuestionsNumber ? (
      <div
          className="quiz-finish-button"
          onClick={() => endQuiz()}
      >
          Complete
      </div>
      ) : (
      <div
          className="quiz-finish-button"
          onClick={() => setSelectedQuestion(questionNumber)}
      >
          Next
      </div>
      )}
    </div>
  );
}