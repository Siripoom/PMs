// src/pages/TeamMembers.jsx
import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Space,
  Avatar,
  Tooltip,
  notification,
  Upload,
  Switch,
  Divider,
} from "antd";
import {
  UserOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  PhoneOutlined,
  MailOutlined,
  TeamOutlined,
  PaperClipOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { supabase } from "../supabaseClient";

const { Option } = Select;
const { TextArea } = Input;

const TeamMembers = () => {
  const [members, setMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingMember, setEditingMember] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  // ทักษะที่เป็นตัวเลือกให้เลือก
  const skillOptions = [
    "React",
    "Vue",
    "Angular",
    "JavaScript",
    "TypeScript",
    "HTML/CSS",
    "Node.js",
    "PHP",
    "Python",
    "Java",
    "C#",
    ".NET",
    "UI/UX Design",
    "Graphic Design",
    "Project Management",
    "Marketing",
    "Content Writing",
    "SEO",
    "DevOps",
    "Database",
    "Testing",
    "Mobile Development",
  ];

  useEffect(() => {
    fetchTeamMembers();
    fetchProjects();
  }, []);

  // แก้ไขในฟังก์ชัน fetchTeamMembers ในไฟล์ TeamMembers.jsx

  const fetchTeamMembers = async () => {
    setLoading(true);
    try {
      // ดึงข้อมูลทีมงานพร้อมการมอบหมายโปรเจค
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

      if (error) throw error;

      // แก้ไขข้อมูลที่ได้รับมาให้อยู่ในรูปแบบที่ใช้ง่าย
      const formattedMembers = data.map((member) => {
        // คัดกรองการมอบหมายที่มีข้อมูลโปรเจคครบถ้วน
        const validAssignments =
          member.assignments?.filter(
            (assignment) => assignment.project && assignment.project.id
          ) || [];

        return {
          ...member,
          assignments: validAssignments,
        };
      });

      // ลอง console.log ดูข้อมูลที่ได้
      console.log("Team members with assignments:", formattedMembers);

      setMembers(formattedMembers || []);
    } catch (error) {
      console.error("Error fetching team members:", error);
      notification.error({
        message: "ไม่สามารถดึงข้อมูลทีมงานได้",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .order("name");

      if (error) throw error;

      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const showMemberModal = (member = null) => {
    setEditingMember(member);
    setAvatarUrl(member?.avatar_url || "");
    console.log("Edit member data:", member);

    if (member) {
      console.log("Member assignments:", member.assignments);
      // ตรวจสอบว่ามี assignments หรือไม่
      const projectAssignments =
        member.assignments && member.assignments.length > 0
          ? member.assignments.map((a) => ({
              project_id: a.project?.id || a.project_id,
              role: a.role,
            }))
          : [{ project_id: undefined, role: undefined }];

      form.setFieldsValue({
        ...member,
        project_assignments: projectAssignments,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        active: true,
        project_assignments: [{ project_id: undefined, role: undefined }],
      });
    }

    setModalVisible(true);
  };

  const handleUploadAvatar = async (file) => {
    try {
      setUploading(true);

      // สร้างชื่อไฟล์ที่ไม่ซ้ำกันโดยใช้เวลาปัจจุบัน
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // อัปโหลดไฟล์ไปยัง Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("team-avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // สร้าง public URL
      const { data } = supabase.storage
        .from("team-avatars")
        .getPublicUrl(filePath);

      setAvatarUrl(data.publicUrl);

      notification.success({
        message: "อัปโหลดรูปภาพสำเร็จ",
        description: "อัปโหลดรูปโปรไฟล์เรียบร้อยแล้ว",
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      notification.error({
        message: "ไม่สามารถอัปโหลดรูปภาพได้",
        description: error.message,
      });
    } finally {
      setUploading(false);
    }
  };

  // แก้ไขในฟังก์ชัน handleSubmit ในไฟล์ TeamMembers.jsx

  const handleSubmit = async (values) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user)
        throw new Error("ไม่มีข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่");

      // ข้อมูลสมาชิกทีม
      const memberData = {
        name: values.name,
        position: values.position,
        email: values.email,
        phone: values.phone,
        skills: values.skills,
        active: values.active,
        avatar_url: avatarUrl,
        user_id: userData.user.id,
      };

      let memberId;

      // อัปเดตหรือเพิ่มสมาชิกทีม
      if (editingMember) {
        const { data, error } = await supabase
          .from("team_members")
          .update(memberData)
          .eq("id", editingMember.id)
          .select();

        if (error) throw error;
        memberId = editingMember.id;

        notification.success({
          message: "อัปเดตข้อมูลสำเร็จ",
          description: `อัปเดตข้อมูลของ ${values.name} เรียบร้อยแล้ว`,
        });
      } else {
        const { data, error } = await supabase
          .from("team_members")
          .insert([memberData])
          .select();

        if (error) throw error;
        memberId = data[0].id;

        notification.success({
          message: "เพิ่มสมาชิกสำเร็จ",
          description: `เพิ่ม ${values.name} เข้าทีมเรียบร้อยแล้ว`,
        });
      }

      // จัดการการมอบหมายโปรเจค
      if (values.project_assignments && values.project_assignments.length > 0) {
        // ลบการมอบหมายเดิมทั้งหมด
        if (editingMember) {
          const { error: deleteError } = await supabase
            .from("team_project_assignments")
            .delete()
            .eq("team_member_id", memberId);

          if (deleteError) {
            console.error("Error deleting old assignments:", deleteError);
            // ไม่ throw error เพื่อให้โค้ดทำงานต่อไป
          }
        }

        // กรองเฉพาะการมอบหมายที่มีข้อมูลครบถ้วน
        const validAssignments = values.project_assignments.filter(
          (a) => a && a.project_id && a.role
        );

        console.log("Valid assignments to save:", validAssignments);

        // เพิ่มการมอบหมายใหม่
        if (validAssignments.length > 0) {
          const assignmentsData = validAssignments.map((a) => ({
            team_member_id: memberId,
            project_id: a.project_id,
            role: a.role,
          }));

          const { data: assignmentData, error: assignmentError } =
            await supabase
              .from("team_project_assignments")
              .insert(assignmentsData)
              .select();

          if (assignmentError) {
            console.error("Error inserting assignments:", assignmentError);
            notification.warning({
              message: "บันทึกการมอบหมายโปรเจคไม่สมบูรณ์",
              description: assignmentError.message,
            });
          } else {
            console.log("Saved assignments:", assignmentData);
          }
        }
      }

      fetchTeamMembers();
      setModalVisible(false);
    } catch (error) {
      console.error("Error saving team member:", error);
      notification.error({
        message: "ไม่สามารถบันทึกข้อมูลได้",
        description: error.message,
      });
    }
  };

  const deleteMember = async (id) => {
    try {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", id);

      if (error) throw error;

      notification.success({
        message: "ลบสมาชิกสำเร็จ",
        description: "ลบสมาชิกทีมเรียบร้อยแล้ว",
      });

      fetchTeamMembers();
    } catch (error) {
      console.error("Error deleting team member:", error);
      notification.error({
        message: "ไม่สามารถลบสมาชิกได้",
        description: error.message,
      });
    }
  };

  const columns = [
    {
      title: "สมาชิก",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div style={{ display: "flex", alignItems: "center" }}>
          <Avatar
            size={40}
            src={record.avatar_url}
            icon={<UserOutlined />}
            style={{ marginRight: 12 }}
          />
          <div>
            <div style={{ fontWeight: "bold" }}>{text}</div>
            <div style={{ fontSize: "12px", color: "#666" }}>
              {record.position}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "การติดต่อ",
      key: "contact",
      render: (text, record) => (
        <div>
          {record.email && (
            <div>
              <MailOutlined style={{ marginRight: 8 }} />
              {record.email}
            </div>
          )}
          {record.phone && (
            <div>
              <PhoneOutlined style={{ marginRight: 8 }} />
              {record.phone}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "ทักษะ",
      dataIndex: "skills",
      key: "skills",
      render: (skills) => (
        <>
          {skills &&
            skills.map((skill) => (
              <Tag color="blue" key={skill}>
                {skill}
              </Tag>
            ))}
        </>
      ),
    },
    {
      title: "โปรเจคที่ร่วมงาน",
      key: "projects",
      render: (text, record) => {
        // ตรวจสอบว่ามี assignments หรือไม่
        console.log(`Projects for ${record.name}:`, record.assignments);

        if (!record.assignments || record.assignments.length === 0) {
          return <span style={{ color: "#999" }}>ไม่มีโปรเจคที่ร่วมงาน</span>;
        }

        return (
          <>
            {record.assignments.map((assignment) => (
              <div
                key={
                  assignment.id || `${assignment.project_id}-${Math.random()}`
                }
                style={{ marginBottom: 4 }}
              >
                <Tooltip title={`บทบาท: ${assignment.role || "ไม่ระบุ"}`}>
                  <Tag color="green">
                    {assignment.project?.name || "โปรเจคที่ไม่มีชื่อ"}
                  </Tag>
                </Tooltip>
                {assignment.role && (
                  <span
                    style={{ fontSize: "12px", color: "#666", marginLeft: 4 }}
                  >
                    ({assignment.role})
                  </span>
                )}
              </div>
            ))}
          </>
        );
      },
    },
    {
      title: "สถานะ",
      dataIndex: "active",
      key: "active",
      render: (active) => (
        <Tag color={active ? "green" : "red"}>
          {active ? "ทำงานอยู่" : "ไม่ได้ทำงานแล้ว"}
        </Tag>
      ),
    },
    {
      title: "จัดการ",
      key: "action",
      render: (text, record) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => showMemberModal(record)}
          />
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => {
              if (
                window.confirm(
                  `คุณต้องการลบ ${record.name} ออกจากทีมใช่หรือไม่?`
                )
              ) {
                deleteMember(record.id);
              }
            }}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="team-members-page">
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <h2>
          <TeamOutlined /> ทีมงาน
        </h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => showMemberModal()}
        >
          เพิ่มสมาชิกใหม่
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={members}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingMember ? "แก้ไขข้อมูลสมาชิก" : "เพิ่มสมาชิกใหม่"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div style={{ marginBottom: 16, textAlign: "center" }}>
            <Avatar
              size={100}
              src={avatarUrl}
              icon={<UserOutlined />}
              style={{ marginBottom: 16 }}
            />
            <Upload
              showUploadList={false}
              beforeUpload={(file) => {
                handleUploadAvatar(file);
                return false;
              }}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />} loading={uploading}>
                อัปโหลดรูปโปรไฟล์
              </Button>
            </Upload>
          </div>
          <Form.Item
            name="name"
            label="ชื่อ-นามสกุล"
            rules={[{ required: true, message: "กรุณากรอกชื่อ-นามสกุล" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="กรอกชื่อ-นามสกุล" />
          </Form.Item>
          <Form.Item name="position" label="ตำแหน่ง">
            <Input placeholder="ตำแหน่งหรือหน้าที่" />
          </Form.Item>
          <Form.Item
            name="email"
            label="อีเมล"
            rules={[{ type: "email", message: "รูปแบบอีเมลไม่ถูกต้อง" }]}
          >
            <Input prefix={<MailOutlined />} placeholder="อีเมล" />
          </Form.Item>
          <Form.Item name="phone" label="เบอร์โทรศัพท์">
            <Input prefix={<PhoneOutlined />} placeholder="เบอร์โทรศัพท์" />
          </Form.Item>
          <Form.Item name="skills" label="ทักษะ">
            <Select
              mode="multiple"
              placeholder="เลือกทักษะ"
              style={{ width: "100%" }}
              allowClear
            >
              {skillOptions.map((skill) => (
                <Option key={skill} value={skill}>
                  {skill}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="active" label="สถานะ" valuePropName="checked">
            <Switch
              checkedChildren="ทำงานอยู่"
              unCheckedChildren="ไม่ได้ทำงานแล้ว"
              defaultChecked
            />
          </Form.Item>
          <Divider>โปรเจคที่ร่วมงาน</Divider>

          <Form.List name="project_assignments">
            {(fields, { add, remove }) => (
              <>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <h4 style={{ margin: 0 }}>โปรเจคที่ร่วมงาน</h4>
                  <Button
                    type="dashed"
                    onClick={() =>
                      add({ project_id: undefined, role: undefined })
                    }
                    icon={<PlusOutlined />}
                  >
                    เพิ่มโปรเจค
                  </Button>
                </div>

                {fields.length === 0 ? (
                  <Alert
                    message="ยังไม่มีโปรเจคที่มอบหมาย"
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                ) : (
                  fields.map((field) => (
                    <div
                      key={field.key}
                      style={{ display: "flex", marginBottom: 8, gap: 8 }}
                    >
                      <Form.Item
                        {...field}
                        name={[field.name, "project_id"]}
                        style={{ width: "60%", marginBottom: 0 }}
                        rules={[
                          { required: true, message: "กรุณาเลือกโปรเจค" },
                        ]}
                      >
                        <Select placeholder="เลือกโปรเจค">
                          {projects.map((project) => (
                            <Option key={project.id} value={project.id}>
                              {project.name}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>

                      <Form.Item
                        {...field}
                        name={[field.name, "role"]}
                        style={{ width: "30%", marginBottom: 0 }}
                        rules={[{ required: true, message: "กรุณาระบุบทบาท" }]}
                      >
                        <Input placeholder="บทบาท/หน้าที่" />
                      </Form.Item>

                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(field.name)}
                      />
                    </div>
                  ))
                )}

                {fields.length === 0 && (
                  <Form.Item>
                    <Button
                      type="dashed"
                      onClick={() =>
                        add({ project_id: undefined, role: undefined })
                      }
                      block
                      icon={<PlusOutlined />}
                    >
                      เพิ่มโปรเจค
                    </Button>
                  </Form.Item>
                )}
              </>
            )}
          </Form.List>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {editingMember ? "บันทึกข้อมูล" : "เพิ่มสมาชิก"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TeamMembers;
