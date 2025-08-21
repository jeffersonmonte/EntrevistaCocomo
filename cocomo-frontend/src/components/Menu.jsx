import React from 'react';
import { Link } from 'react-router-dom';

const Menu = () => (
  <nav className="bg-gray-800 text-white p-4 mb-4">
    <ul className="flex gap-4">
      <li><Link to="/">Início</Link></li>
      <li><Link to="/nova-entrevista">Nova Entrevista</Link></li>
      <li><Link to="/entrevistas">Entrevistas</Link></li>
      <li><Link to="/docs/formulas">Fórmulas</Link></li>
    </ul>
  </nav>
);

export default Menu;
