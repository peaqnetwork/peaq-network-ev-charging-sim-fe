import React, { useEffect } from "react";
import { Button, ButtonVariant, Label, Popover } from "@patternfly/react-core";
import CogIcon from "@patternfly/react-icons/dist/esm/icons/cog-icon";
import InfoCircleIcon from "@patternfly/react-icons/dist/esm/icons/info-circle-icon";

import { Manager } from "socket.io-client";

import { useSelector, useDispatch } from "react-redux";
import {
  setConnecting,
  setConnected,
  setDisconnect,
  setDisconnecting,
  setDisconnected,
  setNodeAddress,
} from "./connectionSlice";

export function Connection() {
  const status = useSelector((state: any) => state.connection.status);
  const nodeAddress = useSelector((state: any) => state.connection.nodeAddress);
  const dispatch = useDispatch();

  let search = window.location.search;
  let params = new URLSearchParams(search);
  let qpNodeAddress = params.get("node");

  useEffect(() => {
    if (qpNodeAddress != null) {
      dispatch(setNodeAddress(qpNodeAddress));
    } else {
      console.log(
        "Using default node address as none provided in query parameter [node]"
      );
    }

    let manager = new Manager(nodeAddress, { reconnectionDelayMax: 10000 });

    let socket = manager.socket("/");

    socket.on("connect", () => {
      dispatch(setConnected());
    });
    
    socket.on("disconnect", () => {
      dispatch(setDisconnected());
    });    

    return function cleanup() {
      if (socket != undefined && socket != null) {
        socket.disconnect();
      } else {
        console.log("Socket was not initialized");
      }
    };
  }, []);

  return (
    <div>
      <Label
        color={
          status === "connected"
            ? "green"
            : status === "connecting"
            ? "orange"
            : "red"
        }
        icon={<InfoCircleIcon />}
      >
        {status}
        {status === "connecting" ? " to " + nodeAddress : ""}
      </Label>
      <Button
        aria-label="Settings actions"
        variant={ButtonVariant.plain}
        onClick={() => dispatch(setConnecting())}
      >
        Connect
      </Button>
      <Button aria-label="Settings actions" variant={ButtonVariant.plain}>
        <CogIcon onClick={() => dispatch(setNodeAddress("localhost"))} />
      </Button>
    </div>
  );
}
