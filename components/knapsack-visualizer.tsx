"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Play, RotateCcw, Plus, Trash2 } from "lucide-react"

interface Item {
  id: number
  weight: number
  value: number
  selected?: boolean
}

export default function KnapsackVisualizer() {
  const [items, setItems] = useState<Item[]>([
    { id: 1, weight: 2, value: 3 },
    { id: 2, weight: 3, value: 4 },
    { id: 3, weight: 4, value: 5 },
    { id: 4, weight: 5, value: 6 },
  ])
  const [capacity, setCapacity] = useState(8)
  const [dpTable, setDpTable] = useState<number[][]>([])
  const [selectedItems, setSelectedItems] = useState<Item[]>([])
  const [currentCell, setCurrentCell] = useState<{ i: number; w: number } | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [steps, setSteps] = useState<string[]>([])
  const [newWeight, setNewWeight] = useState("")
  const [newValue, setNewValue] = useState("")

  const runKnapsack = async () => {
    setIsAnimating(true)
    const n = items.length
    const W = capacity
    const dp: number[][] = Array(n + 1)
      .fill(null)
      .map(() => Array(W + 1).fill(0))
    const newSteps: string[] = []

    newSteps.push(`Initializing DP table with ${n + 1} rows and ${W + 1} columns`)

    // Fill the DP table
    for (let i = 1; i <= n; i++) {
      for (let w = 1; w <= W; w++) {
        setCurrentCell({ i, w })

        const currentItem = items[i - 1]

        if (currentItem.weight <= w) {
          const includeValue = currentItem.value + dp[i - 1][w - currentItem.weight]
          const excludeValue = dp[i - 1][w]

          if (includeValue > excludeValue) {
            dp[i][w] = includeValue
            newSteps.push(
              `Item ${i} (w=${currentItem.weight}, v=${currentItem.value}): Include (${includeValue}) > Exclude (${excludeValue})`,
            )
          } else {
            dp[i][w] = excludeValue
            newSteps.push(
              `Item ${i} (w=${currentItem.weight}, v=${currentItem.value}): Exclude (${excludeValue}) >= Include (${includeValue})`,
            )
          }
        } else {
          dp[i][w] = dp[i - 1][w]
          newSteps.push(
            `Item ${i} (w=${currentItem.weight}, v=${currentItem.value}): Too heavy for capacity ${w}, exclude`,
          )
        }

        setDpTable([...dp])
        await new Promise((resolve) => setTimeout(resolve, 300))
      }
    }

    // Backtrack to find selected items
    const selected: Item[] = []
    let i = n
    let w = W

    newSteps.push(`Backtracking to find selected items...`)

    while (i > 0 && w > 0) {
      if (dp[i][w] !== dp[i - 1][w]) {
        selected.push(items[i - 1])
        newSteps.push(`Selected item ${i} (w=${items[i - 1].weight}, v=${items[i - 1].value})`)
        w -= items[i - 1].weight
      }
      i--
    }

    setSelectedItems(selected.reverse())
    setCurrentCell(null)
    setSteps(newSteps)
    setIsAnimating(false)
  }

  const reset = () => {
    setDpTable([])
    setSelectedItems([])
    setCurrentCell(null)
    setSteps([])
    setIsAnimating(false)
  }

  const addItem = () => {
    if (newWeight && newValue) {
      const weight = Number.parseInt(newWeight)
      const value = Number.parseInt(newValue)
      if (weight > 0 && value > 0) {
        setItems([...items, { id: items.length + 1, weight, value }])
        setNewWeight("")
        setNewValue("")
        reset()
      }
    }
  }

  const removeItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id))
    reset()
  }

  const getCellColor = (i: number, w: number) => {
    if (currentCell && currentCell.i === i && currentCell.w === w) {
      return "bg-red-200 dark:bg-red-800"
    }
    return "bg-white dark:bg-slate-700"
  }

  const totalWeight = selectedItems.reduce((sum, item) => sum + item.weight, 0)
  const totalValue = selectedItems.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>DP Table</CardTitle>
            {currentCell && (
              <Badge variant="outline">
                Processing: Item {currentCell.i}, Capacity {currentCell.w}
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {dpTable.length > 0 && (
              <div className="overflow-auto">
                <table className="border-collapse border border-gray-300 text-sm">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 p-2 bg-gray-100 dark:bg-gray-700">Item/Cap</th>
                      {Array.from({ length: capacity + 1 }, (_, i) => (
                        <th key={i} className="border border-gray-300 p-2 bg-gray-100 dark:bg-gray-700">
                          {i}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dpTable.map((row, i) => (
                      <tr key={i}>
                        <td className="border border-gray-300 p-2 bg-gray-100 dark:bg-gray-700 font-semibold">
                          {i === 0 ? "∅" : `${i} (${items[i - 1]?.weight}/${items[i - 1]?.value})`}
                        </td>
                        {row.map((cell, w) => (
                          <td key={w} className={`border border-gray-300 p-2 text-center ${getCellColor(i, w)}`}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <Button onClick={runKnapsack} disabled={isAnimating}>
                <Play className="w-4 h-4 mr-2" />
                {isAnimating ? "Running..." : "Solve Knapsack"}
              </Button>
              <Button onClick={reset} variant="outline" disabled={isAnimating}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Knapsack Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="capacity">Knapsack Capacity</Label>
              <Input
                id="capacity"
                type="number"
                value={capacity}
                onChange={(e) => {
                  setCapacity(Number.parseInt(e.target.value) || 0)
                  reset()
                }}
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label>Add New Item</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Weight"
                  type="number"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                />
                <Input
                  placeholder="Value"
                  type="number"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                />
                <Button onClick={addItem} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-700 rounded"
                >
                  <div>
                    <span className="font-semibold">Item {item.id}</span>
                    <div className="text-sm text-muted-foreground">
                      Weight: {item.weight}, Value: {item.value}
                    </div>
                  </div>
                  <Button onClick={() => removeItem(item.id)} size="sm" variant="outline" disabled={isAnimating}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Optimal Solution</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedItems.length > 0 ? (
              <div className="space-y-2">
                <div className="text-sm">
                  <div>
                    Total Weight: {totalWeight}/{capacity}
                  </div>
                  <div>Total Value: {totalValue}</div>
                </div>
                <div className="space-y-1">
                  {selectedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center p-2 bg-green-50 dark:bg-green-900 rounded"
                    >
                      <span>Item {item.id}</span>
                      <Badge variant="default">
                        {item.weight}kg / ${item.value}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Run algorithm to see solution</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Algorithm Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {steps.map((step, index) => (
                <div key={index} className="p-2 bg-slate-50 dark:bg-slate-700 rounded text-sm">
                  <Badge variant="outline" className="mr-2">
                    {index + 1}
                  </Badge>
                  {step}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
