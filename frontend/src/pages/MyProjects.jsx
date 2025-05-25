// src/pages/MyProjects.jsx
import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Tag,
  Progress,
  Button,
  Modal,
  Empty,
  Spin,
  Alert,
  Tooltip,
  Badge,
  Avatar,
  Statistic,
  Descriptions,
  List,
} from "antd";
import {
  ProjectOutlined,
  CalendarOutlined,
  UserOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  FileTextOutlined,
  TeamOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import moment from "moment";
import "moment/locale/th";
import { useAuth } from "../context/AuthContext";

const MyProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    delayed: 0,
  });

  const { getAssignedProjects, user, isAdmin } = useAuth();

  useEffect(() => {
    fetchMyProjects();
  }, []);

  const fetchMyProjects = async () => {
    setLoading(true);
    try {
      const projectsData = await getAssignedProjects();

      // กรองเฉพาะโปรเจคที่ user ได้รับมอบหมาย (สำหรับ user ทั่วไป)
      let filteredProjects = projectsData;
      if (!isAdmin) {
        // สำหรับ user ทั่วไป แสดงเฉพาะโปรเจคที่ได้รับมอบหมาย
        filteredProjects = projectsData.filter(
          (project) =>
            project.user_assignment_role ||
            (project.assignments &&
              project.assignments.some(
                (assignment) => assignment.team_member?.email === user?.email
              ))
        );
      }

      setProjects(filteredProjects);

      // คำนวณสถิติ
      const total = filteredProjects.length;
      const completed = filteredProjects.filter(
        (p) => p.status === "done"
      ).length;
      const inProgress = filteredProjects.filter(
        (p) => p.status === "in-progress"
      ).length;
      const delayed = filteredProjects.filter(
        (p) => p.status === "delay"
      ).length;

      setStats({ total, completed, inProgress, delayed });
    } catch (error) {
      console.error("Error fetching my projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const showProjectDetail = (project) => {
    setSelectedProject(project);
    setDetailModalVisible(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "todo":
        return "default";
      case "in-progress":
        return "processing";
      case "done":
        return "success";
      case "delay":
        return "error";
      case "maintenance":
        return "warning";
      default:
        return "default";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "todo":
        return "รอดำเนินการ";
      case "in-progress":
        return "กำลังดำเนินการ";
      case "done":
        return "เสร็จสิ้น";
      case "delay":
        return "ล่าช้า";
      case "maintenance":
        return "บำรุงรักษา";
      default:
        return status;
    }
  };

  const calculateProgress = (project) => {
    if (!project.tasks || project.tasks.length === 0) return 0;
    const completedTasks = project.tasks.filter(
      (task) => task.status === "done"
    ).length;
    return Math.round((completedTasks / project.tasks.length) * 100);
  };

  const getDaysLeft = (endDate) => {
    return moment(endDate).diff(moment(), "days");
  };

  const ProjectCard = ({ project }) => {
    const progress = calculateProgress(project);
    const daysLeft = getDaysLeft(project.end_date);
    const isOverdue = daysLeft < 0;
    const isUrgent = daysLeft <= 3 && daysLeft >= 0;

    return (
      <Card
        hoverable
        className="project-card"
        style={{
          marginBottom: 16,
          border: isOverdue
            ? "2px solid #ff4d4f"
            : isUrgent
            ? "2px solid #faad14"
            : undefined,
        }}
        actions={[
          <Button
            type="primary"
            icon={<InfoCircleOutlined />}
            onClick={() => showProjectDetail(project)}
          >
            ดูรายละเอียด
          </Button>,
        ]}
      >
        <Card.Meta
          avatar={
            <Avatar
              style={{
                backgroundColor:
                  project.status === "done" ? "#52c41a" : "#1890ff",
              }}
              icon={<ProjectOutlined />}
            />
          }
          title={
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>{project.name}</span>
              <Tag color={getStatusColor(project.status)}>
                {getStatusText(project.status)}
              </Tag>
            </div>
          }
          description={
            <div>
              <p style={{ color: "#666", marginBottom: 8 }}>
                {project.description || "ไม่มีคำอธิบาย"}
              </p>

              <div style={{ marginBottom: 8 }}>
                <Text strong>บทบาทของฉัน: </Text>
                <Tag color="blue">
                  {project.user_assignment_role || "สมาชิกทีม"}
                </Tag>
              </div>

              <div style={{ marginBottom: 8 }}>
                <CalendarOutlined style={{ marginRight: 4 }} />
                <span style={{ fontSize: "12px", color: "#666" }}>
                  {moment(project.start_date).format("DD/MM/YYYY")} -{" "}
                  {moment(project.end_date).format("DD/MM/YYYY")}
                </span>
              </div>

              {daysLeft >= 0 ? (
                <div style={{ marginBottom: 8 }}>
                  <ClockCircleOutlined
                    style={{
                      marginRight: 4,
                      color: isUrgent ? "#faad14" : "#52c41a",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "12px",
                      color: isUrgent ? "#faad14" : "#52c41a",
                    }}
                  >
                    เหลือ {daysLeft} วัน
                  </span>
                </div>
              ) : (
                <div style={{ marginBottom: 8 }}>
                  <WarningOutlined
                    style={{ marginRight: 4, color: "#ff4d4f" }}
                  />
                  <span style={{ fontSize: "12px", color: "#ff4d4f" }}>
                    เกินกำหนด {Math.abs(daysLeft)} วัน
                  </span>
                </div>
              )}

              {project.tasks && project.tasks.length > 0 && (
                <div>
                  <div
                    style={{ marginBottom: 4, fontSize: "12px", color: "#666" }}
                  >
                    ความคืบหน้า: {progress}%
                  </div>
                  <Progress
                    percent={progress}
                    size="small"
                    status={project.status === "done" ? "success" : "active"}
                  />
                </div>
              )}
            </div>
          }
        />
      </Card>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <Spin size="large" />
        <p style={{ marginTop: 16 }}>กำลังโหลดโปรเจคของคุณ...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2>
          <ProjectOutlined /> โปรเจคของฉัน
        </h2>
        <p style={{ color: "#666" }}>โปรเจคที่คุณได้รับมอบหมายให้รับผิดชอบ</p>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="โปรเจคทั้งหมด"
              value={stats.total}
              prefix={<ProjectOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="เสร็จสิ้นแล้ว"
              value={stats.completed}
              valueStyle={{ color: "#3f8600" }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="กำลังทำ"
              value={stats.inProgress}
              valueStyle={{ color: "#1890ff" }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="ล่าช้า"
              value={stats.delayed}
              valueStyle={{ color: "#cf1322" }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Projects List */}
      {projects.length > 0 ? (
        <Row gutter={[16, 16]}>
          {projects.map((project) => (
            <Col xs={24} md={12} lg={8} key={project.id}>
              <ProjectCard project={project} />
            </Col>
          ))}
        </Row>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div>
              <p>ยังไม่มีโปรเจคที่ได้รับมอบหมาย</p>
              <p style={{ color: "#999", fontSize: "12px" }}>
                กรุณาติดต่อผู้ดูแลระบบเพื่อขอรับมอบหมายโปรเจค
              </p>
            </div>
          }
        />
      )}

      {/* Project Detail Modal */}
      <Modal
        title={
          <div>
            <ProjectOutlined style={{ marginRight: 8 }} />
            {selectedProject?.name}
          </div>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedProject && (
          <div>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="สถานะ" span={1}>
                <Tag color={getStatusColor(selectedProject.status)}>
                  {getStatusText(selectedProject.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="บทบาทของฉัน" span={1}>
                <Tag color="blue">
                  {selectedProject.user_assignment_role || "สมาชิกทีม"}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="วันที่เริ่ม" span={1}>
                {moment(selectedProject.start_date).format("DD/MM/YYYY")}
              </Descriptions.Item>
              <Descriptions.Item label="วันที่สิ้นสุด" span={1}>
                {moment(selectedProject.end_date).format("DD/MM/YYYY")}
              </Descriptions.Item>
              <Descriptions.Item label="เจ้าของโปรเจค" span={2}>
                <UserOutlined style={{ marginRight: 4 }} />
                {selectedProject.owner_name}
              </Descriptions.Item>
              <Descriptions.Item label="คำอธิบาย" span={2}>
                {selectedProject.description || "ไม่มีคำอธิบาย"}
              </Descriptions.Item>
            </Descriptions>

            {selectedProject.tasks && selectedProject.tasks.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4>งานย่อย ({selectedProject.tasks.length} งาน)</h4>
                <List
                  dataSource={selectedProject.tasks}
                  renderItem={(task) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          task.status === "done" ? (
                            <CheckCircleOutlined style={{ color: "#52c41a" }} />
                          ) : (
                            <ClockCircleOutlined style={{ color: "#1890ff" }} />
                          )
                        }
                        title={task.name || task.title}
                        description={task.description}
                      />
                      <Tag color={getStatusColor(task.status)}>
                        {getStatusText(task.status)}
                      </Tag>
                    </List.Item>
                  )}
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyProjects;
