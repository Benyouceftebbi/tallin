import { redirect } from "next/navigation"

export default function Home() {
  // Redirect to sign-in page from the root
  redirect("/sign-in")
}
