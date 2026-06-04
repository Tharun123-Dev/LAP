import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function Shell() {
  const [open, setOpen] = useState(false)

  return (
    <div className="h-screen overflow-hidden bg-slate-50 text-slate-900">
      <div className="flex h-full min-h-0 overflow-hidden">
        <Sidebar open={open} onClose={() => setOpen(false)} />
        {open && (
          <button
            className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[1px] lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close main menu"
          />
        )}

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Topbar onMenuClick={() => setOpen(true)} />
          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 p-4 custom-scrollbar sm:p-5 lg:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
