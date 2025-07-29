import logo from "../assets/panopticspdflogo.png"; // Ensure correct relative path

export function addHeader(doc, title, engineer, date) {
  try {
    const imgProps = doc.getImageProperties(logo);
    const ratio = imgProps.width / imgProps.height;
    const logoWidth = 30;
    const logoHeight = logoWidth / ratio;

    // Add Logo
    doc.addImage(logo, "PNG", 14, 10, logoWidth, logoHeight);

    // Title
    doc.setFontSize(14);
    doc.text("Panoptics Daily Report", 50, 20);

    // Subheading: title (e.g., vSAN Checklist)
    if (title) {
      doc.setFontSize(12);
      doc.text(title, 50, 28);
    }

    // Engineer and Date
    if (engineer) {
      doc.setFontSize(10);
      doc.text(`Engineer: ${engineer}`, 50, 36);
    }

    if (date) {
      const formattedDate = new Date(date).toISOString().split("T")[0];
      doc.setFontSize(10);
      doc.text(`Date: ${formattedDate}`, 50, 43);
    }

  } catch (err) {
    console.error("Failed to add logo to PDF:", err);
  }
}
