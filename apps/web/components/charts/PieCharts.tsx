"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type Slice = { name: string; value: number; color: string }

export function FocusHoursPie({ title, description, data }: { title: string; description: string; data: Slice[] }) {
  return (
    <Card className="border-gray-200 dark:border-gray-700 dark:bg-gray-900">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold dark:text-white">{title}</CardTitle>
        <CardDescription className="dark:text-gray-400">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={5} dataKey="value">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} style={{ fill: entry.color }} stroke={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}h`, "Hours"]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {item.name}: {item.value}h
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function EfficiencyPie({ title, description, data }: { title: string; description: string; data: Slice[] }) {
  return (
    <Card className="border-gray-200 dark:border-gray-700 dark:bg-gray-900">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold dark:text-white">{title}</CardTitle>
        <CardDescription className="dark:text-gray-400">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={5} dataKey="value">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} style={{ fill: entry.color }} stroke={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-1 gap-2 mt-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {item.name}: {item.value}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}


