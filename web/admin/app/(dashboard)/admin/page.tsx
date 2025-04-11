// import Main from "@/app/Component/Main";
import ChartOne from '@/app/Component/Chart/ChartOne';
import Report from '@/app/Component/Chart/Report';
export default function Admin() {
  // return <Main />
  return (
    <>
      <div className='text-3xl font-bold text-black text-center'>Admin Dashboard</div>
      <div className="flex flex-row w-full gap-4 m-2">
        <div className="w-2/3">
          <ChartOne />
        </div>
        <div className="w-1/3">
          <Report />
        </div>
      </div>
    </>

  )
}