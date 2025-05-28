const QuizQuestion = ({
  allQuestionsNumber,
  questionNumber,
  question,
  type,
  options,
  setSelectedQuestion,
  userAnswers,
  setUserAnswers,
}) => {
  const questionIndex = questionNumber - 1;

  const handleCheckboxChange = (answerIndex) => (e) => {
    const checked = e.target.checked;

    setUserAnswers((prev) => {
      const prevAnswers = prev[questionIndex] || [];

      if (checked) {
        // Dodaj tylko, jeśli jeszcze nie ma
        if (!prevAnswers.includes(answerIndex)) {
          return {
            ...prev,
            [questionIndex]: [...prevAnswers, answerIndex],
          };
        }
        return prev;
      } else {
        // Usuń zaznaczoną odpowiedź
        return {
          ...prev,
          [questionIndex]: prevAnswers.filter((i) => i !== answerIndex),
        };
      }
    });
  };

  return (
    <>
      <div className="question-box">
        <h2>
          {questionNumber}. {question}
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
            <p>{option}</p>
          </div>
        ))}
      </div>

      <div className="navigation-box">
        {questionNumber > 1 && (
          <div
            className="quiz-back-button"
            onClick={() => setSelectedQuestion(questionNumber - 2)}
          >
            Wstecz
          </div>
        )}
        {questionNumber === allQuestionsNumber ? (
          <div
            className="quiz-finish-button"
            onClick={() => setSelectedQuestion(questionNumber)}
          >
            Zakończ
          </div>
        ) : (
          <div
            className="quiz-finish-button"
            onClick={() => setSelectedQuestion(questionNumber)}
          >
            Dalej
          </div>
        )}
      </div>
    </>
  );
};

export default QuizQuestion;
