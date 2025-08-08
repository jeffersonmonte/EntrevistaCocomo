import InterviewForm from "./components/InterviewForm";
import InterviewList from "./components/InterviewList";

export default function App() {
  return (
    <div className="p-4 space-y-8">
      <h1 className="text-2xl font-bold text-center">Sistema COCOMO - Entrevistas</h1>
      <InterviewForm />
      <hr />
      <InterviewList />
    </div>
  );
}