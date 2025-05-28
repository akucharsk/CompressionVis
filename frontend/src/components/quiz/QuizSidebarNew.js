import { useState } from "react";
import "../../styles/components/QuizSidebar.css"

const QuizSidebar = ({questions, selectedQuestion, setSelectedQuestion, selectedAnswers}) => {
    const [openSidebar, setOpenSidebar] = useState(true)

    console.log("CZY? ", openSidebar)
    return (
        <>
            <div className={openSidebar ? "quiz-navigation-opened" : "quiz-navigation-closed"}>
                <div className={openSidebar ? "close-arrow" : "open-arrow"} onClick={() => setOpenSidebar(!openSidebar)}></div>
                {questions.map((question, index) => (    
                            <>
                                <div 
                                    key={index} 
                                    className={selectedQuestion == index ? "quiz-navigation-question-selected" : selectedAnswers[index] == null || selectedAnswers[index].length === 0 ? "quiz-navigation-question-nonanswered" : "quiz-navigation-question-answered"} 
                                    onClick={() => setSelectedQuestion(index)}
                                >
                                    <h3>{index + 1}</h3>
                                    <div className={selectedAnswers[index] == null || selectedAnswers[index].length === 0 ? "quiz-navigation-check-true" : "quiz-navigation-check-false"}></div>
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