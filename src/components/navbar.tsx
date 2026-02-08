import { Link } from "react-router-dom";

export const Navbar = () => {
  return (
    <nav className="w-full bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-x-10">
          <Link
            to="/"
            className="text-sm font-medium text-slate-600 hover:text-blue-600 transition"
          >
            Home
          </Link>
          <Link
            to="/predicao"
            className="text-sm font-medium text-slate-600 hover:text-blue-600 transition"
          >
            Predição
          </Link>
          <Link
            to="/sobre"
            className="text-sm font-medium text-slate-600 hover:text-blue-600 transition"
          >
            Sobre a ferramenta
          </Link>
        </div>
      </div>
    </nav>
  );
};
