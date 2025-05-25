import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Statistic,
  Progress,
  List,
  Tag,
  Divider,
  Spin,
  Empty,
  Alert,
  Timeline,
  Button,
  Tabs,
} from "antd";
import {
  ProjectOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  DollarOutlined,
  TeamOutlined,
  CalendarOutlined,
  FileOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SyncOutlined,
  RightOutlined,
  BarChartOutlined,
  UserOutlined,
  LockOutlined,
} from "@ant-design/icons";
import moment from "moment";
import "moment/locale/th";
import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { AdminOnly, PermissionGuard } from "../components/RoleGuard";
import MonthlySummary from "../components/MounthlySummary";

const Dashboard = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    completedProjects: 0,
    inProgressProjects: 0,
    delayedProjects: 0,
    totalBudget: 0,
    activeBudget: 0,
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [activities, setActivities] = useState([]);
  const [delayedProjectsList, setDelayedProjectsList] = useState([]);

  const { userRole, isAdmin, getAssignedProjects, canAccessProject, user } =
    useAuth();

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, userRole]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // ดึงข้อมูลโปรเจคตามสิทธิ์ของผู้ใช้
      const projects = await getAssignedProjects();

      // ดึงข้อมูลกิจกรรมล่าสุด (สำหรับ Admin เท่านั้น) - แยก query
      let activities = [];
      if (isAdmin) {
        try {
          // ดึงข้อมูล activities แยกจากโปรเจค
          const { data: activitiesData, error: activitiesError } =
            await supabase
              .from("activities")
              .select("*")
              .order("created_at", { ascending: false })
              .limit(10);

          if (activitiesError) {
            console.error("Error fetching activities:", activitiesError);
          } else {
            // ดึงข้อมูลโปรเจคแยกสำหรับ activities
            const { data: projectsData, error: projectsError } = await supabase
              .from("projects")
              .select("id, name");

            if (!projectsError && projectsData) {
              // รวมข้อมูลใน JavaScript
              activities = (activitiesData || []).map((activity) => {
                const project = projectsData.find(
                  (p) => p.id === activity.project_id
                );
                return {
                  ...activity,
                  project: project ? { name: project.name } : null,
                };
              });
            } else {
              activities = activitiesData || [];
            }
          }
        } catch (error) {
          console.error("Error fetching activities:", error);
        }
      }

      // คำนวณสถิติต่างๆ
      const totalProjects = projects.length;
      const completedProjects = projects.filter(
        (p) => p.status === "done"
      ).length;
      const inProgressProjects = projects.filter(
        (p) => p.status === "in-progress"
      ).length;

      // กรองโปรเจคที่ล่าช้า
      const delayedProjects = projects.filter((p) => p.status === "delay");
      const delayedProjectsCount = delayedProjects.length;

      setDelayedProjectsList(delayedProjects);

      // คำนวณงบประมาณ (สำหรับ Admin เท่านั้น)
      let totalBudget = 0;
      let activeBudget = 0;

      if (isAdmin) {
        totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
        activeBudget = projects
          .filter((p) => p.status !== "done")
          .reduce((sum, p) => sum + (p.budget || 0), 0);
      }

      // กรองโปรเจคที่ใกล้ถึงกำหนด (ภายใน 7 วัน)
      const upcoming = projects
        .filter((p) => {
          if (p.status === "done") return false;
          const daysLeft = moment(p.end_date).diff(moment(), "days");
          return daysLeft >= 0 && daysLeft <= 7;
        })
        .sort((a, b) => moment(a.end_date).diff(moment(b.end_date)))
        .slice(0, 5)
        .map((p) => ({
          ...p,
          daysLeft: moment(p.end_date).diff(moment(), "days"),
        }));

      setStats({
        totalProjects,
        completedProjects,
        inProgressProjects,
        delayedProjects: delayedProjectsCount,
        totalBudget,
        activeBudget,
      });

      setRecentProjects(projects.slice(0, 5));
      setUpcomingDeadlines(upcoming);
      setActivities(activities);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    switch (status) {
      case "todo":
        return <Tag color="default">Todo</Tag>;
      case "in-progress":
        return <Tag color="processing">In Progress</Tag>;
      case "done":
        return <Tag color="success">Done</Tag>;
      case "delay":
        return <Tag color="error">Delay</Tag>;
      case "maintenance":
        return <Tag color="warning">Maintenance</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "create":
        return <ProjectOutlined style={{ color: "#52c41a" }} />;
      case "update":
        return <FileOutlined style={{ color: "#1890ff" }} />;
      case "status_change":
        return <SyncOutlined style={{ color: "#fa8c16" }} />;
      case "deadline_approaching":
        return <ClockCircleOutlined style={{ color: "#fa8c16" }} />;
      case "deadline_passed":
        return <WarningOutlined style={{ color: "#f5222d" }} />;
      default:
        return <FileOutlined />;
    }
  };

  const showDelayedProjects = () => {
    import("antd").then(({ Modal }) => {
      Modal.info({
        title: "โปรเจคที่ล่าช้า",
        width: 700,
        content: (
          <div style={{ maxHeight: "60vh", overflow: "auto" }}>
            <List
              itemLayout="horizontal"
              dataSource={delayedProjectsList}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button
                      type="link"
                      size="small"
                      onClick={() => {
                        Modal.destroyAll();

                        if (typeof onNavigate === "function") {
                          onNavigate("projects", item.id);
                        } else {
                          localStorage.setItem("viewProjectId", item.id);
                          alert(
                            `กรุณาไปที่หน้าโปรเจคและเปิดดูรายละเอียดของโปรเจค ${item.name}`
                          );
                        }
                      }}
                      disabled={!canAccessProject(item)}
                    >
                      {canAccessProject(item) ? "ดูรายละเอียด" : "ไม่มีสิทธิ์"}
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      !canAccessProject(item) ? (
                        <LockOutlined />
                      ) : (
                        <ProjectOutlined />
                      )
                    }
                    title={
                      <div>
                        {item.name}
                        {!isAdmin && (
                          <Tag
                            size="small"
                            color="blue"
                            style={{ marginLeft: 8 }}
                          >
                            {item.user_assignment_role || "ผู้ร่วมงาน"}
                          </Tag>
                        )}
                      </div>
                    }
                    description={
                      <>
                        <div>เจ้าของโปรเจค: {item.owner_name}</div>
                        <div>
                          วันสิ้นสุด:{" "}
                          {moment(item.end_date).format("DD/MM/YYYY")}
                        </div>
                        <div>
                          ล่าช้า:{" "}
                          <Tag color="error">
                            {Math.abs(
                              moment(item.end_date).diff(moment(), "days")
                            )}{" "}
                            วัน
                          </Tag>
                        </div>
                      </>
                    }
                  />
                </List.Item>
              )}
            />
          </div>
        ),
        onOk() {},
      });
    });
  };

  const viewAllProjects = () => {
    if (typeof onNavigate === "function") {
      onNavigate("projects");
    }
  };

  const viewAllUpcoming = () => {
    if (typeof onNavigate === "function") {
      onNavigate("projects", null, { filter: "upcoming" });
    }
  };

  // สร้าง items สำหรับ Tabs แบบใหม่
  const tabItems = [
    {
      key: "overview",
      label: "ภาพรวม",
      children: (
        <Spin spinning={loading}>
          <div className="overview">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h2>
                {isAdmin
                  ? "ภาพรวมโปรเจคทั้งหมด"
                  : "ภาพรวมโปรเจคที่ได้รับมอบหมาย"}
              </h2>
              {!isAdmin && (
                <Alert
                  message="คุณจะเห็นเฉพาะโปรเจคที่ได้รับมอบหมายเท่านั้น"
                  type="info"
                  showIcon
                  style={{ marginBottom: 0 }}
                />
              )}
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24} sm={12} lg={6}>
                <Card hoverable onClick={viewAllProjects}>
                  <Statistic
                    title="โปรเจคทั้งหมด"
                    value={stats.totalProjects}
                    prefix={<ProjectOutlined />}
                  />
                  {stats.totalProjects > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <Progress
                        percent={Math.round(
                          (stats.completedProjects / stats.totalProjects) * 100
                        )}
                        size="small"
                        status="active"
                      />
                    </div>
                  )}
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card
                  hoverable
                  onClick={() => {
                    if (typeof onNavigate === "function") {
                      onNavigate("projects", null, { status: "done" });
                    }
                  }}
                >
                  <Statistic
                    title="เสร็จสิ้นแล้ว"
                    value={stats.completedProjects}
                    valueStyle={{ color: "#3f8600" }}
                    prefix={<CheckCircleOutlined />}
                    suffix={
                      stats.totalProjects > 0 ? `/ ${stats.totalProjects}` : ""
                    }
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card
                  hoverable
                  onClick={() => {
                    if (typeof onNavigate === "function") {
                      onNavigate("projects", null, { status: "in-progress" });
                    }
                  }}
                >
                  <Statistic
                    title="กำลังดำเนินการ"
                    value={stats.inProgressProjects}
                    valueStyle={{ color: "#1890ff" }}
                    prefix={<ClockCircleOutlined />}
                  />
                </Card>
              </Col>

              <Col xs={24} sm={12} lg={6}>
                <Card
                  hoverable
                  onClick={() => {
                    if (typeof onNavigate === "function") {
                      onNavigate("projects", null, { status: "delay" });
                    } else {
                      showDelayedProjects();
                    }
                  }}
                >
                  <Statistic
                    title="ล่าช้า"
                    value={stats.delayedProjects}
                    valueStyle={{ color: "#cf1322" }}
                    prefix={<WarningOutlined />}
                  />
                </Card>
              </Col>
            </Row>

            {/* Budget Cards - เฉพาะ Admin */}
            <AdminOnly showFallback={false}>
              <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={24} sm={12}>
                  <Card>
                    <Statistic
                      title="งบประมาณทั้งหมด"
                      value={stats.totalBudget}
                      precision={2}
                      valueStyle={{ color: "#3f8600" }}
                      prefix={<DollarOutlined />}
                      suffix="บาท"
                    />
                  </Card>
                </Col>

                <Col xs={24} sm={12}>
                  <Card>
                    <Statistic
                      title="งบประมาณที่ยังดำเนินการ"
                      value={stats.activeBudget}
                      precision={2}
                      valueStyle={{ color: "#1890ff" }}
                      prefix={<DollarOutlined />}
                      suffix="บาท"
                    />
                    {stats.totalBudget > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <Progress
                          percent={Math.round(
                            (stats.activeBudget / stats.totalBudget) * 100
                          )}
                          size="small"
                          status="active"
                          strokeColor="#1890ff"
                        />
                      </div>
                    )}
                  </Card>
                </Col>
              </Row>
            </AdminOnly>
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card
                title={
                  <>
                    <CalendarOutlined /> โปรเจคที่ใกล้ถึงกำหนด
                  </>
                }
                style={{ marginBottom: 16 }}
                extra={
                  <Button type="link" size="small" onClick={viewAllUpcoming}>
                    ดูทั้งหมด
                  </Button>
                }
              >
                {upcomingDeadlines.length > 0 ? (
                  <List
                    dataSource={upcomingDeadlines}
                    renderItem={(item) => (
                      <List.Item
                        actions={[
                          <Tag
                            color={
                              item.daysLeft === 0
                                ? "red"
                                : item.daysLeft <= 2
                                ? "orange"
                                : "green"
                            }
                          >
                            {item.daysLeft === 0
                              ? "วันนี้"
                              : `อีก ${item.daysLeft} วัน`}
                          </Tag>,
                        ]}
                      >
                        <List.Item.Meta
                          avatar={
                            !canAccessProject(item) ? (
                              <LockOutlined />
                            ) : (
                              <ProjectOutlined />
                            )
                          }
                          title={
                            <div>
                              <a
                                onClick={() => {
                                  if (
                                    canAccessProject(item) &&
                                    typeof onNavigate === "function"
                                  ) {
                                    onNavigate("projects", item.id);
                                  }
                                }}
                                style={{
                                  color: canAccessProject(item)
                                    ? undefined
                                    : "#ccc",
                                  cursor: canAccessProject(item)
                                    ? "pointer"
                                    : "not-allowed",
                                }}
                              >
                                {item.name}
                              </a>
                              {!isAdmin && (
                                <Tag
                                  size="small"
                                  color="blue"
                                  style={{ marginLeft: 8 }}
                                >
                                  {item.user_assignment_role || "ผู้ร่วมงาน"}
                                </Tag>
                              )}
                            </div>
                          }
                          description={
                            <>
                              {getStatusTag(item.status)}
                              <span style={{ marginLeft: 8 }}>
                                วันสิ้นสุด:{" "}
                                {moment(item.end_date).format("DD/MM/YYYY")}
                              </span>
                            </>
                          }
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="ไม่มีโปรเจคที่ใกล้ถึงกำหนด" />
                )}
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card
                title={
                  <>
                    <ProjectOutlined /> โปรเจคล่าสุด
                  </>
                }
                style={{ marginBottom: 16 }}
                extra={
                  <Button type="link" size="small" onClick={viewAllProjects}>
                    ดูทั้งหมด
                  </Button>
                }
              >
                {recentProjects.length > 0 ? (
                  <List
                    dataSource={recentProjects}
                    renderItem={(item) => (
                      <List.Item actions={[getStatusTag(item.status)]}>
                        <List.Item.Meta
                          avatar={
                            !canAccessProject(item) ? (
                              <LockOutlined />
                            ) : (
                              <ProjectOutlined />
                            )
                          }
                          title={
                            <div>
                              <a
                                onClick={() => {
                                  if (
                                    canAccessProject(item) &&
                                    typeof onNavigate === "function"
                                  ) {
                                    onNavigate("projects", item.id);
                                  }
                                }}
                                style={{
                                  color: canAccessProject(item)
                                    ? undefined
                                    : "#ccc",
                                  cursor: canAccessProject(item)
                                    ? "pointer"
                                    : "not-allowed",
                                }}
                              >
                                {item.name}
                              </a>
                              {!isAdmin && (
                                <Tag
                                  size="small"
                                  color="blue"
                                  style={{ marginLeft: 8 }}
                                >
                                  {item.user_assignment_role || "ผู้ร่วมงาน"}
                                </Tag>
                              )}
                            </div>
                          }
                          description={
                            <>
                              <span>
                                วันที่สร้าง:{" "}
                                {moment(item.created_at).format("DD/MM/YYYY")}
                              </span>
                              <AdminOnly showFallback={false}>
                                <div>
                                  งบประมาณ:{" "}
                                  {(item.budget || 0).toLocaleString("th-TH")}{" "}
                                  บาท
                                </div>
                              </AdminOnly>
                            </>
                          }
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="ไม่มีโปรเจค" />
                )}
              </Card>
            </Col>
          </Row>

          {/* Activities - เฉพาะ Admin */}
          <AdminOnly showFallback={false}>
            <Card
              title={
                <>
                  <TeamOutlined /> กิจกรรมล่าสุด
                </>
              }
              style={{ marginBottom: 16 }}
            >
              {activities.length > 0 ? (
                <Timeline>
                  {activities.map((activity, index) => (
                    <Timeline.Item
                      key={activity.id || index}
                      dot={getActivityIcon(activity.type)}
                    >
                      <div style={{ marginBottom: 6 }}>
                        <strong style={{ color: "#ffffff" }}>
                          {activity.project?.name || "โปรเจคที่ไม่ระบุ"}
                        </strong>
                        <span style={{ color: "#999", marginLeft: 8 }}>
                          {moment(activity.created_at).fromNow()}
                        </span>
                      </div>
                      <div style={{ color: "#ffffff" }}>
                        {activity.description}
                      </div>
                    </Timeline.Item>
                  ))}
                </Timeline>
              ) : (
                <Empty description="ไม่มีกิจกรรมล่าสุด" />
              )}
            </Card>
          </AdminOnly>
        </Spin>
      ),
    },
  ];

  // เพิ่ม Monthly Summary tab สำหรับ Admin
  if (isAdmin) {
    tabItems.push({
      key: "monthly",
      label: (
        <>
          <BarChartOutlined /> สรุปรายเดือน
        </>
      ),
      children: <MonthlySummary supabase={supabase} />,
    });
  }

  return (
    <div className="dashboard">
      <Tabs defaultActiveKey="overview" items={tabItems} />
    </div>
  );
};

export default Dashboard;
