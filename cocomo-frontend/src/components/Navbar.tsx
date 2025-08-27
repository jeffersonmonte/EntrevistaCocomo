import { NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <div className="navbar">
      <div className="brand">
        <div className="logo">C2</div>
        <div>
          <div style={{fontWeight:800}}>COCOMO II</div>
          <div className="hint">Estimativas & Entrevistas</div>
        </div>
      </div>
      <nav className="navlinks">
        <NavLink to="/" className={({isActive}) => isActive ? 'active' : ''}>Entrevistas</NavLink>
        {/* coloque aqui outros menus que já existam no seu app */}
      </nav>
    </div>
  );
}
