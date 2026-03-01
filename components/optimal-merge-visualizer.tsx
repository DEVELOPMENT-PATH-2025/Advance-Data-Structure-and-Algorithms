"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Play, RotateCcw, Upload, Download, Plus, Trash2, Info } from "lucide-react"

interface MergeNode {
  id: number
  size: number
  left?: MergeNode
  right?: MergeNode
  x?: number
  y?: number
  isLeaf: boolean
  cost?: number
}

interface MergeStep {
  step: number
  file1: number
  file2: number
  cost: number
  newSize: number
  description: string
}

export default function OptimalMergeVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fileSizes, setFileSizes] = useState<number[]>([20, 30, 10, 5, 30, 15])
  const [inputMode, setInputMode] = useState<"manual" | "array">("manual")
  const [arrayInput, setArrayInput] = useState("")
  const [newFileSize, setNewFileSize] = useState("")
  const [mergeTree, setMergeTree] = useState<MergeNode | null>(null)
  const [mergeSteps, setMergeSteps] = useState<MergeStep[]>([])
  const [totalCost, setTotalCost] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [error, setError] = useState("")

  const buildOptimalMergeTree = () => {
    if (fileSizes.length < 2) {
      setError("Need at least 2 files to merge")
      return
    }

    setError("")
    setIsAnimating(true)

    // Create initial nodes (leaves)
    const nodes: MergeNode[] = fileSizes.map((size, index) => ({
      id: index,
      size,
      isLeaf: true,
    }))

    const steps: MergeStep[] = []
    let stepCounter = 1
    let totalMergeCost = 0

    // Build merge tree using greedy approach (always merge two smallest)
    while (nodes.length > 1) {
      // Sort nodes by size
      nodes.sort((a, b) => a.size - b.size)

      // Take two smallest
      const left = nodes.shift()!
      const right = nodes.shift()!

      const mergeCost = left.size + right.size
      totalMergeCost += mergeCost

      // Create new internal node
      const newNode: MergeNode = {
        id: stepCounter + 1000, // Use high ID for internal nodes
        size: mergeCost,
        left,
        right,
        isLeaf: false,
        cost: mergeCost,
      }

      steps.push({
        step: stepCounter,
        file1: left.size,
        file2: right.size,
        cost: mergeCost,
        newSize: mergeCost,
        description: `Merge files of size ${left.size} and ${right.size} with cost ${mergeCost}`,
      })

      nodes.push(newNode)
      stepCounter++
    }

    // Position nodes in tree
    const tree = nodes[0]
    positionNodes(tree, 350, 50, 0)

    setMergeTree(tree)
    setMergeSteps(steps)
    setTotalCost(totalMergeCost)
    setIsAnimating(false)
  }

  const positionNodes = (node: MergeNode, x: number, y: number, level: number) => {
    node.x = x
    node.y = y

    const spacing = 150 / (level + 1)
    if (node.left) {
      positionNodes(node.left, x - spacing, y + 80, level + 1)
    }
    if (node.right) {
      positionNodes(node.right, x + spacing, y + 80, level + 1)
    }
  }

  const drawTree = () => {
    const canvas = canvasRef.current
    if (!canvas || !mergeTree) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const drawNode = (node: MergeNode) => {
      if (!node.x || !node.y) return

      // Draw connections
      if (node.left && node.left.x && node.left.y) {
        ctx.beginPath()
        ctx.moveTo(node.x, node.y)
        ctx.lineTo(node.left.x, node.left.y)
        ctx.strokeStyle = "#64748b"
        ctx.lineWidth = 2
        ctx.stroke()
      }

      if (node.right && node.right.x && node.right.y) {
        ctx.beginPath()
        ctx.moveTo(node.x, node.y)
        ctx.lineTo(node.right.x, node.right.y)
        ctx.strokeStyle = "#64748b"
        ctx.lineWidth = 2
        ctx.stroke()
      }

      // Draw node
      ctx.beginPath()
      ctx.arc(node.x, node.y, 30, 0, 2 * Math.PI)
      ctx.fillStyle = node.isLeaf ? "#10b981" : "#3b82f6"
      ctx.fill()
      ctx.strokeStyle = "#334155"
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw size
      ctx.fillStyle = "white"
      ctx.font = "bold 14px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(node.size.toString(), node.x, node.y + 5)

      // Draw cost for internal nodes
      if (!node.isLeaf && node.cost) {
        ctx.fillStyle = "#dc2626"
        ctx.font = "10px sans-serif"
        ctx.fillText(`Cost: ${node.cost}`, node.x, node.y - 40)
      }

      // Recursively draw children
      if (node.left) drawNode(node.left)
      if (node.right) drawNode(node.right)
    }

    drawNode(mergeTree)
  }

  useEffect(() => {
    if (mergeTree) {
      drawTree()
    }
  }, [mergeTree])

  const addFileSize = () => {
    const size = Number.parseInt(newFileSize)
    if (size && size > 0) {
      setFileSizes([...fileSizes, size])
      setNewFileSize("")
      setError("")
    } else {
      setError("Please enter a valid positive file size")
    }
  }

  const removeFileSize = (index: number) => {
    setFileSizes(fileSizes.filter((_, i) => i !== index))
  }

  const loadArrayInput = () => {
    try {
      const arr = JSON.parse(`[${arrayInput}]`)
      if (!Array.isArray(arr) || arr.some((x) => isNaN(x) || x <= 0)) {
        setError("Invalid array format. Please use comma-separated positive numbers.")
        return
      }
      setError("")
      setFileSizes(arr)
      setArrayInput("")
    } catch (e) {
      setError("Invalid array format. Please use comma-separated positive numbers.")
    }
  }

  const reset = () => {
    setMergeTree(null)
    setMergeSteps([])
    setTotalCost(0)
    setCurrentStep(-1)
    setError("")
  }

  const exportData = () => {
    const data = {
      fileSizes,
      mergeSteps,
      totalCost,
      optimalMergePattern: mergeSteps.map((s) => s.description),
    }
    const dataStr = JSON.stringify(data, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "optimal-merge-pattern.json"
    link.click()
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2">
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-2xl">
          <CardHeader>
            <CardTitle className="dark:text-white">Optimal Merge Pattern Tree</CardTitle>
            {totalCost > 0 && (
              <Badge variant="outline" className="w-fit text-lg px-3 py-1 dark:border-gray-600 dark:text-gray-300">
                Total Cost: {totalCost}
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            <canvas
              ref={canvasRef}
              width={700}
              height={450}
              className="border rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-gray-700 dark:to-gray-800 w-full shadow-inner dark:border-gray-600"
            />
            <div className="flex gap-3 mt-6 flex-wrap">
              <Button
                onClick={buildOptimalMergeTree}
                disabled={isAnimating || fileSizes.length < 2}
                className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Find Optimal Pattern
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
                disabled={!mergeTree}
                className="dark:border-gray-600 dark:text-gray-300 bg-transparent"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-2xl">
          <CardHeader>
            <CardTitle className="dark:text-white">File Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={inputMode} onValueChange={(value) => setInputMode(value as any)}>
              <TabsList className="grid w-full grid-cols-2 dark:bg-gray-700">
                <TabsTrigger value="manual" className="dark:text-gray-300">
                  Manual
                </TabsTrigger>
                <TabsTrigger value="array" className="dark:text-gray-300">
                  Array Input
                </TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="File size"
                    value={newFileSize}
                    onChange={(e) => setNewFileSize(e.target.value)}
                    min="1"
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <Button onClick={addFileSize} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {fileSizes.map((size, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-700 dark:to-gray-600 rounded-lg"
                    >
                      <span className="font-mono text-lg dark:text-gray-300">
                        File {index + 1}: {size}
                      </span>
                      <Button
                        onClick={() => removeFileSize(index)}
                        size="sm"
                        variant="outline"
                        className="dark:border-gray-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="array" className="space-y-4">
                <div>
                  <Label htmlFor="array-input" className="dark:text-gray-300">
                    File Sizes (comma-separated)
                  </Label>
                  <Textarea
                    id="array-input"
                    placeholder="20, 30, 10, 5, 30, 15"
                    value={arrayInput}
                    onChange={(e) => setArrayInput(e.target.value)}
                    rows={3}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <Button onClick={loadArrayInput} className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  Load File Sizes
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
            <CardTitle className="dark:text-white">Current File Sizes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {fileSizes.map((size, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-lg px-3 py-2 dark:bg-gray-700 dark:text-gray-300"
                >
                  {size}
                </Badge>
              ))}
            </div>
            {fileSizes.length === 0 && (
              <p className="text-muted-foreground text-sm dark:text-gray-400">No files added yet</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-2xl">
          <CardHeader>
            <CardTitle className="dark:text-white">Merge Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {mergeSteps.map((step, index) => (
                <div
                  key={index}
                  className="p-3 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-lg text-sm"
                >
                  <div className="flex justify-between items-center mb-1">
                    <Badge variant="outline" className="dark:border-gray-500 dark:text-gray-300">
                      Step {step.step}
                    </Badge>
                    <Badge variant="default" className="bg-red-500">
                      Cost: {step.cost}
                    </Badge>
                  </div>
                  <p className="dark:text-gray-300">{step.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-2xl">
          <CardHeader>
            <CardTitle className="dark:text-white">Algorithm Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-gradient-to-br from-violet-50 to-violet-100 dark:from-violet-900/20 dark:to-violet-800/20 rounded-lg">
              <h4 className="font-semibold text-sm dark:text-gray-300">Greedy Strategy</h4>
              <p className="text-xs text-muted-foreground dark:text-gray-400">
                Always merge the two smallest files first
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg">
              <h4 className="font-semibold text-sm dark:text-gray-300">Time Complexity</h4>
              <p className="text-xs text-muted-foreground dark:text-gray-400">O(n log n) due to sorting at each step</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-lg">
              <h4 className="font-semibold text-sm dark:text-gray-300">Applications</h4>
              <p className="text-xs text-muted-foreground dark:text-gray-400">
                File merging, Huffman coding, optimal binary search trees
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
