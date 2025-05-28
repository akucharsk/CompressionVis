const QuizSidebar = ({questions, setSelectedQuestion}) => {
    
    return (
        <>
            <div className="quiz-navigation">
                {questions.map((question, index) => (    
                            <>
                                <div key={index} className="quiz-navigation-question" onClick={() => setSelectedQuestion(index)}>
                                    <h3>{index + 1}</h3>
                                </div>
                            </>
                        )
                    )
                }
            </div>
        </>
    )
}

export default QuizSidebar;