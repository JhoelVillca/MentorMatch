export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-[#060911]">
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-4 border-sky-500/20 border-t-sky-500 animate-spin" />
        <div className="absolute w-8 h-8 rounded-full bg-sky-500/10 animate-ping" />
      </div>
    </div>
  );
}
