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
import { Play, Plus, Minus, RotateCcw, Shuffle, Upload } from "lucide-react"

export default function HeapVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [heap, setHeap] = useState<number[]>([50, 30, 40, 20, 25, 35, 15])
  const [inputValue, setInputValue] = useState("")
  const [arrayInput, setArrayInput] = useState("")
  const [steps, setSteps] = useState<string[]>([])
  const [highlightedIndices, setHighlightedIndices] = useState<number[]>([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [inputMode, setInputMode] = useState<"single" | "array">("single")
  const [heapType, setHeapType] = useState<"max" | "min">("max")
  const [error, setError] = useState("")
  const [sortedArray, setSortedArray] = useState<number[]>([])

  const drawHeap = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (heap.length === 0) return

    const nodeRadius = 25
    const levelHeight = 80

    const drawNode = (index: number, x: number, y: number) => {
      if (index >= heap.length) return

      // Draw connections to children
      const leftChild = 2 * index + 1
      const rightChild = 2 * index + 2

      if (leftChild < heap.length) {
        const childX = x - canvas.width / Math.pow(2, Math.floor(Math.log2(leftChild + 1)) + 2)
        const childY = y + levelHeight

        ctx.beginPath()
        ctx.moveTo(x, y + nodeRadius)
        ctx.lineTo(childX, childY - nodeRadius)
        ctx.strokeStyle = "#64748b"
        ctx.lineWidth = 2
        ctx.stroke()

        drawNode(leftChild, childX, childY)
      }

      if (rightChild < heap.length) {
        const childX = x + canvas.width / Math.pow(2, Math.floor(Math.log2(rightChild + 1)) + 2)
        const childY = y + levelHeight

        ctx.beginPath()
        ctx.moveTo(x, y + nodeRadius)
        ctx.lineTo(childX, childY - nodeRadius)
        ctx.strokeStyle = "#64748b"
        ctx.lineWidth = 2
        ctx.stroke()

        drawNode(rightChild, childX, childY)
      }

      // Draw node
      ctx.beginPath()
      ctx.arc(x, y, nodeRadius, 0, 2 * Math.PI)

      if (highlightedIndices.includes(index)) {
        ctx.fillStyle = "#ef4444"
      } else {
        ctx.fillStyle = heapType === "max" ? "#3b82f6" : "#10b981"
      }

      ctx.fill()
      ctx.strokeStyle = "#1e293b"
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw value
      ctx.fillStyle = "white"
      ctx.font = "bold 16px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(heap[index].toString(), x, y + 5)

      // Draw index
      ctx.fillStyle = "#64748b"
      ctx.font = "10px sans-serif"
      ctx.fillText(index.toString(), x, y - 35)
    }

    // Start drawing from root
    drawNode(0, canvas.width / 2, 60)
  }

  useEffect(() => {
    drawHeap()
  }, [heap, highlightedIndices, heapType])

  const heapifyUp = async (index: number) => {
    const newSteps: string[] = []
    const newHeap = [...heap]

    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2)

      setHighlightedIndices([index, parentIndex])
      newSteps.push(
        `Comparing ${newHeap[index]} at index ${index} with parent ${newHeap[parentIndex]} at index ${parentIndex}`,
      )

      const shouldSwap =
        heapType === "max" ? newHeap[index] > newHeap[parentIndex] : newHeap[index] < newHeap[parentIndex]

      if (!shouldSwap) {
        newSteps.push(`${heapType === "max" ? "Max" : "Min"} heap property satisfied`)
        break
      }
      // Swap
      ;[newHeap[index], newHeap[parentIndex]] = [newHeap[parentIndex], newHeap[index]]
      newSteps.push(`Swapped ${newHeap[parentIndex]} and ${newHeap[index]}`)

      setHeap([...newHeap])
      await new Promise((resolve) => setTimeout(resolve, 1000))

      index = parentIndex
    }

    setHighlightedIndices([])
    setSteps((prev) => [...prev, ...newSteps])
  }

  const heapifyDown = async (index: number) => {
    const newSteps: string[] = []
    const newHeap = [...heap]

    while (true) {
      let largest = index
      const leftChild = 2 * index + 1
      const rightChild = 2 * index + 2

      setHighlightedIndices([index, leftChild, rightChild].filter((i) => i < newHeap.length))

      if (leftChild < newHeap.length) {
        if (heapType === "max" ? newHeap[leftChild] > newHeap[largest] : newHeap[leftChild] < newHeap[largest]) {
          largest = leftChild
        }
      }

      if (rightChild < newHeap.length) {
        if (heapType === "max" ? newHeap[rightChild] > newHeap[largest] : newHeap[rightChild] < newHeap[largest]) {
          largest = rightChild
        }
      }

      if (largest === index) {
        newSteps.push(`Heap property satisfied at index ${index}`)
        break
      }

      newSteps.push(`Swapping ${newHeap[index]} at index ${index} with ${newHeap[largest]} at index ${largest}`)
      // Swap
      ;[newHeap[index], newHeap[largest]] = [newHeap[largest], newHeap[index]]
      setHeap([...newHeap])
      await new Promise((resolve) => setTimeout(resolve, 1000))

      index = largest
    }

    setHighlightedIndices([])
    setSteps((prev) => [...prev, ...newSteps])
  }

  const insertValue = async () => {
    if (!inputValue || isNaN(Number.parseInt(inputValue))) return

    setIsAnimating(true)
    const value = Number.parseInt(inputValue)
    const newHeap = [...heap, value]
    setHeap(newHeap)

    setSteps((prev) => [...prev, `Inserted ${value} at the end of heap`])
    await heapifyUp(newHeap.length - 1)

    setInputValue("")
    setIsAnimating(false)
  }

  const buildHeap = async () => {
    setIsAnimating(true)
    const n = heap.length

    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
      await heapifyDown(i)
    }
    setIsAnimating(false)
  }

  const extractMax = async () => {
    if (heap.length === 0) return

    setIsAnimating(true)
    const max = heap[0]
    const newHeap = [...heap]

    // Move last element to root
    newHeap[0] = newHeap[newHeap.length - 1]
    newHeap.pop()

    setHeap([...newHeap])
    setSteps((prev) => [
      ...prev,
      `Extracted ${heapType === "max" ? "maximum" : "minimum"} ${max}, moved last element to root`,
    ])

    if (newHeap.length > 0) {
      await heapifyDown(0)
    }

    setIsAnimating(false)
  }

  const heapSort = async () => {
    setIsAnimating(true)
    setSortedArray([])
    const sorted: number[] = []
    const workingHeap = [...heap]
    const n = workingHeap.length

    for (let i = n - 1; i >= 0; i--) {
      // Move current root to end
      ;[workingHeap[0], workingHeap[i]] = [workingHeap[i], workingHeap[0]]

      sorted.push(workingHeap.pop()!)
      setHeap([...workingHeap])
      setSortedArray([...sorted])
      setSteps((prev) => [...prev, `Moved largest to sorted array`])

      await heapifyDown(0)
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    setHeap([...sorted.reverse()])
    setSortedArray([])
    setSteps((prev) => [...prev, `Heap Sorted`])
    setIsAnimating(false)
  }

  const reset = () => {
    setHeap([50, 30, 40, 20, 25, 35, 15])
    setSteps([])
    setHighlightedIndices([])
    setInputValue("")
    setArrayInput("")
    setError("")
    setSortedArray([])
  }

  const randomizeHeap = () => {
    const newHeap = Array.from({ length: 7 }, () => Math.floor(Math.random() * 100) + 1)
    setHeap(newHeap)
    setSteps([])
    setHighlightedIndices([])
    setError("")
    setSortedArray([])
  }

  const loadArray = () => {
    try {
      const arr = JSON.parse(`[${arrayInput}]`)
      if (!Array.isArray(arr) || arr.some(isNaN)) {
        setError("Invalid array format. Please use comma-separated numbers.")
        return
      }
      setError("")
      setHeap(arr)
      setSteps([])
      setHighlightedIndices([])
      setSortedArray([])
    } catch (e: any) {
      setError("Invalid array format. Please use comma-separated numbers.")
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>{heapType === "max" ? "Max" : "Min"} Heap Visualization</CardTitle>
          </CardHeader>
          <CardContent>
            <canvas ref={canvasRef} width={600} height={400} className="border rounded-lg bg-white w-full" />
            <div className="flex gap-2 mt-4 flex-wrap">
              <Button onClick={insertValue} disabled={isAnimating || !inputValue || inputMode !== "single"}>
                <Plus className="w-4 h-4 mr-2" />
                Insert
              </Button>
              <Button onClick={extractMax} disabled={isAnimating || heap.length === 0}>
                <Minus className="w-4 h-4 mr-2" />
                Extract {heapType === "max" ? "Max" : "Min"}
              </Button>
              <Button onClick={heapSort} disabled={isAnimating || heap.length === 0}>
                <Play className="w-4 h-4 mr-2" />
                Heap Sort
              </Button>
              <Button onClick={buildHeap} disabled={isAnimating || heap.length === 0}>
                <Upload className="w-4 h-4 mr-2" />
                Build Heap
              </Button>
              <Button onClick={randomizeHeap} variant="outline" disabled={isAnimating}>
                <Shuffle className="w-4 h-4 mr-2" />
                Randomize
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
            <CardTitle>Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs
              defaultValue="single"
              className="w-full"
              onValueChange={(value) => setInputMode(value as "single" | "array")}
            >
              <TabsList>
                <TabsTrigger value="single">Single</TabsTrigger>
                <TabsTrigger value="array">Array</TabsTrigger>
              </TabsList>
              <TabsContent value="single" className="space-y-4">
                <div>
                  <Label htmlFor="insert-value">Insert Value</Label>
                  <Input
                    id="insert-value"
                    type="number"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Enter number..."
                  />
                </div>
              </TabsContent>
              <TabsContent value="array" className="space-y-4">
                <div>
                  <Label htmlFor="array-input">Enter Array</Label>
                  <Textarea
                    id="array-input"
                    placeholder="Enter comma-separated numbers (e.g., 1, 2, 3)"
                    value={arrayInput}
                    onChange={(e) => setArrayInput(e.target.value)}
                  />
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  <Button onClick={loadArray} disabled={isAnimating}>
                    <Upload className="w-4 h-4 mr-2" />
                    Load Array
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            <div>
              <Label htmlFor="heap-type">Heap Type</Label>
              <div className="flex gap-2">
                <Button
                  variant={heapType === "max" ? "default" : "outline"}
                  onClick={() => setHeapType("max")}
                  disabled={isAnimating}
                >
                  Max Heap
                </Button>
                <Button
                  variant={heapType === "min" ? "default" : "outline"}
                  onClick={() => setHeapType("min")}
                  disabled={isAnimating}
                >
                  Min Heap
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Heap Array</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              {heap.map((value, index) => (
                <div
                  key={index}
                  className={`p-2 text-center border rounded ${
                    highlightedIndices.includes(index)
                      ? "bg-red-200 dark:bg-red-800"
                      : sortedArray.includes(value)
                        ? "bg-green-200 dark:bg-green-800"
                        : "bg-slate-50 dark:bg-slate-700"
                  }`}
                >
                  <div className="text-xs text-muted-foreground">[{index}]</div>
                  <div className="font-bold">{value}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Algorithm Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
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
