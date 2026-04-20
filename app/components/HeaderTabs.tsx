"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const tabs = [
  { href: "/", label: "商品一覧" },
  { href: "/register", label: "レジ" },
  { href: "/sales", label: "売上一覧" },
]

export default function HeaderTabs() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b bg-white">
      <div className="px-4 pt-3 pb-2">
        <h1 className="text-lg font-bold">フリマレジ</h1>
      </div>

      <nav className="flex px-2 pb-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 rounded-lg px-3 py-2 text-center text-sm font-medium ${
                isActive
                  ? "bg-green-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}