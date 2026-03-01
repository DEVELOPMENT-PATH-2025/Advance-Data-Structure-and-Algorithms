"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Play, RotateCcw, Shuffle } from "lucide-react"

interface Node {
  id: number
  x: number
  y: number
  visited: boolean
  current: boolean
  distance: number
}

interface Edge {
  from: number
  to: number
}

export default function GraphTraversalVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [traversalType, setTraversalType] = useState<"dfs" | "bfs">("dfs")
  const [startNode, setStartNode] = useState(0)
  const [traversalResult, setTraversalResult] = useState<number[]>([])
  const [isAnimating, setIsAnimating] = useState(false)
  const [steps, setSteps] = useState<string[]>([])
  const [queue, setQueue] = useState<number[]>([])
  const [stack, setStack] = useState<number[]>([])

  useEffect(() => {
    // Initialize default graph
    const defaultNodes: Node[] = [
      { id: 0, x: 150, y: 100, visited: false, current: false, distance: 0 },
      { id: 1, x: 300, y: 80, visited: false, current: false, distance: 0 },
      { id: 2, x: 450, y: 100, visited: false, current: false, distance: 0 },
      { id: 3, x: 150, y: 200, visited: false, current: false, distance: 0 },
      { id: 4, x: 300, y: 220, visited: false, current: false, distance: 0 },
      { id: 5, x: 450, y: 200, visited: false, current: false, distance: 0 },
    ]

    const defaultEdges: Edge[] = [
      { from: 0, to: 1 },
      { from: 0, to: 3 },
      { from: 1, to: 2 },
      { from: 1, to: 4 },
      { from: 2, to: 5 },
      { from: 3, to: 4 },
      { from: 4, to: 5 },
    ]

    setNodes(defaultNodes)
    setEdges(defaultEdges)
  }, [])

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
    })

    // Draw nodes
    nodes.forEach((node) => {
      ctx.beginPath()
      ctx.arc(node.x, node.y, 25, 0, 2 * Math.PI)

      if (node.current) {
        ctx.fillStyle = "#ef4444"
      } else if (node.visited) {
        ctx.fillStyle = "#10b981"
      } else {
        ctx.fillStyle = "#f1f5f9"
      }

      ctx.fill()
      ctx.strokeStyle = "#334155"
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw node ID
      ctx.fillStyle = node.current || node.visited ? "white" : "#334155"
      ctx.font = "bold 16px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(node.id.toString(), node.x, node.y + 5)

      // Draw distance for BFS
      if (traversalType === "bfs" && node.visited) {
        ctx.fillStyle = "#dc2626"
        ctx.font = "12px sans-serif"
        ctx.fillText(node.distance.toString(), node.x, node.y - 35)
      }
    })
  }

  useEffect(() => {
    drawGraph()
  }, [nodes, edges, traversalType])

  const getNeighbors = (nodeId: number): number[] => {
    const neighbors: number[] = []
    edges.forEach((edge) => {
      if (edge.from === nodeId) neighbors.push(edge.to)
      if (edge.to === nodeId) neighbors.push(edge.from)
    })
    return neighbors.sort()
  }

  const resetGraph = () => {
    const resetNodes = nodes.map((node) => ({
      ...node,
      visited: false,
      current: false,
      distance: 0,
    }))
    setNodes(resetNodes)
    setTraversalResult([])
    setQueue([])
    setStack([])
    setSteps([])
  }

  const dfsTraversal = async () => {
    const newNodes = [...nodes]
    const result: number[] = []
    const newSteps: string[] = []
    const visitedSet = new Set<number>()
    const stackArray: number[] = [startNode]

    newSteps.push(`Starting DFS from node ${startNode}`)
    newSteps.push(`Push ${startNode} to stack`)

    while (stackArray.length > 0) {
      setStack([...stackArray])

      const current = stackArray.pop()!
      newSteps.push(`Pop ${current} from stack`)

      if (visitedSet.has(current)) {
        newSteps.push(`Node ${current} already visited, continue`)
        continue
      }

      // Mark as current
      newNodes.forEach((n) => (n.current = false))
      newNodes[current].current = true
      setNodes([...newNodes])
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Visit node
      visitedSet.add(current)
      newNodes[current].visited = true
      newNodes[current].current = false
      result.push(current)
      setTraversalResult([...result])
      newSteps.push(`Visited node ${current}`)

      // Add neighbors to stack (in reverse order for correct traversal)
      const neighbors = getNeighbors(current).filter((n) => !visitedSet.has(n))
      neighbors.reverse().forEach((neighbor) => {
        if (!stackArray.includes(neighbor)) {
          stackArray.push(neighbor)
          newSteps.push(`Push ${neighbor} to stack`)
        }
      })

      setNodes([...newNodes])
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    setStack([])
    setSteps(newSteps)
  }

  const bfsTraversal = async () => {
    const newNodes = [...nodes]
    const result: number[] = []
    const newSteps: string[] = []
    const visitedSet = new Set<number>()
    const queueArray: number[] = [startNode]

    newNodes[startNode].distance = 0
    newSteps.push(`Starting BFS from node ${startNode}`)
    newSteps.push(`Enqueue ${startNode}`)

    while (queueArray.length > 0) {
      setQueue([...queueArray])

      const current = queueArray.shift()!
      newSteps.push(`Dequeue ${current}`)

      if (visitedSet.has(current)) {
        newSteps.push(`Node ${current} already visited, continue`)
        continue
      }

      // Mark as current
      newNodes.forEach((n) => (n.current = false))
      newNodes[current].current = true
      setNodes([...newNodes])
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Visit node
      visitedSet.add(current)
      newNodes[current].visited = true
      newNodes[current].current = false
      result.push(current)
      setTraversalResult([...result])
      newSteps.push(`Visited node ${current} at distance ${newNodes[current].distance}`)

      // Add neighbors to queue
      const neighbors = getNeighbors(current).filter((n) => !visitedSet.has(n))
      neighbors.forEach((neighbor) => {
        if (!queueArray.includes(neighbor)) {
          newNodes[neighbor].distance = newNodes[current].distance + 1
          queueArray.push(neighbor)
          newSteps.push(`Enqueue ${neighbor} with distance ${newNodes[neighbor].distance}`)
        }
      })

      setNodes([...newNodes])
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    setQueue([])
    setSteps(newSteps)
  }

  const runTraversal = async () => {
    setIsAnimating(true)
    resetGraph()

    await new Promise((resolve) => setTimeout(resolve, 500))

    if (traversalType === "dfs") {
      await dfsTraversal()
    } else {
      await bfsTraversal()
    }

    setIsAnimating(false)
  }

  const randomizeGraph = () => {
    const nodeCount = 6
    const newNodes: Node[] = []

    // Generate random positions
    for (let i = 0; i < nodeCount; i++) {
      newNodes.push({
        id: i,
        x: 100 + Math.random() * 400,
        y: 80 + Math.random() * 140,
        visited: false,
        current: false,
        distance: 0,
      })
    }

    // Generate random edges (ensure connectivity)
    const newEdges: Edge[] = []
    const edgeSet = new Set<string>()

    // Create a spanning tree to ensure connectivity
    for (let i = 1; i < nodeCount; i++) {
      const from = Math.floor(Math.random() * i)
      const edge = `${Math.min(from, i)}-${Math.max(from, i)}`
      if (!edgeSet.has(edge)) {
        newEdges.push({ from, to: i })
        edgeSet.add(edge)
      }
    }

    // Add some random edges
    for (let i = 0; i < 3; i++) {
      const from = Math.floor(Math.random() * nodeCount)
      const to = Math.floor(Math.random() * nodeCount)
      if (from !== to) {
        const edge = `${Math.min(from, to)}-${Math.max(from, to)}`
        if (!edgeSet.has(edge)) {
          newEdges.push({ from, to })
          edgeSet.add(edge)
        }
      }
    }

    setNodes(newNodes)
    setEdges(newEdges)
    resetGraph()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Graph Traversal</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={traversalType === "dfs" ? "default" : "outline"}
                size="sm"
                onClick={() => setTraversalType("dfs")}
                disabled={isAnimating}
              >
                DFS
              </Button>
              <Button
                variant={traversalType === "bfs" ? "default" : "outline"}
                size="sm"
                onClick={() => setTraversalType("bfs")}
                disabled={isAnimating}
              >
                BFS
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <canvas ref={canvasRef} width={600} height={300} className="border rounded-lg bg-white w-full" />
            <div className="flex gap-2 mt-4">
              <Button onClick={runTraversal} disabled={isAnimating}>
                <Play className="w-4 h-4 mr-2" />
                {isAnimating ? "Running..." : `Run ${traversalType.toUpperCase()}`}
              </Button>
              <Button onClick={randomizeGraph} variant="outline" disabled={isAnimating}>
                <Shuffle className="w-4 h-4 mr-2" />
                Random Graph
              </Button>
              <Button onClick={resetGraph} variant="outline" disabled={isAnimating}>
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
          <CardContent>
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
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Traversal Result</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {traversalResult.map((value, index) => (
                <Badge key={index} variant="default" className="text-lg px-3 py-1">
                  {value}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>{traversalType === "dfs" ? "Stack" : "Queue"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(traversalType === "dfs" ? stack : queue).map((value, index) => (
                <Badge key={index} variant="outline" className="px-3 py-1">
                  {value}
                </Badge>
              ))}
            </div>
            {(traversalType === "dfs" ? stack : queue).length === 0 && (
              <p className="text-muted-foreground text-sm">Empty</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Algorithm Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded">
              <h4 className="font-semibold text-sm">DFS (Depth-First Search)</h4>
              <p className="text-xs text-muted-foreground">Uses stack (LIFO)</p>
              <p className="text-xs">Goes deep before exploring siblings</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded">
              <h4 className="font-semibold text-sm">BFS (Breadth-First Search)</h4>
              <p className="text-xs text-muted-foreground">Uses queue (FIFO)</p>
              <p className="text-xs">Explores level by level</p>
            </div>
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
