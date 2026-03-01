"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Play, RotateCcw, Upload, Download, Shuffle, Info } from "lucide-react"

interface Matrix {
  data: number[][]
  rows: number
  cols: number
}

interface StrassenStep {
  step: number
  operation: string
  description: string
  matrices?: {
    name: string
    data: number[][]
  }[]
}

export default function StrassenVisualizer() {
  const [matrixA, setMatrixA] = useState<Matrix>({
    data: [
      [1, 2],
      [3, 4],
    ],
    rows: 2,
    cols: 2,
  })
  const [matrixB, setMatrixB] = useState<Matrix>({
    data: [
      [5, 6],
      [7, 8],
    ],
    rows: 2,
    cols: 2,
  })
  const [result, setResult] = useState<Matrix | null>(null)
  const [inputMode, setInputMode] = useState<"manual" | "random">("manual")
  const [matrixSize, setMatrixSize] = useState(2)
  const [matrixAInput, setMatrixAInput] = useState("1,2\n3,4")
  const [matrixBInput, setMatrixBInput] = useState("5,6\n7,8")
  const [steps, setSteps] = useState<StrassenStep[]>([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [error, setError] = useState("")
  const [useStrassen, setUseStrassen] = useState(true)
  const [operationCount, setOperationCount] = useState(0)

  const parseMatrixInput = (input: string): number[][] => {
    const lines = input.trim().split(/\r?\n/)
    return lines.map((line) =>
      line.split(",").map((val) => {
        const num = Number.parseFloat(val.trim())
        if (isNaN(num)) throw new Error(`Invalid number: ${val}`)
        return num
      }),
    )
  }

  const loadMatrices = () => {
    try {
      setError("")
      const dataA = parseMatrixInput(matrixAInput)
      const dataB = parseMatrixInput(matrixBInput)

      if (dataA.length !== dataB.length || dataA[0].length !== dataB[0].length) {
        throw new Error("Matrices must have the same dimensions")
      }

      if (dataA.length !== dataA[0].length) {
        throw new Error("Matrices must be square for Strassen multiplication")
      }

      const size = dataA.length
      if (size & (size - 1)) {
        throw new Error("Matrix size must be a power of 2 for Strassen algorithm")
      }

      setMatrixA({ data: dataA, rows: size, cols: size })
      setMatrixB({ data: dataB, rows: size, cols: size })
      setMatrixSize(size)
    } catch (err: any) {
      setError(`Matrix parsing error: ${err.message}`)
    }
  }

  const generateRandomMatrices = () => {
    const size = matrixSize
    const dataA: number[][] = []
    const dataB: number[][] = []

    for (let i = 0; i < size; i++) {
      dataA[i] = []
      dataB[i] = []
      for (let j = 0; j < size; j++) {
        dataA[i][j] = Math.floor(Math.random() * 10) + 1
        dataB[i][j] = Math.floor(Math.random() * 10) + 1
      }
    }

    setMatrixA({ data: dataA, rows: size, cols: size })
    setMatrixB({ data: dataB, rows: size, cols: size })

    // Update input fields with proper newline characters
    setMatrixAInput(dataA.map((row) => row.join(",")).join("\n"))
    setMatrixBInput(dataB.map((row) => row.join(",")).join("\n"))
  }

  const addMatrices = (A: number[][], B: number[][]): number[][] => {
    const n = A.length
    const result: number[][] = []
    for (let i = 0; i < n; i++) {
      result[i] = []
      for (let j = 0; j < n; j++) {
        result[i][j] = A[i][j] + B[i][j]
      }
    }
    return result
  }

  const subtractMatrices = (A: number[][], B: number[][]): number[][] => {
    const n = A.length
    const result: number[][] = []
    for (let i = 0; i < n; i++) {
      result[i] = []
      for (let j = 0; j < n; j++) {
        result[i][j] = A[i][j] - B[i][j]
      }
    }
    return result
  }

  const standardMultiply = (A: number[][], B: number[][]): number[][] => {
    const n = A.length
    const result: number[][] = Array(n)
      .fill(null)
      .map(() => Array(n).fill(0))

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        for (let k = 0; k < n; k++) {
          result[i][j] += A[i][k] * B[k][j]
        }
      }
    }
    return result
  }

  const strassenMultiply = (A: number[][], B: number[][], stepList: StrassenStep[]): number[][] => {
    const n = A.length

    if (n === 1) {
      return [[A[0][0] * B[0][0]]]
    }

    const mid = n / 2

    // Divide matrices into quadrants
    const A11 = A.slice(0, mid).map((row) => row.slice(0, mid))
    const A12 = A.slice(0, mid).map((row) => row.slice(mid))
    const A21 = A.slice(mid).map((row) => row.slice(0, mid))
    const A22 = A.slice(mid).map((row) => row.slice(mid))

    const B11 = B.slice(0, mid).map((row) => row.slice(0, mid))
    const B12 = B.slice(0, mid).map((row) => row.slice(mid))
    const B21 = B.slice(mid).map((row) => row.slice(0, mid))
    const B22 = B.slice(mid).map((row) => row.slice(mid))

    stepList.push({
      step: stepList.length + 1,
      operation: "divide",
      description: `Divided ${n}x${n} matrices into ${mid}x${mid} quadrants`,
      matrices: [
        { name: "A11", data: A11 },
        { name: "A12", data: A12 },
        { name: "A21", data: A21 },
        { name: "A22", data: A22 },
      ],
    })

    // Calculate the 7 products
    const M1 = strassenMultiply(addMatrices(A11, A22), addMatrices(B11, B22), stepList)
    const M2 = strassenMultiply(addMatrices(A21, A22), B11, stepList)
    const M3 = strassenMultiply(A11, subtractMatrices(B12, B22), stepList)
    const M4 = strassenMultiply(A22, subtractMatrices(B21, B11), stepList)
    const M5 = strassenMultiply(addMatrices(A11, A12), B22, stepList)
    const M6 = strassenMultiply(subtractMatrices(A21, A11), addMatrices(B11, B12), stepList)
    const M7 = strassenMultiply(subtractMatrices(A12, A22), addMatrices(B21, B22), stepList)

    stepList.push({
      step: stepList.length + 1,
      operation: "products",
      description: "Calculated 7 Strassen products M1 through M7",
    })

    // Combine results
    const C11 = subtractMatrices(addMatrices(addMatrices(M1, M4), M7), M5)
    const C12 = addMatrices(M3, M5)
    const C21 = addMatrices(M2, M4)
    const C22 = subtractMatrices(subtractMatrices(addMatrices(M1, M3), M2), M6)

    // Construct result matrix
    const result: number[][] = Array(n)
      .fill(null)
      .map(() => Array(n).fill(0))

    for (let i = 0; i < mid; i++) {
      for (let j = 0; j < mid; j++) {
        result[i][j] = C11[i][j]
        result[i][j + mid] = C12[i][j]
        result[i + mid][j] = C21[i][j]
        result[i + mid][j + mid] = C22[i][j]
      }
    }

    return result
  }

  const runMultiplication = () => {
    setIsAnimating(true)
    setError("")
    const newSteps: StrassenStep[] = []

    try {
      let resultMatrix: number[][]

      if (useStrassen) {
        newSteps.push({
          step: 1,
          operation: "start",
          description: "Starting Strassen matrix multiplication algorithm",
        })
        resultMatrix = strassenMultiply(matrixA.data, matrixB.data, newSteps)
      } else {
        newSteps.push({
          step: 1,
          operation: "start",
          description: "Starting standard matrix multiplication algorithm",
        })
        resultMatrix = standardMultiply(matrixA.data, matrixB.data)
      }

      setResult({
        data: resultMatrix,
        rows: resultMatrix.length,
        cols: resultMatrix[0].length,
      })
      setSteps(newSteps)
    } catch (err: any) {
      setError(`Multiplication error: ${err.message}`)
    }

    setIsAnimating(false)
  }

  const reset = () => {
    setResult(null)
    setSteps([])
    setError("")
    setOperationCount(0)
  }

  const exportData = () => {
    const data = {
      matrixA: matrixA.data,
      matrixB: matrixB.data,
      result: result?.data,
      algorithm: useStrassen ? "Strassen" : "Standard",
      steps: steps.length,
    }
    const dataStr = JSON.stringify(data, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "matrix-multiplication.json"
    link.click()
  }

  const renderMatrix = (matrix: number[][], title: string, color: string) => (
    <div className={`p-4 rounded-lg ${color}`}>
      <h4 className="font-semibold mb-2 dark:text-gray-300">{title}</h4>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${matrix[0]?.length || 1}, minmax(0, 1fr))` }}>
        {matrix.map((row, i) =>
          row.map((cell, j) => (
            <div
              key={`${i}-${j}`}
              className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-700 border rounded text-sm font-mono dark:text-white"
            >
              {cell}
            </div>
          )),
        )}
      </div>
    </div>
  )

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2">
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-2xl">
          <CardHeader>
            <CardTitle className="dark:text-white">Matrix Multiplication Visualization</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={useStrassen ? "default" : "outline"}
                size="sm"
                onClick={() => setUseStrassen(true)}
                className="dark:border-gray-600"
              >
                Strassen Algorithm
              </Button>
              <Button
                variant={!useStrassen ? "default" : "outline"}
                size="sm"
                onClick={() => setUseStrassen(false)}
                className="dark:border-gray-600"
              >
                Standard Algorithm
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {renderMatrix(
                matrixA.data,
                "Matrix A",
                "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20",
              )}
              <div className="flex items-center justify-center">
                <span className="text-4xl font-bold text-gray-400">×</span>
              </div>
              {renderMatrix(
                matrixB.data,
                "Matrix B",
                "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20",
              )}
            </div>

            {result && (
              <div className="mb-6">
                {renderMatrix(
                  result.data,
                  "Result Matrix",
                  "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20",
                )}
              </div>
            )}

            <div className="flex gap-3 flex-wrap">
              <Button
                onClick={runMultiplication}
                disabled={isAnimating}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              >
                <Play className="w-4 h-4 mr-2" />
                {isAnimating ? "Computing..." : "Multiply Matrices"}
              </Button>
              <Button
                onClick={reset}
                variant="outline"
                className="dark:border-gray-600 dark:text-gray-300 bg-transparent"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={exportData}
                variant="outline"
                disabled={!result}
                className="dark:border-gray-600 dark:text-gray-300 bg-transparent"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-2xl">
          <CardHeader>
            <CardTitle className="dark:text-white">Matrix Input</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={inputMode} onValueChange={(value) => setInputMode(value as any)}>
              <TabsList className="grid w-full grid-cols-2 dark:bg-gray-700">
                <TabsTrigger value="manual" className="dark:text-gray-300">
                  Manual
                </TabsTrigger>
                <TabsTrigger value="random" className="dark:text-gray-300">
                  Random
                </TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="space-y-4">
                <div>
                  <Label htmlFor="matrix-a" className="dark:text-gray-300">
                    Matrix A (comma-separated rows)
                  </Label>
                  <Textarea
                    id="matrix-a"
                    placeholder="1,2\n3,4"
                    value={matrixAInput}
                    onChange={(e) => setMatrixAInput(e.target.value)}
                    rows={3}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="matrix-b" className="dark:text-gray-300">
                    Matrix B (comma-separated rows)
                  </Label>
                  <Textarea
                    id="matrix-b"
                    placeholder="5,6\n7,8"
                    value={matrixBInput}
                    onChange={(e) => setMatrixBInput(e.target.value)}
                    rows={3}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <Button onClick={loadMatrices} className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  Load Matrices
                </Button>
              </TabsContent>

              <TabsContent value="random" className="space-y-4">
                <div>
                  <Label htmlFor="matrix-size" className="dark:text-gray-300">
                    Matrix Size (power of 2)
                  </Label>
                  <Input
                    id="matrix-size"
                    type="number"
                    value={matrixSize}
                    onChange={(e) => setMatrixSize(Number.parseInt(e.target.value) || 2)}
                    min="2"
                    max="8"
                    step="2"
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <Button onClick={generateRandomMatrices} className="w-full">
                  <Shuffle className="w-4 h-4 mr-2" />
                  Generate Random Matrices
                </Button>
              </TabsContent>
            </Tabs>

            {error && (
              <Alert className="mt-4 dark:bg-red-900/20 dark:border-red-800">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-red-600 dark:text-red-400">{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-2xl">
          <CardHeader>
            <CardTitle className="dark:text-white">Algorithm Comparison</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
              <h4 className="font-semibold text-sm dark:text-gray-300">Standard Algorithm</h4>
              <p className="text-xs text-muted-foreground dark:text-gray-400">Time Complexity: O(n³)</p>
              <p className="text-xs text-muted-foreground dark:text-gray-400">Space Complexity: O(1)</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-lg">
              <h4 className="font-semibold text-sm dark:text-gray-300">Strassen Algorithm</h4>
              <p className="text-xs text-muted-foreground dark:text-gray-400">Time Complexity: O(n^2.807)</p>
              <p className="text-xs text-muted-foreground dark:text-gray-400">Space Complexity: O(log n)</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-2xl">
          <CardHeader>
            <CardTitle className="dark:text-white">Algorithm Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 rounded-lg text-sm"
                >
                  <div className="flex justify-between items-center mb-1">
                    <Badge variant="outline" className="dark:border-gray-500 dark:text-gray-300">
                      Step {step.step}
                    </Badge>
                    <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-300">
                      {step.operation}
                    </Badge>
                  </div>
                  <p className="dark:text-gray-300">{step.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
