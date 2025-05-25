// ✅ MyProjects.jsx (สมบูรณ์ + แก้ไขสถานะได้)
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
  Avatar,
  Statistic,
  Descriptions,
  List,
  Typography,
  Select,
  message,
} from "antd";
import {
  ProjectOutlined,
  CalendarOutlined,
  UserOutlined,
  InfoCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import moment from "moment";
import "moment/locale/th";
import { useAuth } from "../context/AuthContext";

const { Text } = Typography;
const { Option } = Select;

const MyProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    delayed: 0,
  });

  const { getAssignedProjects, updateProjectStatus, user, isAdmin, userRole } =
    useAuth();

  useEffect(() => {
    if (user) fetchMyProjects();
  }, [user, userRole]);

  const fetchMyProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const projectsData = await getAssignedProjects();
      const filteredProjects = isAdmin
        ? projectsData
        : projectsData.map((p) => ({
            ...p,
            user_assignment_role: p.user_assignment_role || "สมาชิกทีม",
          }));
      setProjects(filteredProjects);
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
      setError(error.message || "เกิดข้อผิดพลาดในการดึงข้อมูลโปรเจค");
    } finally {
      setLoading(false);
    }
  };

  const showProjectDetail = (project) => {
    setSelectedProject(project);
    setDetailModalVisible(true);
  };

  const handleStatusChange = async (value) => {
    const success = await updateProjectStatus(selectedProject.id, value);
    if (success) {
      message.success("อัปเดตสถานะสำเร็จ");
      setDetailModalVisible(false);
      fetchMyProjects();
    } else {
      message.error("อัปเดตสถานะล้มเหลว");
    }
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
      (t) => t.status === "done"
    ).length;
    return Math.round((completedTasks / project.tasks.length) * 100);
  };

  const getDaysLeft = (endDate) => moment(endDate).diff(moment(), "days");

  const ProjectCard = ({ project }) => {
    const progress = calculateProgress(project);
    const daysLeft = getDaysLeft(project.end_date);
    const isOverdue = daysLeft < 0;
    const isUrgent = daysLeft <= 3 && daysLeft >= 0;

    return (
      <Card
        hoverable
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
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#ffffff" }}>{project.name}</span>
              <Tag color={getStatusColor(project.status)}>
                {getStatusText(project.status)}
              </Tag>
            </div>
          }
          description={
            <>
              <p style={{ color: "#ffffff" }}>
                {project.description || "ไม่มีคำอธิบาย"}
              </p>
              <div>
                <Text strong style={{ color: "#ffffff" }}>
                  บทบาทของฉัน:{" "}
                </Text>
                <Tag color="blue">{project.user_assignment_role}</Tag>
              </div>
              <div style={{ color: "#ffffff" }}>
                <CalendarOutlined />{" "}
                {moment(project.start_date).format("DD/MM/YYYY")} -{" "}
                {moment(project.end_date).format("DD/MM/YYYY")}
              </div>
              <div>
                {daysLeft >= 0 ? (
                  <>
                    <ClockCircleOutlined
                      style={{ color: isUrgent ? "#faad14" : "#52c41a" }}
                    />{" "}
                    <span style={{ color: isUrgent ? "#faad14" : "#52c41a" }}>
                      เหลือ {daysLeft} วัน
                    </span>
                  </>
                ) : (
                  <>
                    <WarningOutlined style={{ color: "#ff4d4f" }} />{" "}
                    <span style={{ color: "#ff4d4f" }}>
                      เกินกำหนด {Math.abs(daysLeft)} วัน
                    </span>
                  </>
                )}
              </div>
              {project.tasks?.length > 0 && (
                <>
                  <div>ความคืบหน้า: {progress}%</div>
                  <Progress
                    percent={progress}
                    size="small"
                    status={project.status === "done" ? "success" : "active"}
                  />
                </>
              )}
            </>
          }
        />
      </Card>
    );
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: 50 }}>
        <Spin size="large" />
        <p>กำลังโหลดโปรเจคของคุณ...</p>
      </div>
    );

  if (error)
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="เกิดข้อผิดพลาด"
          description={error}
          type="error"
          showIcon
          action={
            <Button icon={<ReloadOutlined />} onClick={fetchMyProjects}>
              ลองใหม่
            </Button>
          }
        />
      </div>
    );

  return (
    <div style={{ padding: 24 }}>
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
          description={
            <>
              <p>ยังไม่มีโปรเจคที่ได้รับมอบหมาย</p>
              <Button icon={<ReloadOutlined />} onClick={fetchMyProjects}>
                รีเฟรชข้อมูล
              </Button>
            </>
          }
        />
      )}

      <Modal
        title={
          <>
            <ProjectOutlined style={{ marginRight: 8 }} />
            {selectedProject?.name}
          </>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedProject && (
          <div>
            <Descriptions column={2} bordered>
              <Descriptions.Item label="สถานะ" span={2}>
                {/* <Select
                  defaultValue={selectedProject.status}
                  onChange={handleStatusChange}
                  style={{ width: 200 }}
                >
                  <Option value="todo">รอดำเนินการ</Option>
                  <Option value="in-progress">กำลังดำเนินการ</Option>
                  <Option value="done">เสร็จสิ้น</Option>
                  <Option value="delay">ล่าช้า</Option>
                  <Option value="maintenance">บำรุงรักษา</Option>
                </Select> */}

                <Tag color={getStatusColor(selectedProject.status)}>
                  {getStatusText(selectedProject.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="บทบาทของฉัน">
                <Tag color="blue">{selectedProject.user_assignment_role}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="วันที่เริ่ม">
                {moment(selectedProject.start_date).format("DD/MM/YYYY")}
              </Descriptions.Item>
              <Descriptions.Item label="วันที่สิ้นสุด">
                {moment(selectedProject.end_date).format("DD/MM/YYYY")}
              </Descriptions.Item>
              <Descriptions.Item label="คำอธิบาย" span={2}>
                {selectedProject.description || "ไม่มีคำอธิบาย"}
              </Descriptions.Item>
            </Descriptions>

            {selectedProject.tasks?.length > 0 && (
              <List
                style={{ marginTop: 16 }}
                header={
                  <strong>งานย่อย ({selectedProject.tasks.length})</strong>
                }
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
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default MyProjects;
