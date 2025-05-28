const QuizQuestion = ({allQuestionsNumber, questionNumber, question, type, options, setSelectedQuestion}) => {
    return (
        <>
            <div className="question-box">
                <h2>
                    {questionNumber}. {question}
                </h2>
            </div>

            <div className="options-box">
                {console.log(options)}
                {options.map((option, index) => {
                    return ( 
                        <div className="quiz-option" key={index}>
                            <input type={type} className={`${type}-option`}></input>
                            <p>{option}</p>
                        </div>
                    )
                })}
            </div>

            <div className="navigation-box">
                {questionNumber == 0 && <div className="quiz-back-button" onClick={setSelectedQuestion(questionNumber - 1)}>Wstecz</div>}
                {questionNumber == allQuestionsNumber 
                    ? <div className="quiz-finish-button" onClick={() => setSelectedQuestion(questionNumber + 1)}>Zakończ</div> 
                    : <div className="quiz-finish-button" onClick={() => setSelectedQuestion(questionNumber + 1)}>Dalej</div>}
            </div>
        </>
    )
}

export default QuizQuestion;