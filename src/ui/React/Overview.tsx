import React, { useState, useEffect, useRef, useMemo } from "react";
import Draggable, { DraggableEventHandler } from "react-draggable";
import { makeStyles } from "tss-react/mui";
import Collapse from "@mui/material/Collapse";
import Paper from "@mui/material/Paper";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import EqualizerIcon from "@mui/icons-material/Equalizer";
import SchoolIcon from "@mui/icons-material/School";
import { Router } from "../GameRoot";
import { Page } from "../Router";
import { Settings } from "../../Settings/Settings";
import { Box, Button, Typography } from "@mui/material";
import { debounce } from "lodash";

const useStyles = makeStyles()({
  overviewContainer: {
    position: "fixed",
    top: 0,
    right: 0,
    zIndex: 1500,
    display: "flex",
    justifyContent: "flex-end",
    flexDirection: "column",
  },

  header: {
    cursor: "grab",
    textAlign: "center",
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },

  visibilityToggle: {
    padding: "2px",
    minWidth: "inherit",
    backgroundColor: "transparent",
    border: "none",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
    },
  },

  collapse: {
    borderTop: `1px solid ${Settings.theme.welllight}`,
    margin: "0 auto",
  },

  icon: {
    fontSize: "24px",
  },
});

interface IProps {
  children: (parentOpen: boolean) => JSX.Element[] | JSX.Element | React.ReactElement[] | React.ReactElement;
  mode: "tutorial" | "overview";
}

export interface OverviewSettings {
  opened: boolean;
  x: number;
  y: number;
}

export function Overview({ children, mode }: IProps): React.ReactElement {
  const draggableRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(Settings.overview.opened);
  const [x, setX] = useState(Settings.overview.x);
  const [y, setY] = useState(Settings.overview.y);
  const { classes } = useStyles();

  const CurrentIcon = open ? KeyboardArrowUpIcon : KeyboardArrowDownIcon;
  const LeftIcon = mode === "tutorial" ? SchoolIcon : EqualizerIcon;
  const header = mode === "tutorial" ? "Tutorial" : "Overview";
  const handleStop: DraggableEventHandler = (e, data) => {
    setX(data.x);
    setY(data.y);
  };

  useEffect(() => {
    Settings.overview = { x, y, opened: open };
  }, [open, x, y]);

  const fakeDrag = useMemo(
    () =>
      debounce((): void => {
        const node = draggableRef.current;
        if (!node) return;

        // No official way to trigger an onChange to recompute the bounds
        // See: https://github.com/react-grid-layout/react-draggable/issues/363#issuecomment-947751127
        triggerMouseEvent(node, "mouseover");
        triggerMouseEvent(node, "mousedown");
        triggerMouseEvent(document, "mousemove");
        triggerMouseEvent(node, "mouseup");
        // According to a comment in the above GitHub issue, apparently mousemove is important,
        // but click probably isn't. This click causes a runtime error in Safari (NotAllowedError),
        // but not Chromium. If further errors occur, a more thorough fix, possibly using
        // navigator.userActivation.isActive, might be necessary.
        // triggerMouseEvent(node, "click");
      }, 100),
    [],
  );

  // Trigger fakeDrag once to make sure loaded data is not outside bounds
  useEffect(() => fakeDrag(), [fakeDrag]);

  // And trigger fakeDrag when the window is resized
  useEffect(() => {
    window.addEventListener("resize", fakeDrag);
    return () => {
      window.removeEventListener("resize", fakeDrag);
    };
  }, [fakeDrag]);

  const triggerMouseEvent = (node: HTMLDivElement | Document, eventType: string): void => {
    const clickEvent = new MouseEvent(eventType, { bubbles: true, cancelable: true });
    node.dispatchEvent(clickEvent);
  };

  if (Router.page() === Page.BitVerse || Router.page() === Page.Loading || Router.page() === Page.Recovery)
    return <></>;
  return (
    <Draggable handle=".drag" bounds="body" onStop={handleStop} defaultPosition={{ x, y }}>
      <Paper className={classes.overviewContainer} square>
        <Box className="drag" onDoubleClick={() => setOpen((old) => !old)} ref={draggableRef}>
          <Box className={classes.header}>
            <LeftIcon color="secondary" className={classes.icon} sx={{ padding: "2px" }} />
            <Typography flexGrow={1} color="secondary">
              {header}
            </Typography>
            <Button
              aria-label="expand or collapse character overview"
              variant="text"
              size="small"
              className={classes.visibilityToggle}
            >
              {
                <CurrentIcon
                  className={classes.icon}
                  color="secondary"
                  onClick={() => setOpen((old) => !old)}
                  onTouchEnd={() => setOpen((old) => !old)}
                />
              }
            </Button>
          </Box>
        </Box>
        <Collapse in={open} className={classes.collapse}>
          {children(open)}
        </Collapse>
      </Paper>
    </Draggable>
  );
}
