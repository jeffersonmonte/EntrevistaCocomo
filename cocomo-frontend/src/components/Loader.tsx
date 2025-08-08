export default function Loader({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-gray-600">
      <span className="inline-block h-5 w-5 rounded-full border-2 border-gray-300 border-t-transparent animate-spin"></span>
      <span className="text-sm">{label}</span>
    </div>
  );
}
