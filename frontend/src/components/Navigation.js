import { useLocation } from "react-router-dom";
import { useState } from "react";
import "../styles/pages/Navigation.css";
import AccountAccess from "./AccountAccess";
import GeneralAccess from "./GeneralAccess";
import CompressedVideoAccess from "./CompressedVideoAccess";

const Navigation = () => {
    const [open, setOpen] = useState(false);
    const { pathname, search } = useLocation();
    const searchParams = new URLSearchParams(search);
    const includeCompressedAccess = searchParams.get("videoId") !== null && searchParams.get("originalVideoId") !== null;

    return (
        <div style={{ height: "100vh" }}>
            <button className={`nav-dots-btn ${open ? "active" : ""}`} onClick={() => setOpen(!open)}>⋮</button>
            <div
                className={`nav-overlay ${open ? "active" : ""}`}
                onClick={() => setOpen(!open)}
            />
            <div className={`nav-container ${open ? "open" : ""}`}>
                <div>
                    { includeCompressedAccess && <CompressedVideoAccess setOpen={setOpen} /> }
                    <GeneralAccess setOpen={setOpen} />
                </div>
                <AccountAccess setOpen={setOpen} />
            </div>
        </div>
    );
};

export default Navigation;