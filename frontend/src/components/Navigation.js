import {NavLink, useLocation} from 'react-router-dom';
import './../styles/pages/Navigation.css';

const Navigation = () => {

    const location = useLocation();
    const search = location.search;

    return (
        <div className="nav-container">
            <NavLink to="/" className="nav-tab nav-back">
                ↩
            </NavLink>
            <NavLink to={`/compress${search}`} className={({ isActive }) => `nav-tab${isActive ? ' active' : ''}`}>
                MACROBLOCKS
            </NavLink>
            <NavLink to={`/comparison${search}`} className={({ isActive }) => `nav-tab${isActive ? ' active' : ''}`}>
                COMPARISON
            </NavLink>
            <NavLink to={`/quiz${search}`} className={({ isActive }) => `nav-tab${isActive ? ' active' : ''}`}>
                QUIZ
            </NavLink>
        </div>
    );
};

export default Navigation;