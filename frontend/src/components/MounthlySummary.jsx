import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Tabs,
  Empty,
  Spin,
  Row,
  Col,
  Select,
  Statistic,
} from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  ProjectOutlined,
  DollarOutlined,
  CalendarOutlined,
  BarChartOutlined,
} from "@ant-design/icons";
import moment from "moment";
import "moment/locale/th";
moment.locale("th");

const { TabPane } = Tabs;
const { Option } = Select;

const MonthlySummary = ({ supabase }) => {
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(moment().year());
  const [years, setYears] = useState([]);

  useEffect(() => {
    fetchProjects();
  }, [selectedYear]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      // ดึงข้อมูลโปรเจคทั้งหมด
      const { data: projects, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // สร้างรายการปีที่มีข้อมูล
      const yearsList = [
        ...new Set(projects.map((p) => moment(p.created_at).year())),
      ];
      setYears(yearsList);

      // จัดกลุ่มข้อมูลตามเดือนและปี
      processMonthlySummary(projects);
    } catch (error) {
      console.error("Error fetching projects for monthly summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const processMonthlySummary = (projects) => {
    // สร้างอาร์เรย์ว่างสำหรับ 12 เดือน
    const months = [];
    for (let i = 0; i < 12; i++) {
      months.push({
        month: i,
        monthName: moment().month(i).format("MMMM"),
        projectCount: 0,
        totalBudget: 0,
        projects: [],
      });
    }

    // จัดกลุ่มโปรเจคตามเดือนและปี
    projects.forEach((project) => {
      const createdDate = moment(project.created_at);
      const projectYear = createdDate.year();

      // ตรวจสอบว่าโปรเจคอยู่ในปีที่เลือกหรือไม่
      if (projectYear === selectedYear) {
        const monthIndex = createdDate.month();

        // เพิ่มจำนวนโปรเจคและงบประมาณ
        months[monthIndex].projectCount += 1;
        months[monthIndex].totalBudget += project.budget || 0;
        months[monthIndex].projects.push(project);
      }
    });

    setMonthlyData(months);
  };

  const columns = [
    {
      title: "เดือน",
      dataIndex: "monthName",
      key: "monthName",
    },
    {
      title: "จำนวนโปรเจค",
      dataIndex: "projectCount",
      key: "projectCount",
      sorter: (a, b) => a.projectCount - b.projectCount,
    },
    {
      title: "งบประมาณรวม (บาท)",
      dataIndex: "totalBudget",
      key: "totalBudget",
      sorter: (a, b) => a.totalBudget - b.totalBudget,
      render: (value) => value.toLocaleString("th-TH"),
    },
  ];

  // คำนวณสถิติรวมของปี
  const calculateYearlyStats = () => {
    const totalProjects = monthlyData.reduce(
      (sum, month) => sum + month.projectCount,
      0
    );
    const totalBudget = monthlyData.reduce(
      (sum, month) => sum + month.totalBudget,
      0
    );
    const avgProjectsPerMonth = totalProjects / 12;
    const avgBudgetPerMonth = totalBudget / 12;

    return {
      totalProjects,
      totalBudget,
      avgProjectsPerMonth,
      avgBudgetPerMonth,
    };
  };

  const yearlyStats = calculateYearlyStats();

  return (
    <Spin spinning={loading}>
      <Card
        title={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>
              <BarChartOutlined /> สรุปรายเดือน
            </span>
            <Select
              value={selectedYear}
              onChange={setSelectedYear}
              style={{ width: 120 }}
              placeholder="เลือกปี"
            >
              {years.map((year) => (
                <Option key={year} value={year}>
                  {year}
                </Option>
              ))}
            </Select>
          </div>
        }
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="โปรเจคทั้งหมดในปี"
                value={yearlyStats.totalProjects}
                prefix={<ProjectOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="งบประมาณรวมทั้งปี"
                value={yearlyStats.totalBudget}
                precision={2}
                valueStyle={{ color: "#3f8600" }}
                prefix={<DollarOutlined />}
                suffix="บาท"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="โปรเจคเฉลี่ยต่อเดือน"
                value={yearlyStats.avgProjectsPerMonth}
                precision={1}
                prefix={<CalendarOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="งบประมาณเฉลี่ยต่อเดือน"
                value={yearlyStats.avgBudgetPerMonth}
                precision={2}
                valueStyle={{ color: "#1890ff" }}
                prefix={<DollarOutlined />}
                suffix="บาท"
              />
            </Card>
          </Col>
        </Row>

        <Tabs defaultActiveKey="chart">
          <TabPane tab="กราฟแท่ง" key="chart">
            {monthlyData.length > 0 ? (
              <div style={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monthName" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#82ca9d"
                    />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === "งบประมาณ") {
                          return [`${value.toLocaleString("th-TH")} บาท`, name];
                        }
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Bar
                      yAxisId="left"
                      dataKey="projectCount"
                      name="จำนวนโปรเจค"
                      fill="#8884d8"
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="totalBudget"
                      name="งบประมาณ"
                      fill="#82ca9d"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty description="ไม่มีข้อมูลสำหรับปีที่เลือก" />
            )}
          </TabPane>
          <TabPane tab="กราฟเส้น" key="line">
            {monthlyData.length > 0 ? (
              <div style={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monthName" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#82ca9d"
                    />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === "งบประมาณ") {
                          return [`${value.toLocaleString("th-TH")} บาท`, name];
                        }
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="projectCount"
                      name="จำนวนโปรเจค"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="totalBudget"
                      name="งบประมาณ"
                      stroke="#82ca9d"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty description="ไม่มีข้อมูลสำหรับปีที่เลือก" />
            )}
          </TabPane>
          <TabPane tab="ตาราง" key="table">
            <Table
              dataSource={monthlyData}
              columns={columns}
              rowKey="month"
              pagination={false}
              expandable={{
                expandedRowRender: (record) => (
                  <div>
                    <p>รายการโปรเจคในเดือน {record.monthName}:</p>
                    {record.projects.length > 0 ? (
                      <ul>
                        {record.projects.map((project) => (
                          <li key={project.id}>
                            {project.name} -{" "}
                            {project.budget?.toLocaleString("th-TH")} บาท (
                            {moment(project.created_at).format("DD MMMM YYYY")})
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>ไม่มีโปรเจคในเดือนนี้</p>
                    )}
                  </div>
                ),
              }}
            />
          </TabPane>
        </Tabs>
      </Card>
    </Spin>
  );
};

export default MonthlySummary;
