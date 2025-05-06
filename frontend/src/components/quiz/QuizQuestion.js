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
                {Object.entries(answers).map(([key, value]) => (
                    <button key={key} onClick={() => onAnswer(key)}>
                        {key}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default QuizQuestion;
