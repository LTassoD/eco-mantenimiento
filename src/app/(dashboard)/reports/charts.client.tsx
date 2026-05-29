"use client";

import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const COLORS = ["#021793", "#78ae3e", "#30ff00", "#454545", "#eab308", "#ef4444"];

export function ReportsCharts({
  fleetData,
  checklistByCenterData,
  ticketsByStatusData,
  ticketsByMonthData,
}: {
  fleetData: { name: string; value: number }[];
  checklistByCenterData: { name: string; count: number }[];
  ticketsByStatusData: { name: string; count: number }[];
  ticketsByMonthData: { month: string; count: number }[];
}) {
  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <ChartCard title="Estado de Flota">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie data={fleetData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
              {fleetData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Checklists por Centro (este mes)">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={checklistByCenterData.length > 0 ? checklistByCenterData : [{ name: "Sin datos", count: 0 }]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#021793" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Órdenes por Estado">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={ticketsByStatusData.length > 0 ? ticketsByStatusData : [{ name: "Sin datos", count: 0 }]}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#78ae3e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Mantenimientos por Mes (este año)">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={ticketsByMonthData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#30ff00" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="font-heading font-bold text-lg text-brand-blue mb-4">{title}</h3>
      {children}
    </div>
  );
}
