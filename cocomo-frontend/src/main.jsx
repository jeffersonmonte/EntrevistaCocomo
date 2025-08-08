import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./styles/index.css";
import InterviewForm from "./pages/InterviewForm";
import ListaEntrevistas from "./pages/ListaEntrevistas";
import DetalheEntrevista from "./pages/DetalheEntrevista";
import Menu from "./components/Menu";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Router>
      <Menu />
      <Routes>
        <Route path="/" element=<div className='p-6'>
  <h1 className='text-2xl font-semibold mb-4'>Bem-vindo!</h1>
  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl'>
    <a href='/nova-entrevista' className='p-6 border rounded hover:shadow transition flex items-center justify-center gap-3'>
      <span className='text-3xl'>📝</span><span className='font-medium'>Nova Entrevista</span>
    </a>
    <a href='/entrevistas' className='p-6 border rounded hover:shadow transition flex items-center justify-center gap-3'>
      <span className='text-3xl'>📋</span><span className='font-medium'>Listar Entrevistas</span>
    </a>
  </div>
</div> />
        <Route path="/nova-entrevista" element={<InterviewForm />} />
        <Route path="/entrevistas" element={<ListaEntrevistas />} />
        <Route path="/entrevistas/:id" element={<DetalheEntrevista />} />
      </Routes>
    </Router>
  </React.StrictMode>
);
