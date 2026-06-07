import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Printer, Download } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface AdhesionCardProps {
  member: {
    id: number;
    firstName: string;
    lastName: string;
    memberID: string;
    photo?: string;
    email?: string;
  };
  adhesion?: {
    dateExpiration: Date;
    annee: number;
    type?: string;
  };
}

export function AdhesionCard({ member, adhesion }: AdhesionCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (cardRef.current) {
      window.print();
    }
  };

  const handleDownloadPDF = async () => {
    if (!cardRef.current) return;

    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [85.6, 53.98], // Credit card size
      });

      pdf.addImage(imgData, "PNG", 0, 0, 85.6, 53.98);
      pdf.save(`carte-adhesion-${member.memberID}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const expirationDate = adhesion?.dateExpiration
    ? new Date(adhesion.dateExpiration).toLocaleDateString("fr-FR")
    : "Non défini";

  return (
    <div className="space-y-4">
      {/* Card Preview */}
      <div
        ref={cardRef}
        className="w-full max-w-sm mx-auto bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-6 text-white shadow-lg"
        style={{
          aspectRatio: "1.586 / 1", // Credit card ratio
        }}
      >
        <div className="h-full flex flex-col justify-between">
          {/* Header */}
          <div>
            <h3 className="text-sm font-bold opacity-90">CARTE D'ADHÉSION</h3>
            <p className="text-xs opacity-75">Les Bâtisseurs Engagés</p>
          </div>

          {/* Member Info with Photo */}
          <div className="flex items-center gap-4">
            {member.photo ? (
              <img
                src={member.photo}
                alt={`${member.firstName} ${member.lastName}`}
                className="w-16 h-20 rounded object-cover border-2 border-white"
              />
            ) : (
              <div className="w-16 h-20 rounded bg-white/20 flex items-center justify-center border-2 border-white">
                <span className="text-xs text-center">Photo</span>
              </div>
            )}

            <div className="flex-1">
              <h4 className="font-bold text-sm">
                {member.firstName} {member.lastName}
              </h4>
              <p className="text-xs opacity-90">ID: {member.memberID}</p>
              {member.email && (
                <p className="text-xs opacity-75">{member.email}</p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-end text-xs">
            <div>
              <p className="opacity-75">Valide jusqu'au</p>
              <p className="font-bold">{expirationDate}</p>
            </div>
            {adhesion && (
              <div className="text-right">
                <p className="opacity-75">Adhésion {adhesion.annee}</p>
                <p className="text-xs capitalize">{adhesion.type}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-center print:hidden">
        <Button
          onClick={handlePrint}
          variant="outline"
          className="gap-2"
          size="sm"
        >
          <Printer className="h-4 w-4" />
          Imprimer
        </Button>
        <Button
          onClick={handleDownloadPDF}
          variant="outline"
          className="gap-2"
          size="sm"
        >
          <Download className="h-4 w-4" />
          Télécharger PDF
        </Button>
      </div>
    </div>
  );
}
