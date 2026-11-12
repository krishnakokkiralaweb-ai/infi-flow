
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import AdminNavbar from "../components/AdminNavbar";
import "./AdminLayout.css";
import usePageTitle from "../../hooks/usePageTitle";

function AdminLayout() {
  usePageTitle("Admin");

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="admin-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation menu"
          onClick={closeSidebar}
        />
      )}

      <div className="admin-main">
        <AdminNavbar
          onMenuClick={() => setSidebarOpen((prev) => !prev)}
        />

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
