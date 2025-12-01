import React from "react";

export default function QuestionsFormatInfo() {
    const example = [
        {
            question: "What is the capital of France?",
            answers: [
                { text: "Paris", is_correct: true },
                { text: "London", is_correct: false },
                { text: "Berlin", is_correct: false }
            ],
            image: null
        },
        {
            question: "Which animal is shown in the picture?",
            answers: [
                { text: "Dog", is_correct: false },
                { text: "Cat", is_correct: true },
                { text: "Rabbit", is_correct: false }
            ],
            image: "cat.jpg"
        }
    ];

    return (
        <div>
            <h3 style={{ marginTop: 0 }}>questions.json File Format</h3>

            <p>The ZIP file must contain:</p>
            <ul>
                <li><strong>questions.json</strong> (or questions1.json ... questions4.json)</li>
                <li>optional images used by questions (e.g., <code>cat.jpg</code>)</li>
            </ul>

            <p><strong>Structure of a single question:</strong></p>
            <ul>
                <li><code>question</code> – the question text</li>
                <li><code>answers</code> – a list of possible answers</li>
                <li>
                    each answer contains:
                    <ul>
                        <li><code>text</code> – answer text</li>
                        <li><code>is_correct</code> – <code>true</code> / <code>false</code></li>
                    </ul>
                </li>
                <li><code>image</code> – (optional) name of the image file inside the ZIP, or <code>null</code></li>
            </ul>

            <p><strong>Example questions.json:</strong></p>
            <pre>{JSON.stringify(example, null, 2)}</pre>
        </div>
    );
}
