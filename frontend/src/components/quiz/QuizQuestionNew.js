const QuizQuestion = ({allQuestionsNumber, questionNumber, question, type, options }) => {
    return (
        <>
            <div className="question-box">
                <h2>
                    {questionNumber}. {question}
                </h2>
            </div>

            <div className="options-box">
                {console.log(options)}
                {options.map((option) => {
                    return ( 
                        <div className="quiz-option">
                            <input type={type} className={`${type}-option`}></input>
                            <p>{option}</p>
                        </div>
                    )
                })}
            </div>

            <div className="navigation-box">
                {questionNumber == 0 && <div className="quiz-back-button">Wstecz</div>}
                {questionNumber == allQuestionsNumber 
                    ? <div className="quiz-finish-button">Zakończ</div> 
                    : <div className="quiz-finish-button">Dalej</div>}
            </div>
        </>
    )
}

export default QuizQuestion;