export const Footer = () => {
  return (
    <footer className="w-full py-6 mt-auto border-t border-slate-100">
      <div className="container mx-auto px-6 flex flex-col items-center justify-center gap-1">
        <p className="text-xs text-slate-400 uppercase tracking-widest font-medium">
          © 2025 UESC
        </p>
        <p className="text-sm text-slate-500">
          Developed by{" "}
          <a
            href="https://www.linkedin.com/in/anderson-morbeck-895a6928a/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 font-semibold hover:underline decoration-2 underline-offset-4 transition-all"
          >
            Anderson Morbeck
          </a>
        </p>
      </div>
    </footer>
  );
};
