"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useWallet } from "@/context/wallet-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { ethers } from "ethers"
import {
  getEducatorCourses,
  getLearnerEnrollments,
  getCourseDetails,
  getEnrollmentDetails,
  withdrawBalance,
  markCourseCompleted,
} from "@/lib/contract"
import { Clock, Percent, CheckCircle, X, DollarSign } from "lucide-react"

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

interface Enrollment {
  courseId: number
  course: Course
  enrollmentTime: number
  completionDeadline: number
  isCompleted: boolean
  isRefunded: boolean
}

export default function DashboardPage() {
  const { account, connectWallet, isConnected } = useWallet()
  const { toast } = useToast()

  const [educatorCourses, setEducatorCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [educatorBalance, setEducatorBalance] = useState<string>("0")
  const [loading, setLoading] = useState(true)
  const [withdrawing, setWithdrawing] = useState(false)
  const [markingCompleted, setMarkingCompleted] = useState<number | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!window.ethereum || !account) return

      try {
        setLoading(true)

        // Fetch educator courses
        const courseIds = await getEducatorCourses(account)
        const coursesData: Course[] = []

        for (const id of courseIds) {
          const course = await getCourseDetails(id)
          coursesData.push({
            id: id,
            ...course,
          })
        }

        setEducatorCourses(coursesData)

        // Fetch learner enrollments
        const enrollmentIds = await getLearnerEnrollments(account)
        const enrollmentsData: Enrollment[] = []

        for (const id of enrollmentIds) {
          const course = await getCourseDetails(id)
          const enrollment = await getEnrollmentDetails(account, id)

          enrollmentsData.push({
            courseId: id,
            course: {
              id: id,
              ...course,
            },
            ...enrollment,
          })
        }

        setEnrollments(enrollmentsData)

        // Fetch educator balance
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const contract = new ethers.Contract(
          process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string,
          [
            {
              inputs: [
                {
                  internalType: "address",
                  name: "",
                  type: "address",
                },
              ],
              name: "educatorBalance",
              outputs: [
                {
                  internalType: "uint256",
                  name: "",
                  type: "uint256",
                },
              ],
              stateMutability: "view",
              type: "function",
            },
          ],
          provider,
        )

        const balance = await contract.educatorBalance(account)
        setEducatorBalance(ethers.utils.formatEther(balance))
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        toast({
          title: "Error loading dashboard",
          description: "Could not load your courses and enrollments",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    if (isConnected && account) {
      fetchDashboardData()
    } else {
      setLoading(false)
    }
  }, [account, isConnected, toast])

  const handleWithdrawBalance = async () => {
    if (!isConnected) return

    try {
      setWithdrawing(true)

      await withdrawBalance()

      toast({
        title: "Withdrawal successful!",
        description: `${educatorBalance} ETH has been transferred to your wallet`,
      })

      setEducatorBalance("0")
    } catch (error) {
      console.error("Error withdrawing balance:", error)
      toast({
        title: "Error withdrawing balance",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setWithdrawing(false)
    }
  }

  const handleMarkCompleted = async (learnerAddress: string, courseId: number) => {
    if (!isConnected) return

    try {
      setMarkingCompleted(courseId)

      await markCourseCompleted(learnerAddress, courseId)

      toast({
        title: "Course marked as completed",
        description: "The learner will receive their refund if eligible",
      })

      // Refresh dashboard data
      window.location.reload()
    } catch (error) {
      console.error("Error marking course as completed:", error)
      toast({
        title: "Error marking course as completed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setMarkingCompleted(null)
    }
  }

  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  // Check if deadline has passed
  const isDeadlinePassed = (deadline: number) => {
    return Date.now() > deadline * 1000
  }

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>You need to connect your wallet to view your dashboard</CardDescription>
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
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <Tabs defaultValue="enrollments">
        <TabsList className="mb-8">
          <TabsTrigger value="enrollments">My Enrollments</TabsTrigger>
          <TabsTrigger value="courses">My Courses</TabsTrigger>
        </TabsList>

        <TabsContent value="enrollments">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Your Enrolled Courses</h2>

            {loading ? (
              <p className="text-muted-foreground">Loading your enrollments...</p>
            ) : enrollments.length === 0 ? (
              <div className="text-center py-12 bg-muted/40 rounded-lg">
                <p className="text-muted-foreground mb-4">You haven't enrolled in any courses yet</p>
                <Link href="/courses">
                  <Button>Browse Courses</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {enrollments.map((enrollment) => (
                  <Card key={enrollment.courseId} className="flex flex-col">
                    <CardHeader>
                      <CardTitle>{enrollment.course.title}</CardTitle>
                      <CardDescription className="line-clamp-2">{enrollment.course.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
                      <div className="flex items-center text-sm">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Enrolled on: {formatDate(enrollment.enrollmentTime)}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span
                          className={`${isDeadlinePassed(enrollment.completionDeadline) && !enrollment.isCompleted ? "text-red-500" : "text-muted-foreground"}`}
                        >
                          Complete by: {formatDate(enrollment.completionDeadline)}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Percent className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Refund: {enrollment.course.refundPercentage}% upon completion
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        {enrollment.isCompleted ? (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            <span>Completed</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-amber-600">
                            <Clock className="mr-2 h-4 w-4" />
                            <span>In Progress</span>
                          </div>
                        )}
                      </div>
                      {enrollment.isRefunded && (
                        <div className="flex items-center text-sm text-green-600">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          <span>Refund processed</span>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter>
                      <Link href={`/courses/${enrollment.courseId}`} className="w-full">
                        <Button variant="outline" className="w-full">
                          View Course
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="courses">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Your Created Courses</h2>
              <Link href="/create">
                <Button>Create New Course</Button>
              </Link>
            </div>

            {loading ? (
              <p className="text-muted-foreground">Loading your courses...</p>
            ) : educatorCourses.length === 0 ? (
              <div className="text-center py-12 bg-muted/40 rounded-lg">
                <p className="text-muted-foreground mb-4">You haven't created any courses yet</p>
                <Link href="/create">
                  <Button>Create Your First Course</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {educatorCourses.map((course) => (
                  <Card key={course.id} className="flex flex-col">
                    <CardHeader>
                      <CardTitle>{course.title}</CardTitle>
                      <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
                      <div className="flex items-center text-sm">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Completion time: {Math.floor(course.completionTimeLimit / (24 * 60 * 60))} days
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Percent className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Refund: {course.refundPercentage}% upon completion
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Price: {course.price} ETH</span>
                      </div>
                      <div className="flex items-center text-sm">
                        {course.isActive ? (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            <span>Active</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-red-600">
                            <X className="mr-2 h-4 w-4" />
                            <span>Inactive</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Link href={`/courses/${course.id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          View
                        </Button>
                      </Link>
                      <Link href={`/courses/${course.id}/edit`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          Edit
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {Number.parseFloat(educatorBalance) > 0 && (
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Educator Balance</CardTitle>
                <CardDescription>Your current balance from course enrollments</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{educatorBalance} ETH</p>
              </CardContent>
              <CardFooter>
                <Button onClick={handleWithdrawBalance} disabled={withdrawing} className="w-full">
                  {withdrawing ? "Processing..." : "Withdraw Balance"}
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

