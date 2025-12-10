import { NavLink, useLocation } from "react-router-dom";
import { useState } from "react";
import "../styles/pages/Navigation.css";
import AccountAccess from "./AccountAccess";
import GeneralAccess from "./GeneralAccess";

const Navigation = () => {
    const [open, setOpen] = useState(false);
    const { pathname } = useLocation();
    const hideGeneralAccess = [ "/login", "/admin", "/" ].includes(pathname);

    return (
        <div style={{ height: "100vh" }}>
            <button className={`nav-dots-btn ${open ? "active" : ""}`} onClick={() => setOpen(!open)}>⋮</button>
            <div
                className={`nav-overlay ${open ? "active" : ""}`}
                onClick={() => setOpen(!open)}
            />
            <div className={`nav-container ${open ? "open" : ""}`}>
                { !hideGeneralAccess && <GeneralAccess setOpen={setOpen} /> }
                <AccountAccess setOpen={setOpen} includeHome={hideGeneralAccess && pathname !== "/"} />
            </div>
        </div>
    );
};

export default Navigation;