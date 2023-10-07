import React, { useRef, useEffect, useState } from "react";
import Plot from "react-plotly.js";
import { InfluxDB, Point } from "@influxdata/influxdb-client";

function Graphs(props) {
  const token =
    "3zK40TmVz0-kpnise5PejCO40GhgIxFKcAORGB2hnjbNHXjwqgC9FvxcmDFjdq-asdPoZurO02n9mTp-1jJZCA==";
  const url = "http://10.130.1.221:8086";
  const org = "draeger";
  const queryApi = new InfluxDB({ url, token }).getQueryApi(org);

  const [x_values, setX] = useState([]);
  const [y_values, setY] = useState([]);

  // Similar to componentDidMount and componentDidUpdate:
  useEffect(() => {
    // Update the document title using the browser API

    const fluxQuery = `from(bucket: "robomaster")
      |> range(start: -10m)
      |> filter(fn: (r) => r["_measurement"] == "sps30")
      |> filter(fn: (r) => r["_field"] == "mass_pm1")
      |> yield(name: "mean")`;

    var x_temp = [];
    var y_temp = [];
    queryApi.queryRows(fluxQuery, {
      next: (row, tableMeta) => {
        const tableObject = tableMeta.toObject(row);
        x_temp.push(tableObject._time);
        y_temp.push(tableObject._value);
      },
      error: (error) => {
        console.error("\nError", error);
      },
      complete: () => {
        setX(x_temp);
        setY(y_temp);
        console.log("\nSuccess");
      },
    });
  });

  return (
    <Plot
      data={[
        {
          x: x_values,
          y: y_values,
          type: "scatter+markers",
          mode: "lines",
          marker: { color: "red" },
          name: "Test",
        },
      ]}
      layout={{ width: "100%", height: "100%", title: "A Fancy Plot" }}
    />
  );
}

export default Graphs;
