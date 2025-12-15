import { useQuiz } from "../../context/QuizContext";
import { useCallback, useMemo } from "react";
import QuizNavigation from "./QuizNavigation";
import { scale as chroma } from "chroma-js";
import Spinner from "../Spinner";
import QuestionOption from "./QuestionOption";
import { apiUrl } from "../../utils/urls";

const QuizQuestion = ({
  questionIdx,
  showResults = false,
}) => {
  const {
    selectedQuestionIdx,
    userAnswers,
    setUserAnswers,
    questions,
    quizQuery,
  } = useQuiz();

  questionIdx = typeof questionIdx === "number" ? questionIdx : selectedQuestionIdx;
  const currentQuestion = useMemo(() => questions[questionIdx], [questions, questionIdx]);
  const currentUserAnswers = useMemo(() => userAnswers[questionIdx], [userAnswers, questionIdx]);

  const handleCheckboxChange = useCallback((answerIndex) => (isChecked) => {
    setUserAnswers((prev) => {
      const answers = prev[questionIdx] || [];
      console.log({ answers, answerIndex, isChecked })
      if (isChecked && !answers.includes(answerIndex)) {
        return {
          ...prev,
          [questionIdx]: [...answers, answerIndex]
        };
      } else if (!isChecked && answers.includes(answerIndex)) {
        return {
          ...prev,
          [questionIdx]: answers.filter((index) => index !== answerIndex)
        };
      }
      return prev;
    })
  }, [questionIdx, setUserAnswers]);

  const getOptionClass = useCallback((index) => {
    if (!showResults) return "";
    if (currentUserAnswers?.includes(index) && !currentQuestion.answers[index].is_correct) return "quiz-option-incorrect";
    if (currentQuestion.answers[index].is_correct) return "quiz-option-correct";
    return "";
  }, [currentUserAnswers, currentQuestion, showResults]);

  const { score, total } = useMemo(() => {
    if (!showResults) return { total: 0, score: 0 };
    const total = currentQuestion.answers.reduce((acc, { is_correct }) => acc + Number(is_correct), 0);
    if (currentUserAnswers?.filter((index) => !currentQuestion.answers[index].is_correct).length > 0) {
      return { total, score: 0 };
    }
    return { total, score: currentUserAnswers?.length || 0 };
  }, [currentQuestion, currentUserAnswers, showResults]);

  const scale = chroma(['#ff0000', '#ffff00', '#00aa00']).domain([0, total]);

  if (quizQuery.isPending) return <Spinner />;
  console.log(currentQuestion);

  return (
    <div className="quiz-question-main-view">
        <div className="question-box">
            <h2>
              {questionIdx + 1}. {currentQuestion.question}
            </h2>
            {showResults && <p>
              Your score: <span style={{ color: scale(score).hex() }}>{score} / {total}</span>
            </p>}
            {currentQuestion.image && (
              <img src={`${apiUrl}/quiz/question/${currentQuestion.id}/image/`} alt="Question-image" />
            )}
        </div>

        <div className="options-box">
          {currentQuestion.answers.map((option, index) => (
            <QuestionOption
              key={`${questionIdx}-${index}`}
              optionClass={getOptionClass(index)}
              onClick={handleCheckboxChange(index)}
              optionText={option.text}
              defaultIsChecked={currentUserAnswers?.includes(index)}
              disabled={showResults}
            />
          ))}
        </div>

        { !showResults && (
          <QuizNavigation />
        )}
    </div>
  );
};

export default QuizQuestion;
