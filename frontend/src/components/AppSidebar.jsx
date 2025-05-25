// src/components/AppSidebar.jsx
import React from "react";
import { Layout, Menu, Typography, Divider } from "antd";
import {
  DashboardOutlined,
  ProjectOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import projectLogo from "../assets/project-management.png";
import { useAuth } from "../context/AuthContext";

const { Sider } = Layout;
const { Title } = Typography;

const AppSidebar = ({
  collapsed,
  selectedMenu,
  onMenuSelect,
  visible = true,
}) => {
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
          onClick: () => onMenuSelect("dashboard"),
        },
        {
          key: "projects",
          icon: <ProjectOutlined />,
          label: "โปรเจคทั้งหมด",
          onClick: () => onMenuSelect("projects"),
        },
        {
          key: "team",
          icon: <TeamOutlined />,
          label: "ทีมงาน",
          onClick: () => onMenuSelect("team"),
        }
      );
    } else {
      // เมนูสำหรับ User ทั่วไป
      baseItems.push({
        key: "my-projects",
        icon: <ProjectOutlined />,
        label: "โปรเจคของฉัน",
        onClick: () => onMenuSelect("my-projects"),
      });
    }

    return baseItems;
  };

  const menuItems = getMenuItems();

  if (!visible) return null;

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      breakpoint="lg"
      width={250}
      className="app-sider"
      style={{
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 1000,
        boxShadow: "2px 0 8px rgba(0,0,0,0.15)",
      }}
    >
      <div className="logo">
        {!collapsed && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px 0",
            }}
          >
            <img
              src={projectLogo}
              alt="Project Hub Logo"
              style={{
                width: "32px",
                height: "32px",
                marginRight: "12px",
              }}
            />
            <Title
              level={4}
              style={{
                color: "white",
                margin: 0,
                fontSize: "18px",
              }}
            >
              Project Hub
            </Title>
          </div>
        )}
        {collapsed && (
          <div style={{ padding: "16px 0", textAlign: "center" }}>
            <img
              src={projectLogo}
              alt="Project Hub Logo"
              style={{
                width: "28px",
                height: "28px",
              }}
            />
          </div>
        )}
      </div>
      <Divider
        style={{ margin: "0 0 16px 0", borderColor: "rgba(255,255,255,0.1)" }}
      />

      {/* แสดงข้อมูลสิทธิ์ในกรณีที่ไม่ collapse */}
      {!collapsed && (
        <div
          style={{
            padding: "8px 16px",
            marginBottom: "8px",
            background: "rgba(255,255,255,0.1)",
            margin: "0 12px 16px 12px",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <UserOutlined style={{ marginRight: "4px" }} />
            {isAdmin ? "ผู้ดูแลระบบ" : "ผู้ใช้ทั่วไป"}
          </div>
        </div>
      )}

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedMenu]}
        className="app-menu"
        style={{ borderRight: 0 }}
        items={menuItems}
      />
    </Sider>
  );
};

export default AppSidebar;
