import React from "react";

const QuizEnded = ({ userAnswers, questions, setStep, setUserAnswers }) => {

    console.log(questions)

    const arraysEqual = (a, b) => {
        if (a.length !== b.length) return false;
        const aSorted = [...a].sort();
        const bSorted = [...b].sort();
        return aSorted.every((val, index) => val === bSorted[index]);
    };

    const countScore = () => {
        let score = 0
        // console.log(userAnswers)
        // console.log("SIEMA TU JA")
        console.log(userAnswers.length)

        for (let i = 0; i < userAnswers.length; i ++) {
            // console.log(userAnswers[i], questions[i].correctAnswer, "SIEMA")
            console.log("DEBUG")
            if (Array.isArray(userAnswers[i]) && Array.isArray(questions[i].correctAnswer)) {
                if (arraysEqual(userAnswers[i], questions[i].correctAnswer)) {
                    score += 1;
                }
            } else if (userAnswers[i] === questions[i].correctAnswer) {
                score += 1;
            }
        }

        return score
    }

    return (
        <div className="quiz-box">
            <h1>Quiz Completed!</h1>
            <p>Your score: {countScore()} / {questions.length}</p>
            {/* <p>{userAnswers}</p> */}
            <div className="end-navigation-box">
                <div
                    className="quiz-try-again-button"
                    onClick={() => {{
                        setStep("menu")
                        const newArray = Array(questions.length).fill(null)
                        setUserAnswers(newArray)
                    }}
                    }
                >
                    Try again
                </div>
                <div
                    className="quiz-see-results-button"
                    onClick={() => {}}
                    disabled
                >
                    See results
                </div>
            </div>
        </div>
    );
};

export default QuizEnded;
