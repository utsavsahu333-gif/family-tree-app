"use client";
import { useRef, useCallback } from "react";

export default function ExportPDF() {
  const exporting = useRef(false);

  const handleExport = useCallback(async () => {
    if (exporting.current) return;
    exporting.current = true;

    try {
      // Dynamic imports to avoid SSR issues
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const treeEl = document.querySelector("[data-tree-container]") as HTMLElement;
      if (!treeEl) {
        alert("No tree to export. Please view the Family Tree page first.");
        exporting.current = false;
        return;
      }

      const canvas = await html2canvas(treeEl, {
        backgroundColor: "#faf8f5",
        scale: 2,
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? "landscape" : "portrait",
        unit: "px",
        format: [canvas.width, canvas.height + 80],
      });

      // Header
      pdf.setFontSize(24);
      pdf.setFont("helvetica", "bold");
      pdf.text("Family Tree", 40, 40);
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 40, 60);

      pdf.addImage(imgData, "PNG", 0, 80, canvas.width, canvas.height);
      pdf.save("family-tree.pdf");
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("PDF export failed. Please try again.");
    }

    exporting.current = false;
  }, []);

  return (
    <button onClick={handleExport} className="btn-secondary" style={{ gap: 8 }}>
      📄 Export PDF
    </button>
  );
}
