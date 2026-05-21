"use client";

import {useState, useEffect} from "react";

export function useGreeting() {
  // ✅ Safe defaults that match what server renders
  const [greeting, setGreeting] = useState("Good day");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    // Only runs on client — no SSR mismatch
    const hour = new Date().getHours();
    const run = () => {
      setGreeting(hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Evening");
      setCurrentDate(
        new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      );
    };
    run();
  }, []);

  return {greeting, currentDate};
}
