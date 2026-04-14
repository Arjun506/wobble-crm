import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

function Layout() {
    return (
        <div className="app-container">
            <Sidebar />

            <div style={{ flex: 1 }}>
                <Header />

                <div className="content">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

export default Layout;