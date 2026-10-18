const DAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
export default function SalesChart({values}:{values:number[]}) {
 const data=DAYS.map((day,i)=>({day,value:values[i]??0})); const max=Math.max(...data.map(x=>x.value),1);
 return <div className="chart" role="img" aria-label="Ticket sales this week">{data.map(({day,value})=><div className="chart-column" key={day} title={`${day}: ${value} tickets`}><span className="chart-value">{value||''}</span><div className="chart-bar-wrap"><div className="chart-bar" style={{height:`${Math.max(value/max*100,value?8:2)}%`}}/></div><span className="chart-day">{day}</span></div>)}</div>;
}
