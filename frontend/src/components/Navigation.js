import { NavLink } from 'react-router-dom';
import './../styles/Navigation.css';

const Navigation = () => {
    return (
        <div className="nav-container">
            <NavLink to="/compress" className={({ isActive }) => `nav-tab${isActive ? ' active' : ''}`}>
                FRAMES DISTRIBUTION
            </NavLink>
            <NavLink to="/comparison" className={({ isActive }) => `nav-tab${isActive ? ' active' : ''}`}>
                COMPARISON
            </NavLink>
            <NavLink to="/quiz" className={({ isActive }) => `nav-tab${isActive ? ' active' : ''}`}>
                QUIZ
            </NavLink>
        </div>
    );
};

export default Navigation;
