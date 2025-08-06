"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusCircle, Zap } from "lucide-react"

interface ProxmoxServerData {
  id?: string // Optional for new servers
  name: string
  url: string
  username: string
  password?: string // Password might not be returned from API for security, only sent on creation/update
}

interface ProxmoxServerModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  initialData?: ProxmoxServerData | null
  onSubmit: (data: ProxmoxServerData) => Promise<void>
  isLoading: boolean
}

export function ProxmoxServerModal({
  isOpen,
  onOpenChange,
  initialData,
  onSubmit,
  isLoading,
}: ProxmoxServerModalProps) {
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("") // Only for new/updated password

  useEffect(() => {
    if (initialData) {
      setName(initialData.name)
      setUrl(initialData.url)
      setUsername(initialData.username)
      setPassword("") // Clear password when editing, user will re-enter if needed
    } else {
      setName("")
      setUrl("")
      setUsername("")
      setPassword("")
    }
  }, [initialData, isOpen]) // Reset when modal opens or initialData changes

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data: ProxmoxServerData = {
      name,
      url,
      username,
    }
    if (password) {
      data.password = password
    }
    if (initialData?.id) {
      data.id = initialData.id // Include ID for updates
    }
    await onSubmit(data)
    if (!isLoading) {
      // Only close if submission was successful and not still loading
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 text-white border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">{initialData ? "Edit Proxmox Server" : "Add Proxmox Server"}</DialogTitle>
          <DialogDescription className="text-slate-400">
            {initialData
              ? "Make changes to your Proxmox server connection here."
              : "Connect a new Proxmox server to Nucleus."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">
              Server Name
            </Label>
            <Input
              id="name"
              placeholder="My Proxmox Host"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="url" className="text-white">
              API URL (e.g., https://192.168.1.100:8006)
            </Label>
            <Input
              id="url"
              type="url"
              placeholder="https://your-proxmox-ip:8006"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username" className="text-white">
              Username
            </Label>
            <Input
              id="username"
              placeholder="root@pam"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">
              Password {initialData ? "(Leave blank to keep current)" : ""}
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Proxmox API Token or Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-500"
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              {isLoading ? (
                <>
                  <Zap className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4 mr-2" />
                  {initialData ? "Save Changes" : "Add Server"}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

