import { Link, useLocation } from "react-router-dom";

const AdminNavbar = () => {
  const location = useLocation();

  const links = [
    { name: "Dashboard", path: "/admin" },
    { name: "Products", path: "/admin/products" },
    { name: "Orders", path: "/admin/orders" },
    { name: "Customers", path: "/admin/customers" },
    { name: "Billing", path: "/" },
  ];

  return (
    <nav className="bg-white shadow-md p-4 mb-6 rounded-2xl flex gap-6 items-center"> 
      <h2 className="text-2xl font-black text-orange-600 mr-4 tracking-tighter">Fruteria Admin</h2>
      {links.map((link) => (
        <Link
          key={link.path}
          to={link.path}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            location.pathname === link.path
              ? "bg-green-500 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {link.name}
        </Link>
      ))}
    </nav>
  );
};

export default AdminNavbar;
