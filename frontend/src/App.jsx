import React, { useState, useEffect } from "react";
import { Layout, Menu, notification } from "antd";
import {
  DashboardOutlined,
  ProjectOutlined,
  TeamOutlined,
  CalendarOutlined,
  SettingOutlined,
  BellOutlined,
} from "@ant-design/icons";

import Dashboard from "./pages/Dashboard";
import ProjectList from "./pages/ProjectList";
import TeamMembers from "./pages/TeamMembers";

import Auth from "./components/Auth";
import { supabase } from "./supabaseClient";

const { Header, Content, Footer, Sider } = Layout;

function App() {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState("dashboard");
  const [session, setSession] = useState(null);

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

    return () => subscription.unsubscribe();
  }, []);
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

  // ถ้ายังไม่ได้เข้าสู่ระบบ แสดงหน้า Auth
  if (!session) {
    return <Auth />;
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div className="logo" />
        <Menu theme="dark" selectedKeys={[selectedMenu]} mode="inline">
          <Menu.Item
            key="dashboard"
            icon={<DashboardOutlined />}
            onClick={() => setSelectedMenu("dashboard")}
          >
            แดชบอร์ด
          </Menu.Item>
          <Menu.Item
            key="projects"
            icon={<ProjectOutlined />}
            onClick={() => setSelectedMenu("projects")}
          >
            โปรเจคทั้งหมด
          </Menu.Item>
          <Menu.Item
            key="team"
            icon={<TeamOutlined />}
            onClick={() => setSelectedMenu("team")}
          >
            ทีมงาน
          </Menu.Item>
         
        </Menu>
      </Sider>
      <Layout className="site-layout">
        <Header className="site-layout-background" style={{ padding: 0 }} />
        <Content style={{ margin: "0 16px" }}>
          <div
            className="site-layout-background"
            style={{ padding: 24, minHeight: 360 }}
          >
            {renderContent()}
          </div>
        </Content>
        <Footer style={{ textAlign: "center" }}>ระบบจัดการโปรเจค ©2025</Footer>
      </Layout>
    </Layout>
  );
}

export default App;
