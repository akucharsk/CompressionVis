import { useQuiz } from "../../context/QuizContext";

export default function QuizNavigation() {
  const { selectedQuestionIdx, setSelectedQuestionIdx, questions, setStep } = useQuiz();
  return (
    <div className="navigation-box">
      <button
          className={`quiz-back-button ${selectedQuestionIdx === 0 ? "disabled" : ""}`}
          onClick={() => setSelectedQuestionIdx(selectedQuestionIdx - 1)}
      >
          Back
      </button>
      {selectedQuestionIdx === questions.length - 1 ? (
      <button
          className="quiz-finish-button"
          onClick={() => setStep("end")}
      >
          Complete
      </button>
      ) : (
      <button
          className="quiz-finish-button"
          onClick={() => setSelectedQuestionIdx(selectedQuestionIdx + 1)}
      >
          Next
      </button>
      )}
    </div>
  );
}