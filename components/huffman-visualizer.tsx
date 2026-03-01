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

interface HuffmanNode {
  char: string
  freq: number
  left?: HuffmanNode
  right?: HuffmanNode
  x?: number
  y?: number
}

interface CharFreq {
  char: string
  freq: number
}

export default function HuffmanVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [inputText, setInputText] = useState("ABRACADABRA")
  const [customFrequencies, setCustomFrequencies] = useState<CharFreq[]>([])
  const [frequencies, setFrequencies] = useState<{ [key: string]: number }>({})
  const [huffmanTree, setHuffmanTree] = useState<HuffmanNode | null>(null)
  const [codes, setCodes] = useState<{ [key: string]: string }>({})
  const [steps, setSteps] = useState<string[]>([])
  const [inputMode, setInputMode] = useState<"text" | "frequency">("text")
  const [newChar, setNewChar] = useState("")
  const [newFreq, setNewFreq] = useState("")
  const [error, setError] = useState("")

  const calculateFrequencies = (text: string) => {
    const freq: { [key: string]: number } = {}
    for (const char of text) {
      freq[char] = (freq[char] || 0) + 1
    }
    return freq
  }

  const buildHuffmanTree = (frequencies: { [key: string]: number }) => {
    const nodes: HuffmanNode[] = Object.entries(frequencies)
      .map(([char, freq]) => ({ char, freq }))
      .sort((a, b) => a.freq - b.freq)

    const newSteps: string[] = []
    newSteps.push(
      `Initial frequencies: ${Object.entries(frequencies)
        .map(([c, f]) => `${c}:${f}`)
        .join(", ")}`,
    )

    while (nodes.length > 1) {
      const left = nodes.shift()!
      const right = nodes.shift()!

      const merged: HuffmanNode = {
        char: left.char + right.char,
        freq: left.freq + right.freq,
        left,
        right,
      }

      newSteps.push(
        `Merged '${left.char}' (${left.freq}) and '${right.char}' (${right.freq}) → '${merged.char}' (${merged.freq})`,
      )

      // Insert in sorted order
      let inserted = false
      for (let i = 0; i < nodes.length; i++) {
        if (merged.freq <= nodes[i].freq) {
          nodes.splice(i, 0, merged)
          inserted = true
          break
        }
      }
      if (!inserted) nodes.push(merged)
    }

    setSteps(newSteps)
    return nodes[0]
  }

  const generateCodes = (node: HuffmanNode, code = "", codes: { [key: string]: string } = {}) => {
    if (!node.left && !node.right) {
      codes[node.char] = code || "0"
      return codes
    }

    if (node.left) generateCodes(node.left, code + "0", codes)
    if (node.right) generateCodes(node.right, code + "1", codes)

    return codes
  }

  const positionNodes = (node: HuffmanNode, x = 350, y = 50, level = 0) => {
    node.x = x
    node.y = y

    const spacing = 200 / (level + 1)
    if (node.left) {
      positionNodes(node.left, x - spacing, y + 80, level + 1)
    }
    if (node.right) {
      positionNodes(node.right, x + spacing, y + 80, level + 1)
    }
  }

  const drawTree = () => {
    const canvas = canvasRef.current
    if (!canvas || !huffmanTree) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const drawNode = (node: HuffmanNode) => {
      if (!node.x || !node.y) return

      // Draw connections
      if (node.left && node.left.x && node.left.y) {
        ctx.beginPath()
        ctx.moveTo(node.x, node.y)
        ctx.lineTo(node.left.x, node.left.y)
        ctx.strokeStyle = "#64748b"
        ctx.lineWidth = 2
        ctx.stroke()

        // Draw "0" label
        const midX = (node.x + node.left.x) / 2
        const midY = (node.y + node.left.y) / 2
        ctx.fillStyle = "#dc2626"
        ctx.font = "bold 12px sans-serif"
        ctx.fillText("0", midX - 10, midY)
      }

      if (node.right && node.right.x && node.right.y) {
        ctx.beginPath()
        ctx.moveTo(node.x, node.y)
        ctx.lineTo(node.right.x, node.right.y)
        ctx.strokeStyle = "#64748b"
        ctx.lineWidth = 2
        ctx.stroke()

        // Draw "1" label
        const midX = (node.x + node.right.x) / 2
        const midY = (node.y + node.right.y) / 2
        ctx.fillStyle = "#dc2626"
        ctx.font = "bold 12px sans-serif"
        ctx.fillText("1", midX + 5, midY)
      }

      // Draw node
      ctx.beginPath()
      ctx.arc(node.x, node.y, 30, 0, 2 * Math.PI)
      ctx.fillStyle = node.left || node.right ? "#e2e8f0" : "#10b981"
      ctx.fill()
      ctx.strokeStyle = "#334155"
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw text
      ctx.fillStyle = "#334155"
      ctx.font = "bold 12px sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(node.char, node.x, node.y - 5)
      ctx.fillText(node.freq.toString(), node.x, node.y + 10)

      // Recursively draw children
      if (node.left) drawNode(node.left)
      if (node.right) drawNode(node.right)
    }

    drawNode(huffmanTree)
  }

  useEffect(() => {
    if (huffmanTree) {
      drawTree()
    }
  }, [huffmanTree])

  const addCustomFrequency = () => {
    if (newChar && newFreq && !isNaN(Number(newFreq))) {
      const freq = Number(newFreq)
      if (freq > 0) {
        const existing = customFrequencies.find((cf) => cf.char === newChar)
        if (existing) {
          setCustomFrequencies(customFrequencies.map((cf) => (cf.char === newChar ? { ...cf, freq } : cf)))
        } else {
          setCustomFrequencies([...customFrequencies, { char: newChar, freq }])
        }
        setNewChar("")
        setNewFreq("")
        setError("")
      } else {
        setError("Frequency must be positive")
      }
    } else {
      setError("Please enter valid character and frequency")
    }
  }

  const removeCustomFrequency = (char: string) => {
    setCustomFrequencies(customFrequencies.filter((cf) => cf.char !== char))
  }

  const loadFrequenciesFromText = () => {
    try {
      setError("")
      if (!inputText.trim()) {
        setError("Please enter some text")
        return
      }
      const freq = calculateFrequencies(inputText)
      setFrequencies(freq)
    } catch (err) {
      setError("Error processing text")
    }
  }

  const loadCustomFrequencies = () => {
    try {
      setError("")
      if (customFrequencies.length === 0) {
        setError("Please add some character frequencies")
        return
      }
      const freq: { [key: string]: number } = {}
      customFrequencies.forEach((cf) => {
        freq[cf.char] = cf.freq
      })
      setFrequencies(freq)
    } catch (err) {
      setError("Error loading custom frequencies")
    }
  }

  const runHuffman = () => {
    if (Object.keys(frequencies).length === 0) {
      setError("No frequencies loaded. Please load text or custom frequencies first.")
      return
    }

    const tree = buildHuffmanTree(frequencies)
    positionNodes(tree)
    setHuffmanTree(tree)

    const generatedCodes = generateCodes(tree)
    setCodes(generatedCodes)
  }

  const reset = () => {
    setFrequencies({})
    setHuffmanTree(null)
    setCodes({})
    setSteps([])
    setError("")
  }

  const exportData = () => {
    const data = {
      frequencies,
      codes,
      inputText: inputMode === "text" ? inputText : "",
      customFrequencies: inputMode === "frequency" ? customFrequencies : [],
    }
    const dataStr = JSON.stringify(data, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "huffman-data.json"
    link.click()
  }

  const encodedText = inputText
    .split("")
    .map((char) => codes[char] || "")
    .join("")
  const originalBits = inputText.length * 8
  const compressedBits = encodedText.length
  const compressionRatio = originalBits > 0 ? (((originalBits - compressedBits) / originalBits) * 100).toFixed(1) : 0

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2">
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 shadow-2xl">
          <CardHeader>
            <CardTitle>Huffman Tree Visualization</CardTitle>
          </CardHeader>
          <CardContent>
            <canvas
              ref={canvasRef}
              width={700}
              height={450}
              className="border rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-700 dark:to-slate-800 w-full shadow-inner"
            />
            <div className="flex gap-3 mt-6 flex-wrap">
              <Button
                onClick={runHuffman}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                <Play className="w-4 h-4 mr-2" />
                Build Tree
              </Button>
              <Button onClick={reset} variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button onClick={exportData} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 shadow-2xl">
          <CardHeader>
            <CardTitle>Input Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={inputMode} onValueChange={(value) => setInputMode(value as any)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="text">Text Input</TabsTrigger>
                <TabsTrigger value="frequency">Custom Frequencies</TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-4">
                <div>
                  <Label htmlFor="input-text">Text to encode</Label>
                  <Textarea
                    id="input-text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value.toUpperCase())}
                    placeholder="Enter text to analyze..."
                    rows={4}
                  />
                </div>
                <Button onClick={loadFrequenciesFromText} className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  Analyze Text
                </Button>
              </TabsContent>

              <TabsContent value="frequency" className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Char"
                    value={newChar}
                    onChange={(e) => setNewChar(e.target.value.slice(0, 1).toUpperCase())}
                    className="w-16"
                  />
                  <Input
                    type="number"
                    placeholder="Freq"
                    value={newFreq}
                    onChange={(e) => setNewFreq(e.target.value)}
                    min="1"
                  />
                  <Button onClick={addCustomFrequency} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {customFrequencies.map((cf) => (
                    <div
                      key={cf.char}
                      className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-700 rounded"
                    >
                      <span className="font-mono">
                        '{cf.char}': {cf.freq}
                      </span>
                      <Button onClick={() => removeCustomFrequency(cf.char)} size="sm" variant="outline">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button onClick={loadCustomFrequencies} className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  Load Frequencies
                </Button>
              </TabsContent>
            </Tabs>

            {error && (
              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-red-600">{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 shadow-2xl">
          <CardHeader>
            <CardTitle>Character Frequencies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {Object.entries(frequencies).map(([char, freq]) => (
                <div
                  key={char}
                  className="flex justify-between items-center p-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 rounded-lg"
                >
                  <span className="font-mono text-lg">'{char}'</span>
                  <Badge variant="secondary" className="font-mono text-sm">
                    {freq}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 shadow-2xl">
          <CardHeader>
            <CardTitle>Huffman Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {Object.entries(codes).map(([char, code]) => (
                <div
                  key={char}
                  className="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-slate-700 dark:to-slate-600 rounded-lg"
                >
                  <span className="font-mono text-lg">'{char}'</span>
                  <Badge variant="outline" className="font-mono text-sm bg-white">
                    {code}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {encodedText && (
          <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 shadow-2xl">
            <CardHeader>
              <CardTitle>Compression Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{originalBits}</div>
                  <div className="text-sm text-muted-foreground">Original bits</div>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{compressedBits}</div>
                  <div className="text-sm text-muted-foreground">Compressed bits</div>
                </div>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">{compressionRatio}%</div>
                <div className="text-sm text-muted-foreground">Space saved</div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                <div className="text-xs text-muted-foreground mb-2">Encoded output:</div>
                <div className="font-mono text-xs break-all bg-white dark:bg-slate-800 p-2 rounded border max-h-20 overflow-y-auto">
                  {encodedText}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
