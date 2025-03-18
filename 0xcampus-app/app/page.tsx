import Link from "next/link"
import { Button } from "@/components/ui/button"
import { GraduationCap, Video, Award } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-primary/10 to-background">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Learn, Earn, and Share Knowledge</h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto">
            A decentralized educational platform where educators are rewarded fairly and learners get incentives for
            completing courses.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/courses">
              <Button size="lg" className="px-8">
                Explore Courses
              </Button>
            </Link>
            <Link href="/create">
              <Button size="lg" variant="outline" className="px-8">
                Create a Course
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Our Platform?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card">
              <div className="bg-primary/10 p-3 rounded-full mb-4">
                <Video className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Decentralized Content</h3>
              <p className="text-muted-foreground">
                All educational content is stored on IPFS, ensuring censorship resistance and permanent availability.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card">
              <div className="bg-primary/10 p-3 rounded-full mb-4">
                <Award className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Incentivized Learning</h3>
              <p className="text-muted-foreground">
                Complete courses on time and receive partial refunds as a reward for your dedication.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-lg border bg-card">
              <div className="bg-primary/10 p-3 rounded-full mb-4">
                <GraduationCap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fair Compensation</h3>
              <p className="text-muted-foreground">
                Educators receive direct payments without intermediaries taking large cuts of their earnings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Start Learning?</h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto">
            Join thousands of learners and educators on our platform and be part of the educational revolution.
          </p>
          <Link href="/courses">
            <Button size="lg" className="px-8">
              Browse Courses Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

