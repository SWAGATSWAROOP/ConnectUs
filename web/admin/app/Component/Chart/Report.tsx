"use client";

import { useEffect, useState } from "react";

interface Report {
  email: string;
  experienceId: string;
  reason: string;
}

const ReportCard: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch("https://mocki.io/v1/8eb50263-1849-407f-a6dc-a895575cd845");
        const data: Report[] = await response.json();
        setReports(data);
      } catch (error) {
        console.error("Error fetching reports:", error);
      }
    };

    fetchReports();
  }, []);

  const handleResolve = async (experienceId: string) => {
    try {
      await fetch(`/api/reports/resolve/${experienceId}`, {
        method: "POST",
      });

      setReports((prevReports) =>
        prevReports.filter((report) => report.experienceId !== experienceId)
      );
    } catch (error) {
      console.error("Error resolving report:", error);
    }
  };

  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white py-6 shadow-default xl:col-span-4">
      <h4 className="mb-6 px-7.5 text-2xl font-semibold text-black text-center">
        Reports
      </h4>

      <div>
        {reports.length === 0 ? (
          <p className="px-7.5 text-black">No reports available.</p>
        ) : (
          reports.map((report) => (
            <div
              key={report.experienceId}
              className="flex items-center justify-between gap-5 px-7.5 py-3 hover:bg-gray-3"
            >
              <div>
                <h5 className="font-medium text-black">
                  {report.email}
                </h5>
                <p className="text-sm text-black">
                  Experience ID: {report.experienceId}
                </p>
                <p className="text-sm text-gray-500">
                  Reason: {report.reason}
                </p>
              </div>
              <button
                onClick={() => handleResolve(report.experienceId)}
                className="h-8 w-8 flex items-center justify-center rounded-full bg-primary text-white hover:bg-green-600"
              >
                ✅
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReportCard;
