import React, { useEffect, useState } from "react";

import { Checkbox, Col, Divider, Input, Menu, message, Row, Select, Space } from "antd";

import logo from "./logo.svg";
import "./App.css";
import AppProvider from "./api/appProvider";
import { Button } from "antd";
import Title from "antd/lib/typography/Title";
import { Option } from "antd/lib/mentions";
import Login from "./Login";

function App() {
  const [total, setTotal] = useState(null);
  const [currentDesign, setCurrentDesign] = useState({});
  const [isbuilding, setIsbuilding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [selectedType, setSelectedType] = useState("color");
  const [logged, setLogged] = useState(false);
  const [texturedThumbs, setTexturedThumbs] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const onSubmit = (values) => {
    console.log("onSubmit -> values", values);
    getKey({ username: values.username, password: values.password });
  };

  const getKey = ({ username, password }) => {
    AppProvider.fetchApiKey({
      username: username,
      password: password,
    })
      .then((key) => {
        console.log("onSubmit -> key", key);
        setErrorMsg("");
        message.success("Logged in Successfully", 3);
        setLogged(true);
      })
      .catch(() => {
        setErrorMsg("Invalid Credentials");
      });
  };
  const createCache = () => {
    if (isbuilding) return;
    if (!logged) {
      message.warning({
        content: "Please login first",
        className: "custom-class",
        duration: 20,
      });
      //message.warning("Please login first", 3);
      return;
    }
    AppProvider.fetchDesignList().then(async (list) => {
      const f = list.filter((item) => item.Type === "file");
      console.log("list", f);
      setTotal(f.length);
      let index = 0;
      setIsbuilding(true);
      const getthumbs = () => {
        console.log(f[index], index);
        setCurrentDesign({ name: f[index].FullPath, index: index + 1 });
        AppProvider.getDesignThumbnails({
          designs: [{ fullpath: f[index].FullPath }],
          renderTexturedThumbs: texturedThumbs
        })
          .then(() => {
            index++;
            if (index < f.length) getthumbs();
            else {
              message.success("Cache Build", 3);
              setIsbuilding(false);
            }
          })
          .catch((err) => {
            index++;
            if (index < f.length) getthumbs();
            else {
              setIsbuilding(false);
            }
          });
      };
      getthumbs();
    });
  };
  const clearCache = () => {
    if (!logged) {
      message.warning({
        content: "Please login first",
        className: "custom-class",
        duration: 3,
      });
      return;
    }
    //console.log("App -> data", selectedType);
    const cleaCacheOf = selectedType.replace(/ /g, '');
    setIsClearing(true);
    AppProvider.clearCache({ mode: cleaCacheOf }).then(() => {
      setIsClearing(false);
      message.success({
        content: "Cache Cleared",
        className: "custom-class",
        duration: 3,
      });
    });
  };
  const onCheckboxChange=(val)=>{
  setTexturedThumbs(val.target.checked)

  }
  return (
    <div className="App">
      <div>
        <Title>Tool to Clear/ Build Cache</Title>
      </div>
      <Login onSubmit={onSubmit} errorMsg={errorMsg} />
      <Divider />
      {logged && (
        <div>
          <Row gutter={16}>
            <Col span={12}>
              <Divider orientation="left" plain>
                <Title level={3}>Clear Cache</Title>
              </Divider>
              <div>
                <Space>
                  <Select
                    style={{ width: 120 }}
                    onChange={(val) => setSelectedType(val)}
                    value={selectedType}
                  >
                    <Option value="color">Color</Option>
                    <Option value="texture">Texture</Option>
                    <Option value="other">Other</Option>
                    <Option value="all designs">All Designs</Option>
                    <Option value="all rooms">All Rooms</Option>
                  </Select>
                </Space>
                <Button onClick={clearCache} loading={isClearing}>
                  Clear Cache
                </Button>
              </div>
            </Col>
            <Col span={12}>
              <div>
                <Divider orientation="left" plain>
                  <Title level={3}>Build Cache</Title>
                </Divider>
                <div className="checkbox-area">
                <Checkbox onChange={onCheckboxChange} checked = {texturedThumbs}>Render textured thumbs</Checkbox>
                </div>
                <Button loading={isbuilding} onClick={createCache}>
                  Build design Cache
                </Button>
                <div>
                  <br />
                  {isbuilding && (
                    <>
                      Status: found {total} designs
                      <br />
                      creating cache for {currentDesign.name} (
                      {currentDesign.index} / {total})
                    </>
                  )}
                </div>
              </div>
            </Col>
          </Row>
        </div>
      )}
    </div>
  );
}

export default App;
