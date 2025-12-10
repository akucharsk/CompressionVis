import { useState } from "react";
import QuestionsFormatInfo from "./QuestionsFormatInfo";
import { apiUrl } from "../../utils/urls";
import { fetchWithCredentials } from "../../api/genericFetch";

const QuestionsUpload = () => {
    const [file, setFile] = useState(null);
    const [selectedSet, setSelectedSet] = useState(1);
    const [questions, setQuestions] = useState(null);

    const handleUpload = async () => {
        if (!file) return alert("Please select a ZIP file!");

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetchWithCredentials(`${apiUrl}/upload-questions/`, {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            alert(data.message);
        } catch (err) {
            console.error(err);
            alert("Upload failed.");
        }
    };

    const handleFetchQuestions = async () => {
        try {
            const res = await fetchWithCredentials(`${apiUrl}/questions/${selectedSet}/`);
            if (!res.ok) throw new Error("Failed to fetch questions");

            const data = await res.json();
            setQuestions(data);
        } catch (err) {
            console.error(err);
            alert("Error fetching questions.");
        }
    };

    const handleDownloadZip = () => {
        window.open(`${apiUrl}/upload-questions/`, "_blank");
    };

    return (
        <div style={{ marginTop: "30px" }}>
            <h2>Import Questions (ZIP)</h2>

            <input
                type="file"
                accept=".zip"
                onChange={(e) => setFile(e.target.files[0])}
            />
            <button onClick={handleUpload} style={{ marginLeft: "10px" }}>
                Upload
            </button>

            <hr />

            <h3>Preview Questions</h3>
            <select
                value={selectedSet}
                onChange={(e) => setSelectedSet(e.target.value)}
            >
                {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>questions{n}.json</option>
                ))}
            </select>
            <button onClick={handleFetchQuestions} style={{ marginLeft: "10px" }}>
                Show
            </button>

            {questions && (
                <pre>
                    {JSON.stringify(questions, null, 2)}
                </pre>
            )}

            <QuestionsFormatInfo />

            <hr />

            <button onClick={handleDownloadZip}>Download Current ZIP</button>
        </div>
    );
};

export default QuestionsUpload;
