"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, RotateCcw, Shuffle } from "lucide-react"

interface TreeNode {
  value: number
  left?: TreeNode
  right?: TreeNode
  x?: number
  y?: number
  visited?: boolean
  current?: boolean
}

export default function TreeTraversalVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tree, setTree] = useState<TreeNode | null>(null)
  const [traversalType, setTraversalType] = useState<"inorder" | "preorder" | "postorder">("inorder")
  const [traversalResult, setTraversalResult] = useState<number[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [isAnimating, setIsAnimating] = useState(false)
  const [steps, setSteps] = useState<string[]>([])

  useEffect(() => {
    // Create a sample binary tree
    const sampleTree: TreeNode = {
      value: 50,
      left: {
        value: 30,
        left: { value: 20 },
        right: { value: 40 },
      },
      right: {
        value: 70,
        left: { value: 60 },
        right: { value: 80 },
      },
    }

    positionNodes(sampleTree, 300, 50, 0)
    setTree(sampleTree)
  }, [])

  const positionNodes = (node: TreeNode, x: number, y: number, level: number) => {
    node.x = x
    node.y = y
    node.visited = false
    node.current = false

    const spacing = 120 / (level + 1)
    if (node.left) {
      positionNodes(node.left, x - spacing, y + 80, level + 1)
    }
    if (node.right) {
      positionNodes(node.right, x + spacing, y + 80, level + 1)
    }
  }

  const drawTree = () => {
    const canvas = canvasRef.current
    if (!canvas || !tree) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const drawNode = (node: TreeNode) => {
      if (!node.x || !node.y) return

      // Draw connections
      if (node.left && node.left.x && node.left.y) {
        ctx.beginPath()
        ctx.moveTo(node.x, node.y)
        ctx.lineTo(node.left.x, node.left.y)
        ctx.strokeStyle = "#64748b"
        ctx.lineWidth = 2
        ctx.stroke()
        drawNode(node.left)
      }

      if (node.right && node.right.x && node.right.y) {
        ctx.beginPath()
        ctx.moveTo(node.x, node.y)
        ctx.lineTo(node.right.x, node.right.y)
        ctx.strokeStyle = "#64748b"
        ctx.lineWidth = 2
        ctx.stroke()
        drawNode(node.right)
      }

      // Draw node
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

      // Draw value
      ctx.fillStyle = node.current || node.visited ? "white" : "#334155"
      ctx.font = "bold 16px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(node.value.toString(), node.x, node.y + 5)
    }

    drawNode(tree)
  }

  useEffect(() => {
    drawTree()
  }, [tree])

  const resetTree = (node: TreeNode) => {
    node.visited = false
    node.current = false
    if (node.left) resetTree(node.left)
    if (node.right) resetTree(node.right)
  }

  const inorderTraversal = async (node: TreeNode | undefined, result: number[], steps: string[]): Promise<void> => {
    if (!node) return

    // Visit left subtree
    if (node.left) {
      steps.push(`Moving to left child of ${node.value}`)
      await inorderTraversal(node.left, result, steps)
    }

    // Visit current node
    node.current = true
    setTree({ ...tree! })
    steps.push(`Visiting node ${node.value}`)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    result.push(node.value)
    node.visited = true
    node.current = false
    setTree({ ...tree! })
    setTraversalResult([...result])
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Visit right subtree
    if (node.right) {
      steps.push(`Moving to right child of ${node.value}`)
      await inorderTraversal(node.right, result, steps)
    }
  }

  const preorderTraversal = async (node: TreeNode | undefined, result: number[], steps: string[]): Promise<void> => {
    if (!node) return

    // Visit current node first
    node.current = true
    setTree({ ...tree! })
    steps.push(`Visiting node ${node.value}`)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    result.push(node.value)
    node.visited = true
    node.current = false
    setTree({ ...tree! })
    setTraversalResult([...result])
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Visit left subtree
    if (node.left) {
      steps.push(`Moving to left child of ${node.value}`)
      await preorderTraversal(node.left, result, steps)
    }

    // Visit right subtree
    if (node.right) {
      steps.push(`Moving to right child of ${node.value}`)
      await preorderTraversal(node.right, result, steps)
    }
  }

  const postorderTraversal = async (node: TreeNode | undefined, result: number[], steps: string[]): Promise<void> => {
    if (!node) return

    // Visit left subtree
    if (node.left) {
      steps.push(`Moving to left child of ${node.value}`)
      await postorderTraversal(node.left, result, steps)
    }

    // Visit right subtree
    if (node.right) {
      steps.push(`Moving to right child of ${node.value}`)
      await postorderTraversal(node.right, result, steps)
    }

    // Visit current node last
    node.current = true
    setTree({ ...tree! })
    steps.push(`Visiting node ${node.value}`)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    result.push(node.value)
    node.visited = true
    node.current = false
    setTree({ ...tree! })
    setTraversalResult([...result])
    await new Promise((resolve) => setTimeout(resolve, 500))
  }

  const runTraversal = async () => {
    if (!tree) return

    setIsAnimating(true)
    resetTree(tree)
    setTraversalResult([])
    setCurrentIndex(-1)

    const result: number[] = []
    const newSteps: string[] = []

    switch (traversalType) {
      case "inorder":
        newSteps.push("Starting Inorder Traversal (Left → Root → Right)")
        await inorderTraversal(tree, result, newSteps)
        break
      case "preorder":
        newSteps.push("Starting Preorder Traversal (Root → Left → Right)")
        await preorderTraversal(tree, result, newSteps)
        break
      case "postorder":
        newSteps.push("Starting Postorder Traversal (Left → Right → Root)")
        await postorderTraversal(tree, result, newSteps)
        break
    }

    newSteps.push(`Traversal complete: [${result.join(", ")}]`)
    setSteps(newSteps)
    setIsAnimating(false)
  }

  const reset = () => {
    if (tree) {
      resetTree(tree)
      setTree({ ...tree })
    }
    setTraversalResult([])
    setCurrentIndex(-1)
    setSteps([])
  }

  const randomizeTree = () => {
    const values = Array.from({ length: 7 }, () => Math.floor(Math.random() * 100) + 1)
    values.sort((a, b) => a - b)

    const buildBalancedTree = (arr: number[], start: number, end: number): TreeNode | undefined => {
      if (start > end) return undefined

      const mid = Math.floor((start + end) / 2)
      const node: TreeNode = {
        value: arr[mid],
        left: buildBalancedTree(arr, start, mid - 1),
        right: buildBalancedTree(arr, mid + 1, end),
      }

      return node
    }

    const newTree = buildBalancedTree(values, 0, values.length - 1)
    if (newTree) {
      positionNodes(newTree, 300, 50, 0)
      setTree(newTree)
    }

    setTraversalResult([])
    setSteps([])
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Binary Tree Traversal</CardTitle>
            <div className="flex gap-2">
              {(["inorder", "preorder", "postorder"] as const).map((type) => (
                <Button
                  key={type}
                  variant={traversalType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTraversalType(type)}
                  disabled={isAnimating}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <canvas ref={canvasRef} width={600} height={300} className="border rounded-lg bg-white w-full" />
            <div className="flex gap-2 mt-4">
              <Button onClick={runTraversal} disabled={isAnimating}>
                <Play className="w-4 h-4 mr-2" />
                {isAnimating ? "Running..." : "Start Traversal"}
              </Button>
              <Button onClick={randomizeTree} variant="outline" disabled={isAnimating}>
                <Shuffle className="w-4 h-4 mr-2" />
                Random Tree
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
            {traversalResult.length === 0 && (
              <p className="text-muted-foreground text-sm">Run traversal to see results</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Traversal Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded">
              <h4 className="font-semibold text-sm">Inorder (LNR)</h4>
              <p className="text-xs text-muted-foreground">Left → Node → Right</p>
              <p className="text-xs">Gives sorted order for BST</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded">
              <h4 className="font-semibold text-sm">Preorder (NLR)</h4>
              <p className="text-xs text-muted-foreground">Node → Left → Right</p>
              <p className="text-xs">Used for tree copying</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded">
              <h4 className="font-semibold text-sm">Postorder (LRN)</h4>
              <p className="text-xs text-muted-foreground">Left → Right → Node</p>
              <p className="text-xs">Used for tree deletion</p>
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
