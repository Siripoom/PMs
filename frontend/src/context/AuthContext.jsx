// ✅ AuthContext.jsx (สมบูรณ์)
import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userPermissions, setUserPermissions] = useState({});
  const [userEmail, setUserEmail] = useState(null);

  const ADMIN_EMAIL = "artorsiriratpoom@gmail.com";

  useEffect(() => {
    const getInitialSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (session?.user) {
        setupUserData(session.user);
        setSession(session);
      }
      setLoading(false);
    };

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session?.user) {
        setupUserData(session.user);
      } else {
        setUser(null);
        setUserRole(null);
        setUserPermissions({});
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const setupUserData = (authUser) => {
    setUser(authUser);
    setUserEmail(authUser.email);
    const role = authUser.email === ADMIN_EMAIL ? "admin" : "user";
    setUserRole(role);

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

    setUserPermissions(permissions);
  };

  const getAssignedProjects = async () => {
    if (!user) return [];

    try {
      const { data: projects, error } = await supabase
        .from("projects")
        .select(
          `
          *,
          assignments:team_project_assignments(
            id,
            role,
            team_member:team_members(id, name, email)
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (userRole === "admin") return projects || [];

      const assignedProjects = (projects || []).filter((project) =>
        project.assignments.some((a) => a.team_member?.email === user.email)
      );

      const projectsWithRole = assignedProjects.map((project) => {
        const match = project.assignments.find(
          (a) => a.team_member?.email === user.email
        );
        return {
          ...project,
          user_assignment_role: match?.role || "สมาชิกทีม",
        };
      });

      return projectsWithRole;
    } catch (error) {
      console.error("❌ getAssignedProjects: Error", error);
      return [];
    }
  };

  const getTeamMembers = async () => {
    if (!user || userRole !== "admin") return [];

    try {
      const { data: teamMembers, error } = await supabase
        .from("team_members")
        .select(
          `
          *,
          assignments:team_project_assignments(
            id,
            role,
            project_id,
            project:projects(id, name)
          )
        `
        )
        .order("name");

      if (error) throw error;
      return teamMembers || [];
    } catch (error) {
      console.error("❌ getTeamMembers: Error", error);
      return [];
    }
  };
  const updateProjectStatus = async (projectId, newStatus) => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({ status: newStatus })
        .eq("id", projectId);

      if (error) throw error;
      console.log("✅ updateProjectStatus: Updated successfully");
      return true;
    } catch (error) {
      console.error("❌ updateProjectStatus:", error.message);
      return false;
    }
  };

  const canAccessProject = (project) => {
    if (!project || !user) return false;
    if (userRole === "admin") return true;
    return project.assignments?.some(
      (a) => a.team_member?.email === user.email
    );
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setSession(null);
    setUserRole(null);
    setUserPermissions({});
  };

  const value = {
    user,
    session,
    userRole,
    userPermissions,
    updateProjectStatus,
    loading,
    isAdmin: userRole === "admin",
    isUser: userRole === "user",
    getAssignedProjects,
    getTeamMembers,
    canAccessProject,
    signOut,
    ADMIN_EMAIL,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
