import { useState, useMemo } from "react";
import QuestionsFormatInfo from "./QuestionsFormatInfo";
import { apiUrl } from "../../utils/urls";
import { fetchWithCredentials } from "../../api/genericFetch";
import { useQuizes, useSingleQuiz } from "../../hooks/quizes";

const QuestionsUpload = () => {
    const [file, setFile] = useState(null);
    const [selectedSet, setSelectedSet] = useState(1);
    const { data } = useQuizes();
    const quizQuery = useSingleQuiz(selectedSet);
    const quiz = useMemo(() => quizQuery.data?.quiz || {}, [quizQuery.data?.quiz]);

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

    const handleDownloadZip = () => {
        window.open(`${apiUrl}/upload-questions/`, "_blank");
    };

    return (
        <div style={{ marginTop: "30px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "2rem" }}>
            <h2>Import Questions (ZIP)</h2>
            <QuestionsFormatInfo />
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-around", border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "0.5rem", gap: "1rem" }}>
                <input
                    type="file"
                    accept=".zip"
                    onChange={(e) => setFile(e.target.files[0])}
                    hidden
                    id="zip-upload"
                />
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontWeight: "bold" }}>
                    <label htmlFor="zip-upload">
                        Choose ZIP file
                    </label>
                    { file && <p>{file.name}</p> }
                </div>
                <button onClick={handleUpload}>
                    Upload
                </button>
            </div>
        </div>
    );
};

export default QuestionsUpload;
