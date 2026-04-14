import React from "react";
import { Link } from "react-router-dom";

function Sidebar() {
    return (
        <div className="sidebar">
            <h2>🚀 Wobble CRM</h2>

            <Link to="/dashboard">📊 Dashboard</Link>
            <Link to="/register">📝 Register Case</Link>
            <Link to="/search">🔍 Search Case</Link>
        </div>
    );
}

export default Sidebar;