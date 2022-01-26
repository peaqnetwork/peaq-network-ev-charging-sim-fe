import * as React from 'react';
import { useState, useReducer, useRef, useEffect } from 'react';

import { PageSection, Title, TitleSizes, Grid, GridItem, Button, Divider } from '@patternfly/react-core';
import { Panel, PanelMain, PanelMainBody, PanelHeader } from '@patternfly/react-core';
import { LogViewer, LogViewerSearch } from '@patternfly/react-log-viewer';
import { Toolbar, ToolbarContent, ToolbarItem, Checkbox } from '@patternfly/react-core';


import QRCode from 'react-qr-code';
import { Manager } from 'socket.io-client';

const BEAPI = 'http://localhost:25566';

const Dashboard: React.FunctionComponent = (props) => {
  let initialLogdata = ['App initialized'];
  const [sessLog, setSessLog] = React.useState(initialLogdata);
  const [appLog, setAppLog] = React.useState(initialLogdata);

  const [isTextWrappedSess, setIsTextWrappedSess] = React.useState(false);
  const [isTextWrappedApp, setIsTextWrappedApp] = React.useState(false);

  const [currDid, setCurrDid] = React.useState('');

  const errorButtonRef = useRef();
  const completeButtonRef = useRef();

  function appendToLog(event, data) {
    let date = new Date()
    let time = Intl.DateTimeFormat("en-GB", {
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric',
      hour12: false,
    }).format(date)
    let obj = JSON.parse(data);
    if (obj.state === 'charging') {
      errorButtonRef.current.disabled = false;
      completeButtonRef.current.disabled = false;
    } else {
      errorButtonRef.current.disabled = true;
      completeButtonRef.current.disabled = true;
    }

    if (event === 'log') {
      setAppLog((currLog) => [...currLog, time + " " + data]);
    } else {
      setSessLog((currLog) => [...currLog, time + " " + data]);
    }
  }

  function makeStopChargingRequest(success: boolean) {
    fetch(BEAPI + '/end_charging', {
      method: 'POST',
      body: JSON.stringify({
        success: success,
      }),
    });
  }

  function stopChargingBySimulatingError() {
    makeStopChargingRequest(false);
    appendToLog('session','Request to stop charging by error sent');
  }

  function stopChargingBySimulatingCompletion() {
    makeStopChargingRequest(true);
    appendToLog('session','Request to stop charging by success sent');
  }

  useEffect(() => {
    errorButtonRef.current.disabled = true;
    completeButtonRef.current.disabled = true;
  }, []);

  useEffect(() => {
    console.log('in async');
    fetch(BEAPI + '/pk')
      .then((r) => r.text())
      .then((d) => {
        setCurrDid('did:peaq:' + d);
      });
  }, []);

  useEffect(() => {
    let manager = new Manager(BEAPI, { reconnectionDelayMax: 10000 });
    let socket = manager.socket('/');

    socket.onAny((event, data) => {
      appendToLog(event, data);
    });

    return function cleanup() {
      if (socket != undefined && socket != null) {
        socket.disconnect();
      } else {
        console.log('Socket was undefined or null');
      }
    };
  }, []);

  return (
    <PageSection>
      <Panel variant="bordered">
        <PanelHeader>
          <Title headingLevel="h1" size={TitleSizes['l']}>
            Station identity
          </Title>
        </PanelHeader>
        <Divider />
        <PanelMain>
          <PanelMainBody>
            <Grid>
              <GridItem span={6}>{currDid}</GridItem>
              <GridItem span={3}>
                <QRCode value={currDid} />
              </GridItem>
              <GridItem span={3}>
                <Button isBlock variant="warning" ref={errorButtonRef} onClick={() => stopChargingBySimulatingError()}>
                  Simulate Error
                </Button>{' '}
                <br />
                <Button isBlock variant="primary" ref={completeButtonRef} onClick={() => stopChargingBySimulatingCompletion()}>
                  Simulate Charging Complete
                </Button>
              </GridItem>
            </Grid>
          </PanelMainBody>
        </PanelMain>
      </Panel>

      <Panel variant="bordered">
        <PanelHeader>
          <Title headingLevel="h1" size={TitleSizes['l']}>
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
                          <LogViewerSearch minSearchChars={5} placeholder="Search value" />
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
          <Title headingLevel="h1" size={TitleSizes['l']}>
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
                      <LogViewerSearch minSearchChars={5} placeholder="Search value" />
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
