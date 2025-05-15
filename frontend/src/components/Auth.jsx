import React, { useState } from 'react';
import { Form, Input, Button, Card, Divider, Alert, Typography } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { supabase } from '../supabaseClient';

const { Title, Text } = Typography;

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('login'); // 'login' หรือ 'register'
  const [errorMessage, setErrorMessage] = useState(null);

  const handleLogin = async (values) => {
    try {
      setLoading(true);
      setErrorMessage(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      
      if (error) throw error;
      
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values) => {
    try {
      setLoading(true);
      setErrorMessage(null);
      
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      });
      
      if (error) throw error;
      
      setMode('login');
      alert('สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบ');
      
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: '50px 0' }}>
      <Card>
        <Title level={3} style={{ textAlign: 'center', marginBottom: 30 }}>
          {mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
        </Title>
        
        {errorMessage && (
          <Alert 
            message="เกิดข้อผิดพลาด" 
            description={errorMessage} 
            type="error" 
            showIcon 
            style={{ marginBottom: 16 }}
          />
        )}
        
        <Form
          name="auth-form"
          onFinish={mode === 'login' ? handleLogin : handleRegister}
          layout="vertical"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'กรุณากรอกอีเมล' },
              { type: 'email', message: 'รูปแบบอีเมลไม่ถูกต้อง' }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="อีเมล" />
          </Form.Item>
          
          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'กรุณากรอกรหัสผ่าน' },
              { min: 6, message: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' }
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="รหัสผ่าน" />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              {mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
            </Button>
          </Form.Item>
        </Form>
        
        <Divider plain>หรือ</Divider>
        
        <Button 
          type="link" 
          block 
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          style={{ marginBottom: 0 }}
        >
          {mode === 'login' ? 'สมัครสมาชิกใหม่' : 'เข้าสู่ระบบ'}
        </Button>
      </Card>
    </div>
  );
};

export default Auth;