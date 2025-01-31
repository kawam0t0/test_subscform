import { Home, Camera, MonitorSmartphone, Settings } from "lucide-react"
import type { NavButtonProps } from "../types"

export function Navigation() {
  return (
    <nav className="fixed right-0 top-0 flex h-screen w-16 flex-col items-center justify-between bg-[#2A303C] py-8">
      <div>
        <NavButton icon={<Home size={24} />} label="Home" />
      </div>
      <div className="space-y-4">
        <NavButton icon={<Camera size={24} />} label="Camera" />
        <NavButton icon={<MonitorSmartphone size={24} />} label="Monitor" />
      </div>
      <div>
        <NavButton icon={<Settings size={24} />} label="Manage" />
      </div>
    </nav>
  )
}

function NavButton({ icon, label }: NavButtonProps) {
  return (
    <button
      className="flex h-12 w-12 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
      title={label}
    >
      {icon}
    </button>
  )
}