"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Network,
  Binary,
  TreePine,
  Layers,
  Route,
  Shuffle,
  Package,
  GitBranch,
  Zap,
  Sparkles,
  Merge,
  Calculator,
} from "lucide-react"

import DijkstraVisualizer from "@/components/dijkstra-visualizer"
import FloydWarshallVisualizer from "@/components/floyd-warshall-visualizer"
import HuffmanVisualizer from "@/components/huffman-visualizer"
import MultistageGraphVisualizer from "@/components/multistage-graph-visualizer"
import HeapVisualizer from "@/components/heap-visualizer"
import TreeTraversalVisualizer from "@/components/tree-traversal-visualizer"
import GraphTraversalVisualizer from "@/components/graph-traversal-visualizer"
import KnapsackVisualizer from "@/components/knapsack-visualizer"
import OptimalMergeVisualizer from "@/components/optimal-merge-visualizer"
import StrassenVisualizer from "@/components/strassen-visualizer"

export default function DataStructureVisualizer() {
  const [activeTab, setActiveTab] = useState("dijkstra")

  const algorithms = [
    {
      id: "dijkstra",
      name: "Dijkstra's Algorithm",
      description: "Find shortest paths in weighted graphs with interactive graph builder",
      icon: Route,
      category: "Graph",
      complexity: "O((V + E) log V)",
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "floyd-warshall",
      name: "Floyd-Warshall",
      description: "All-pairs shortest paths with adjacency matrix input",
      icon: Network,
      category: "Graph",
      complexity: "O(V³)",
      color: "from-purple-500 to-pink-500",
    },
    {
      id: "huffman",
      name: "Huffman Coding",
      description: "Text compression with custom text and frequency input",
      icon: Binary,
      category: "Tree",
      complexity: "O(n log n)",
      color: "from-green-500 to-emerald-500",
    },
    {
      id: "multistage",
      name: "Multistage Graph",
      description: "Dynamic programming with custom stage configuration and graph builder",
      icon: Layers,
      category: "Graph",
      complexity: "O(V + E)",
      color: "from-orange-500 to-red-500",
    },
    {
      id: "heap",
      name: "Heap & Heapsort",
      description: "Interactive heap with custom array input and operations",
      icon: TreePine,
      category: "Tree",
      complexity: "O(n log n)",
      color: "from-indigo-500 to-purple-500",
    },
    {
      id: "tree-traversal",
      name: "Tree Traversal",
      description: "Build custom trees and visualize traversals",
      icon: GitBranch,
      category: "Tree",
      complexity: "O(n)",
      color: "from-teal-500 to-green-500",
    },
    {
      id: "graph-traversal",
      name: "DFS & BFS",
      description: "Create custom graphs and explore traversal patterns",
      icon: Shuffle,
      category: "Graph",
      complexity: "O(V + E)",
      color: "from-yellow-500 to-orange-500",
    },
    {
      id: "knapsack",
      name: "0/1 Knapsack",
      description: "Solve optimization with custom items and capacity",
      icon: Package,
      category: "DP",
      complexity: "O(nW)",
      color: "from-rose-500 to-pink-500",
    },
    {
      id: "optimal-merge",
      name: "Optimal Merge Pattern",
      description: "Find minimum cost to merge files with custom file sizes",
      icon: Merge,
      category: "Greedy",
      complexity: "O(n log n)",
      color: "from-violet-500 to-purple-500",
    },
    {
      id: "strassen",
      name: "Strassen Matrix Multiplication",
      description: "Efficient matrix multiplication with custom matrix input",
      icon: Calculator,
      category: "Divide & Conquer",
      complexity: "O(n^2.807)",
      color: "from-amber-500 to-orange-500",
    },
  ]

  const currentAlgo = algorithms.find((a) => a.id === activeTab)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-indigo-950">
      <div className="container mx-auto p-6">
        {/* Enhanced Header with Dark Mode Support */}
        <div className="mb-8 text-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 dark:from-blue-400/10 dark:to-purple-400/10 blur-3xl -z-10"></div>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 dark:from-blue-400 dark:to-purple-500 rounded-2xl shadow-lg dark:shadow-2xl">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
              Advanced Data Structure Visualizer
            </h1>
          </div>
          <p className="text-muted-foreground text-xl max-w-3xl mx-auto dark:text-gray-300">
            Interactive visualizations with comprehensive input support for algorithms and data structures
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
            <Badge
              variant="outline"
              className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-white/20 dark:border-gray-700/50"
            >
              🎯 Interactive Learning
            </Badge>
            <Badge
              variant="outline"
              className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-white/20 dark:border-gray-700/50"
            >
              ⚡ Real-time Visualization
            </Badge>
            <Badge
              variant="outline"
              className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-white/20 dark:border-gray-700/50"
            >
              🔧 Custom Input Support
            </Badge>
            <Badge
              variant="outline"
              className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-white/20 dark:border-gray-700/50"
            >
              🌙 Dark Mode Optimized
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Enhanced Tab Navigation with Dark Mode */}
          <div className="mb-8">
            <TabsList className="grid grid-cols-5 lg:grid-cols-10 gap-3 h-auto p-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-xl rounded-2xl">
              {algorithms.map((algo) => {
                const Icon = algo.icon
                const isActive = activeTab === algo.id
                return (
                  <TabsTrigger
                    key={algo.id}
                    value={algo.id}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-300 ${
                      isActive
                        ? `bg-gradient-to-br ${algo.color} text-white shadow-lg scale-105 dark:shadow-2xl`
                        : "hover:bg-white/50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-medium text-center leading-tight">
                      {algo.name.split(" ")[0]}
                      <br />
                      {algo.name.split(" ")[1] || algo.name.split(" ")[2]}
                    </span>
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </div>

          {/* Enhanced Algorithm Info Card with Dark Mode */}
          <div className="mb-6">
            <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-white/20 dark:border-gray-700/30 shadow-xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 bg-gradient-to-br ${currentAlgo?.color} rounded-xl shadow-lg dark:shadow-2xl`}>
                      {(() => {
                        const Icon = currentAlgo?.icon || Zap
                        return <Icon className="w-7 h-7 text-white" />
                      })()}
                    </div>
                    <div>
                      <CardTitle className="text-2xl flex items-center gap-2 dark:text-white">
                        {currentAlgo?.name}
                        <Badge variant="secondary" className="text-xs dark:bg-gray-700 dark:text-gray-300">
                          {currentAlgo?.category}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-base mt-1 dark:text-gray-300">
                        {currentAlgo?.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant="outline"
                      className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-sm px-3 py-1 border-white/20 dark:border-gray-700/50"
                    >
                      {currentAlgo?.complexity}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Algorithm Content */}
          <TabsContent value="dijkstra" className="mt-0">
            <DijkstraVisualizer />
          </TabsContent>

          <TabsContent value="floyd-warshall" className="mt-0">
            <FloydWarshallVisualizer />
          </TabsContent>

          <TabsContent value="huffman" className="mt-0">
            <HuffmanVisualizer />
          </TabsContent>

          <TabsContent value="multistage" className="mt-0">
            <MultistageGraphVisualizer />
          </TabsContent>

          <TabsContent value="heap" className="mt-0">
            <HeapVisualizer />
          </TabsContent>

          <TabsContent value="tree-traversal" className="mt-0">
            <TreeTraversalVisualizer />
          </TabsContent>

          <TabsContent value="graph-traversal" className="mt-0">
            <GraphTraversalVisualizer />
          </TabsContent>

          <TabsContent value="knapsack" className="mt-0">
            <KnapsackVisualizer />
          </TabsContent>

          <TabsContent value="optimal-merge" className="mt-0">
            <OptimalMergeVisualizer />
          </TabsContent>

          <TabsContent value="strassen" className="mt-0">
            <StrassenVisualizer />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
