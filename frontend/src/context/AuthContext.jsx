// src/contexts/AuthContext.jsx (Simple Version - ไม่ใช้ database)
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

  const getAssignedProjects = async () => {
    if (!user) {
      console.log("❌ getAssignedProjects: No user");
      return [];
    }

    try {
      console.log(
        "🔍 getAssignedProjects: Fetching projects for role:",
        userRole
      );

      if (userRole === "admin") {
        console.log("👑 getAssignedProjects: Admin - fetching all projects");
        // Admin can see all projects
        const { data, error } = await supabase
          .from("projects")
          .select(
            `
            *,
            tasks:tasks(*),
            assignments:team_project_assignments(
              id,
              role,
              team_member:team_members(id, name, email)
            )
          `
          )
          .order("created_at", { ascending: false });

        if (error) {
          console.error(
            "❌ getAssignedProjects: Error fetching admin projects:",
            error
          );
          return [];
        }

        console.log(
          "✅ getAssignedProjects: Admin projects fetched:",
          data?.length || 0
        );
        return data || [];
      } else {
        console.log(
          "👤 getAssignedProjects: User - fetching assigned projects"
        );
        // For regular users, try to get assigned projects
        try {
          const { data, error } = await supabase
            .from("team_project_assignments")
            .select(
              `
              project_id,
              role,
              project:projects(
                *,
                tasks:tasks(*),
                assignments:team_project_assignments(
                  id,
                  role,
                  team_member:team_members(id, name, email)
                )
              ),
              team_member:team_members!inner(*)
            `
            )
            .eq("team_members.email", user.email);

          if (error) {
            console.error(
              "❌ getAssignedProjects: Error fetching user projects:",
              error
            );
            return [];
          }

          // Extract projects from assignments
          const projects = (data || [])
            .filter((assignment) => assignment.project)
            .map((assignment) => ({
              ...assignment.project,
              user_assignment_role: assignment.role,
            }));

          console.log(
            "✅ getAssignedProjects: User projects fetched:",
            projects.length
          );
          return projects;
        } catch (error) {
          console.error(
            "❌ getAssignedProjects: Table might not exist:",
            error
          );
          return [];
        }
      }
    } catch (error) {
      console.error("❌ getAssignedProjects: Exception:", error);
      return [];
    }
  };

  const getTeamMembers = async () => {
    if (!user) {
      console.log("❌ getTeamMembers: No user");
      return [];
    }

    try {
      console.log(
        "🔍 getTeamMembers: Fetching team members for role:",
        userRole
      );

      if (userRole === "admin") {
        // Admin can see all team members
        const { data, error } = await supabase
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

        if (error) {
          console.error(
            "❌ getTeamMembers: Error fetching admin team members:",
            error
          );
          return [];
        }

        console.log(
          "✅ getTeamMembers: Admin team members fetched:",
          data?.length || 0
        );
        return data || [];
      } else {
        // For regular users, return empty array for now
        console.log("👤 getTeamMembers: User - returning empty array");
        return [];
      }
    } catch (error) {
      console.error("❌ getTeamMembers: Exception:", error);
      return [];
    }
  };

  const canAccessProject = (project) => {
    if (userRole === "admin") return true;

    // Check if user is assigned to this project
    if (project.assignments) {
      return project.assignments.some(
        (assignment) => assignment.team_member?.email === user?.email
      );
    }

    return false;
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
