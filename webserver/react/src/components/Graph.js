import React, { useEffect, useState, useMemo } from "react";
import Plot from "react-plotly.js";
import { InfluxDB } from "@influxdata/influxdb-client";

const TOKEN =
  "3zK40TmVz0-kpnise5PejCO40GhgIxFKcAORGB2hnjbNHXjwqgC9FvxcmDFjdq-asdPoZurO02n9mTp-1jJZCA==";
const URL = "http://localhost:3000";
const ORG = "draeger";

function Graph() {
  const api = useMemo(() => new InfluxDB({ url: URL, token: TOKEN }), []);

  const [xs, setX] = useState([]);
  const [ys, setY] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const queryApi = api.getQueryApi(ORG);
      const query = `
        from(bucket: "robomaster")
          |> range(start: -10m)
          |> filter(fn: (r) => r["_measurement"] == "sps30")
          |> filter(fn: (r) => r["_field"] == "mass_pm1")
          |> yield(name: "mean")
      `;
      const xs = [];
      const ys = [];
      queryApi.queryRows(query, {
        next: (row, tableMeta) => {
          const tableObject = tableMeta.toObject(row);
          xs.push(tableObject._time);
          ys.push(tableObject._value);
        },
        error: (error) => {
          console.error("Error", error);
        },
        complete: () => {
          setX(xs);
          setY(ys);
        },
      });
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [api]);

  return (
    <Plot
      data={[
        {
          x: ys,
          y: xs,
          type: "scatter+markers",
          mode: "lines",
          marker: { color: "#0028c6" },
          name: "pm10",
        },
      ]}
      layout={{ width: 500, height: 1080, title: "Sensor Intensity" }}
    />
  );
}

export default Graph;
