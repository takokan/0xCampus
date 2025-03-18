"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useWallet } from "@/context/wallet-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { getCourseDetails, enrollInCourse } from "@/lib/contract"
import { Search, Clock, Percent, User } from "lucide-react"

interface Course {
  id: number
  educator: string
  title: string
  description: string
  ipfsHash: string
  price: string
  completionTimeLimit: number
  refundPercentage: number
  isActive: boolean
}

export default function CoursesPage() {
  const { account, connectWallet, isConnected } = useWallet()
  const router = useRouter()
  const { toast } = useToast()

  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [enrollingCourseId, setEnrollingCourseId] = useState<number | null>(null)

  useEffect(() => {
    const fetchCourses = async () => {
      if (!window.ethereum) return

      try {
        setLoading(true)

        // For demo purposes, we'll fetch the first 10 courses
        // In a real app, you'd implement pagination or use events to get all courses
        const coursesList: Course[] = []

        for (let i = 0; i < 10; i++) {
          try {
            const course = await getCourseDetails(i)
            if (course.isActive) {
              coursesList.push({
                id: i,
                ...course,
              })
            }
          } catch (error) {
            // If we can't fetch a course, we've reached the end
            break
          }
        }

        setCourses(coursesList)
      } catch (error) {
        console.error("Error fetching courses:", error)
        toast({
          title: "Error fetching courses",
          description: "Could not load the available courses",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [toast])

  const handleEnroll = async (courseId: number, price: string) => {
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to enroll in a course",
        variant: "destructive",
      })
      return
    }

    try {
      setEnrollingCourseId(courseId)

      await enrollInCourse(courseId, price)

      toast({
        title: "Enrollment successful!",
        description: "You have successfully enrolled in the course",
      })

      // Redirect to the course page
      router.push(`/courses/${courseId}`)
    } catch (error) {
      console.error("Error enrolling in course:", error)
      toast({
        title: "Error enrolling in course",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setEnrollingCourseId(null)
    }
  }

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Format days for display
  const formatDays = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60))
    return `${days} days`
  }

  // Format address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Explore Courses</h1>

      <div className="flex items-center mb-8">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading courses...</p>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No courses found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{course.title}</CardTitle>
                <CardDescription className="line-clamp-2">{course.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="space-y-4">
                  <div className="flex items-center text-sm">
                    <User className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Educator: {formatAddress(course.educator)}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Completion time: {formatDays(course.completionTimeLimit)}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Percent className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Refund: {course.refundPercentage}% upon completion</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center border-t pt-6">
                <div className="font-bold">{course.price} ETH</div>
                <Button
                  onClick={() => handleEnroll(course.id, course.price)}
                  disabled={enrollingCourseId === course.id || !isConnected}
                >
                  {enrollingCourseId === course.id ? "Enrolling..." : "Enroll Now"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {!isConnected && (
        <div className="mt-8 text-center">
          <p className="text-muted-foreground mb-4">Connect your wallet to enroll in courses</p>
          <Button onClick={connectWallet}>Connect Wallet</Button>
        </div>
      )}
    </div>
  )
}

