"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
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
  id: string
  stage: number
  x: number
  y: number
  cost: number
  selected: boolean
  label?: string
}

interface Edge {
  from: string
  to: string
  weight: number
}

export default function MultistageGraphVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [steps, setSteps] = useState<string[]>([])
  const [currentStage, setCurrentStage] = useState(-1)
  const [isRunning, setIsRunning] = useState(false)
  const [inputMode, setInputMode] = useState<"visual" | "stages" | "matrix">("visual")
  const [stageCount, setStageCount] = useState(4)
  const [nodesPerStage, setNodesPerStage] = useState("1,2,2,1")
  const [matrixInput, setMatrixInput] = useState("")
  const [error, setError] = useState("")
  const [isAddingNode, setIsAddingNode] = useState(false)
  const [isAddingEdge, setIsAddingEdge] = useState(false)
  const [selectedNodes, setSelectedNodes] = useState<string[]>([])
  const [edgeWeight, setEdgeWeight] = useState("")
  const [newNodeStage, setNewNodeStage] = useState(0)

  useEffect(() => {
    loadDefaultGraph()
  }, [])

  const loadDefaultGraph = () => {
    const defaultNodes: Node[] = [
      { id: "S", stage: 0, x: 100, y: 150, cost: 0, selected: false, label: "Start" },
      { id: "A", stage: 1, x: 200, y: 100, cost: Number.POSITIVE_INFINITY, selected: false },
      { id: "B", stage: 1, x: 200, y: 200, cost: Number.POSITIVE_INFINITY, selected: false },
      { id: "C", stage: 2, x: 300, y: 80, cost: Number.POSITIVE_INFINITY, selected: false },
      { id: "D", stage: 2, x: 300, y: 150, cost: Number.POSITIVE_INFINITY, selected: false },
      { id: "E", stage: 2, x: 300, y: 220, cost: Number.POSITIVE_INFINITY, selected: false },
      { id: "T", stage: 3, x: 400, y: 150, cost: Number.POSITIVE_INFINITY, selected: false, label: "Target" },
    ]

    const defaultEdges: Edge[] = [
      { from: "S", to: "A", weight: 1 },
      { from: "S", to: "B", weight: 3 },
      { from: "A", to: "C", weight: 4 },
      { from: "A", to: "D", weight: 2 },
      { from: "B", to: "D", weight: 1 },
      { from: "B", to: "E", weight: 5 },
      { from: "C", to: "T", weight: 2 },
      { from: "D", to: "T", weight: 3 },
      { from: "E", to: "T", weight: 1 },
    ]

    setNodes(defaultNodes)
    setEdges(defaultEdges)
    setStageCount(4)
  }

  const generateGraphFromStages = () => {
    try {
      setError("")
      const stageNodeCounts = nodesPerStage.split(",").map((n) => Number.parseInt(n.trim()))

      if (stageNodeCounts.length !== stageCount) {
        throw new Error("Number of stage counts must match stage count")
      }

      const newNodes: Node[] = []
      let nodeId = 0

      // Generate nodes for each stage
      stageNodeCounts.forEach((nodeCount, stage) => {
        const stageX = 100 + (stage * 500) / (stageCount - 1)
        const startY = 150 - ((nodeCount - 1) * 40) / 2

        for (let i = 0; i < nodeCount; i++) {
          const y = startY + i * 80
          const id = stage === 0 ? "S" : stage === stageCount - 1 ? "T" : String.fromCharCode(65 + nodeId - 1)

          newNodes.push({
            id,
            stage,
            x: stageX,
            y,
            cost: stage === 0 ? 0 : Number.POSITIVE_INFINITY,
            selected: false,
            label: stage === 0 ? "Start" : stage === stageCount - 1 ? "Target" : undefined,
          })

          if (stage > 0 || nodeCount > 1) nodeId++
        }
      })

      // Generate random edges between consecutive stages
      const newEdges: Edge[] = []
      for (let stage = 0; stage < stageCount - 1; stage++) {
        const currentStageNodes = newNodes.filter((n) => n.stage === stage)
        const nextStageNodes = newNodes.filter((n) => n.stage === stage + 1)

        currentStageNodes.forEach((fromNode) => {
          nextStageNodes.forEach((toNode) => {
            // Add edge with random probability and weight
            if (Math.random() > 0.3) {
              newEdges.push({
                from: fromNode.id,
                to: toNode.id,
                weight: Math.floor(Math.random() * 9) + 1,
              })
            }
          })
        })
      }

      setNodes(newNodes)
      setEdges(newEdges)
    } catch (err: any) {
      setError(`Stage generation error: ${err.message}`)
    }
  }

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    if (isAddingNode) {
      const nodeId = String.fromCharCode(65 + nodes.length)
      const newNode: Node = {
        id: nodeId,
        stage: newNodeStage,
        x,
        y,
        cost: newNodeStage === 0 ? 0 : Number.POSITIVE_INFINITY,
        selected: false,
      }
      setNodes([...nodes, newNode])
      setIsAddingNode(false)
    } else if (isAddingEdge) {
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

    // Draw stage lines
    const maxStage = Math.max(...nodes.map((n) => n.stage))
    for (let stage = 0; stage <= maxStage; stage++) {
      const stageNodes = nodes.filter((n) => n.stage === stage)
      if (stageNodes.length === 0) continue

      const x = stageNodes[0].x
      ctx.beginPath()
      ctx.moveTo(x, 50)
      ctx.lineTo(x, 350)
      ctx.strokeStyle = currentStage === stage ? "#3b82f6" : "#e2e8f0"
      ctx.lineWidth = currentStage === stage ? 3 : 1
      ctx.setLineDash(currentStage === stage ? [] : [5, 5])
      ctx.stroke()
      ctx.setLineDash([])

      // Stage label
      ctx.fillStyle = currentStage === stage ? "#3b82f6" : "#64748b"
      ctx.font = "bold 14px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(`Stage ${stage}`, x, 40)
    }

    // Draw edges
    edges.forEach((edge) => {
      const fromNode = nodes.find((n) => n.id === edge.from)
      const toNode = nodes.find((n) => n.id === edge.to)
      if (!fromNode || !toNode) return

      ctx.beginPath()
      ctx.moveTo(fromNode.x, fromNode.y)
      ctx.lineTo(toNode.x, toNode.y)
      ctx.strokeStyle = fromNode.selected && toNode.selected ? "#10b981" : "#e2e8f0"
      ctx.lineWidth = fromNode.selected && toNode.selected ? 4 : 2
      ctx.stroke()

      // Draw weight
      const midX = (fromNode.x + toNode.x) / 2
      const midY = (fromNode.y + toNode.y) / 2
      ctx.fillStyle = "#dc2626"
      ctx.font = "bold 12px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(edge.weight.toString(), midX, midY - 5)
    })

    // Draw nodes
    nodes.forEach((node) => {
      ctx.beginPath()
      ctx.arc(node.x, node.y, 25, 0, 2 * Math.PI)

      if (selectedNodes.includes(node.id)) {
        ctx.fillStyle = "#f59e0b"
      } else if (node.selected) {
        ctx.fillStyle = "#10b981"
      } else if (node.stage === currentStage) {
        ctx.fillStyle = "#3b82f6"
      } else {
        ctx.fillStyle = "#f1f5f9"
      }

      ctx.fill()
      ctx.strokeStyle = "#334155"
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw node ID
      ctx.fillStyle = node.selected || selectedNodes.includes(node.id) ? "white" : "#334155"
      ctx.font = "bold 14px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(node.id, node.x, node.y + 4)

      // Draw cost
      if (node.cost !== Number.POSITIVE_INFINITY) {
        ctx.fillStyle = "#dc2626"
        ctx.font = "bold 10px sans-serif"
        ctx.fillText(node.cost.toString(), node.x, node.y - 30)
      }

      // Draw label
      if (node.label) {
        ctx.fillStyle = "#64748b"
        ctx.font = "10px sans-serif"
        ctx.fillText(node.label, node.x, node.y + 40)
      }
    })
  }

  useEffect(() => {
    drawGraph()
  }, [nodes, edges, currentStage, selectedNodes])

  const runMultistageGraph = async () => {
    setIsRunning(true)
    const newNodes = [...nodes]
    const newSteps: string[] = []

    // Get all stages
    const stages = [...new Set(nodes.map((n) => n.stage))].sort((a, b) => b - a)

    // Initialize the target nodes (last stage)
    const lastStage = Math.max(...stages)
    const targetNodes = newNodes.filter((n) => n.stage === lastStage)
    targetNodes.forEach((node) => {
      node.cost = 0
      newSteps.push(`Initialize target node ${node.id} with cost 0`)
    })

    // Process stages from last to first
    for (const stage of stages.slice(1)) {
      setCurrentStage(stage)
      newSteps.push(`Processing stage ${stage}`)

      const stageNodes = newNodes.filter((n) => n.stage === stage)

      for (const node of stageNodes) {
        let minCost = Number.POSITIVE_INFINITY
        let bestNext = ""

        // Find all outgoing edges from this node
        const outgoingEdges = edges.filter((e) => e.from === node.id)

        for (const edge of outgoingEdges) {
          const nextNode = newNodes.find((n) => n.id === edge.to)
          if (nextNode && nextNode.cost !== Number.POSITIVE_INFINITY) {
            const totalCost = edge.weight + nextNode.cost
            if (totalCost < minCost) {
              minCost = totalCost
              bestNext = nextNode.id
            }
          }
        }

        if (minCost !== Number.POSITIVE_INFINITY) {
          node.cost = minCost
          newSteps.push(`Node ${node.id}: minimum cost = ${minCost} (via ${bestNext})`)
        }
      }

      setNodes([...newNodes])
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    // Trace the optimal path
    const startNodes = newNodes.filter((n) => n.stage === 0)
    if (startNodes.length > 0) {
      let current = startNodes[0]
      const path = []

      while (current) {
        current.selected = true
        path.push(current.id)

        if (current.stage === lastStage) break

        // Find the next node in optimal path
        const outgoingEdges = edges.filter((e) => e.from === current.id)
        let nextNode = null

        for (const edge of outgoingEdges) {
          const candidate = newNodes.find((n) => n.id === edge.to)
          if (candidate && candidate.cost + edge.weight === current.cost) {
            nextNode = candidate
            break
          }
        }

        if (nextNode) {
          current = nextNode
        } else {
          break // No valid path found
        }
      }

      newSteps.push(`Optimal path: ${path.join(" → ")} with total cost ${startNodes[0].cost}`)
    }

    setNodes([...newNodes])
    setSteps(newSteps)
    setCurrentStage(-1)
    setIsRunning(false)
  }

  const reset = () => {
    const resetNodes = nodes.map((node) => ({
      ...node,
      cost: node.stage === 0 ? 0 : Number.POSITIVE_INFINITY,
      selected: false,
    }))
    setNodes(resetNodes)
    setSteps([])
    setCurrentStage(-1)
    setIsRunning(false)
    setSelectedNodes([])
    setIsAddingNode(false)
    setIsAddingEdge(false)
    setError("")
  }

  const exportGraph = () => {
    const graphData = {
      nodes: nodes.map((n) => ({ ...n })),
      edges: edges,
      stageCount,
    }
    const dataStr = JSON.stringify(graphData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "multistage-graph.json"
    link.click()
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      <div className="xl:col-span-3">
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl dark:text-white">Interactive Multistage Graph</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={isAddingNode ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setIsAddingNode(!isAddingNode)
                    setIsAddingEdge(false)
                    setSelectedNodes([])
                  }}
                  className="dark:border-gray-600 dark:text-gray-300"
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
                  className="dark:border-gray-600 dark:text-gray-300"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Edge
                </Button>
              </div>
            </div>
            {currentStage >= 0 && (
              <Badge variant="outline" className="w-fit dark:border-gray-600 dark:text-gray-300">
                Processing Stage: {currentStage}
              </Badge>
            )}
            {isAddingNode && (
              <Alert className="dark:bg-gray-700/50 dark:border-gray-600">
                <Info className="h-4 w-4" />
                <AlertDescription className="dark:text-gray-300">
                  Click anywhere on the canvas to add a new node. Stage:
                  <Input
                    type="number"
                    value={newNodeStage}
                    onChange={(e) => setNewNodeStage(Number.parseInt(e.target.value) || 0)}
                    min="0"
                    max={stageCount - 1}
                    className="inline-block w-16 mx-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </AlertDescription>
              </Alert>
            )}
            {isAddingEdge && (
              <Alert className="dark:bg-gray-700/50 dark:border-gray-600">
                <Info className="h-4 w-4" />
                <AlertDescription className="dark:text-gray-300">
                  Click two nodes to connect them. Weight:
                  <Input
                    type="number"
                    value={edgeWeight}
                    onChange={(e) => setEdgeWeight(e.target.value)}
                    placeholder="1"
                    className="inline-block w-16 mx-2 dark:bg-gray-700 dark:border-gray-600"
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
              className="border rounded-xl bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-700 dark:to-gray-800 w-full cursor-pointer shadow-inner dark:border-gray-600"
              onClick={handleCanvasClick}
            />
            <div className="flex gap-3 mt-6 flex-wrap">
              <Button
                onClick={runMultistageGraph}
                disabled={isRunning}
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
              >
                <Play className="w-4 h-4 mr-2" />
                {isRunning ? "Running..." : "Find Optimal Path"}
              </Button>
              <Button
                onClick={reset}
                variant="outline"
                disabled={isRunning}
                className="dark:border-gray-600 dark:text-gray-300 bg-transparent"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={loadDefaultGraph}
                variant="outline"
                className="dark:border-gray-600 dark:text-gray-300 bg-transparent"
              >
                <Settings className="w-4 h-4 mr-2" />
                Load Default
              </Button>
              <Button
                onClick={exportGraph}
                variant="outline"
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
            <CardTitle className="dark:text-white">Graph Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={inputMode} onValueChange={(value) => setInputMode(value as any)}>
              <TabsList className="grid w-full grid-cols-3 dark:bg-gray-700">
                <TabsTrigger value="visual" className="dark:text-gray-300">
                  Visual
                </TabsTrigger>
                <TabsTrigger value="stages" className="dark:text-gray-300">
                  Stages
                </TabsTrigger>
                <TabsTrigger value="matrix" className="dark:text-gray-300">
                  Matrix
                </TabsTrigger>
              </TabsList>

              <TabsContent value="visual" className="space-y-4">
                <div className="text-sm text-muted-foreground dark:text-gray-400">
                  Use the "Add Node" and "Add Edge" buttons to build your multistage graph visually.
                </div>
              </TabsContent>

              <TabsContent value="stages" className="space-y-4">
                <div>
                  <Label htmlFor="stage-count" className="dark:text-gray-300">
                    Number of Stages
                  </Label>
                  <Input
                    id="stage-count"
                    type="number"
                    min="2"
                    max="10"
                    value={stageCount}
                    onChange={(e) => setStageCount(Number.parseInt(e.target.value) || 4)}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="nodes-per-stage" className="dark:text-gray-300">
                    Nodes per Stage (comma-separated)
                  </Label>
                  <Input
                    id="nodes-per-stage"
                    placeholder="1,2,2,1"
                    value={nodesPerStage}
                    onChange={(e) => setNodesPerStage(e.target.value)}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <Button onClick={generateGraphFromStages} className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  Generate Graph
                </Button>
              </TabsContent>

              <TabsContent value="matrix" className="space-y-4">
                <div>
                  <Label htmlFor="matrix-input" className="dark:text-gray-300">
                    Stage Transition Matrix
                  </Label>
                  <Textarea
                    id="matrix-input"
                    placeholder="Enter stage-wise adjacency data..."
                    value={matrixInput}
                    onChange={(e) => setMatrixInput(e.target.value)}
                    rows={6}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <Button className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  Load Matrix
                </Button>
              </TabsContent>
            </Tabs>

            {error && (
              <Alert className="mt-4 dark:bg-red-900/20 dark:border-red-800">
                <AlertDescription className="text-red-600 dark:text-red-400">{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-2xl">
          <CardHeader>
            <CardTitle className="dark:text-white">Node Costs by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {Array.from(new Set(nodes.map((n) => n.stage)))
                .sort()
                .map((stage) => (
                  <div key={stage}>
                    <h4 className="font-semibold mb-2 dark:text-gray-300">Stage {stage}</h4>
                    <div className="space-y-1">
                      {nodes
                        .filter((n) => n.stage === stage)
                        .map((node) => (
                          <div
                            key={node.id}
                            className="flex justify-between items-center p-2 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-gray-700 dark:to-gray-600 rounded text-sm"
                          >
                            <span
                              className={`${node.selected ? "font-bold text-green-600 dark:text-green-400" : "dark:text-gray-300"}`}
                            >
                              {node.id}
                            </span>
                            <Badge variant={node.selected ? "default" : "secondary"} className="text-xs font-mono">
                              {node.cost === Number.POSITIVE_INFINITY ? "∞" : node.cost}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
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
                  className="p-3 bg-gradient-to-r from-orange-50 to-red-50 dark:from-gray-700 dark:to-gray-600 rounded-lg text-sm"
                >
                  <Badge variant="outline" className="mr-2 dark:border-gray-500 dark:text-gray-300">
                    {index + 1}
                  </Badge>
                  <span className="dark:text-gray-300">{step}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
