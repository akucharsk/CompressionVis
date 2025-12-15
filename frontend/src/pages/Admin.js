import './../styles/pages/Admin.css';
import QuestionsUpload from "../components/admin/QuestionsUpload";
import VideoManager from '../components/admin/VideoManager';
import QuestionManager from '../components/admin/QuestionManager';

const Admin = () => {
    return (
        <div className="admin-page">
            <div>
                <VideoManager />
                <QuestionsUpload />
            </div>
            <QuestionManager />
        </div>
    );
};

export default Admin;
