"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Play, RotateCcw, Upload, Download, Plus, Settings, Info } from "lucide-react"

interface Node {
  id: number
  x: number
  y: number
  distance: number
  visited: boolean
  previous: number | null
  label?: string
}

interface Edge {
  from: number
  to: number
  weight: number
}

export default function DijkstraVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [startNode, setStartNode] = useState(0)
  const [steps, setSteps] = useState<string[]>([])
  const [inputMode, setInputMode] = useState<"visual" | "matrix" | "list">("visual")
  const [matrixInput, setMatrixInput] = useState("")
  const [listInput, setListInput] = useState("")
  const [nodeCount, setNodeCount] = useState(6)
  const [error, setError] = useState("")
  const [isAddingNode, setIsAddingNode] = useState(false)
  const [isAddingEdge, setIsAddingEdge] = useState(false)
  const [selectedNodes, setSelectedNodes] = useState<number[]>([])
  const [edgeWeight, setEdgeWeight] = useState("")

  // Initialize default graph
  useEffect(() => {
    loadDefaultGraph()
  }, [])

  const loadDefaultGraph = () => {
    const defaultNodes: Node[] = [
      { id: 0, x: 100, y: 150, distance: Number.POSITIVE_INFINITY, visited: false, previous: null, label: "A" },
      { id: 1, x: 250, y: 100, distance: Number.POSITIVE_INFINITY, visited: false, previous: null, label: "B" },
      { id: 2, x: 250, y: 200, distance: Number.POSITIVE_INFINITY, visited: false, previous: null, label: "C" },
      { id: 3, x: 400, y: 100, distance: Number.POSITIVE_INFINITY, visited: false, previous: null, label: "D" },
      { id: 4, x: 400, y: 200, distance: Number.POSITIVE_INFINITY, visited: false, previous: null, label: "E" },
      { id: 5, x: 550, y: 150, distance: Number.POSITIVE_INFINITY, visited: false, previous: null, label: "F" },
    ]

    const defaultEdges: Edge[] = [
      { from: 0, to: 1, weight: 4 },
      { from: 0, to: 2, weight: 2 },
      { from: 1, to: 3, weight: 5 },
      { from: 2, to: 4, weight: 3 },
      { from: 1, to: 2, weight: 1 },
      { from: 3, to: 5, weight: 2 },
      { from: 4, to: 5, weight: 4 },
      { from: 3, to: 4, weight: 1 },
    ]

    setNodes(defaultNodes)
    setEdges(defaultEdges)
    setNodeCount(defaultNodes.length)
  }

  const parseMatrixInput = () => {
    try {
      setError("")
      const lines = matrixInput.trim().split("\n")
      const matrix = lines.map((line) =>
        line
          .trim()
          .split(/\s+/)
          .map((val) => {
            const num = Number.parseFloat(val)
            return isNaN(num) || num === 0 ? null : num
          }),
      )

      if (matrix.length === 0) {
        throw new Error("Empty matrix")
      }

      const n = matrix.length
      if (!matrix.every((row) => row.length === n)) {
        throw new Error("Matrix must be square")
      }

      // Create nodes
      const newNodes: Node[] = []
      const radius = 200
      const centerX = 350
      const centerY = 200

      for (let i = 0; i < n; i++) {
        const angle = (2 * Math.PI * i) / n
        newNodes.push({
          id: i,
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
          distance: Number.POSITIVE_INFINITY,
          visited: false,
          previous: null,
          label: String.fromCharCode(65 + i),
        })
      }

      // Create edges
      const newEdges: Edge[] = []
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (matrix[i][j] !== null && i !== j) {
            newEdges.push({ from: i, to: j, weight: matrix[i][j] as number })
          }
        }
      }

      setNodes(newNodes)
      setEdges(newEdges)
      setNodeCount(n)
    } catch (err: unknown) {
      setError(`Matrix parsing error: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const parseListInput = () => {
    try {
      setError("")
      const lines = listInput.trim().split("\n")
      const edgeList: Edge[] = []
      const nodeSet = new Set<number>()

      for (const line of lines) {
        const parts = line.trim().split(/\s+/)
        if (parts.length !== 3) {
          throw new Error(`Invalid edge format: ${line}. Expected: "from to weight"`)
        }

        const from = Number.parseInt(parts[0])
        const to = Number.parseInt(parts[1])
        const weight = Number.parseFloat(parts[2])

        if (isNaN(from) || isNaN(to) || isNaN(weight)) {
          throw new Error(`Invalid numbers in: ${line}`)
        }

        edgeList.push({ from, to, weight })
        nodeSet.add(from)
        nodeSet.add(to)
      }

      // Create nodes
      const nodeIds = Array.from(nodeSet).sort((a, b) => a - b)
      const newNodes: Node[] = []
      const radius = 200
      const centerX = 350
      const centerY = 200

      nodeIds.forEach((id, index) => {
        const angle = (2 * Math.PI * index) / nodeIds.length
        newNodes.push({
          id,
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
          distance: Number.POSITIVE_INFINITY,
          visited: false,
          previous: null,
          label: String.fromCharCode(65 + id),
        })
      })

      setNodes(newNodes)
      setEdges(edgeList)
      setNodeCount(nodeIds.length)
    } catch (err: unknown) {
      setError(`Edge list parsing error: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    if (isAddingNode) {
      const newNode: Node = {
        id: nodes.length,
        x,
        y,
        distance: Number.POSITIVE_INFINITY,
        visited: false,
        previous: null,
        label: String.fromCharCode(65 + nodes.length),
      }
      setNodes([...nodes, newNode])
      setNodeCount(nodes.length + 1)
      setIsAddingNode(false)
    } else if (isAddingEdge) {
      // Find clicked node
      const clickedNode = nodes.find((node) => {
        const distance = Math.sqrt((node.x - x) ** 2 + (node.y - y) ** 2)
        return distance <= 25
      })

      if (clickedNode) {
        if (selectedNodes.length === 0) {
          setSelectedNodes([clickedNode.id])
        } else if (selectedNodes.length === 1 && selectedNodes[0] !== clickedNode.id) {
          const weight = Number.parseFloat(edgeWeight) || 1
          const newEdge: Edge = {
            from: selectedNodes[0],
            to: clickedNode.id,
            weight,
          }
          setEdges([...edges, newEdge])
          setSelectedNodes([])
          setIsAddingEdge(false)
          setEdgeWeight("")
        }
      }
    }
  }

  const drawGraph = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw edges
    edges.forEach((edge) => {
      const fromNode = nodes.find((n) => n.id === edge.from)
      const toNode = nodes.find((n) => n.id === edge.to)
      if (!fromNode || !toNode) return

      ctx.beginPath()
      ctx.moveTo(fromNode.x, fromNode.y)
      ctx.lineTo(toNode.x, toNode.y)
      ctx.strokeStyle = "#e2e8f0"
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw weight
      const midX = (fromNode.x + toNode.x) / 2
      const midY = (fromNode.y + toNode.y) / 2
      ctx.fillStyle = "#dc2626"
      ctx.font = "bold 14px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(edge.weight.toString(), midX, midY - 5)
    })

    // Draw nodes
    nodes.forEach((node) => {
      ctx.beginPath()
      ctx.arc(node.x, node.y, 25, 0, 2 * Math.PI)

      if (selectedNodes.includes(node.id)) {
        ctx.fillStyle = "#f59e0b"
      } else if (node.visited) {
        ctx.fillStyle = "#10b981"
      } else if (node.id === startNode) {
        ctx.fillStyle = "#3b82f6"
      } else {
        ctx.fillStyle = "#f1f5f9"
      }

      ctx.fill()
      ctx.strokeStyle = "#334155"
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw node label
      ctx.fillStyle = node.visited || selectedNodes.includes(node.id) ? "white" : "#334155"
      ctx.font = "bold 16px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(node.label || node.id.toString(), node.x, node.y + 5)

      // Draw distance
      ctx.fillStyle = "#dc2626"
      ctx.font = "12px sans-serif"
      const distText = node.distance === Number.POSITIVE_INFINITY ? "∞" : node.distance.toString()
      ctx.fillText(distText, node.x, node.y - 35)
    })
  }

  useEffect(() => {
    drawGraph()
  }, [nodes, edges, startNode, selectedNodes])

  const runDijkstra = () => {
    const newNodes = [...nodes]
    const newSteps: string[] = []

    // Initialize
    newNodes[startNode].distance = 0
    newSteps.push(`Starting from node ${newNodes[startNode].label || startNode}, set distance to 0`)

    const unvisited = new Set(newNodes.map((n) => n.id))

    while (unvisited.size > 0) {
      // Find unvisited node with minimum distance
      let current = -1
      let minDistance = Number.POSITIVE_INFINITY

      for (const nodeId of unvisited) {
        if (newNodes[nodeId].distance < minDistance) {
          minDistance = newNodes[nodeId].distance
          current = nodeId
        }
      }

      if (current === -1 || minDistance === Number.POSITIVE_INFINITY) break

      const currentLabel = newNodes[current].label || current
      newSteps.push(`Visiting node ${currentLabel} with distance ${minDistance}`)

      // Mark as visited
      newNodes[current].visited = true
      unvisited.delete(current)

      // Update neighbors
      edges.forEach((edge) => {
        if (edge.from === current && unvisited.has(edge.to)) {
          const newDistance = newNodes[current].distance + edge.weight
          if (newDistance < newNodes[edge.to].distance) {
            newNodes[edge.to].distance = newDistance
            newNodes[edge.to].previous = current
            const toLabel = newNodes[edge.to].label || edge.to
            newSteps.push(`Updated node ${toLabel} distance to ${newDistance}`)
          }
        }
      })
    }

    setNodes(newNodes)
    setSteps(newSteps)
  }

  const reset = () => {
    setIsRunning(false)
    setSteps([])
    setSelectedNodes([])
    setIsAddingNode(false)
    setIsAddingEdge(false)
    const resetNodes = nodes.map((node) => ({
      ...node,
      distance: Number.POSITIVE_INFINITY,
      visited: false,
      previous: null,
    }))
    setNodes(resetNodes)
  }

  const exportGraph = () => {
    const graphData = {
      nodes: nodes.map((n) => ({ id: n.id, label: n.label, x: n.x, y: n.y })),
      edges: edges,
    }
    const dataStr = JSON.stringify(graphData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "dijkstra-graph.json"
    link.click()
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      <div className="xl:col-span-3">
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 shadow-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Interactive Graph Visualization</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={isAddingNode ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setIsAddingNode(!isAddingNode)
                    setIsAddingEdge(false)
                    setSelectedNodes([])
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Node
                </Button>
                <Button
                  variant={isAddingEdge ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setIsAddingEdge(!isAddingEdge)
                    setIsAddingNode(false)
                    setSelectedNodes([])
                  }}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Edge
                </Button>
              </div>
            </div>
            {isAddingNode && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>Click anywhere on the canvas to add a new node</AlertDescription>
              </Alert>
            )}
            {isAddingEdge && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Click two nodes to connect them. Weight:
                  <Input
                    type="number"
                    value={edgeWeight}
                    onChange={(e) => setEdgeWeight(e.target.value)}
                    placeholder="1"
                    className="inline-block w-16 mx-2"
                  />
                </AlertDescription>
              </Alert>
            )}
          </CardHeader>
          <CardContent>
            <canvas
              ref={canvasRef}
              width={700}
              height={400}
              className="border rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-800 w-full cursor-pointer shadow-inner"
              onClick={handleCanvasClick}
            />
            <div className="flex gap-3 mt-6 flex-wrap">
              <Button
                onClick={runDijkstra}
                disabled={isRunning}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Run Algorithm
              </Button>
              <Button onClick={reset} variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button onClick={loadDefaultGraph} variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Load Default
              </Button>
              <Button onClick={exportGraph} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 shadow-2xl">
          <CardHeader>
            <CardTitle>Graph Input</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={inputMode} onValueChange={(value) => setInputMode(value as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="visual">Visual</TabsTrigger>
                <TabsTrigger value="matrix">Matrix</TabsTrigger>
                <TabsTrigger value="list">Edge List</TabsTrigger>
              </TabsList>

              <TabsContent value="visual" className="space-y-4">
                <div>
                  <Label htmlFor="start-node">Start Node</Label>
                  <Input
                    id="start-node"
                    type="number"
                    min="0"
                    max={nodes.length - 1}
                    value={startNode}
                    onChange={(e) => setStartNode(Number.parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  Use the "Add Node" and "Add Edge" buttons to build your graph visually.
                </div>
              </TabsContent>

              <TabsContent value="matrix" className="space-y-4">
                <div>
                  <Label htmlFor="matrix-input">Adjacency Matrix</Label>
                  <Textarea
                    id="matrix-input"
                    placeholder="0 4 0 0 0 0&#10;0 0 1 5 0 0&#10;2 0 0 0 3 0&#10;0 0 0 0 1 2&#10;0 0 0 0 0 4&#10;0 0 0 0 0 0"
                    value={matrixInput}
                    onChange={(e) => setMatrixInput(e.target.value)}
                    rows={6}
                  />
                </div>
                <Button onClick={parseMatrixInput} className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  Load Matrix
                </Button>
              </TabsContent>

              <TabsContent value="list" className="space-y-4">
                <div>
                  <Label htmlFor="list-input">Edge List (from to weight)</Label>
                  <Textarea
                    id="list-input"
                    placeholder="0 1 4&#10;0 2 2&#10;1 3 5&#10;2 4 3&#10;1 2 1&#10;3 5 2&#10;4 5 4&#10;3 4 1"
                    value={listInput}
                    onChange={(e) => setListInput(e.target.value)}
                    rows={6}
                  />
                </div>
                <Button onClick={parseListInput} className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  Load Edge List
                </Button>
              </TabsContent>
            </Tabs>

            {error && (
              <Alert className="mt-4">
                <AlertDescription className="text-red-600">{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 shadow-2xl">
          <CardHeader>
            <CardTitle>Distance Table</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {nodes.map((node) => (
                <div
                  key={node.id}
                  className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 rounded-lg"
                >
                  <span className="font-medium">Node {node.label || node.id}</span>
                  <Badge variant={node.visited ? "default" : "secondary"} className="font-mono">
                    {node.distance === Number.POSITIVE_INFINITY ? "∞" : node.distance}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 shadow-2xl">
          <CardHeader>
            <CardTitle>Algorithm Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600 rounded-lg text-sm"
                >
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
