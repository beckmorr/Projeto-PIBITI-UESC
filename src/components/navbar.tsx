import { Link } from "react-router-dom";
import { NAVBAR_ITEMS } from "../constants/navigation";

export const Navbar = () => {
  return (
    <nav className="w-full bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-x-10">
          {NAVBAR_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};
