import type { Metadata } from "next";
import { BuildSimulator } from "@/components/simulator/BuildSimulator";

export const metadata: Metadata = {
  title: "Simulateur de build — Altéris",
};

export default function SimulateurPage() {
  return <BuildSimulator />;
}
