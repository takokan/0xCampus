import { ethers } from "ethers"
import EducationalPlatformABI from "@/lib/EducationalPlatformABI.json"

// Contract address from environment variable
const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS

// Function to get contract instance with signer
export async function getContractWithSigner() {
  if (!window.ethereum) {
    throw new Error("MetaMask not installed")
  }

  await window.ethereum.request({ method: "eth_requestAccounts" })
  const provider = new ethers.providers.Web3Provider(window.ethereum)
  const signer = provider.getSigner()

  return new ethers.Contract(contractAddress as string, EducationalPlatformABI, signer)
}

// Function to get contract instance for read-only operations
export function getContractForReading(provider: ethers.providers.Provider) {
  return new ethers.Contract(contractAddress as string, EducationalPlatformABI, provider)
}

// Create a course
export async function createCourse(
  title: string,
  description: string,
  ipfsHash: string,
  price: string,
  completionTimeLimit: number,
  refundPercentage: number,
) {
  const contract = await getContractWithSigner()
  const priceInWei = ethers.utils.parseEther(price)

  const tx = await contract.createCourse(
    title,
    description,
    ipfsHash,
    priceInWei,
    completionTimeLimit,
    refundPercentage,
  )

  return tx.wait()
}

// Enroll in a course
export async function enrollInCourse(courseId: number, price: string) {
  const contract = await getContractWithSigner()
  const priceInWei = ethers.utils.parseEther(price)

  const tx = await contract.enrollInCourse(courseId, {
    value: priceInWei,
  })

  return tx.wait()
}

// Mark a course as completed
export async function markCourseCompleted(learnerAddress: string, courseId: number) {
  const contract = await getContractWithSigner()

  const tx = await contract.markCourseCompleted(learnerAddress, courseId)

  return tx.wait()
}

// Withdraw balance
export async function withdrawBalance() {
  const contract = await getContractWithSigner()

  const tx = await contract.withdrawBalance()

  return tx.wait()
}

// Get course details
export async function getCourseDetails(courseId: number) {
  const provider = new ethers.providers.Web3Provider(window.ethereum)
  const contract = getContractForReading(provider)

  const course = await contract.courses(courseId)

  return {
    educator: course.educator,
    title: course.title,
    description: course.description,
    ipfsHash: course.ipfsHash,
    price: ethers.utils.formatEther(course.price),
    completionTimeLimit: course.completionTimeLimit.toNumber(),
    refundPercentage: course.refundPercentage,
    isActive: course.isActive,
  }
}

// Get educator courses
export async function getEducatorCourses(educatorAddress: string) {
  const provider = new ethers.providers.Web3Provider(window.ethereum)
  const contract = getContractForReading(provider)

  const courseIds = await contract.getEducatorCourses(educatorAddress)

  return courseIds.map((id: ethers.BigNumber) => id.toNumber())
}

// Get learner enrollments
export async function getLearnerEnrollments(learnerAddress: string) {
  const provider = new ethers.providers.Web3Provider(window.ethereum)
  const contract = getContractForReading(provider)

  const enrollmentIds = await contract.getLearnerEnrollments(learnerAddress)

  return enrollmentIds.map((id: ethers.BigNumber) => id.toNumber())
}

// Get enrollment details
export async function getEnrollmentDetails(learnerAddress: string, courseId: number) {
  const provider = new ethers.providers.Web3Provider(window.ethereum)
  const contract = getContractForReading(provider)

  const details = await contract.getEnrollmentDetails(learnerAddress, courseId)

  return {
    enrollmentTime: details.enrollmentTime.toNumber(),
    completionDeadline: details.completionDeadline.toNumber(),
    isCompleted: details.isCompleted,
    isRefunded: details.isRefunded,
  }
}

