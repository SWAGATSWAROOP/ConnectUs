"use client";
import { fetchFareData } from "@/utils/fareApi";
import React, { useEffect, useState, lazy, Suspense } from "react";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import axios from "axios";
const Skeleton = lazy(() => import('./Skeleton'));
const ReactApexChart = dynamic(() => import("react-apexcharts"), {
    ssr: false,
});
const ChartOne: React.FC = () => {
    const [series, setSeries] = useState<ApexAxisChartSeries>([]);
    const [selectedYear, setSelectedYear] = useState<string | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
    const [showDaily, setShowDaily] = useState<boolean>(false);
    const [loading, setLoading] = useState(false);
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
    ];
    const [options, setOptions] = useState<ApexOptions>({
        legend: {
            show: true,
            position: "top",
            horizontalAlign: "left",
        },
        colors: ["#3C50E0", "#80CAEE", "#FF5733", "#33FF57", "#FFC300"],
        chart: {
            fontFamily: "Satoshi, sans-serif",
            height: 335,
            type: "area",
            dropShadow: {
                enabled: true,
                color: "#623CEA14",
                top: 10,
                blur: 4,
                left: 0,
                opacity: 0.0,
            },
            toolbar: {
                show: false,
            },
        },
        stroke: {
            width: [1.5, 1.5, 1.5, 1.5, 1.5],
            curve: "smooth",
        },
        grid: {
            xaxis: {
                lines: {
                    show: true,
                },
            },
            yaxis: {
                lines: {
                    show: true,
                },
            },
        },
        dataLabels: {
            enabled: false,
        },
        markers: {
            size: 4,
            colors: "#fff",
            strokeColors: ["#3056D3", "#80CAEE", "#FF5733", "#33FF57", "#FFC300"],
            strokeWidth: 3,
        },
        xaxis: {
            type: "category",
            categories: [],
            axisBorder: {
                show: false,
            },
            axisTicks: {
                show: false,
            },
        },
        yaxis: {
            min: 0,
        },
    });

    useEffect(() => {
        // setLoading(true);
        const fetchData = async () => {
            try {
                const data = await fetchFareData({ selectedYear, selectedMonth, showDaily });
                console.log("API Data:", data);
                setSeries([
                    { name: "Max", data: data.max },
                    { name: "Min", data: data.min },
                    { name: "Mean", data: data.mean },
                    { name: "Count", data: data.count },
                ]);
                let categories: string[] | number[] = [];

                if (!selectedYear) {
                    categories = data.year || [];
                } else if (selectedYear && selectedMonth && showDaily) {
                    categories = (data.hour || []).map(String);
                } else if (selectedYear && selectedMonth && !showDaily) {
                     categories = (data.day || []).map(String);
                } else if (selectedYear) {
                    categories = (data.month || []).map((num: number) => monthNames[num - 1]); 
                }

                setOptions((prev) => ({
                    ...prev,
                    xaxis: {
                        ...prev.xaxis,
                        categories : categories,
                    },
                }));
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                // setLoading(false);
            }
        };

        fetchData();
    }, [selectedYear, selectedMonth, showDaily]);
    // if(loading){
    //     return (
    //         <Suspense fallback={<div className="p-8 text-center">Loading</div>}>
    //           <Skeleton  options={dummyOptions} series={dummySeries}/>
    //         </Suspense>
    //       );
    // }

    // Optional: Dummy selectors for testing interaction
    return (
        <div className="col-span-12 rounded-sm border border-stroke bg-white px-5 pb-5 pt-7.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:col-span-8">
            <h5 className="text-3xl font-bold text-black text-center">Fare Statistics</h5>
            <div className="flex w-full max-w-96 justify-end">
                <div className="inline-flex items-center rounded-md bg-white p-2 shadow-sm dark:bg-meta-4 gap-2">

                    {/* Year Dropdown */}
                    <select
                        onChange={(e) => setSelectedYear(e.target.value || null)}
                        defaultValue=""
                        className="rounded bg-white px-3 py-1 text-xs font-medium text-black shadow-sm hover:shadow-md "
                    >
                        <option value="">Select Year</option>
                        {[2009, 2010, 2011, 2012, 2013, 2014].map((year) => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>

                    {/* Month Dropdown */}
                    <select
                        onChange={(e) => setSelectedMonth(e.target.value || null)}
                        defaultValue=""
                        className="rounded bg-white px-3 py-1 text-xs font-medium text-black shadow-sm hover:shadow-md "
                    >
                        <option value="">Select Month</option>
                        {monthNames.map((month, index) => (
                            <option key={index} value={index + 1}>
                                {month}
                            </option>
                        ))}
                    </select>

                    {/* Checkbox */}
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

export default ChartOne;
