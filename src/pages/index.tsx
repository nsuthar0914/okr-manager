import Head from "next/head";
import Image from "next/image";
import { Inter } from "next/font/google";
import styles from "@/styles/Home.module.css";
import { users } from "./mock-data/mock-users";
import { mockResponse } from "./mock-data/mock-response";
import { useState, useRef, useEffect } from "react";
import * as d3 from "d3";
import { ThemeMatch, UserMatch } from "./api/match-objectives";

const inter = Inter({ subsets: ["latin"] });

interface Node {
  id: string;
  type: "theme" | "objective" | "user";
}
interface Props {
  themeMatches: ThemeMatch[];
  userMatches: UserMatch[];
  themes: string[];
}

const NetworkGraph: React.FC<Props> = ({
  themeMatches,
  userMatches,
  themes,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const width = 600;
    const height = 400;

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", [-width / 2, -height / 2, width, height]);
    svg.selectAll("*").remove();
    // create the links
    const links = [];
    userMatches.forEach((um) => {
      um.user.objectives.forEach((obj) =>
        links.push({
          source: um.user.id,
          target: `${um.user.id}-${obj}`,
          value: 1,
        })
      );
      um.themeScores.forEach((ts) =>
        links.push({
          source: `${um.user.id}-${ts.objective}`,
          target: ts.theme,
          value: ts.score,
        })
      );
    });

    // create the nodes
    const nodes: Node[] = [];
    userMatches.forEach((um) => {
      nodes.push({ id: um.user.id, type: "user" });
      um.user.objectives.forEach((obj) =>
        nodes.push({
          id: `${um.user.id}-${obj}`,
          type: "objective",
        })
      );
    });
    themes.forEach((theme) => nodes.push({ id: theme, type: "theme" }));

    // create the links and nodes groups
    const linkGroup = svg
      .append("g")
      .attr("class", "links")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6);
    const nodeGroup = svg
      .append("g")
      .attr("class", "nodes")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);

    // create the links
    const link = linkGroup
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", (d) => d.value);

    function drag(simulation: d3.Simulation<Node, Link>) {
      function dragstarted(event: any) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        if (event.subject) {
          event.subject.fx = event.subject.x;
          event.subject.fy = event.subject.y;
        }
      }

      function dragged(event: any) {
        if (event.subject) {
          event.subject.fx = event.x;
          event.subject.fy = event.y;
        }
      }

      function dragended(event: any) {
        if (!event.active) simulation.alphaTarget(0);
        if (event.subject) {
          event.subject.fx = null;
          event.subject.fy = null;
        }
      }

      return d3
        .drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance(50)
      )
      .force("charge", d3.forceManyBody())
      .force("center", d3.forceCenter());

    // create the nodes
    const node = nodeGroup
      .selectAll("circle")
      .data<Node>(nodes)
      .join("circle")
      .attr("r", (d) => (d.type === "user" ? 12 : 8))
      .attr("fill", (d) => {
        switch (d.type) {
          case "theme":
            return "blue";
          case "objective":
            return "green";
          case "user":
            return "red";
          default:
            return "black";
        }
      })
      .call(drag(simulation)); // ts-ignore-line
    node.append("title").text((d) => d.id);
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);

      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
    });
    console.log(nodes, links);
  }, []);

  return (
    <div style={{ width: "100%" }}>
      <svg ref={svgRef} />
    </div>
  );
};

export default function Home() {
  const [data, setData] = useState<{
    themeMatches: ThemeMatch[];
    userMatches: UserMatch[];
    themes: string[];
  }>();
  const checkAPI = async () => {
    const results = await fetch("/api/match-objectives", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ users }),
    });
    // console.log(await results.json());
    // const results = mockResponse;
    setData(await results.json());
  };
  console.log(data);
  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <button onClick={checkAPI}>Check API</button>
        {data && <NetworkGraph {...data} />}
      </main>
    </>
  );
}
