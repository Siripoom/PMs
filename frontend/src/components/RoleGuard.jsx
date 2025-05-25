// src/components/RoleGuard.jsx
import React from "react";
import { Result, Button } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";

const RoleGuard = ({
  children,
  requiredRole = null,
  requiredPermission = null,
  fallback = null,
  showFallback = true,
}) => {
  const { userRole, userPermissions, loading, user } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "200px",
        }}
      >
        <div>กำลังตรวจสอบสิทธิ์...</div>
      </div>
    );
  }

  // Check if user is logged in
  if (!user) {
    return showFallback ? (
      <Result
        status="403"
        title="กรุณาเข้าสู่ระบบ"
        subTitle="คุณต้องเข้าสู่ระบบก่อนเพื่อเข้าถึงหน้านี้"
        icon={<UserOutlined />}
      />
    ) : null;
  }

  // Check role requirement
  if (requiredRole && userRole !== requiredRole) {
    return showFallback
      ? fallback || (
          <Result
            status="403"
            title="ไม่มีสิทธิ์เข้าถึง"
            subTitle={`คุณต้องมีสิทธิ์ ${
              requiredRole === "admin" ? "ผู้ดูแลระบบ" : "ผู้ใช้"
            } เพื่อเข้าถึงหน้านี้`}
            icon={<LockOutlined />}
            extra={
              <div style={{ textAlign: "center", marginTop: 16 }}>
                <p style={{ color: "#666" }}>
                  สิทธิ์ปัจจุบันของคุณ:{" "}
                  {userRole === "admin" ? "ผู้ดูแลระบบ" : "ผู้ใช้ทั่วไป"}
                </p>
              </div>
            }
          />
        )
      : null;
  }

  // Check permission requirement
  if (requiredPermission && !userPermissions[requiredPermission]) {
    return showFallback
      ? fallback || (
          <Result
            status="403"
            title="ไม่มีสิทธิ์ในการดำเนินการ"
            subTitle="คุณไม่มีสิทธิ์ในการเข้าถึงฟีเจอร์นี้"
            icon={<LockOutlined />}
          />
        )
      : null;
  }

  // User has required permissions
  return children;
};

// Helper components for common use cases
export const AdminOnly = ({ children, fallback, showFallback = true }) => (
  <RoleGuard
    requiredRole="admin"
    fallback={fallback}
    showFallback={showFallback}
  >
    {children}
  </RoleGuard>
);

export const UserOnly = ({ children, fallback, showFallback = true }) => (
  <RoleGuard
    requiredRole="user"
    fallback={fallback}
    showFallback={showFallback}
  >
    {children}
  </RoleGuard>
);

export const PermissionGuard = ({
  children,
  permission,
  fallback,
  showFallback = true,
}) => (
  <RoleGuard
    requiredPermission={permission}
    fallback={fallback}
    showFallback={showFallback}
  >
    {children}
  </RoleGuard>
);

// Hook for checking permissions in components
export const usePermissions = () => {
  const { userPermissions, userRole } = useAuth();

  const hasPermission = (permission) => {
    return userPermissions[permission] || false;
  };

  const isAdmin = () => {
    return userRole === "admin";
  };

  const isUser = () => {
    return userRole === "user";
  };

  return {
    hasPermission,
    isAdmin,
    isUser,
    permissions: userPermissions,
    role: userRole,
  };
};

export default RoleGuard;
