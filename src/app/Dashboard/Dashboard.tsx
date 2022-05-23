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

  let manager = useRef();
  let socket = useRef();

  function turnOnStopCharingButton(event, data) {
      if(event !== "log") {
      return;
    }
    try {
      let obj = JSON.parse(data);
      if (JSON.parse(obj.emitShowInfoData.data).state === "charging") {
        errorButtonRef.current.disabled = false;
        completeButtonRef.current.disabled = false;
      } else {
        errorButtonRef.current.disabled = true;
        completeButtonRef.current.disabled = true;
      }
    } catch (e) {
      //ignore
    }
  }
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

    let obj = null;
    try {
      obj = JSON.parse(data);
    } catch (e) {
      obj = null;
    }

    if (obj && obj.eventId === 'GET_BALANCE_ACK') {
      if (!obj.getBalanceAckData.resp || !obj.getBalanceAckData.resp.error) {
        setCurrBalance("" + obj.getBalanceAckData.balance);
        appendToLog("log", "Balance updated.");
      } else {
        setCurrBalance("failure");
        appendToLog("log", "Failed to update balance " + obj.getBalanceAckData.resp.message);
      }
    }
    else if (obj && obj.eventId === 'GET_PK_ACK') {
      if (!obj.getPkAckData.resp || !obj.getPkAckData.resp.error) {
        appendToLog("log", "PK is successfully acquired");
        setCurrDid("did:peaq:" + obj.getPkAckData.pk);
      } else {
        appendToLog("log", "Failed to publish DID: " + obj.getPkAckData.resp.message);
      }
    }
    else if (obj && obj.eventId === "REPUBLISH_DID_ACK") {
      if (!obj.republishAckData.resp || !obj.republishAckData.resp.error) {
        appendToLog("log", "DID published.");
      } else {
        appendToLog("log", "Failed to publish DID.");
      }
    }
    else if (obj && obj.eventId === "RECONNECT_ACK") {
      if (!obj.reconnectAckData.resp || !obj.reconnectAckData.resp.error) {
        appendToLog("log", obj.reconnectAckData.message);
      } else {
        appendToLog("log", 'Failed to reconnect: ' + obj.reconnectAckData.resp.message);
      }
    }
    // [TODO] Wait for the refinement
    else if (event === "log") {
      if (obj) {
        setAppLog((currLog) => [...currLog, time + " " + obj.emitShowInfoData.data]);
      } else {
        setAppLog((currLog) => [...currLog, time + " " + data]);
      }
    }
    else if (event === "event") {
      if (obj) {
          setSessLog((currLog) => [...currLog, time + " " + obj.emitShowInfoData.data]);
      }
    }
    else {
      setSessLog((currLog) => [...currLog, time + " " + event + ": " + data]);
    }
  }

  function makeStopChargingRequest(success: boolean) {
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
      type : "RePublishDID",
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
    const BEAPI = process.env.REACT_APP_BE_URL || "http://peaq-network-ev-charging-sim-be-jx-devbr.ci.peaq.network";
    const search = window.location.search;
    const params = new URLSearchParams(search);
    const qpNodeAddress = params.get("backend");

    if (qpNodeAddress === null) {
      console.log(
        "Using default node address as none provided in query parameter [node]"
      );
    }

    manager.current = new Manager(qpNodeAddress || BEAPI,
        { reconnectionDelayMax: 10000,
          transports: ['websocket', 'polling', 'flashsocket'],
        });

    socket.current = manager.current.socket("/");

    socket.current.onAny((event, data) => {
      appendToLog(event, data);
      turnOnStopCharingButton(event, data);
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
