import React from "react";

const QuizQuestion = ({ number, total, question, answers, onAnswer }) => {
    return (
        <div className="quiz-box">
            <h1>Question {number}/{total}</h1>
            <p>{question}</p>
            <div>
                <ul>
                    {Object.entries(answers).map(([key, value]) => (
                        <li key={key}>{key}. {value}</li>
                    ))}
                </ul>
                <div className="answer-buttons">
                    {Object.entries(answers).map(([key]) => (
                        <button key={key} onClick={() => onAnswer(key)}>
                            {key}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default QuizQuestion;
