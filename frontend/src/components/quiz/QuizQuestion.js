const QuizQuestion = ({
  allQuestionsNumber,
  questionNumber,
  question,
  type,
  options,
  setSelectedQuestion,
  userAnswers,
  setUserAnswers,
  endQuiz
}) => {
  const questionIndex = questionNumber - 1;

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

  return (
    <>
    <div className="quiz-question-main-view">
        <div className="question-box">
            <h2>
            {questionNumber}. {question.question}
            </h2>
        </div>

        <div className="options-box">
            {options.map((option, index) => (
            <div className="quiz-option" key={index}>
                <input
                  type={type}
                  className={`${type}-option`}
                  onChange={handleCheckboxChange(index)}
                  checked={userAnswers[questionIndex]?.includes(index) || false}
                />
                <p>{option.text}</p>
            </div>
            ))}
        </div>

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
    </div>
    </>
  );
};

export default QuizQuestion;
