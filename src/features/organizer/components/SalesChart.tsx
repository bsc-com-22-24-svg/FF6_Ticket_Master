import React from 'react';

export const SalesChart: React.FC = () => {
  return (
    <div className="mock-chart-container">
      <div className="chart-header">
        <h4>Sales Analytics Over Time</h4>
        <span className="text-muted">Live metric stream active</span>
      </div>
      <div className="chart-bars-mock">
        <div className="mock-bar" style={{ height: '40%' }}><span>Jan</span></div>
        <div className="mock-bar" style={{ height: '65%' }}><span>Feb</span></div>
        <div className="mock-bar" style={{ height: '50%' }}><span>Mar</span></div>
        <div className="mock-bar" style={{ height: '85%' }}><span>Apr</span></div>
        <div className="mock-bar" style={{ height: '95%' }}><span>May</span></div>
      </div>
    </div>
  );
};
