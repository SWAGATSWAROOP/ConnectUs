import axios from "axios";

interface FareDataParams {
  selectedYear: string | null;
  selectedMonth: string | null;
  showDaily: boolean;
}

const BASE_URL = "http://127.0.0.1:5000/statistics/fare";

export const fetchFareData = async ({
  selectedYear,
  selectedMonth,
  showDaily,
}: FareDataParams) => {
  let url = BASE_URL + "?type=yearly";

  if (selectedYear && selectedMonth && showDaily) {
    url = `${BASE_URL}?year_name=${selectedYear}&month_name=${selectedMonth}&type=hourly`;
  } else if (selectedYear && selectedMonth) {
    url = `${BASE_URL}?year_name=${selectedYear}&month_name=${selectedMonth}&type=daily`;
  } else if (selectedYear) {
    url = `${BASE_URL}?year_name=${selectedYear}&type=monthly`;
  }

  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error("Error fetching fare data:", error);
    throw error;
  }
};
