import React, { useState, useEffect } from "react";
import {
  Layout,
  Menu,
  Avatar,
  Badge,
  Dropdown,
  Typography,
  Space,
  Divider,
  notification,
} from "antd";
import {
  DashboardOutlined,
  ProjectOutlined,
  TeamOutlined,
  CalendarOutlined,
  SettingOutlined,
  BellOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  UserOutlined,
  LogoutOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";

import Dashboard from "./pages/Dashboard";
import ProjectList from "./pages/ProjectList";
import TeamMembers from "./pages/TeamMembers";

import Auth from "./components/Auth";
import { supabase } from "./supabaseClient";

import "./App.css";

const { Header, Content, Footer, Sider } = Layout;
const { Title, Text } = Typography;

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState("dashboard");
  const [session, setSession] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [mobileView, setMobileView] = useState(window.innerWidth <= 768);

  useEffect(() => {
    // ตรวจสอบการเข้าสู่ระบบเมื่อ App โหลด
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // ฟังก์ชันการเปลี่ยนแปลงเซสชัน
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // ดึงจำนวนการแจ้งเตือนที่ยังไม่ได้อ่าน
    fetchUnreadNotifications();

    // ตรวจสอบขนาดหน้าจอเมื่อมีการ resize
    const handleResize = () => {
      const isMobile = window.innerWidth <= 768;
      setMobileView(isMobile);
      if (isMobile && !collapsed) {
        setCollapsed(true);
      }
    };

    window.addEventListener("resize", handleResize);
    // เรียกฟังก์ชันครั้งแรกเพื่อตั้งค่าเริ่มต้น
    handleResize();

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // ดึงจำนวนการแจ้งเตือนที่ยังไม่ได้อ่าน
  const fetchUnreadNotifications = async () => {
    if (!session) return;

    try {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact" })
        .eq("user_id", session.user.id)
        .eq("read", false);

      if (error) throw error;

      setUnreadNotifications(count || 0);
    } catch (error) {
      console.error("Error fetching unread notifications:", error);
    }
  };

  const handleMenuSelect = (key) => {
    setSelectedMenu(key);

    // ปิด Sider ในกรณีที่เป็นมือถือเมื่อกดเมนู
    if (mobileView) {
      setCollapsed(true);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      notification.success({
        message: "ออกจากระบบสำเร็จ",
        description: "คุณได้ออกจากระบบเรียบร้อยแล้ว",
      });
    } catch (error) {
      console.error("Error logging out:", error);
      notification.error({
        message: "ไม่สามารถออกจากระบบได้",
        description: error.message,
      });
    }
  };

  // เมนูสำหรับ dropdown ของผู้ใช้
  const userMenu = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "ข้อมูลส่วนตัว",
      onClick: () =>
        notification.info({
          message: "กำลังพัฒนา",
          description: "ฟีเจอร์นี้กำลังอยู่ระหว่างการพัฒนา",
        }),
    },
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "ตั้งค่า",
      onClick: () => handleMenuSelect("settings"),
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "ออกจากระบบ",
      danger: true,
      onClick: handleLogout,
    },
  ];

  const renderContent = () => {
    switch (selectedMenu) {
      case "dashboard":
        return <Dashboard />;
      case "projects":
        return <ProjectList />;
      case "team":
        return <TeamMembers />;
      default:
        return <Dashboard />;
    }
  };

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

  // ถ้ายังไม่ได้เข้าสู่ระบบ แสดงหน้า Auth
  if (!session) {
    return <Auth />;
  }

  return (
    <Layout className="app-layout">
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
            <Title
              level={4}
              style={{ color: "white", margin: "16px 0", textAlign: "center" }}
            >
              <AppstoreOutlined /> Project Hub
            </Title>
          )}
          {collapsed && (
            <div style={{ padding: "16px 0", textAlign: "center" }}>
              <AppstoreOutlined style={{ color: "white", fontSize: "24px" }} />
            </div>
          )}
        </div>
        <Divider
          style={{ margin: "0 0 16px 0", borderColor: "rgba(255,255,255,0.1)" }}
        />
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedMenu]}
          className="app-menu"
          style={{ borderRight: 0 }}
          items={[
            {
              key: "dashboard",
              icon: <DashboardOutlined />,
              label: "แดชบอร์ด",
              onClick: () => handleMenuSelect("dashboard"),
            },
            {
              key: "projects",
              icon: <ProjectOutlined />,
              label: "โปรเจคทั้งหมด",
              onClick: () => handleMenuSelect("projects"),
            },
            {
              key: "team",
              icon: <TeamOutlined />,
              label: "ทีมงาน",
              onClick: () => handleMenuSelect("team"),
            },
          ]}
        />
      </Sider>

      <Layout
        className="site-layout"
        style={{ marginLeft: collapsed ? 80 : 250, transition: "all 0.2s" }}
      >
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
                onClick: () => setCollapsed(!collapsed),
                style: { fontSize: "18px", cursor: "pointer" },
              }
            )}
            <Title
              level={4}
              style={{
                margin: 0,
                marginLeft: 12,
                display: mobileView ? "none" : "block",
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
                  onClick={() => handleMenuSelect("notifications")}
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
                  <Text strong>{session?.user?.email || "ผู้ใช้งาน"}</Text>
                )}
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content
          className="site-content"
          style={{
            margin: mobileView ? "16px 8px" : "24px 16px",
            minHeight: "calc(100vh - 64px - 24px - 24px - 69px)",
            background: "#fff",
            padding: mobileView ? 16 : 24,
            borderRadius: 8,
          }}
        >
          {renderContent()}
        </Content>

        <Footer
          style={{
            textAlign: "center",
            padding: "12px 50px",
            color: "rgba(0, 0, 0, 0.45)",
          }}
        >
          Project Hub ©{new Date().getFullYear()} | พัฒนาด้วย ❤️
        </Footer>
      </Layout>
    </Layout>
  );
}

export default App;
