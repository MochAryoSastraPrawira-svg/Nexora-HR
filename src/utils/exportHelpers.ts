/**
 * Export and Print Utilities for HRMS Report Tables
 * Created: 2026-07-14
 */

// Helper to format currency to IDR
export const formatIDR = (value: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Helper to export any JSON array to Excel (as CSV with BOM)
export const exportToCSV = (filename: string, headers: string[], rows: string[][]) => {
  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${(cell || "").replace(/"/g, '""')}"`).join(","))
  ].join("\n");

  // UTF-8 BOM to ensure Excel opens Indonesian accents/symbols properly
  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Initiate native browser printing for a clean isolated target
export const printElement = (title: string, headers: string[], rows: string[][]) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const html = `
    <html>
      <head>
        <title>HRMS - ${title}</title>
        <style>
          body { font-family: 'Inter', sans-serif; padding: 30px; color: #020617; }
          h2 { text-align: center; margin-bottom: 5px; font-family: 'Space Grotesk', sans-serif; }
          .date { text-align: center; font-size: 12px; color: #64748b; margin-bottom: 25px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background-color: #f1f5f9; padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase; border: 1px solid #cbd5e1; }
          td { padding: 10px; font-size: 12px; border: 1px solid #e2e8f0; }
          tr:nth-child(even) { background-color: #f8fafc; }
          .footer { margin-top: 50px; text-align: right; font-size: 12px; }
          .signature { margin-top: 70px; font-weight: bold; }
        </style>
      </head>
      <body>
        <h2>SISTEM HRMS - LAPORAN ${title.toUpperCase()}</h2>
        <div class="date">Dicetak pada: ${new Date().toLocaleString("id-ID")}</div>
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>
          </thead>
          <tbody>
            ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`).join("")}
          </tbody>
        </table>
        <div class="footer">
          <p>Disetujui Oleh,</p>
          <div class="signature">Management HRMS</div>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
