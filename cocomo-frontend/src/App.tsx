import InterviewForm from "./components/InterviewForm";
import InterviewList from "./components/InterviewList";
import Menu from "./components/Menu";

export default function App() {
  return (
    <div className="container-app space-y-6">
      <Menu />
      <header className="card flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl">Sistema COCOMO • Entrevistas</h1>
          <p className="text-slate-300 text-sm">Cadastro, edição e exclusão com visual renovado</p>
        </div>
      </header>

      <section className="card">
        <h2 className="section-title">Nova Entrevista</h2>
        <InterviewForm />
      </section>

      <section className="card">
        <h2 className="section-title">Entrevistas</h2>
        <InterviewList />
      </section>
    </div>
  );
}