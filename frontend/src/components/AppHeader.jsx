// src/components/AppHeader.jsx
import React from "react";
import { Layout, Typography, Space, Avatar, Dropdown, Badge } from "antd";
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  UserOutlined,
  BellOutlined,
} from "@ant-design/icons";

const { Header } = Layout;
const { Title, Text } = Typography;

const AppHeader = ({
  collapsed,
  onToggleCollapse,
  selectedMenu,
  session,
  userMenu,
  unreadNotifications = 0,
  mobileView = false,
  onNotificationClick,
}) => {
  const getHeaderTitle = () => {
    switch (selectedMenu) {
      case "dashboard":
        return "แดชบอร์ด";
      case "projects":
        return "โปรเจคทั้งหมด";
      case "team":
        return "ทีมงาน";
      case "settings":
        return "ตั้งค่า";
      default:
        return "ระบบจัดการโปรเจค";
    }
  };

  return (
    <Header
      className="site-header"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        background: "#fff",
        boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
        position: "sticky",
        top: 0,
        zIndex: 900,
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        {React.createElement(
          collapsed ? MenuUnfoldOutlined : MenuFoldOutlined,
          {
            className: "trigger",
            onClick: onToggleCollapse,
            style: {
              fontSize: "18px",
              cursor: "pointer",
              display: mobileView ? "none" : "block", // ซ่อนบนมือถือ
            },
          }
        )}
        <Title
          level={4}
          style={{
            margin: 0,
            marginLeft: mobileView ? 0 : 12,
            fontSize: mobileView ? "18px" : "20px",
            color: "#FFFFFF",
          }}
        >
          {getHeaderTitle()}
        </Title>
      </div>

      <Space>
        {mobileView && (
          <Badge count={unreadNotifications} size="small">
            <BellOutlined
              style={{ fontSize: "20px", cursor: "pointer" }}
              onClick={onNotificationClick}
            />
          </Badge>
        )}
        <Dropdown
          menu={{ items: userMenu }}
          placement="bottomRight"
          trigger={["click"]}
        >
          <Space className="user-dropdown" style={{ cursor: "pointer" }}>
            <Avatar
              icon={<UserOutlined />}
              style={{ backgroundColor: "#1890ff" }}
            />
            {!mobileView && (
              <Text strong style={{ color: "#FFFFFF" }}>
                {session?.user?.email || "ผู้ใช้งาน"}
              </Text>
            )}
          </Space>
        </Dropdown>
      </Space>
    </Header>
  );
};

export default AppHeader;
