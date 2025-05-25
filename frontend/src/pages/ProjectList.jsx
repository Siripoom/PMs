import React, { useState, useEffect } from "react";
import {
  Table,
  Tag,
  Space,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  InputNumber,
  Tooltip,
  Progress,
  Badge,
  notification,
  Upload,
  List,
  Checkbox,
  Divider,
  Alert,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  FileOutlined,
  UserOutlined,
  DollarOutlined,
  SyncOutlined,
  UploadOutlined,
  PaperClipOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  LockOutlined,
} from "@ant-design/icons";
import moment from "moment";
import "moment/locale/th";

import { supabase } from "../supabaseClient";
import { useAuth } from "../context/AuthContext";
import { AdminOnly, PermissionGuard } from "../components/RoleGuard";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;
const { Dragger } = Upload;

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingProject, setEditingProject] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [projectFiles, setProjectFiles] = useState([]);
  const [fileListVisible, setFileListVisible] = useState(false);
  const [selectedProjectForFiles, setSelectedProjectForFiles] = useState(null);

  const {
    userRole,
    userPermissions,
    getAssignedProjects,
    canAccessProject,
    isAdmin,
  } = useAuth();

  // สถานะโปรเจค
  const projectStatuses = [
    { value: "todo", label: "Todo", color: "default" },
    { value: "in-progress", label: "In Progress", color: "processing" },
    { value: "done", label: "Done", color: "success" },
    { value: "delay", label: "Delay", color: "error" },
    { value: "maintenance", label: "Maintenance", color: "warning" },
  ];

  useEffect(() => {
    fetchProjects();
  }, [userRole]);

  // ฟังก์ชันดึงข้อมูลโปรเจคตามสิทธิ์ของผู้ใช้
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const assignedProjects = await getAssignedProjects();

      // คำนวณวันที่เหลือและความคืบหน้า
      const projectsWithCalculations = assignedProjects.map((project) => {
        const totalDays = moment(project.end_date).diff(
          moment(project.start_date),
          "days"
        );
        const daysLeft = moment(project.end_date).diff(moment(), "days");
        const progress = calculateProgress(project.tasks || []);

        return {
          ...project,
          total_days: totalDays,
          days_left: daysLeft,
          progress,
        };
      });

      setProjects(projectsWithCalculations);
    } catch (error) {
      console.error("Error fetching projects:", error);
      notification.error({
        message: "ไม่สามารถดึงข้อมูลโปรเจคได้",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // คำนวณความคืบหน้าจากงานย่อย
  const calculateProgress = (tasks) => {
    if (!tasks || tasks.length === 0) return 0;

    const completedTasks = tasks.filter(
      (task) => task.status === "done"
    ).length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  // แสดงฟอร์มเพิ่ม/แก้ไขโปรเจค (เฉพาะ Admin)
  const showProjectForm = (project = null) => {
    if (!userPermissions.canCreateProjects && !project) {
      notification.warning({
        message: "ไม่มีสิทธิ์",
        description: "คุณไม่มีสิทธิ์ในการสร้างโปรเจคใหม่",
      });
      return;
    }

    if (project && !userPermissions.canEditAllProjects) {
      notification.warning({
        message: "ไม่มีสิทธิ์",
        description: "คุณไม่มีสิทธิ์ในการแก้ไขโปรเจค",
      });
      return;
    }

    setEditingProject(project);
    setUploadedFiles([]);

    if (project) {
      let installments = project.payment_installments || [];
      if (typeof installments === "string") {
        try {
          installments = JSON.parse(installments);
        } catch (e) {
          console.error("Error parsing installments:", e);
          installments = [];
        }
      }

      installments = installments.map((item) => ({
        ...item,
        paid: item.paid || false,
      }));

      form.setFieldsValue({
        ...project,
        date_range: [
          project.start_date ? moment(project.start_date) : moment(),
          project.end_date
            ? moment(project.end_date)
            : moment().add(30, "days"),
        ],
        payment_installments: installments.length
          ? installments
          : [
              {
                installment: 1,
                amount: 0,
                description: "งวดที่ 1",
                paid: false,
              },
            ],
      });

      fetchProjectFiles(project.id);
    } else {
      form.resetFields();
      form.setFieldsValue({
        status: "todo",
        payment_installments: [
          { installment: 1, amount: 0, description: "งวดที่ 1", paid: false },
        ],
        date_range: [moment(), moment().add(30, "days")],
      });
      setProjectFiles([]);
    }

    setVisible(true);
  };

  // ดึงไฟล์ที่เกี่ยวข้องกับโปรเจค
  const fetchProjectFiles = async (projectId) => {
    try {
      const { data, error } = await supabase
        .from("project_files")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setProjectFiles(data || []);
    } catch (error) {
      console.error("Error fetching project files:", error);
      notification.error({
        message: "ไม่สามารถดึงข้อมูลไฟล์ได้",
        description: error.message,
      });
    }
  };

  // แสดงรายการไฟล์ของโปรเจค
  const showProjectFiles = async (project) => {
    if (!canAccessProject(project)) {
      notification.warning({
        message: "ไม่มีสิทธิ์",
        description: "คุณไม่มีสิทธิ์ในการดูไฟล์ของโปรเจคนี้",
      });
      return;
    }

    setSelectedProjectForFiles(project);
    await fetchProjectFiles(project.id);
    setFileListVisible(true);
  };

  // บันทึกข้อมูลโปรเจค (เฉพาะ Admin)
  const handleSubmit = async (values) => {
    if (!userPermissions.canCreateProjects && !editingProject) {
      notification.error({
        message: "ไม่มีสิทธิ์",
        description: "คุณไม่มีสิทธิ์ในการสร้างโปรเจค",
      });
      return;
    }

    if (editingProject && !userPermissions.canEditAllProjects) {
      notification.error({
        message: "ไม่มีสิทธิ์",
        description: "คุณไม่มีสิทธิ์ในการแก้ไขโปรเจค",
      });
      return;
    }

    try {
      const [start_date, end_date] = values.date_range;

      let payment_installments = values.payment_installments;
      if (!payment_installments || !Array.isArray(payment_installments)) {
        payment_installments = [];
      }

      payment_installments = payment_installments.filter(
        (item) => item && (item.installment || item.amount || item.description)
      );

      payment_installments = payment_installments.map((item) => ({
        ...item,
        paid: item.paid || false,
      }));

      const projectData = {
        name: values.name,
        description: values.description,
        status: values.status,
        start_date: start_date.format("YYYY-MM-DD"),
        end_date: end_date.format("YYYY-MM-DD"),
        budget: values.budget,
        payment_installments: payment_installments,
        owner_name: values.owner_name,
        owner_contact: values.owner_contact,
      };

      let projectId;

      if (editingProject) {
        const { error } = await supabase
          .from("projects")
          .update(projectData)
          .eq("id", editingProject.id);

        if (error) throw error;

        notification.success({
          message: "อัปเดตโปรเจคสำเร็จ",
          description: `โปรเจค "${values.name}" ได้รับการอัปเดตแล้ว`,
        });

        projectId = editingProject.id;
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) throw new Error("ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่");

        const { data, error } = await supabase
          .from("projects")
          .insert([
            {
              ...projectData,
              user_id: user.id,
            },
          ])
          .select();

        if (error) throw error;

        notification.success({
          message: "สร้างโปรเจคสำเร็จ",
          description: `โปรเจค "${values.name}" ได้ถูกสร้างแล้ว`,
        });

        projectId = data[0].id;
      }

      if (uploadedFiles.length > 0 && projectId) {
        await uploadProjectFiles(projectId, uploadedFiles);
      }

      fetchProjects();
      setVisible(false);
    } catch (error) {
      console.error("Error saving project:", error);
      notification.error({
        message: "ไม่สามารถบันทึกโปรเจคได้",
        description: error.message,
      });
    }
  };

  // อัปโหลดไฟล์ไปยัง Supabase Storage
  const uploadProjectFiles = async (projectId, files) => {
    if (!userPermissions.canUploadFiles) {
      notification.warning({
        message: "ไม่มีสิทธิ์",
        description: "คุณไม่มีสิทธิ์ในการอัปโหลดไฟล์",
      });
      return;
    }

    try {
      for (const file of files) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${projectId}/${fileName}`;

        const { data, error } = await supabase.storage
          .from("project-files")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (error) throw error;

        const { data: userData } = await supabase.auth.getUser();

        const { error: dbError } = await supabase.from("project_files").insert({
          project_id: projectId,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          file_path: filePath,
          user_id: userData.user.id,
        });

        if (dbError) throw dbError;
      }

      notification.success({
        message: "อัปโหลดไฟล์สำเร็จ",
        description: `อัปโหลดไฟล์ ${files.length} ไฟล์สำเร็จ`,
      });
    } catch (error) {
      console.error("Error uploading files:", error);
      notification.error({
        message: "ไม่สามารถอัปโหลดไฟล์ได้",
        description: error.message,
      });
    }
  };

  // ลบไฟล์ (เฉพาะ Admin)
  const deleteFile = async (fileId, filePath) => {
    if (!userPermissions.canUploadFiles) {
      notification.warning({
        message: "ไม่มีสิทธิ์",
        description: "คุณไม่มีสิทธิ์ในการลบไฟล์",
      });
      return;
    }

    try {
      const { error: storageError } = await supabase.storage
        .from("project-files")
        .remove([filePath]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("project_files")
        .delete()
        .eq("id", fileId);

      if (dbError) throw dbError;

      if (editingProject) {
        fetchProjectFiles(editingProject.id);
      } else if (selectedProjectForFiles) {
        fetchProjectFiles(selectedProjectForFiles.id);
      }

      notification.success({
        message: "ลบไฟล์สำเร็จ",
        description: "ไฟล์ถูกลบออกจากระบบแล้ว",
      });
    } catch (error) {
      console.error("Error deleting file:", error);
      notification.error({
        message: "ไม่สามารถลบไฟล์ได้",
        description: error.message,
      });
    }
  };

  // ดาวน์โหลดไฟล์
  const downloadFile = async (filePath, fileName) => {
    try {
      const { data, error } = await supabase.storage
        .from("project-files")
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading file:", error);
      notification.error({
        message: "ไม่สามารถดาวน์โหลดไฟล์ได้",
        description: error.message,
      });
    }
  };

  // ลบโปรเจค (เฉพาะ Admin)
  const deleteProject = async (id) => {
    if (!userPermissions.canDeleteProjects) {
      notification.warning({
        message: "ไม่มีสิทธิ์",
        description: "คุณไม่มีสิทธิ์ในการลบโปรเจค",
      });
      return;
    }

    try {
      console.log("Attempting to delete project with ID:", id);

      if (!id) {
        console.error("Invalid project ID:", id);
        notification.error({
          message: "ไม่สามารถลบโปรเจคได้",
          description: "ไม่พบรหัสโปรเจค",
        });
        return;
      }

      const { data: checkProject, error: checkError } = await supabase
        .from("projects")
        .select("id")
        .eq("id", id)
        .single();

      if (checkError || !checkProject) {
        console.error("Project not found:", checkError);
        notification.error({
          message: "ไม่สามารถลบโปรเจคได้",
          description: "ไม่พบโปรเจคที่ต้องการลบ",
        });
        return;
      }

      console.log("Project found, proceeding with deletion");

      const { data: files } = await supabase
        .from("project_files")
        .select("file_path")
        .eq("project_id", id);

      if (files && files.length > 0) {
        const filePaths = files.map((file) => file.file_path);
        await supabase.storage.from("project-files").remove(filePaths);
      }

      const { data, error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id);

      console.log("Delete result:", { data, error });

      if (error) throw error;

      notification.success({
        message: "ลบโปรเจคสำเร็จ",
        description: "โปรเจคถูกลบออกจากระบบแล้ว",
      });

      fetchProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
      notification.error({
        message: "ไม่สามารถลบโปรเจคได้",
        description: error.message,
      });
    }
  };

  // คอลัมน์ตาราง
  const columns = [
    {
      title: "ชื่อโปรเจค",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div>
          <a onClick={() => goToProjectDetail(record.id)}>{text}</a>
          {!isAdmin && (
            <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
              <UserOutlined style={{ marginRight: "4px" }} />
              บทบาท: {record.user_assignment_role || "ไม่ระบุ"}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "สถานะ",
      dataIndex: "status",
      key: "status",
      filters: projectStatuses.map((status) => ({
        text: status.label,
        value: status.value,
      })),
      onFilter: (value, record) => record.status === value,
      render: (status) => {
        const statusObj = projectStatuses.find((s) => s.value === status);
        return (
          <Tag color={statusObj?.color || "default"}>
            {statusObj?.label || status}
          </Tag>
        );
      },
    },
    {
      title: "ระยะเวลา",
      key: "duration",
      render: (record) => (
        <Tooltip
          title={`เริ่ม ${moment(record.start_date).format(
            "DD/MM/YYYY"
          )} - สิ้นสุด ${moment(record.end_date).format("DD/MM/YYYY")}`}
        >
          <span>
            {record.total_days} วัน
            {record.days_left > 0 ? (
              <Badge
                count={`เหลือ ${record.days_left} วัน`}
                style={{
                  backgroundColor: record.days_left < 7 ? "#f50" : "#52c41a",
                }}
              />
            ) : (
              <Badge count="หมดเวลา" style={{ backgroundColor: "#f50" }} />
            )}
          </span>
        </Tooltip>
      ),
    },
    {
      title: "งบประมาณ",
      dataIndex: "budget",
      key: "budget",
      sorter: (a, b) => a.budget - b.budget,
      render: (budget) => (
        <span>
          <DollarOutlined /> {budget?.toLocaleString("th-TH")} บาท
        </span>
      ),
    },
    {
      title: "เจ้าของโครงการ",
      key: "owner",
      render: (record) => (
        <span>
          <UserOutlined /> {record.owner_name}
        </span>
      ),
    },
    {
      title: "ไฟล์",
      key: "files",
      render: (record) => (
        <Button
          type="link"
          icon={<PaperClipOutlined />}
          onClick={() => showProjectFiles(record)}
        >
          ไฟล์แนบ
        </Button>
      ),
    },
    {
      title: "การจัดการ",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          {!canAccessProject(record) ? (
            <Tooltip title="คุณไม่มีสิทธิ์เข้าถึงโปรเจคนี้">
              <Button icon={<LockOutlined />} size="small" disabled />
            </Tooltip>
          ) : (
            <>
              <PermissionGuard
                requiredPermission="canViewAllProjects"
                showFallback={false}
              >
                <Button
                  type="default"
                  icon={<EyeOutlined />}
                  size="small"
                  onClick={() => goToProjectDetail(record.id)}
                  title="ดูรายละเอียด"
                />
              </PermissionGuard>

              <AdminOnly showFallback={false}>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  size="small"
                  onClick={() => showProjectForm(record)}
                  title="แก้ไข"
                />
              </AdminOnly>

              <AdminOnly showFallback={false}>
                <Button
                  type="primary"
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                  onClick={() => {
                    if (
                      window.confirm(
                        `คุณต้องการลบโปรเจค "${record.name}" ใช่หรือไม่?`
                      )
                    ) {
                      deleteProject(record.id);
                    }
                  }}
                  title="ลบ"
                />
              </AdminOnly>
            </>
          )}
        </Space>
      ),
    },
  ];

  // ฟังก์ชันเปลี่ยนหน้าไปที่รายละเอียดโปรเจค
  const goToProjectDetail = (projectId) => {
    const project = projects.find((p) => p.id === projectId);
    if (project && !canAccessProject(project)) {
      notification.warning({
        message: "ไม่มีสิทธิ์",
        description: "คุณไม่มีสิทธิ์ในการดูรายละเอียดโปรเจคนี้",
      });
      return;
    }

    notification.info({
      message: "รายละเอียดโปรเจค",
      description: `ดูรายละเอียดโปรเจค ID: ${projectId}`,
    });
  };

  return (
    <div className="project-list">
      <div
        className="table-header"
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2>{isAdmin ? "รายการโปรเจคทั้งหมด" : "โปรเจคที่ได้รับมอบหมาย"}</h2>
          {!isAdmin && (
            <Alert
              message="คุณจะเห็นเฉพาะโปรเจคที่ได้รับมอบหมายเท่านั้น"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
        </div>

        <AdminOnly showFallback={false}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showProjectForm()}
          >
            สร้างโปรเจคใหม่
          </Button>
        </AdminOnly>
      </div>

      <Table
        columns={columns}
        dataSource={projects}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        expandable={{
          expandedRowRender: (record) => (
            <div>
              <p>{record.description || "ไม่มีคำอธิบาย"}</p>
              {record.payment_installments &&
                record.payment_installments.length > 0 && (
                  <PermissionGuard requiredPermission="canViewAllProjects">
                    <div style={{ marginTop: 16 }}>
                      <h4>การชำระเงิน</h4>
                      <table
                        style={{ width: "100%", borderCollapse: "collapse" }}
                      >
                        <thead>
                          <tr>
                            <th
                              style={{
                                border: "1px solid #f0f0f0",
                                padding: 8,
                              }}
                            >
                              งวดที่
                            </th>
                            <th
                              style={{
                                border: "1px solid #f0f0f0",
                                padding: 8,
                              }}
                            >
                              จำนวนเงิน
                            </th>
                            <th
                              style={{
                                border: "1px solid #f0f0f0",
                                padding: 8,
                              }}
                            >
                              รายละเอียด
                            </th>
                            <th
                              style={{
                                border: "1px solid #f0f0f0",
                                padding: 8,
                              }}
                            >
                              สถานะ
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {record.payment_installments.map((item, index) => (
                            <tr key={index}>
                              <td
                                style={{
                                  border: "1px solid #f0f0f0",
                                  padding: 8,
                                }}
                              >
                                {item.installment}
                              </td>
                              <td
                                style={{
                                  border: "1px solid #f0f0f0",
                                  padding: 8,
                                }}
                              >
                                {item.amount?.toLocaleString("th-TH")} บาท
                              </td>
                              <td
                                style={{
                                  border: "1px solid #f0f0f0",
                                  padding: 8,
                                }}
                              >
                                {item.description}
                              </td>
                              <td
                                style={{
                                  border: "1px solid #f0f0f0",
                                  padding: 8,
                                }}
                              >
                                {item.paid ? (
                                  <Tag
                                    color="success"
                                    icon={<CheckCircleOutlined />}
                                  >
                                    จ่ายแล้ว
                                  </Tag>
                                ) : (
                                  <Tag
                                    color="error"
                                    icon={<CloseCircleOutlined />}
                                  >
                                    ยังไม่จ่าย
                                  </Tag>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </PermissionGuard>
                )}
            </div>
          ),
        }}
        defaultSortOrder="descend"
        sortDirections={["descend", "ascend"]}
      />

      {/* Modal แสดงรายการไฟล์ของโปรเจค */}
      <Modal
        title="ไฟล์แนบโปรเจค"
        open={fileListVisible}
        onCancel={() => setFileListVisible(false)}
        footer={null}
        width={700}
      >
        {projectFiles.length > 0 ? (
          <List
            itemLayout="horizontal"
            dataSource={projectFiles}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button
                    type="link"
                    onClick={() => downloadFile(item.file_path, item.file_name)}
                  >
                    ดาวน์โหลด
                  </Button>,
                  <AdminOnly showFallback={false}>
                    <Button
                      type="link"
                      danger
                      onClick={() => deleteFile(item.id, item.file_path)}
                    >
                      ลบ
                    </Button>
                  </AdminOnly>,
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={<FileOutlined style={{ fontSize: 24 }} />}
                  title={item.file_name}
                  description={
                    <>
                      <span>ขนาด: {(item.file_size / 1024).toFixed(2)} KB</span>
                      <br />
                      <span>
                        อัปโหลดเมื่อ:{" "}
                        {moment(item.created_at).format("DD/MM/YYYY HH:mm")}
                      </span>
                    </>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <p>ไม่มีไฟล์แนบสำหรับโปรเจคนี้</p>
          </div>
        )}
      </Modal>

      {/* Modal สำหรับการจัดการโปรเจค (เฉพาะ Admin) */}
      <AdminOnly showFallback={false}>
        <Modal
          title={editingProject ? "แก้ไขโปรเจค" : "สร้างโปรเจคใหม่"}
          open={visible}
          onCancel={() => setVisible(false)}
          footer={null}
          width={800}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="name"
              label="ชื่อโปรเจค"
              rules={[{ required: true, message: "กรุณาระบุชื่อโปรเจค" }]}
            >
              <Input placeholder="ระบุชื่อโปรเจค" />
            </Form.Item>

            <Form.Item name="description" label="รายละเอียด">
              <TextArea rows={4} placeholder="รายละเอียดโปรเจค" />
            </Form.Item>

            <Form.Item name="status" label="สถานะ" rules={[{ required: true }]}>
              <Select>
                {projectStatuses.map((status) => (
                  <Option key={status.value} value={status.value}>
                    {status.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="date_range"
              label="ระยะเวลาโปรเจค"
              rules={[{ required: true, message: "กรุณาเลือกระยะเวลา" }]}
            >
              <RangePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="budget"
              label="งบประมาณ (บาท)"
              rules={[{ required: true, message: "กรุณาระบุงบประมาณ" }]}
            >
              <InputNumber
                style={{ width: "100%" }}
                formatter={(value) =>
                  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                }
                parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                placeholder="ระบุงบประมาณ"
              />
            </Form.Item>

            <Form.List name="payment_installments">
              {(fields, { add, remove }) => (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <h4>การแบ่งชำระเงิน</h4>
                    <Button
                      type="dashed"
                      onClick={() =>
                        add({
                          installment: fields.length + 1,
                          amount: 0,
                          description: `งวดที่ ${fields.length + 1}`,
                          paid: false,
                        })
                      }
                      icon={<PlusOutlined />}
                    >
                      เพิ่มงวด
                    </Button>
                  </div>

                  {fields.map((field) => (
                    <div
                      key={field.key}
                      style={{
                        display: "flex",
                        marginBottom: 8,
                        gap: 8,
                        alignItems: "center",
                      }}
                    >
                      <Form.Item
                        {...field}
                        name={[field.name, "installment"]}
                        style={{ width: "12%", marginBottom: 0 }}
                      >
                        <InputNumber
                          min={1}
                          placeholder="งวดที่"
                          style={{ width: "100%" }}
                        />
                      </Form.Item>

                      <Form.Item
                        {...field}
                        name={[field.name, "amount"]}
                        style={{ width: "25%", marginBottom: 0 }}
                      >
                        <InputNumber
                          placeholder="จำนวนเงิน"
                          style={{ width: "100%" }}
                          formatter={(value) =>
                            `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                          }
                          parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                        />
                      </Form.Item>

                      <Form.Item
                        {...field}
                        name={[field.name, "description"]}
                        style={{ width: "40%", marginBottom: 0 }}
                      >
                        <Input placeholder="รายละเอียด" />
                      </Form.Item>

                      <Form.Item
                        {...field}
                        name={[field.name, "paid"]}
                        valuePropName="checked"
                        style={{ width: "10%", marginBottom: 0 }}
                      >
                        <Checkbox>จ่ายแล้ว</Checkbox>
                      </Form.Item>

                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(field.name)}
                      />
                    </div>
                  ))}
                </>
              )}
            </Form.List>

            <Form.Item
              name="owner_name"
              label="ชื่อเจ้าของโครงการ"
              rules={[
                { required: true, message: "กรุณาระบุชื่อเจ้าของโครงการ" },
              ]}
            >
              <Input placeholder="ระบุชื่อเจ้าของโครงการ" />
            </Form.Item>

            <Form.Item
              name="owner_contact"
              label="ช่องทางการติดต่อ"
              rules={[{ required: true, message: "กรุณาระบุช่องทางการติดต่อ" }]}
            >
              <Input placeholder="อีเมล หรือ เบอร์โทรศัพท์" />
            </Form.Item>

            <Divider orientation="left">ไฟล์แนบ</Divider>

            {editingProject && projectFiles.length > 0 && (
              <>
                <h4>ไฟล์ที่มีอยู่แล้ว</h4>
                <List
                  size="small"
                  bordered
                  dataSource={projectFiles}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button
                          type="link"
                          onClick={() =>
                            downloadFile(item.file_path, item.file_name)
                          }
                        >
                          ดาวน์โหลด
                        </Button>,
                        <Button
                          type="link"
                          danger
                          onClick={() => deleteFile(item.id, item.file_path)}
                        >
                          ลบ
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<FileOutlined />}
                        title={item.file_name}
                        description={`${(item.file_size / 1024).toFixed(2)} KB`}
                      />
                    </List.Item>
                  )}
                  style={{ marginBottom: 16 }}
                />
              </>
            )}

            <Dragger
              multiple
              beforeUpload={(file) => {
                setUploadedFiles((prev) => [...prev, file]);
                return false;
              }}
              onRemove={(file) => {
                setUploadedFiles((prev) =>
                  prev.filter((item) => item.uid !== file.uid)
                );
              }}
              fileList={uploadedFiles}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                คลิกหรือลากไฟล์มาที่นี่เพื่ออัปโหลด
              </p>
              <p className="ant-upload-hint">
                รองรับการอัปโหลดไฟล์หลายไฟล์พร้อมกัน
              </p>
            </Dragger>

            <Form.Item style={{ marginTop: 16 }}>
              <Button
                type="primary"
                htmlType="submit"
                style={{ width: "100%" }}
              >
                {editingProject ? "อัปเดตโปรเจค" : "สร้างโปรเจค"}
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </AdminOnly>
    </div>
  );
};

export default ProjectList;
