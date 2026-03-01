"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, RotateCcw } from "lucide-react"

export default function FloydWarshallVisualizer() {
  const [matrix, setMatrix] = useState<number[][]>([])
  const [originalMatrix, setOriginalMatrix] = useState<number[][]>([])
  const [currentK, setCurrentK] = useState(-1)
  const [currentI, setCurrentI] = useState(-1)
  const [currentJ, setCurrentJ] = useState(-1)
  const [isRunning, setIsRunning] = useState(false)
  const [steps, setSteps] = useState<string[]>([])

  const INF = 999

  useEffect(() => {
    const defaultMatrix = [
      [0, 5, INF, 10],
      [INF, 0, 3, INF],
      [INF, INF, 0, 1],
      [INF, INF, INF, 0],
    ]
    setMatrix(defaultMatrix)
    setOriginalMatrix(defaultMatrix.map((row) => [...row]))
  }, [])

  const runFloydWarshall = async () => {
    setIsRunning(true)
    const newMatrix = matrix.map((row) => [...row])
    const newSteps: string[] = []
    const n = newMatrix.length

    for (let k = 0; k < n; k++) {
      setCurrentK(k)
      newSteps.push(`Using vertex ${k} as intermediate vertex`)

      for (let i = 0; i < n; i++) {
        setCurrentI(i)
        for (let j = 0; j < n; j++) {
          setCurrentJ(j)

          if (newMatrix[i][k] + newMatrix[k][j] < newMatrix[i][j]) {
            const oldDistance = newMatrix[i][j] === INF ? "∞" : newMatrix[i][j]
            newMatrix[i][j] = newMatrix[i][k] + newMatrix[k][j]
            newSteps.push(`Updated distance[${i}][${j}] from ${oldDistance} to ${newMatrix[i][j]} via vertex ${k}`)
          }

          setMatrix([...newMatrix])
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
      }
    }

    setSteps(newSteps)
    setCurrentK(-1)
    setCurrentI(-1)
    setCurrentJ(-1)
    setIsRunning(false)
  }

  const reset = () => {
    setMatrix(originalMatrix.map((row) => [...row]))
    setCurrentK(-1)
    setCurrentI(-1)
    setCurrentJ(-1)
    setSteps([])
    setIsRunning(false)
  }

  const getCellColor = (i: number, j: number) => {
    if (i === currentI && j === currentJ) return "bg-red-200 dark:bg-red-800"
    if (i === currentI || j === currentJ) return "bg-yellow-200 dark:bg-yellow-800"
    if (i === currentK || j === currentK) return "bg-blue-200 dark:bg-blue-800"
    return "bg-white dark:bg-slate-700"
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Distance Matrix</CardTitle>
            {currentK >= 0 && <Badge variant="outline">Current intermediate vertex: {currentK}</Badge>}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {matrix.map((row, i) =>
                row.map((cell, j) => (
                  <div
                    key={`${i}-${j}`}
                    className={`p-3 text-center border rounded ${getCellColor(i, j)} transition-colors`}
                  >
                    <div className="text-xs text-muted-foreground mb-1">
                      [{i}][{j}]
                    </div>
                    <div className="font-mono font-bold">{cell === INF ? "∞" : cell}</div>
                  </div>
                )),
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={runFloydWarshall} disabled={isRunning}>
                <Play className="w-4 h-4 mr-2" />
                {isRunning ? "Running..." : "Run Algorithm"}
              </Button>
              <Button onClick={reset} variant="outline" disabled={isRunning}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Algorithm Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
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

        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm mt-4">
          <CardHeader>
            <CardTitle>Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-200 dark:bg-red-800 rounded"></div>
                <span className="text-sm">Current cell being updated</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-200 dark:bg-yellow-800 rounded"></div>
                <span className="text-sm">Current row/column</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-200 dark:bg-blue-800 rounded"></div>
                <span className="text-sm">Intermediate vertex</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
