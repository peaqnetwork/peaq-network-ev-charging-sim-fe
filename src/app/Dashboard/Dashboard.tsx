import * as React from "react";
import { useRef, useEffect } from "react";

import {
  PageSection,
  Title,
  TitleSizes,
  Grid,
  GridItem,
  Button,
  Divider,
} from "@patternfly/react-core";
import {
  Panel,
  PanelMain,
  PanelMainBody,
  PanelHeader,
} from "@patternfly/react-core";
import { LogViewer, LogViewerSearch } from "@patternfly/react-log-viewer";
import {
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Checkbox,
} from "@patternfly/react-core";

import QRCode from "react-qr-code";
import { Manager } from "socket.io-client";

const Dashboard: React.FunctionComponent = (props) => {
  let initialLogdata = ["App initialized"];
  const [sessLog, setSessLog] = React.useState(initialLogdata);
  const [appLog, setAppLog] = React.useState(initialLogdata);

  const [isTextWrappedSess, setIsTextWrappedSess] = React.useState(false);
  const [isTextWrappedApp, setIsTextWrappedApp] = React.useState(false);

  const [currDid, setCurrDid] = React.useState("");
  const [currBalance, setCurrBalance] = React.useState("checking....");

  const errorButtonRef = useRef();
  const completeButtonRef = useRef();

  let BEAPI = "http://peaq-network-ev-charging-sim-be-jx-devbr.ci.peaq.network";
  let search = window.location.search;
  let params = new URLSearchParams(search);
  let qpNodeAddress = params.get("backend");
  let manager = new Manager(BEAPI, { reconnectionDelayMax: 10000, transports: ['websocket', 'polling', 'flashsocket'] });
  let socket = useRef(manager.socket("/"));

  function appendToLog(event, data) {
    let date = new Date();
    let time = Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    }).format(date);

    try {
      let obj = JSON.parse(data);
      if (obj.state === "charging") {
        errorButtonRef.current.disabled = false;
        completeButtonRef.current.disabled = false;
      } else {
        errorButtonRef.current.disabled = true;
        completeButtonRef.current.disabled = true;
      }
    } catch (e) {
      //ignore
    }

    if (event === "GetBalanceResponse") {
        let obj = JSON.parse(data);
        if (obj.success) {
          setCurrBalance("" + obj.data);
          appendToLog("log", "Balance updated.");
        } else {
          appendToLog("log", "Failed to update balance");
        }
    }
    else if (event === "GetPKResponse") {
      let obj = JSON.parse(data);
      if (obj.success) {
        appendToLog("log", "PK is successfully acquired");
        setCurrDid("did:peaq:" + obj.data);
      } else {
        appendToLog("log", "Failed to publish DID.");
      }
    }
    else if (event === "PublishDIDResponse") {
      let obj = JSON.parse(data);
      if (obj.success) {
        appendToLog("log", "DID published.");
      } else {
        appendToLog("log", "Failed to publish DID.");
      }
    }
    else if (event === "ReconnectResponse") {
      let obj = JSON.parse(data);
      if (obj.success) {
        appendToLog("log", obj.message);
      } else {
        appendToLog("log", obj.message);
      }
    }
    else if (event === "log") {
      setAppLog((currLog) => [...currLog, time + " " + data]);
    } else {
      setSessLog((currLog) => [...currLog, time + " " + data]);
    }
  }

  function makeStopChargingRequest(success: boolean) {
    if (qpNodeAddress != null) {
      BEAPI = qpNodeAddress;
      manager = new Manager(BEAPI, { reconnectionDelayMax: 10000, transports: ['websocket', 'polling', 'flashsocket'] });
      socket.current = manager.socket("/");
    } else {
      console.log(
        "Using default node address as none provided in query parameter [node]"
      );
    }

    socket.current.emit('json', JSON.stringify({
      type : "UserChargingStop",
      data : success
    }), function(){});
  }

  function stopChargingBySimulatingError() {
    makeStopChargingRequest(false);
    appendToLog("session", "Request to stop charging by error sent");
  }

  function stopChargingBySimulatingCompletion() {
    makeStopChargingRequest(true);
    appendToLog("session", "Request to stop charging by success sent");
  }

  function retryPublishingDid() {
    appendToLog("log", "Request to retry publishing DID initiated.");
    socket.current.emit('json', JSON.stringify({
      type : "PublishDID",
      data : ""
    }), function(){});
  }

  function reConnect() {
    appendToLog("log", "Request to reconnect.");
    socket.current.emit('json', JSON.stringify({
      type : "Reconnect",
      data : ""
    }), function(){});
  }

  function checkBalance() {
    appendToLog("log", "Checking balance.");

    socket.current.emit('json', JSON.stringify({
      type : "GetBalance",
      data : ""
    }), function(){});
  }

  useEffect(() => {

    if(errorButtonRef !== null && errorButtonRef.current!==null && errorButtonRef.current != undefined){
      errorButtonRef.current.disabled = true;
    }
    if(completeButtonRef !== null && completeButtonRef.current!==null && completeButtonRef.current != undefined){
      completeButtonRef.current.disabled = true;
    }
  }, []);

  //init ws
  useEffect(() => {
    if (qpNodeAddress != null) {
      BEAPI = qpNodeAddress;
    } else {
      console.log(
        "Using default node address as none provided in query parameter [node]"
      );
    }

    socket.current.onAny((event, data) => {
      appendToLog(event, data);
    });

    socket.current.on("connect", () => {
      checkBalance();

      socket.current.emit('json', JSON.stringify({
        type : "GetPK",
        data : ""
      }), function(){});
    });

    return function cleanup() {
      if (socket.current != undefined && socket.current != null) {
        socket.current.disconnect();
      } else {
        console.log("Socket was undefined or null");
      }
    };
  }, []);

  return (
    <PageSection>
      <Panel variant="bordered">
        <PanelHeader>
          <Title headingLevel="h1" size={TitleSizes["l"]}>
            Station identity
          </Title>
        </PanelHeader>
        <Divider />
        <PanelMain>
          <PanelMainBody>
            <Grid>
              <GridItem span={6}>
                DID: [{currDid}]
                <br />
                Balance: {currBalance}
              </GridItem>
              <GridItem span={3}>
                <QRCode value={currDid} />
              </GridItem>
              <GridItem span={3}>
                <Button
                  isBlock
                  variant="primary"
                  onClick={() => checkBalance()}
                >
                  Update Balance
                </Button>{" "}
                <br />
                <Button
                  isBlock
                  variant="primary"
                  onClick={() => retryPublishingDid()}
                >
                  Retry DID publish
                </Button>{" "}
                <br />
                <Button
                  isBlock
                  variant="primary"
                  onClick={() => reConnect()}
                >
                  Reconnect to the node
                </Button>{" "}
                <br />
                <Button
                  isBlock
                  variant="warning"
                  ref={errorButtonRef}
                  onClick={() => stopChargingBySimulatingError()}
                >
                  Simulate Error
                </Button>{" "}
                <br />
                <Button
                  isBlock
                  variant="primary"
                  ref={completeButtonRef}
                  onClick={() => stopChargingBySimulatingCompletion()}
                >
                  Simulate Charging Complete
                </Button>
              </GridItem>
            </Grid>
          </PanelMainBody>
        </PanelMain>
      </Panel>

      <Panel variant="bordered">
        <PanelHeader>
          <Title headingLevel="h1" size={TitleSizes["l"]}>
            Session history
          </Title>
        </PanelHeader>
        <Divider />
        <PanelMain>
          <PanelMainBody>
            <Grid>
              <GridItem span={12}>
                <LogViewer
                  hasLineNumbers={true}
                  height={300}
                  data={sessLog}
                  theme="dark"
                  isTextWrapped={isTextWrappedSess}
                  toolbar={
                    <Toolbar>
                      <ToolbarContent>
                        <ToolbarItem>
                          <LogViewerSearch
                            minSearchChars={5}
                            placeholder="Search value"
                          />
                        </ToolbarItem>
                        <ToolbarItem>
                          <Checkbox
                            label="Wrap text"
                            aria-label="wrap text checkbox"
                            isChecked={isTextWrappedSess}
                            id="wrap-text-checkbox-sess"
                            onChange={setIsTextWrappedSess}
                          />
                        </ToolbarItem>
                      </ToolbarContent>
                    </Toolbar>
                  }
                />
              </GridItem>
            </Grid>
          </PanelMainBody>
        </PanelMain>
      </Panel>

      <Panel variant="bordered">
        <PanelHeader>
          <Title headingLevel="h1" size={TitleSizes["l"]}>
            System logs
          </Title>
        </PanelHeader>
        <Divider />
        <PanelMain>
          <PanelMainBody>
            <LogViewer
              hasLineNumbers={true}
              height={300}
              data={appLog}
              theme="dark"
              isTextWrapped={isTextWrappedApp}
              toolbar={
                <Toolbar>
                  <ToolbarContent>
                    <ToolbarItem>
                      <LogViewerSearch
                        minSearchChars={5}
                        placeholder="Search value"
                      />
                    </ToolbarItem>
                    <ToolbarItem>
                      <Checkbox
                        label="Wrap text"
                        aria-label="wrap text checkbox"
                        isChecked={isTextWrappedApp}
                        id="wrap-text-checkbox-app"
                        onChange={setIsTextWrappedApp}
                      />
                    </ToolbarItem>
                  </ToolbarContent>
                </Toolbar>
              }
            />
          </PanelMainBody>
        </PanelMain>
      </Panel>
    </PageSection>
  );
};

export { Dashboard };
