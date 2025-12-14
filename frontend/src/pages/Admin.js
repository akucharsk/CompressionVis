import './../styles/pages/Admin.css';
import QuestionsUpload from "../components/admin/QuestionsUpload";
import VideoManager from '../components/admin/VideoManager';
import QuestionManager from '../components/admin/QuestionManager';

const Admin = () => {
    return (
        <div className="admin-page">
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <VideoManager />
                <QuestionsUpload />
            </div>
            <QuestionManager />
        </div>
    );
};

export default Admin;
