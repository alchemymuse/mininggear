import Link from "next/link";
import Header from "@/components/Header";
import SellForm from "@/components/SellForm";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function SellPage() {
  await requireUser();
  return (
    <>
      <Header />
      <main className="page">
        <Link href="/" className="back">← Home</Link>
        <div className="section-h" style={{ marginTop: 0 }}>
          <div>
            <h2>List equipment or a site</h2>
            <div className="sub">
              Structured listings power search and matching. Fields marked{" "}
              <span style={{ color: "var(--accent)" }}>*</span> 