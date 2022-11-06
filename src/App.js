import React, { useEffect, useState } from "react";
import axios from "axios";
import ical from "cal-parser";
import styles from "./App.module.css";

function emph(text) {
  return (
    <div style={{ background: "white", color: "black", display: "inline" }}>
      {text}
    </div>
  );
}

async function postStartRecording(email, title) {
  let formData = new FormData();
  formData.append("email", email);
  formData.append("title", title);

  let res = await axios({
    method: "post",
    url: "http://130.58.238.153:5000/start_recording",
    data: formData,
  });

  if (res.data.timestamp) return res.data.timestamp;
}

async function postStopRecording() {
  axios({
    method: "post",
    url: "http://130.58.238.153:5000/stop_recording",
  }).then((res) => {
    console.log(res);
  });
}

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [ongoing, setOngoing] = useState(null);
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [siteLoadTime, setSiteLoadTime] = useState(Date.now());

  const [down, setDown] = useState(false);

  useEffect(() => {
    axios({
      method: "GET",
      url: "http://130.58.238.153:5000/is_recording",
    })
      .then((res) => {
        const { is_recording } = res.data;
        console.log(res);
        if (is_recording) {
          const { email, timestamp } = res.data;
          setOngoing({ email, timestamp });
          // startCounting(timestamp);
        }
        setIsRecording(is_recording);
      })
      .catch(() => {
        setDown(true);
      });
  }, []);

  useEffect(() => {
    if (!ongoing || !ongoing?.timestamp) return;
    const timer = setInterval(() => {
      setElapsed((elapsed) => elapsed + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [ongoing?.timestamp]);

  const getDisplayTime = () => {
    if (!ongoing || !ongoing?.timestamp || elapsed === null) return null;

    const startDate = new Date(ongoing.timestamp);
    const delta = (siteLoadTime - startDate.getTime()) / 1000;

    const dateObj = new Date((elapsed + delta) * 1000);

    const hours = dateObj.getUTCHours();
    const minutes = dateObj.getUTCMinutes();
    const seconds = dateObj.getSeconds();

    const timeString =
      hours.toString().padStart(2, "0") +
      ":" +
      minutes.toString().padStart(2, "0") +
      ":" +
      seconds.toString().padStart(2, "0");

    return timeString;
  };

  const startRecording = async () => {
    const timestamp = await postStartRecording(email, title);
    setIsRecording(true);

    setOngoing({
      email,
      timestamp,
    });

    setSiteLoadTime(Date.now(0));

    setEmail("");
    setTitle("");
  };

  const stopRecording = () => {
    postStopRecording();
    setIsRecording(false);
    setOngoing(null);
  };

  return (
    <div
      style={{
        background: "black",
        color: "white",
        minHeight: "100vh",
        height: "100%",
        fontFamily: "courier",
      }}
    >
      <div className={styles.content}>
        <h3>WSRN Recording Service - Studio A</h3>

        {down && (
          <div className={styles.par} style={{ color: "red" }}>
            The recording service is down right now, please contact <> </>
            <u>wsrn-dj-owner@sccs.swarthmore.edu</u> and we will fix it ASAP!
          </div>
        )}
        <div style={{ marginBottom: "20px" }}>
          This is a web recording service for WSRN [Worldwide Swarthmore Radio
          Network] DJs.{" "}
        </div>

        {!isRecording && (
          <div className={styles.par}>
            There are {emph("no ongoing recordings")} right now, enter your
            email and your show title to start recording the broadcast. Then,
            when you stop the recording, the service will automatically send the
            MP3 to the email you entered.
          </div>
        )}

        {isRecording && (
          <div className={styles.par}>
            There is an {emph(`ongoing recording by ${ongoing.email}.`)} <br />
            Elapsed recording time: {getDisplayTime()}
          </div>
        )}

        <form
          style={{ display: "flex", flexDirection: "column" }}
          onSubmit={(e) => {
            e.preventDefault();
            startRecording();

            setEmail("");
            setTitle("");

            return false;
          }}
        >
          <input
            placeholder="email"
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
          <input
            placeholder="recording title"
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <input type="submit" value="Start Recording" disabled={isRecording} />
        </form>
        <button disabled={!isRecording} onClick={stopRecording}>
          {" "}
          Stop Recording
        </button>
      </div>
    </div>
  );
}

export default App;
