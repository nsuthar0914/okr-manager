/* eslint:disable */
import { ThemeMatch, UserMatch } from "@/pages/api/match-objectives";
import * as d3 from "d3";
import { useRef, useEffect } from "react";

interface Node {
  id: string;
  type: "theme" | "objective" | "user";
}
interface Props {
  themeMatches: ThemeMatch[];
  userMatches: UserMatch[];
  themes: string[];
}

export const NetworkGraph: React.FC<Props> = ({
  themeMatches,
  userMatches,
  themes,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const width = 600;
    const height = 400;
    function zoomed(event) {
      const { transform } = event;
      svg.attr("transform", transform);
    }
    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("width", "100%")
      .attr("height", "100%")
      .style("font", "12px sans-serif");

    const zoom = d3.zoom().scaleExtent([0.5, 2]).on("zoom", zoomed);
    svg.call(zoom);
    svg.selectAll("*").remove();
    // create the links
    const links = [];
    userMatches.forEach((um) => {
      um.user.objectives.forEach((obj) =>
        links.push({
          source: um.user.id,
          target: `${um.user.id}-${obj}`,
          value: 0.9,
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
    // create degree map
    const degreeMap = new Map(nodes.map((node) => [node.id, 0]));
    links.forEach((link) => {
      degreeMap.set(link.source, degreeMap.get(link.source) + 1);
      degreeMap.set(link.target, degreeMap.get(link.target) + 1);
    });

    // create node size scale
    const nodeSizeScale = d3
      .scaleLinear()
      .domain(d3.extent(degreeMap.values()))
      .range([10, 40]);
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance((d) => 500 - 500 * d.value)
      )
      .force("charge", d3.forceManyBody())
      .force("center", d3.forceCenter());
    const types = Array.from(new Set(links.map((d) => d.type)));
    const color = d3.scaleOrdinal(types, d3.schemeCategory10);
    svg
      .append("defs")
      .selectAll("marker")
      .data(types)
      .join("marker")
      .attr("id", (d) => `arrow-${d}`)
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 15)
      .attr("refY", -0.5)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("fill", color)
      .attr("d", "M0,-5L10,0L0,5");

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
    const link = svg
      .append("g")
      .attr("class", "links")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", (d) => d.value);

    const node = svg
      .append("g")
      .attr("fill", "currentColor")
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(drag(simulation));

    node
      .append("circle")
      .attr("stroke", "white")
      .attr("stroke-width", 1.5)
      .attr("r", (d) => nodeSizeScale(degreeMap.get(d.id)))
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
      });

    node
      .append("text")
      .style("font-size", (d) => nodeSizeScale(degreeMap.get(d.id)) / 3)
      .attr("x", (d) => 0) // center the text horizontally
      .attr("y", (d) => 0) // center the text vertically
      .attr("text-anchor", "middle") // center the text horizontally and vertically
      .text((d) => (d.type != "objective" ? d.id : ""))
      .clone(true)
      .lower()
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("stroke-width", 3);
    node.append("title").text((d) => d.id);
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);
      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    console.log(nodes, links);
  }, [themeMatches, userMatches, themes]);

  return (
    <div style={{ width: "100%", overflow: "hidden" }}>
      <svg ref={svgRef} />
    </div>
  );
};
