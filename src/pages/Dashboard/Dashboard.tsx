import React from 'react';
import CardDataStats from '../../components/CardDataStats';
import ChartOne from '../../components/Charts/ChartOne';
import ChartThree from '../../components/Charts/ChartThree';
import ChartTwo from '../../components/Charts/ChartTwo';
import ChatCard from '../../components/Chat/ChatCard';
import MapOne from '../../components/Maps/MapOne';
import TableOne from '../../components/Tables/TableOne';
import './dashboard.css';

const Dashboard: React.FC = () => {
  return (
    <>
      <div className="dashboard-grid">
        <CardDataStats title="Total views" total="$3.456K" rate="0.43%" levelUp>
          <svg
            className="card-icon"
            width="22"
            height="16"
            viewBox="0 0 22 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="..." fill="" />
            <path d="..." fill="" />
          </svg>
        </CardDataStats>
        <CardDataStats title="Total Profit" total="$45,2K" rate="4.35%" levelUp>
          <svg
            className="card-icon"
            width="20"
            height="22"
            viewBox="0 0 20 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="..." fill="" />
            <path d="..." fill="" />
          </svg>
        </CardDataStats>
        <CardDataStats title="Total Product" total="2.450" rate="2.59%" levelUp>
          <svg
            className="card-icon"
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="..." fill="" />
            <path d="..." fill="" />
          </svg>
        </CardDataStats>
        <CardDataStats title="Total Users" total="3.456" rate="0.95%" levelDown>
          <svg
            className="card-icon"
            width="22"
            height="18"
            viewBox="0 0 22 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="..." fill="" />
            <path d="..." fill="" />
          </svg>
        </CardDataStats>
      </div>

      <div className="dashboard-charts">
        <ChartOne />
        <ChartTwo />
        <ChartThree />
        <MapOne />
        <div className="chart-table">
          <TableOne />
        </div>
        <ChatCard />
      </div>
    </>
  );
};

export default Dashboard;
