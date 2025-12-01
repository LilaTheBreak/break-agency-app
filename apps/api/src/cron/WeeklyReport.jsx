import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const StatCard = ({ label, value, change }) => (
  <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg text-center">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-3xl font-bold">{value}</p>
    {change !== undefined && (
      <p className={`text-sm font-semibold ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
        {change >= 0 ? `+${change}` : change} from last week
      </p>
    )}
  </div>
);

const ActionPlanItem = ({ item }) => (
  <li className="flex items-start gap-3">
    <span className={`mt-1 w-2 h-2 rounded-full ${item.priority === 'high' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
    <span>{item.action}</span>
  </li>
);

export default function WeeklyReportPage() {
  const { userId } = useParams(); // Or get from auth context if viewing own report
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/reports/${userId}/weekly`);
        if (!res.ok) throw new Error('Report not found');
        const data = await res.json();
        setReport(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [userId]);

  if (loading) return <div className="p-8">Loading Weekly Report...</div>;
  if (!report) return <div className="p-8">No report available for this week.</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Weekly Performance Report</h1>
          <p className="text-gray-500">
            For week ending {new Date(report.weekEnd).toLocaleDateString()}
          </p>
        </div>
        <button className="px-4 py-2 font-semibold bg-gray-200 rounded-md">Download PDF</button>
      </div>

      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Health Score" value={report.healthScore} change={report.changeFromLastWeek} />
          <StatCard label="Grade" value={report.grade} />
          <StatCard label="Risk Level" value={report.riskLevel} />
          <StatCard label="Follower Change" value={report.insights?.followerChange ?? 0} />
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold border-b pb-2 mb-3">AI Summary</h2>
          <p>{report.aiSummary}</p>
        </div>

        <div>
          <h2 className="text-xl font-bold border-b pb-2 mb-3">Your Action Plan</h2>
          {report.actionPlan && report.actionPlan.length > 0 ? (
            <ul className="space-y-2">
              {report.actionPlan.map((item, index) => (
                <ActionPlanItem key={index} item={item} />
              ))}
            </ul>
          ) : (
            <p>No specific actions recommended this week. Keep up the great work!</p>
          )}
        </div>

        {/* History Chart Component would go here */}
      </div>
    </div>
  );
}