"use client"

import Link from "next/link"
import { PlusCircle, MoreHorizontal, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useLandingPages } from "@/context/landing-pages-context"
import { useShop } from "@/context/shop-context"
import { useMemo } from "react"

export default function LandingPagesDashboard() {
  const { landingPages, deleteLandingPage, loading } = useLandingPages()
  const {orders}=useShop()
  const handleDelete = (id: string) => {
    deleteLandingPage(id)
  }
  const ordersBySlug = useMemo(() => {
  const grouped: Record<string, number> = {}

  for (const order of orders) {
    if (order.slug) {
      grouped[order.slug] = (grouped[order.slug] || 0) + 1
    }
  }

  return grouped
}, [orders])

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
      <div className="flex items-center">
        <h1 className="font-semibold text-lg md:text-2xl">Landing Pages</h1>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/admin/landing-pages/create">
            <Button size="sm" className="h-8 gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Landing Page</span>
            </Button>
          </Link>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your Landing Pages</CardTitle>
          <CardDescription>Manage your product landing pages here.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Created at</TableHead>
                  <TableHead className="hidden md:table-cell">Commandes</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {landingPages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell className="font-medium">{page.productTitle}</TableCell>
                    <TableCell>
                      <Link
                        href={`/landing/${page.slug}`}
                        target="_blank"
                        className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
                      >
                        /landing/{page.slug}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={page.status === "Published" ? "default" : "outline"}>
                        {page.status || "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {page.createdAt?.toDate().toLocaleDateString()}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
  {ordersBySlug[page.slug] || 0}
</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/landing-pages/edit/${page.id}`} className="w-full cursor-pointer">
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/landing/${page.slug}`} target="_blank" className="w-full cursor-pointer">
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 cursor-pointer"
                            onClick={() => handleDelete(page.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
