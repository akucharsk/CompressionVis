import { useQuiz } from "../../context/QuizContext";

export default function QuizNavigation() {
  const { selectedQuestionIdx, setSelectedQuestionIdx, questions, setStep } = useQuiz();
  return (
    <div className="navigation-box">
      <div
          className={`quiz-back-button ${selectedQuestionIdx === 0 ? "disabled" : ""}`}
          onClick={() => setSelectedQuestionIdx(selectedQuestionIdx - 1)}
      >
          Back
      </div>
      {selectedQuestionIdx === questions.length - 1 ? (
      <div
          className="quiz-finish-button"
          onClick={() => setStep("end")}
      >
          Complete
      </div>
      ) : (
      <div
          className="quiz-finish-button"
          onClick={() => setSelectedQuestionIdx(selectedQuestionIdx + 1)}
      >
          Next
      </div>
      )}
    </div>
  );
}