import { LoginForm } from "@/components/auth/login-form"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const runtime = "edge"

export default async function LoginPage() {
  const session = await auth()
  
  if (session?.user) {
    redirect("/")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <LoginForm />
    </div>
  )
} 