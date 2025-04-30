import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./styles/notfound.css";

function NotFound() {
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const header = document.querySelector("header");
    if (header) {
      setHeaderHeight(header.offsetHeight);
    }
  }, []);

  return (
    <div
      className="not-found"
      style={{ minHeight: `calc(100vh - ${headerHeight}px - 5px)` }}
    >
      <div className="not-found-content">
        {/* Bouncing Cooking Pot */}
        <div className="boiling-pot">
          <div className="smoke smoke1"></div>
          <div className="smoke smoke2"></div>
          <div className="smoke smoke3"></div>

          <div className="ladle"></div>

          <div className="pot-body">
            <div className="bubble bubble1"></div>
            <div className="bubble bubble2"></div>
            <div className="bubble bubble3"></div>
          </div>

          <div className="fire">
            <div className="flame flame1"></div>
            <div className="flame flame2"></div>
            <div className="flame flame3"></div>
          </div>
        </div>

        {/* Heading */}
        <h1 className="not-found-title">Still Cooking...</h1>

        {/* Message */}
        <p className="not-found-message">
          This page is still being prepped. Maybe try another dish?
        </p>

        {/* Button with steam puff effect */}
        <Link to="/feeds" className="not-found-link">
          🍳 Check What’s Cookin’
          <div className="button-steam">
            <div className="puff puff1"></div>
            <div className="puff puff2"></div>
            <div className="puff puff3"></div>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
