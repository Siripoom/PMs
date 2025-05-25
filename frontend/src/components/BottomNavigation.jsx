// src/components/BottomNavigation.jsx
import React from "react";
import {
  DashboardOutlined,
  ProjectOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";

const BottomNavigation = ({ selectedMenu, onMenuSelect, session }) => {
  const { isAdmin } = useAuth();

  // กำหนดเมนูตามสิทธิ์ของผู้ใช้
  const getMenuItems = () => {
    const baseItems = [];

    if (isAdmin) {
      // เมนูสำหรับ Admin
      baseItems.push(
        {
          key: "dashboard",
          icon: <DashboardOutlined />,
          label: "แดชบอร์ด",
        },
        {
          key: "projects",
          icon: <ProjectOutlined />,
          label: "โปรเจค",
        },
        {
          key: "team",
          icon: <TeamOutlined />,
          label: "ทีม",
        }
      );
    } else {
      // เมนูสำหรับ User ทั่วไป
      baseItems.push({
        key: "my-projects",
        icon: <ProjectOutlined />,
        label: "โปรเจค",
      });
    }

    // เพิ่มเมนูโปรไฟล์สำหรับทุกคน
    baseItems.push({
      key: "profile",
      icon: <UserOutlined />,
      label: "โปรไฟล์",
    });

    return baseItems;
  };

  const menuItems = getMenuItems();

  return (
    <div
      className="bottom-navigation"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "70px",
        background: "#fff",
        borderTop: "1px solid #e8e8e8",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        zIndex: 1000,
        padding: "8px 0",
        boxShadow: "0 -2px 8px rgba(0,0,0,0.1)",
      }}
    >
      {menuItems.map((item) => (
        <div
          key={item.key}
          onClick={() => onMenuSelect(item.key)}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            padding: "4px 8px",
            minWidth: "60px",
            borderRadius: "8px",
            transition: "all 0.2s",
            backgroundColor:
              selectedMenu === item.key ? "#e6f7ff" : "transparent",
            color: selectedMenu === item.key ? "#1890ff" : "#666",
          }}
        >
          <div
            style={{
              fontSize: "20px",
              marginBottom: "4px",
              color: selectedMenu === item.key ? "#1890ff" : "#666",
            }}
          >
            {item.icon}
          </div>
          <span
            style={{
              fontSize: "12px",
              fontWeight: selectedMenu === item.key ? "600" : "400",
              color: selectedMenu === item.key ? "#1890ff" : "#666",
            }}
          >
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default BottomNavigation;
