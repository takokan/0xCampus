"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/context/wallet-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/components/ui/use-toast"
import { createCourse } from "@/lib/contract"
import { uploadVideoToPinata } from "@/app/actions"
import { Upload, Clock, Percent } from "lucide-react"

export default function CreateCoursePage() {
  const { account, connectWallet, isConnected } = useWallet()
  const router = useRouter()
  const { toast } = useToast()

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [completionTimeLimit, setCompletionTimeLimit] = useState(7 * 24 * 60 * 60) // 7 days in seconds
  const [refundPercentage, setRefundPercentage] = useState(20)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create a course",
        variant: "destructive",
      })
      return
    }

    if (!videoFile) {
      toast({
        title: "No video selected",
        description: "Please upload a video for your course",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUploading(true)

      // Upload video to IPFS via Pinata
      const formData = new FormData()
      formData.append("file", videoFile)

      const uploadResult = await uploadVideoToPinata(formData)

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Failed to upload video")
      }

      setIsUploading(false)
      setIsCreating(true)

      // Create course on the blockchain
      const ipfsHash = uploadResult.ipfsHash
      await createCourse(title, description, ipfsHash, price, completionTimeLimit, refundPercentage)

      toast({
        title: "Course created successfully!",
        description: "Your course has been published to the blockchain",
      })

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error) {
      console.error("Error creating course:", error)
      toast({
        title: "Error creating course",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setIsCreating(false)
    }
  }

  // Format days for display
  const formatDays = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60))
    return `${days} days`
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>You need to connect your wallet to create a course</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={connectWallet} className="w-full">
              Connect Wallet
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Create a New Course</h1>

      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Course Details</CardTitle>
          <CardDescription>Fill in the details below to create your educational course</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Course Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Introduction to Blockchain"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Course Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A comprehensive introduction to blockchain technology..."
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (ETH)</Label>
              <Input
                id="price"
                type="number"
                step="0.001"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.05"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="completionTime">Completion Time Limit</Label>
                <span className="text-sm text-muted-foreground">{formatDays(completionTimeLimit)}</span>
              </div>
              <div className="flex items-center gap-4">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Slider
                  id="completionTime"
                  value={[completionTimeLimit]}
                  min={1 * 24 * 60 * 60} // 1 day
                  max={30 * 24 * 60 * 60} // 30 days
                  step={24 * 60 * 60} // 1 day
                  onValueChange={(value) => setCompletionTimeLimit(value[0])}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="refundPercentage">Refund Percentage</Label>
                <span className="text-sm text-muted-foreground">{refundPercentage}%</span>
              </div>
              <div className="flex items-center gap-4">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <Slider
                  id="refundPercentage"
                  value={[refundPercentage]}
                  min={0}
                  max={100}
                  step={5}
                  onValueChange={(value) => setRefundPercentage(value[0])}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="video">Course Video</Label>
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="video"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/40 hover:bg-muted/60"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">MP4, WebM or OGG (MAX. 500MB)</p>
                  </div>
                  <Input
                    id="video"
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleFileChange}
                    required
                  />
                </label>
              </div>
              {videoFile && <p className="text-sm text-muted-foreground mt-2">Selected file: {videoFile.name}</p>}
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full" disabled={isUploading || isCreating}>
              {isUploading ? "Uploading to IPFS..." : isCreating ? "Creating Course..." : "Create Course"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

