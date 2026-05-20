import { Link, useLocation } from "react-router-dom";

const AdminNavbar = () => {
  const location = useLocation();

  const links = [
    { name: "Dashboard", path: "/admin" },
    { name: "Products", path: "/admin/products" },
    { name: "Orders", path: "/admin/orders" },
    { name: "Purchase", path: "/admin/purchase" },
    { name: "Customers", path: "/admin/customers" },
    { name: "Billing", path: "/" },
  ];

  return (
    <nav className="bg-slate-950/90 shadow-xl p-4 mb-6 rounded-2xl flex flex-wrap gap-4 sm:gap-6 items-center border border-slate-700/70"> 
      <h2 className="text-xl sm:text-2xl font-black text-amber-300 mr-2 sm:mr-4 tracking-tighter">Fruteria Admin</h2>
      {links.map((link) => (
        <Link
          key={link.path}
          to={link.path}
          style={{ textDecoration: 'none' }}
          className={`px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all text-sm sm:text-base ${
            location.pathname === link.path
              ? "bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-slate-950 shadow-lg"
              : "text-slate-200 hover:bg-slate-800/70 hover:text-amber-300"
          }`}
        >
          {link.name}
        </Link>
      ))}
    </nav>
  );
};

export default AdminNavbar;
