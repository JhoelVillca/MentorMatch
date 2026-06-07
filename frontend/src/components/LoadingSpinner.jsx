export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="w-9 h-9 rounded-full border-2 border-slate-200 border-t-primary-600 animate-spin" />
    </div>
  );
}
