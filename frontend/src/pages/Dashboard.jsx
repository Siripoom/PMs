import React, { useState, useEffect } from 'react';
import { 
  Row, Col, Card, Statistic, Progress, 
  List, Tag, Divider, Spin, Empty, 
  Alert, Timeline, Button, Tabs
} from 'antd';
import { 
  ProjectOutlined, CheckCircleOutlined, ClockCircleOutlined, 
  WarningOutlined, DollarOutlined, TeamOutlined,
  CalendarOutlined, FileOutlined, ArrowUpOutlined, ArrowDownOutlined,
  SyncOutlined, RightOutlined, BarChartOutlined
} from '@ant-design/icons';
import moment from 'moment';
import 'moment/locale/th';
import { supabase } from '../supabaseClient';
import MonthlySummary from '../components/MounthlySummary';

const { TabPane } = Tabs;

const Dashboard = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    completedProjects: 0,
    inProgressProjects: 0,
    delayedProjects: 0,
    totalBudget: 0,
    activeBudget: 0
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [activities, setActivities] = useState([]);
  const [delayedProjectsList, setDelayedProjectsList] = useState([]);
  
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // ดึงข้อมูลโปรเจคทั้งหมด
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (projectsError) throw projectsError;
      
      // ดึงข้อมูลกิจกรรมล่าสุด
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('*, project:projects(name)')
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (activitiesError) throw activitiesError;
      
      // คำนวณสถิติต่างๆ
      const totalProjects = projects.length;
      const completedProjects = projects.filter(p => p.status === 'done').length;
      const inProgressProjects = projects.filter(p => p.status === 'in-progress').length;
      
      // กรองโปรเจคที่ล่าช้า
      const delayedProjects = projects.filter(p => p.status === 'delay');
      const delayedProjectsCount = delayedProjects.length;
      
      // เก็บรายการโปรเจคที่ล่าช้าไว้สำหรับแสดงในหน้ารายละเอียด
      setDelayedProjectsList(delayedProjects);
      
      const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
      const activeBudget = projects
        .filter(p => p.status !== 'done')
        .reduce((sum, p) => sum + (p.budget || 0), 0);
      
      // กรองโปรเจคที่ใกล้ถึงกำหนด (ภายใน 7 วัน)
      const upcoming = projects
        .filter(p => {
          if (p.status === 'done') return false;
          const daysLeft = moment(p.end_date).diff(moment(), 'days');
          return daysLeft >= 0 && daysLeft <= 7;
        })
        .sort((a, b) => moment(a.end_date).diff(moment(b.end_date)))
        .slice(0, 5)
        .map(p => ({
          ...p,
          daysLeft: moment(p.end_date).diff(moment(), 'days')
        }));
      
      setStats({
        totalProjects,
        completedProjects,
        inProgressProjects,
        delayedProjects: delayedProjectsCount,
        totalBudget,
        activeBudget
      });
      
      setRecentProjects(projects.slice(0, 5));
      setUpcomingDeadlines(upcoming);
      setActivities(activities || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getStatusTag = (status) => {
    switch(status) {
      case 'todo':
        return <Tag color="default">Todo</Tag>;
      case 'in-progress':
        return <Tag color="processing">In Progress</Tag>;
      case 'done':
        return <Tag color="success">Done</Tag>;
      case 'delay':
        return <Tag color="error">Delay</Tag>;
      case 'maintenance':
        return <Tag color="warning">Maintenance</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };
  
  const getActivityIcon = (type) => {
    switch(type) {
      case 'create':
        return <ProjectOutlined style={{ color: '#52c41a' }} />;
      case 'update':
        return <FileOutlined style={{ color: '#1890ff' }} />;
      case 'status_change':
        return <SyncOutlined style={{ color: '#fa8c16' }} />;
      case 'deadline_approaching':
        return <ClockCircleOutlined style={{ color: '#fa8c16' }} />;
      case 'deadline_passed':
        return <WarningOutlined style={{ color: '#f5222d' }} />;
      default:
        return <FileOutlined />;
    }
  };
  
  // ฟังก์ชันสำหรับแสดงรายละเอียดโปรเจคที่ล่าช้า
  const showDelayedProjects = () => {
    // สร้าง Modal หรือ Drawer เพื่อแสดงรายละเอียดโปรเจคที่ล่าช้า
    import('antd').then(({ Modal }) => {
      Modal.info({
        title: 'โปรเจคที่ล่าช้า',
        width: 700,
        content: (
          <div style={{ maxHeight: '60vh', overflow: 'auto' }}>
            <List
              itemLayout="horizontal"
              dataSource={delayedProjectsList}
              renderItem={item => (
                <List.Item
                  actions={[
                    <Button 
                      type="link" 
                      size="small"
                      onClick={() => {
                        Modal.destroyAll(); // ปิด Modal ปัจจุบัน
                        
                        // ถ้า onNavigate ถูกส่งมาจาก parent component
                        if (typeof onNavigate === 'function') {
                          onNavigate('projects', item.id);
                        } else {
                          // ถ้าไม่มี onNavigate ให้ใช้วิธีอื่นในการนำทาง เช่น 
                          // จัดเก็บ ID ลงใน localStorage และเปลี่ยนหน้า
                          localStorage.setItem('viewProjectId', item.id);
                          
                          // ถ้ามีการใช้ react-router
                          // navigate(`/projects/${item.id}`);
                          
                          // หรือถ้าไม่มี ให้แจ้งเตือนผู้ใช้
                          alert(`กรุณาไปที่หน้าโปรเจคและเปิดดูรายละเอียดของโปรเจค ${item.name}`);
                        }
                      }}
                    >
                      ดูรายละเอียด
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    title={item.name}
                    description={
                      <>
                        <div>เจ้าของโปรเจค: {item.owner_name}</div>
                        <div>วันสิ้นสุด: {moment(item.end_date).format('DD/MM/YYYY')}</div>
                        <div>
                          ล่าช้า: <Tag color="error">
                            {Math.abs(moment(item.end_date).diff(moment(), 'days'))} วัน
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
  
  // ฟังก์ชันสำหรับดูโปรเจคทั้งหมด
  const viewAllProjects = () => {
    if (typeof onNavigate === 'function') {
      onNavigate('projects');
    }
  };
  
  // ฟังก์ชันสำหรับดูโปรเจคที่ใกล้ถึงกำหนดทั้งหมด
  const viewAllUpcoming = () => {
    if (typeof onNavigate === 'function') {
      onNavigate('projects', null, { filter: 'upcoming' });
    }
  };
  
  return (
    <div className="dashboard">
      <Tabs defaultActiveKey="overview">
        <TabPane tab="ภาพรวม" key="overview">
          <Spin spinning={loading}>
            <div className="overview">
              <h2>ภาพรวมโปรเจค</h2>
              
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
                          percent={Math.round((stats.completedProjects / stats.totalProjects) * 100)} 
                          size="small" 
                          status="active"
                        />
                      </div>
                    )}
                  </Card>
                </Col>
                
                <Col xs={24} sm={12} lg={6}>
                  <Card hoverable onClick={() => {
                    if (typeof onNavigate === 'function') {
                      onNavigate('projects', null, { status: 'done' });
                    }
                  }}>
                    <Statistic
                      title="เสร็จสิ้นแล้ว"
                      value={stats.completedProjects}
                      valueStyle={{ color: '#3f8600' }}
                      prefix={<CheckCircleOutlined />}
                      suffix={stats.totalProjects > 0 ? `/ ${stats.totalProjects}` : ''}
                    />
                  </Card>
                </Col>
                
                <Col xs={24} sm={12} lg={6}>
                  <Card hoverable onClick={() => {
                    if (typeof onNavigate === 'function') {
                      onNavigate('projects', null, { status: 'in-progress' });
                    }
                  }}>
                    <Statistic
                      title="กำลังดำเนินการ"
                      value={stats.inProgressProjects}
                      valueStyle={{ color: '#1890ff' }}
                      prefix={<ClockCircleOutlined />}
                    />
                  </Card>
                </Col>
                
                <Col xs={24} sm={12} lg={6}>
                  <Card hoverable onClick={() => {
                    if (typeof onNavigate === 'function') {
                      onNavigate('projects', null, { status: 'delay' });
                    } else {
                      showDelayedProjects();
                    }
                  }}>
                    <Statistic
                      title="ล่าช้า"
                      value={stats.delayedProjects}
                      valueStyle={{ color: '#cf1322' }}
                      prefix={<WarningOutlined />}
                    />
                  </Card>
                </Col>
              </Row>
              
              <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={24} sm={12}>
                  <Card>
                    <Statistic
                      title="งบประมาณทั้งหมด"
                      value={stats.totalBudget}
                      precision={2}
                      valueStyle={{ color: '#3f8600' }}
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
                      valueStyle={{ color: '#1890ff' }}
                      prefix={<DollarOutlined />}
                      suffix="บาท"
                    />
                    {stats.totalBudget > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <Progress 
                          percent={Math.round((stats.activeBudget / stats.totalBudget) * 100)} 
                          size="small" 
                          status="active"
                          strokeColor="#1890ff"
                        />
                      </div>
                    )}
                  </Card>
                </Col>
              </Row>
            </div>
            
            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card 
                  title={<><CalendarOutlined /> โปรเจคที่ใกล้ถึงกำหนด</>} 
                  style={{ marginBottom: 16 }}
                  extra={<Button type="link" size="small" onClick={viewAllUpcoming}>ดูทั้งหมด</Button>}
                >
                  {upcomingDeadlines.length > 0 ? (
                    <List
                      dataSource={upcomingDeadlines}
                      renderItem={item => (
                        <List.Item
                          actions={[
                            <Tag 
                              color={item.daysLeft === 0 ? 'red' : (item.daysLeft <= 2 ? 'orange' : 'green')}
                            >
                              {item.daysLeft === 0 ? 'วันนี้' : `อีก ${item.daysLeft} วัน`}
                            </Tag>
                          ]}
                        >
                          <List.Item.Meta
                            title={<a onClick={() => {
                              if (typeof onNavigate === 'function') {
                                onNavigate('projects', item.id);
                              }
                            }}>{item.name}</a>}
                            description={<>
                              {getStatusTag(item.status)}
                              <span style={{ marginLeft: 8 }}>
                                วันสิ้นสุด: {moment(item.end_date).format('DD/MM/YYYY')}
                              </span>
                            </>}
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
                  title={<><ProjectOutlined /> โปรเจคล่าสุด</>} 
                  style={{ marginBottom: 16 }}
                  extra={<Button type="link" size="small" onClick={viewAllProjects}>ดูทั้งหมด</Button>}
                >
                  {recentProjects.length > 0 ? (
                    <List
                      dataSource={recentProjects}
                      renderItem={item => (
                        <List.Item
                          actions={[getStatusTag(item.status)]}
                        >
                          <List.Item.Meta
                            title={<a onClick={() => {
                              if (typeof onNavigate === 'function') {
                                onNavigate('projects', item.id);
                              }
                            }}>{item.name}</a>}
                            description={<>
                              <span>
                                วันที่สร้าง: {moment(item.created_at).format('DD/MM/YYYY')}
                              </span>
                              <div>
                                งบประมาณ: {(item.budget || 0).toLocaleString('th-TH')} บาท
                              </div>
                            </>}
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
            
            <Card 
              title={<><TeamOutlined /> กิจกรรมล่าสุด</>} 
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
                        <strong>{activity.project?.name}</strong>
                        <span style={{ color: '#999', marginLeft: 8 }}>
                          {moment(activity.created_at).fromNow()}
                        </span>
                      </div>
                      <div>{activity.description}</div>
                    </Timeline.Item>
                  ))}
                </Timeline>
              ) : (
                <Empty description="ไม่มีกิจกรรมล่าสุด" />
              )}
            </Card>
            
            {/* Alert สำหรับโปรเจคที่มีปัญหา */}
            {/* {stats.delayedProjects > 0 && (
              <Alert
                message={`มีโปรเจคที่ล่าช้า ${stats.delayedProjects} รายการ`}
                description="กรุณาตรวจสอบและอัปเดตสถานะโปรเจค"
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
                action={
                  <Button 
                    size="small" 
                    type="primary" 
                    danger 
                    onClick={showDelayedProjects}
                    icon={<RightOutlined />}
                  >
                    ดูรายละเอียด
                  </Button>
                }
              />
            )} */}
          </Spin>
        </TabPane>
        
        {/* เพิ่มแท็บใหม่สำหรับสรุปรายเดือน */}
        <TabPane tab={<><BarChartOutlined /> สรุปรายเดือน</>} key="monthly">
          <MonthlySummary supabase={supabase} />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Dashboard;