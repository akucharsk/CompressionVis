import { useLocation } from "react-router-dom";
import { useState } from "react";
import "../styles/pages/Navigation.css";
import AccountAccess from "./AccountAccess";
import GeneralAccess from "./GeneralAccess";
import QuizAccess from "./QuizAccess";

const Navigation = () => {
    const [open, setOpen] = useState(false);
    const { pathname, search } = useLocation();
    const searchParams = new URLSearchParams(search);
    const isStandaloneQuizPath = pathname.split("/").includes("quiz") && !searchParams.get("videoId");
    const hideGeneralAccess = [ "/login", "/admin", "/" ].includes(pathname) || isStandaloneQuizPath;

    return (
        <div style={{ height: "100vh" }}>
            <button className={`nav-dots-btn ${open ? "active" : ""}`} onClick={() => setOpen(!open)}>⋮</button>
            <div
                className={`nav-overlay ${open ? "active" : ""}`}
                onClick={() => setOpen(!open)}
            />
            <div className={`nav-container ${open ? "open" : ""}`}>
                <div>
                    { !hideGeneralAccess && <GeneralAccess setOpen={setOpen} /> }
                    <QuizAccess setOpen={setOpen} includeHome={hideGeneralAccess && pathname !== "/"} />
                </div>
                <AccountAccess setOpen={setOpen} />
            </div>
        </div>
    );
};

export default Navigation;