import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import "../styles/pages/Navigation.css";
import AccountAccess from "./AccountAccess";
import GeneralAccess from "./GeneralAccess";
import { MdQuiz } from "react-icons/md";

const Navigation = () => {
    const [open, setOpen] = useState(false);
    const { pathname, search } = useLocation();
    const hideGeneralAccess = [ "/login", "/admin", "/" ].includes(pathname);

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
                    <NavLink to={`/quiz/list${search}`} className={({ isActive }) => `nav-tab${isActive ? " active" : ""}`}
                        onClick={() => setOpen(false)}>
                        QUIZ
                        <MdQuiz size={20} />
                    </NavLink>
                </div>
                <AccountAccess setOpen={setOpen} includeHome={hideGeneralAccess && pathname !== "/"} />
            </div>
        </div>
    );
};

export default Navigation;