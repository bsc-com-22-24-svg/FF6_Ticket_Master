import React from 'react';
import type { EventItem } from '../Data/Events';

export const SalesChart: React.FC<{ events: EventItem[] }> = ({ events }) => {
  const maximum = Math.max(1, ...events.map((event) => event.ticketsSold));

  return (
    <div className="sales-summary-container">
      <div className="chart-header">
        <div>
          <h3 className="sales-summary-title">Tickets sold</h3>
          <p className="sales-summary-caption">Sales by event</p>
        </div>
        <span className="sales-summary-total">
          {events.reduce((sum, event) => sum + event.ticketsSold, 0).toLocaleString()}
          <span> total</span>
        </span>
      </div>
      {events.length === 0 ? (
        <p className="sales-summary-empty">No event sales data available.</p>
      ) : (
        <ul className="sales-summary-list">
          {events.map((event) => (
            <li key={event.id}>
              <div className="sales-summary-row">
                <span className="sales-summary-event" title={event.name}>{event.name}</span>
                <strong className="sales-summary-count">{event.ticketsSold.toLocaleString()}</strong>
              </div>
              <div className="sales-summary-track">
                <div
                  className="sales-summary-bar"
                  style={{
                    width: event.ticketsSold > 0
                      ? `${Math.max(3, (event.ticketsSold / maximum) * 100)}%`
                      : '0%',
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
