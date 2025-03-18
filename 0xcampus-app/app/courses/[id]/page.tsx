"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useWallet } from "@/context/wallet-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { getCourseDetails, getEnrollmentDetails, enrollInCourse } from "@/lib/contract"
import { Clock, Percent, User, Calendar, CheckCircle } from "lucide-react"

interface Course {
  educator: string
  title: string
  description: string
  ipfsHash: string
  price: string
  completionTimeLimit: number
  refundPercentage: number
  isActive: boolean
}

interface Enrollment {
  enrollmentTime: number
  completionDeadline: number
  isCompleted: boolean
  isRefunded: boolean
}

export default function CourseDetailPage() {
  const params = useParams()
  const courseId = Number.parseInt(params.id as string)
  const { account, connectWallet, isConnected } = useWallet()
  const { toast } = useToast()

  const [course, setCourse] = useState<Course | null>(null)
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)

  useEffect(() => {
    const fetchCourseAndEnrollment = async () => {
      if (!window.ethereum) return

      try {
        setLoading(true)

        // Fetch course details
        const courseDetails = await getCourseDetails(courseId)
        setCourse(courseDetails)

        // If wallet is connected, check enrollment status
        if (account) {
          try {
            const enrollmentDetails = await getEnrollmentDetails(account, courseId)
            if (enrollmentDetails.enrollmentTime > 0) {
              setEnrollment(enrollmentDetails)
            }
          } catch (error) {
            console.error("Error fetching enrollment:", error)
            // Not enrolled, so enrollment will remain null
          }
        }
      } catch (error) {
        console.error("Error fetching course details:", error)
        toast({
          title: "Error fetching course",
          description: "Could not load the course details",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCourseAndEnrollment()
  }, [courseId, account, toast])

  const handleEnroll = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to enroll in this course",
        variant: "destructive",
      })
      return
    }

    if (!course) return

    try {
      setEnrolling(true)

      await enrollInCourse(courseId, course.price)

      toast({
        title: "Enrollment successful!",
        description: "You have successfully enrolled in the course",
      })

      // Refresh enrollment status
      if (account) {
        const enrollmentDetails = await getEnrollmentDetails(account, courseId)
        setEnrollment(enrollmentDetails)
      }
    } catch (error) {
      console.error("Error enrolling in course:", error)
      toast({
        title: "Error enrolling in course",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setEnrolling(false)
    }
  }

  // Format days for display
  const formatDays = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60))
    return `${days} days`
  }

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">Loading course details...</p>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Course Not Found</h1>
        <p className="text-muted-foreground">The course you're looking for doesn't exist or has been removed.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{course.title}</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2">
            {enrollment ? (
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <video
                  controls
                  className="w-full h-full object-cover"
                  poster={`https://gateway.pinata.cloud/ipfs/${course.ipfsHash}?preview=1`}
                >
                  <source src={`https://gateway.pinata.cloud/ipfs/${course.ipfsHash}`} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : (
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center p-6">
                  <h3 className="text-xl font-semibold mb-2">Preview Not Available</h3>
                  <p className="text-muted-foreground mb-4">Enroll in this course to access the full content</p>
                  {isConnected ? (
                    <Button onClick={handleEnroll} disabled={enrolling}>
                      {enrolling ? "Enrolling..." : `Enroll for ${course.price} ETH`}
                    </Button>
                  ) : (
                    <Button onClick={connectWallet}>Connect Wallet to Enroll</Button>
                  )}
                </div>
              </div>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Course Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center text-sm">
                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Educator: {formatAddress(course.educator)}</span>
              </div>
              <div className="flex items-center text-sm">
                <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Completion time: {formatDays(course.completionTimeLimit)}</span>
              </div>
              <div className="flex items-center text-sm">
                <Percent className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Refund: {course.refundPercentage}% upon completion</span>
              </div>
              {enrollment && (
                <>
                  <div className="flex items-center text-sm">
                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Enrolled on: {formatDate(enrollment.enrollmentTime)}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Complete by: {formatDate(enrollment.completionDeadline)}
                    </span>
                  </div>
                  {enrollment.isCompleted && (
                    <div className="flex items-center text-sm text-green-600">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      <span>Completed</span>
                    </div>
                  )}
                  {enrollment.isRefunded && (
                    <div className="flex items-center text-sm text-green-600">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      <span>Refund processed</span>
                    </div>
                  )}
                </>
              )}
            </CardContent>
            {!enrollment && (
              <CardFooter>
                <div className="w-full">
                  <div className="font-bold text-lg mb-2">{course.price} ETH</div>
                  {isConnected ? (
                    <Button onClick={handleEnroll} disabled={enrolling} className="w-full">
                      {enrolling ? "Enrolling..." : "Enroll Now"}
                    </Button>
                  ) : (
                    <Button onClick={connectWallet} className="w-full">
                      Connect Wallet
                    </Button>
                  )}
                </div>
              </CardFooter>
            )}
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Course Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line">{course.description}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

