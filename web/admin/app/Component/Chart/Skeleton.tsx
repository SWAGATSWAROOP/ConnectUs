import React, { useState } from "react";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

interface ApexChartProps {
  options: ApexOptions;
  series: ApexAxisChartSeries;
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const FareStatistics: React.FC<ApexChartProps> = ({ options, series }) => {
  const [, setSelectedYear] = useState<string | null>(null);
  const [, setSelectedMonth] = useState<string | null>(null);
  const [showDaily, setShowDaily] = useState<boolean>(false);

  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white px-5 pb-5 pt-7.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:col-span-8">
      <h5 className="text-3xl font-bold text-black text-center">Fare Statistics</h5>

      <div className="flex w-full max-w-96 justify-end mb-4">
        <div className="inline-flex items-center rounded-md bg-white p-2 shadow-sm dark:bg-meta-4 gap-2">
          <select
            onChange={(e) => setSelectedYear(e.target.value || null)}
            defaultValue=""
            className="rounded bg-white px-3 py-1 text-xs font-medium text-black shadow-sm hover:shadow-md"
          >
            <option value="">Select Year</option>
            {[2009, 2010, 2011, 2012, 2013, 2014].map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>

          <select
            onChange={(e) => setSelectedMonth(e.target.value || null)}
            defaultValue=""
            className="rounded bg-white px-3 py-1 text-xs font-medium text-black shadow-sm hover:shadow-md"
          >
            <option value="">Select Month</option>
            {monthNames.map((month, index) => (
              <option key={index} value={index + 1}>{month}</option>
            ))}
          </select>

          <label className="flex items-center text-xs font-medium text-black space-x-1">
            <input
              type="checkbox"
              checked={showDaily}
              onChange={(e) => setShowDaily(e.target.checked)}
              className="accent-black dark:accent-white"
            />
            <span>Show Hourly</span>
          </label>
        </div>
      </div>

      <div id="chartOne">
        <ReactApexChart options={options} series={series} type="area" height={350} width="100%" />
      </div>
    </div>
  );
};

export default FareStatistics;
