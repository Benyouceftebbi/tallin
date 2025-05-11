import type { ReactNode } from "react"
import { Topbar } from "@/components/topbar"

export default function CommandesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Topbar />
      <div className="flex-1 p-4 pt-0">{children}</div>
    </>
  )
}
