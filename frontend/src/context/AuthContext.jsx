// src/contexts/AuthContext.jsx (เวอร์ชันเรียบง่ายสำหรับทดสอบ)
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userPermissions, setUserPermissions] = useState({});

  // Admin email
  const ADMIN_EMAIL = "artorsiriratpoom@gmail.com";

  useEffect(() => {
    console.log("🔄 AuthProvider: Starting initialization...");

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log("🔍 AuthProvider: Getting initial session...");
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("❌ AuthProvider: Error getting session:", error);
          return;
        }

        console.log(
          "📋 AuthProvider: Session data:",
          session ? "Found" : "Not found"
        );
        setSession(session);

        if (session?.user) {
          console.log("👤 AuthProvider: User found, setting up user data...");
          setupUserData(session.user);
        }
      } catch (error) {
        console.error(
          "❌ AuthProvider: Exception in getInitialSession:",
          error
        );
      } finally {
        setLoading(false);
        console.log("✅ AuthProvider: Initial setup complete");
      }
    };

    getInitialSession();

    // Listen for auth changes
    console.log("👂 AuthProvider: Setting up auth state listener...");
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔔 AuthProvider: Auth state changed:", event);

      setSession(session);
      if (session?.user) {
        console.log(
          "👤 AuthProvider: User found in auth change, setting up..."
        );
        setupUserData(session.user);
      } else {
        console.log("❌ AuthProvider: No user in auth change, clearing data");
        setUser(null);
        setUserRole(null);
        setUserPermissions({});
      }
      setLoading(false);
    });

    return () => {
      console.log("🧹 AuthProvider: Cleanup");
      subscription.unsubscribe();
    };
  }, []);

  const setupUserData = (authUser) => {
    try {
      console.log("⚙️ AuthProvider: Setting up user data for:", authUser.email);
      setUser(authUser);

      // Determine user role based on email only
      const role = authUser.email === ADMIN_EMAIL ? "admin" : "user";
      console.log("🎭 AuthProvider: User role determined:", role);
      setUserRole(role);

      // Set permissions based on role
      const permissions = {
        canViewAllProjects: role === "admin",
        canCreateProjects: role === "admin",
        canEditAllProjects: role === "admin",
        canDeleteProjects: role === "admin",
        canManageTeam: role === "admin",
        canViewTeam: true,
        canViewDashboard: true,
        canViewAssignedProjects: true,
        canEditAssignedProjects: role === "admin",
        canUploadFiles: role === "admin",
        canManageSettings: role === "admin",
      };

      console.log("🔐 AuthProvider: Permissions set:", permissions);
      setUserPermissions(permissions);

      console.log("✅ AuthProvider: User setup completed");
      setLoading(false);
    } catch (error) {
      console.error("❌ AuthProvider: Error setting up user data:", error);
      setLoading(false);
    }
  };

  // ฟังก์ชันทดสอบที่เรียบง่าย - ดึงโปรเจคโดยตรง
  const getAssignedProjects = async () => {
    if (!user) {
      console.log("❌ getAssignedProjects: No user");
      return [];
    }

    try {
      console.log("🔍 getAssignedProjects: Fetching projects - Simple mode");

      // ทดสอบด้วย query ที่เรียบง่ายที่สุด
      const { data: projects, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("❌ getAssignedProjects: Error:", error);
        throw error;
      }

      console.log(
        "✅ getAssignedProjects: Success! Found",
        projects?.length || 0,
        "projects"
      );

      // แสดงข้อมูลโปรเจคที่ได้
      if (projects && projects.length > 0) {
        console.log("📊 Sample project:", projects[0]);
      }

      return projects || [];
    } catch (error) {
      console.error("❌ getAssignedProjects: Exception:", error);
      return [];
    }
  };

  // ฟังก์ชันทดสอบ team members
  const getTeamMembers = async () => {
    if (!user || userRole !== "admin") {
      console.log("❌ getTeamMembers: No permission or no user");
      return [];
    }

    try {
      console.log("🔍 getTeamMembers: Fetching team members - Simple mode");

      const { data: teamMembers, error } = await supabase
        .from("team_members")
        .select("*")
        .order("name");

      if (error) {
        console.error("❌ getTeamMembers: Error:", error);
        throw error;
      }

      console.log(
        "✅ getTeamMembers: Success! Found",
        teamMembers?.length || 0,
        "members"
      );

      return teamMembers || [];
    } catch (error) {
      console.error("❌ getTeamMembers: Exception:", error);
      return [];
    }
  };

  const canAccessProject = (project) => {
    // สำหรับการทดสอบ - admin เข้าถึงได้ทุกโปรเจค
    return userRole === "admin";
  };

  const signOut = async () => {
    try {
      console.log("🚪 AuthProvider: Signing out...");
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setSession(null);
      setUserRole(null);
      setUserPermissions({});
      console.log("✅ AuthProvider: Signed out successfully");
    } catch (error) {
      console.error("❌ AuthProvider: Error signing out:", error);
      throw error;
    }
  };

  const value = {
    user,
    session,
    userRole,
    userPermissions,
    loading,
    isAdmin: userRole === "admin",
    isUser: userRole === "user",
    getAssignedProjects,
    getTeamMembers,
    canAccessProject,
    signOut,
    ADMIN_EMAIL,
  };

  console.log("📊 AuthProvider: Current state:", {
    hasUser: !!user,
    userEmail: user?.email,
    userRole,
    loading,
    isAdmin: userRole === "admin",
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
