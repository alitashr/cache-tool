import React, { PropTypes } from 'react';
import { Form, Input, Button, Checkbox, Select } from 'antd';
import { Option } from 'antd/lib/mentions';

const layout = {
  labelCol: { span: 10 },
  wrapperCol: { span: 4 },
};
const tailLayout = {
  wrapperCol: { offset: 10, span: 4 },
};

const Login = (props) => {
  const {onSubmit, errorMsg} = props;
  const onFinish = (values) => {
    console.log('Success:', values);
    if(onSubmit) onSubmit(values);
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  return (
    <Form
      {...layout}
      name="basic"
      initialValues={{ remember: true }}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
    >
      <Form.Item
        label="Username"
        name="username"
        rules={[{ required: true, message: 'Please enter username!' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="Password"
        name="password"
        rules={[{ required: true, message: 'Please enter password!' }]}
      >
        <Input.Password />
      </Form.Item>
      <Form.Item
        label="Domain"
        name="select"

      >
         <Select
            style={{ width: 120 }}
            defaultValue="v3"
          >
            <Option value="v3">V3</Option>
            <Option value="v3dev">V3Dev</Option>
            <Option value="v3rc">V3RC</Option>
          </Select>
      </Form.Item>

{errorMsg && errorMsg!=='' &&
(
  <p>{errorMsg}</p>
)}
      <Form.Item {...tailLayout}>
        <Button type="primary" htmlType="submit">
          Log in
        </Button>
      </Form.Item>
    </Form>
  );
};

Login.propTypes = {
  
};

export default Login;