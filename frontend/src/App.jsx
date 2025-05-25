import React, { useState, useEffect } from "react";
import { Layout, notification, Spin } from "antd";
import {
  SettingOutlined,
  UserOutlined,
  LogoutOutlined,
} from "@ant-design/icons";

import Dashboard from "./pages/Dashboard";
import ProjectList from "./pages/ProjectList";
import TeamMembers from "./pages/TeamMembers";
import MyProjects from "./pages/MyProjects";

import Auth from "./components/Auth";
import AppSidebar from "./components/AppSidebar";
import AppHeader from "./components/AppHeader";
import BottomNavigation from "./components/BottomNavigation";
import { AuthProvider, useAuth } from "./context/AuthContext";

import "./App.css";
// Import the new CSS enhancements
import "./style/dashboard-enhancements.css";

const { Content, Footer } = Layout;

// Main App Content Component
const AppContent = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState("");
  const [mobileView, setMobileView] = useState(window.innerWidth <= 768);

  const { user, session, loading, signOut, userRole, isAdmin } = useAuth();

  // ตั้งค่าหน้าเริ่มต้นตามสิทธิ์
  useEffect(() => {
    if (user && !selectedMenu) {
      if (isAdmin) {
        setSelectedMenu("dashboard");
      } else {
        setSelectedMenu("my-projects");
      }
    }
  }, [user, isAdmin, selectedMenu]);

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth <= 768;
      setMobileView(isMobile);
      if (isMobile && !collapsed) {
        setCollapsed(true);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [collapsed]);

  const handleMenuSelect = (key) => {
    setSelectedMenu(key);

    // ปิด Sidebar ในกรณีที่เป็นมือถือเมื่อกดเมนู
    if (mobileView) {
      setCollapsed(true);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
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

  const handleNotificationClick = () => {
    handleMenuSelect("notifications");
  };

  // เมนูสำหรับ dropdown ของผู้ใช้
  const userMenu = [
    {
      key: "profile",
      icon: <UserOutlined />,
      label: "ข้อมูลส่วนตัว",
      onClick: () => handleMenuSelect("profile"),
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
      key: "role-info",
      label: (
        <div style={{ color: "#666", fontSize: "12px" }}>
          สิทธิ์: {isAdmin ? "ผู้ดูแลระบบ" : "ผู้ใช้ทั่วไป"}
        </div>
      ),
      disabled: true,
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

  const getHeaderTitle = () => {
    switch (selectedMenu) {
      case "dashboard":
        return "แดชบอร์ด";
      case "projects":
        return "โปรเจคทั้งหมด";
      case "my-projects":
        return "โปรเจคของฉัน";
      case "team":
        return "ทีมงาน";
      case "profile":
        return "ข้อมูลส่วนตัว";
      case "settings":
        return "ตั้งค่า";
      default:
        return "ระบบจัดการโปรเจค";
    }
  };

  const renderContent = () => {
    switch (selectedMenu) {
      case "dashboard":
        // เฉพาะ Admin เท่านั้น
        return isAdmin ? (
          <Dashboard onNavigate={handleMenuSelect} />
        ) : (
          <MyProjects />
        );

      case "projects":
        // เฉพาะ Admin เท่านั้น
        return isAdmin ? <ProjectList /> : <MyProjects />;

      case "my-projects":
        return <MyProjects />;

      case "team":
        return <TeamMembers />;

      case "profile":
        return (
          <div style={{ textAlign: "center", padding: "50px" }}>
            <h2>ข้อมูลส่วนตัว</h2>
            <div
              style={{
                marginTop: 20,
                padding: 20,
                background: "#f5f5f5",
                borderRadius: 8,
                maxWidth: 500,
                margin: "20px auto",
              }}
            >
              <p>
                <strong>อีเมล:</strong> {user?.email}
              </p>
              <p>
                <strong>สิทธิ์:</strong>{" "}
                {isAdmin ? "ผู้ดูแลระบบ" : "ผู้ใช้ทั่วไป"}
              </p>
              <p>
                <strong>เข้าสู่ระบบเมื่อ:</strong>{" "}
                {new Date(
                  session?.user?.last_sign_in_at || new Date()
                ).toLocaleString("th-TH")}
              </p>
              <p>
                <strong>สร้างบัญชีเมื่อ:</strong>{" "}
                {new Date(
                  session?.user?.created_at || new Date()
                ).toLocaleString("th-TH")}
              </p>
            </div>
            <p style={{ color: "#666", marginTop: 20 }}>
              ฟีเจอร์การจัดการโปรไฟล์กำลังอยู่ระหว่างการพัฒนา
            </p>
          </div>
        );
      case "settings":
        return (
          <div style={{ textAlign: "center", padding: "50px" }}>
            <h2>ตั้งค่าระบบ</h2>
            <p style={{ color: "#666" }}>
              ฟีเจอร์การตั้งค่ากำลังอยู่ระหว่างการพัฒนา
            </p>
            <div
              style={{
                marginTop: 20,
                padding: 20,
                background: "#f0f4ff",
                borderRadius: 8,
                maxWidth: 400,
                margin: "20px auto",
              }}
            >
              <h4>ข้อมูลระบบ</h4>
              <p>
                <strong>เวอร์ชัน:</strong> 1.0.0
              </p>
              <p>
                <strong>สิทธิ์ของคุณ:</strong> {isAdmin ? "Admin" : "User"}
              </p>
              <p>
                <strong>ธีม:</strong> Modern Light
              </p>
            </div>
          </div>
        );
      case "notifications":
        return (
          <div style={{ textAlign: "center", padding: "50px" }}>
            <h2>การแจ้งเตือน</h2>
            <p style={{ color: "#666" }}>
              ฟีเจอร์การแจ้งเตือนกำลังอยู่ระหว่างการพัฒนา
            </p>
          </div>
        );
      default:
        return isAdmin ? (
          <Dashboard onNavigate={handleMenuSelect} />
        ) : (
          <MyProjects />
        );
    }
  };

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          flexDirection: "column",
          background: "#f0f2f5",
        }}
      >
        <Spin size="large" />
        <p style={{ marginTop: 16, color: "#666" }}>กำลังโหลดระบบ...</p>
      </div>
    );
  }

  // ถ้ายังไม่ได้เข้าสู่ระบบ แสดงหน้า Auth
  if (!session) {
    return <Auth />;
  }

  return (
    <Layout className="app-layout">
      {/* Sidebar สำหรับเดสก์ท็อป */}
      <AppSidebar
        collapsed={collapsed}
        selectedMenu={selectedMenu}
        onMenuSelect={handleMenuSelect}
        visible={!mobileView}
      />

      <Layout
        className="site-layout"
        style={{
          marginLeft: !mobileView ? (collapsed ? 80 : 250) : 0,
          transition: "all 0.2s",
          marginBottom: mobileView ? "70px" : 0,
        }}
      >
        <AppHeader
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          selectedMenu={selectedMenu}
          session={session}
          userMenu={userMenu}
          unreadNotifications={0}
          mobileView={mobileView}
          onNotificationClick={handleNotificationClick}
          headerTitle={getHeaderTitle()}
        />

        <Content
          className="site-content"
          style={{
            margin: mobileView ? "16px 8px" : "24px 16px",
            minHeight: mobileView
              ? "calc(100vh - 64px - 70px - 32px)"
              : "calc(100vh - 64px - 24px - 24px - 69px)",
            background: "#fff",
            padding: mobileView ? 16 : 24,
            borderRadius: 8,
          }}
        >
          {renderContent()}
        </Content>

        {!mobileView && (
          <Footer
            style={{
              textAlign: "center",
              padding: "12px 50px",
              color: "rgba(0, 0, 0, 0.45)",
            }}
          >
            Project Hub ©{new Date().getFullYear()} | พัฒนาด้วย ❤️
            {isAdmin && (
              <span style={{ marginLeft: 16, color: "#1890ff" }}>
                • Admin Mode
              </span>
            )}
          </Footer>
        )}
      </Layout>

      {/* Bottom Navigation สำหรับมือถือ */}
      {mobileView && (
        <BottomNavigation
          selectedMenu={selectedMenu}
          onMenuSelect={handleMenuSelect}
        />
      )}
    </Layout>
  );
};

// Main App component with AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
