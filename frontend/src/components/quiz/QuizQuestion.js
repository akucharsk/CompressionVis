import { useQuiz } from "../../context/QuizContext";
import { useCallback, useMemo } from "react";
import QuizNavigation from "./QuizNavigation";

const QuizQuestion = ({
  allQuestionsNumber,
  questionNumber,
  question,
  type,
  options,
  setSelectedQuestion,
  endQuiz,
  showResults = false
}) => {
  const questionIndex = questionNumber - 1;
  const { userAnswers, setUserAnswers } = useQuiz();

  const handleCheckboxChange = (answerIndex) => (e) => {
    const checked = e.target.checked;
    setUserAnswers((prev) => {
      const answers = prev[questionIndex] || [];
      if (checked && !answers.includes(answerIndex)) {
        return {
          ...prev,
          [questionIndex]: [...answers, answerIndex]
        };
      } else if (!checked && answers.includes(answerIndex)) {
        return {
          ...prev,
          [questionIndex]: answers.filter((index) => index !== answerIndex)
        };
      }
      return prev;
    })
  }

  const getOptionClass = useCallback((index) => {
    if (!showResults) return "";
    const providedAnswers = userAnswers[questionIndex] || [];
    console.log({ providedAnswers, index, question, questionIndex });
    if (providedAnswers.includes(index) && !question.answers[index].is_correct) return "quiz-option-incorrect";
    if (question.answers[index].is_correct) return "quiz-option-correct";
    return "";
  }, [userAnswers, questionIndex, question, showResults]);
  console.log({ userAnswers });

  return (
    <div className="quiz-question-main-view">
        <div className="question-box">
            <h2>
            {questionNumber}. {question.question}
            </h2>
        </div>

        <div className="options-box">
            {options.map((option, index) => (
              <div className={`quiz-option ${getOptionClass(index)}`} key={index}>
                  <input
                    type={type}
                    className={`${type}-option`}
                    onChange={handleCheckboxChange(index)}
                    checked={userAnswers[questionIndex]?.includes(index) || false}
                    disabled={showResults}
                  />
                  <p>{option.text}</p>
              </div>
            ))}
        </div>

        { !showResults && (
          <QuizNavigation
            questionNumber={questionNumber}
            allQuestionsNumber={allQuestionsNumber}
            setSelectedQuestion={setSelectedQuestion}
            endQuiz={endQuiz}
          />
        )}
    </div>
  );
};

export default QuizQuestion;
