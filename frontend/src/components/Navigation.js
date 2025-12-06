import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import "../styles/pages/Navigation.css";

const Navigation = () => {
    const [open, setOpen] = useState(false);
    const location = useLocation();
    const search = location.search;

    return (
        <>
            <button className="nav-dots-btn" onClick={() => setOpen(!open)}>⋮</button>
            <div
                className={`nav-overlay ${open ? "active" : ""}`}
                onClick={() => setOpen(!open)}
            />
            <div className={`nav-container ${open ? "open" : ""}`}>
                <NavLink to={`/compress${search}`} className={({ isActive }) => `nav-tab${isActive ? " active" : ""}`}
                         onClick={() => setOpen(false)}
                >
                    MACROBLOCKS
                </NavLink>
                <NavLink to={`/comparison${search}`} className={({ isActive }) => `nav-tab${isActive ? " active" : ""}`}
                         onClick={() => setOpen(false)}>
                    COMPARISON
                </NavLink>
                <NavLink to={`/quiz${search}`} className={({ isActive }) => `nav-tab${isActive ? " active" : ""}`}
                         onClick={() => setOpen(false)}>
                    QUIZ
                </NavLink>

                {/* 
                po co wgl jest isActive? 
                To jest pozostałość po czymś? 
                */}

                <NavLink 
                    to={`/charts${search}`} 
                    className={({ isActive }) => `nav-tab${isActive ? " active" : ""}`}
                    onClick={() => setOpen(false)}
                >
                    CHARTS
                </NavLink>
                
                <NavLink to="/" className="nav-tab"
                         onClick={() => setOpen(false)}>
                    ↩ BACK
                </NavLink>
            </div>
        </>
    );
};

export default Navigation;