import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Space,
  Spin,
  Typography,
} from 'antd'
import { DeleteOutlined, LoginOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons'
import { API_ENDPOINTS } from '../../config/api'
import { useAppDispatch } from '../../store/hooks'
import { fetchUserInfo } from '../../store/slices/userInfoSlice'
import type { UserInfo } from '../../types/user'
import { fetchWithAdminCookie, loginAdmin, logoutAdmin } from '../../utils/adminAuth'
import styles from './AdminProfile.module.css'

const { Title, Paragraph } = Typography

interface SkillFormItem {
  id?: number
  name?: string
  nameEn?: string
  level?: number
  classify?: string
  classifyEn?: string
}

interface ProfileFormValues extends UserInfo {
  skills: SkillFormItem[]
}

interface AdminProfileResponse {
  userInfo: UserInfo | null
  skills: SkillFormItem[]
}

export const AdminProfile: React.FC = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [loginForm] = Form.useForm()
  const [profileForm] = Form.useForm<ProfileFormValues>()
  const [authed, setAuthed] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const redirectPath = searchParams.get('redirect')

  const fillProfile = (data: AdminProfileResponse) => {
    profileForm.setFieldsValue({
      ...(data.userInfo || {}),
      skills: data.skills?.length ? data.skills : [],
    })
  }

  const clearSession = async () => {
    await logoutAdmin()
    setAuthed(false)
  }

  const loadProfile = async () => {
    setLoading(true)
    try {
      const response = await fetchWithAdminCookie(API_ENDPOINTS.ADMIN_PROFILE)
      if (response.status === 401) {
        setAuthed(false)
        return
      }
      if (!response.ok) {
        throw new Error(`加载失败: ${response.status}`)
      }
      setAuthed(true)
      fillProfile(await response.json())
    } catch (error) {
      message.error(error instanceof Error ? error.message : '加载资料失败')
    } finally {
      setLoading(false)
      setCheckingAuth(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  const handleLogin = async () => {
    try {
      const values = await loginForm.validateFields()
      setLoading(true)
      await loginAdmin(values)
      setAuthed(true)
      message.success('登录成功')
      if (redirectPath) {
        navigate(redirectPath, { replace: true })
        return
      }
      await loadProfile()
    } catch (error) {
      message.error(error instanceof Error ? error.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const values = await profileForm.validateFields()
      setSaving(true)
      const { skills, ...userInfo } = values
      const response = await fetchWithAdminCookie(API_ENDPOINTS.ADMIN_PROFILE, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInfo,
          skills: (skills || []).map((skill) => ({
            name: skill.name,
            nameEn: skill.nameEn,
            level: skill.level,
            classify: skill.classify,
            classifyEn: skill.classifyEn,
          })),
        }),
      })
      const data = await response.json()
      if (response.status === 401) {
        setAuthed(false)
        throw new Error(data.message || '登录已失效，请重新登录')
      }
      if (!response.ok) {
        throw new Error(data.message || `保存失败: ${response.status}`)
      }
      fillProfile(data)
      dispatch(fetchUserInfo())
      message.success('保存成功，关于我页面会展示最新数据')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className={styles.admin}>
        <Spin />
      </div>
    )
  }

  if (!authed) {
    return (
      <div className={styles.admin}>
        <Card className={styles.loginCard}>
          <Title level={3}>资料管理登录</Title>
          <Form form={loginForm} layout="vertical" onFinish={handleLogin}>
            <Form.Item
              label="账号"
              name="username"
              initialValue="14776866846"
              rules={[{ required: true, message: '请输入账号' }]}
            >
              <Input autoComplete="username" />
            </Form.Item>
            <Form.Item
              label="密码"
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password autoComplete="current-password" />
            </Form.Item>
            <Button type="primary" htmlType="submit" icon={<LoginOutlined />} loading={loading} block>
              登录
            </Button>
          </Form>
        </Card>
      </div>
    )
  }

  return (
    <div className={styles.admin}>
      <div className={styles.header}>
        <div>
          <Title level={2}>资料管理</Title>
          <Paragraph className={styles.subtitle}>
            保存后会写入现有 user_info 和 skills 表，直接影响 /about 页面展示。
          </Paragraph>
        </div>
        <Space>
          <Button onClick={clearSession}>退出登录</Button>
          <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}>
            保存
          </Button>
        </Space>
      </div>

      <Spin spinning={loading}>
        <Form form={profileForm} layout="vertical">
          <Card title="个人信息" className={styles.card}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="name" label="中文姓名" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="nameEn" label="英文姓名">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="title" label="中文头衔" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="titleEn" label="英文头衔">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item name="bio" label="中文简介">
                  <Input.TextArea rows={4} />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item name="bioEn" label="英文简介">
                  <Input.TextArea rows={4} />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="联系方式和链接" className={styles.card}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="wechat" label="微信二维码图片地址">
                  <Input placeholder="https://..." />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="avatar" label="头像图片地址">
                  <Input placeholder="https://..." />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="email" label="邮箱">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="phoneNumber" label="手机号">
                  <Input />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="github" label="GitHub">
                  <Input placeholder="https://..." />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="gitee" label="Gitee">
                  <Input placeholder="https://..." />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item name="resumeUrl" label="简历地址">
                  <Input placeholder="https://..." />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Card title="技术栈水平" className={styles.card}>
            <Form.List name="skills">
              {(fields, { add, remove }) => (
                <>
                  <div className={styles.skillToolbar}>
                    <Button
                      icon={<PlusOutlined />}
                      onClick={() =>
                        add({ classify: '前端', classifyEn: 'frontend', name: '', nameEn: '', level: 80 })
                      }
                    >
                      添加技能
                    </Button>
                  </div>
                  {fields.map((field) => (
                    <div key={field.key} className={styles.skillRow}>
                      <Form.Item
                        {...field}
                        name={[field.name, 'classify']}
                        rules={[{ required: true, message: '分类必填' }]}
                      >
                        <Input placeholder="中文分类" />
                      </Form.Item>
                      <Form.Item
                        {...field}
                        name={[field.name, 'classifyEn']}
                        rules={[{ required: true, message: '英文分类必填' }]}
                      >
                        <Input placeholder="英文分类" />
                      </Form.Item>
                      <Form.Item
                        {...field}
                        name={[field.name, 'name']}
                        rules={[{ required: true, message: '技能名必填' }]}
                      >
                        <Input placeholder="中文技能" />
                      </Form.Item>
                      <Form.Item {...field} name={[field.name, 'nameEn']}>
                        <Input placeholder="英文技能" />
                      </Form.Item>
                      <Form.Item
                        {...field}
                        name={[field.name, 'level']}
                        rules={[{ required: true, message: '水平必填' }]}
                      >
                        <InputNumber min={0} max={100} addonAfter="%" style={{ width: '100%' }} />
                      </Form.Item>
                      <Button danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} />
                    </div>
                  ))}
                </>
              )}
            </Form.List>
          </Card>
        </Form>
      </Spin>
    </div>
  )
}
