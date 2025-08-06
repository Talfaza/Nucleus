"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Server, ArrowLeft, PlusCircle, Trash2, HardDrive, Zap, Edit } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { ProxmoxServerModal } from "@/components/proxmox-server-modal"

interface ServerItem {
  id: string
  name: string
  type: "Nucleus Server" | "Proxmox Server"
  details?: string
  url?: string
  username?: string
}

export default function ManageServersPage() {
  const [servers, setServers] = useState<ServerItem[]>([
    { id: "srv-1", name: "My First Test Server", type: "Nucleus Server", details: "Ubuntu 22.04, Python, Node.js" },
    { id: "srv-2", name: "Dev Environment", type: "Nucleus Server", details: "Debian 11, Docker, Nginx" },
    {
      id: "prox-1",
      name: "Proxmox Host 01",
      type: "Proxmox Server",
      details: "192.168.1.100",
      url: "https://192.168.1.100:8006",
      username: "root@pam",
    },
  ])
  const [isProxmoxModalOpen, setIsProxmoxModalOpen] = useState(false)
  const [editingProxmoxServer, setEditingProxmoxServer] = useState<ServerItem | null>(null)
  const [isLoadingAddEdit, setIsLoadingAddEdit] = useState(false)
  const [isLoadingDelete, setIsLoadingDelete] = useState<string | null>(null)
  const { toast } = useToast()

  const handleDeleteServer = async (id: string, name: string) => {
    setIsLoadingDelete(id)
    // Simulate API call
    setTimeout(() => {
      setServers((prev) => prev.filter((server) => server.id !== id))
      setIsLoadingDelete(null)
      toast({
        title: "Server Deleted! 🗑️",
        description: `Server "${name}" has been successfully removed.`,
        className: "bg-blue-600/20 backdrop-blur-sm text-white border-blue-500/30",
      })
    }, 1000)
  }

  const handleProxmoxSubmit = async (data: {
    id?: string
    name: string
    url: string
    username: string
    password?: string
  }) => {
    setIsLoadingAddEdit(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    if (data.id) {
      // Editing existing server
      setServers((prev) =>
        prev.map((server) =>
          server.id === data.id
            ? { ...server, name: data.name, url: data.url, username: data.username, details: data.url }
            : server,
        ),
      )
      toast({
        title: "Proxmox Server Updated! 🔄",
        description: `Proxmox server "${data.name}" has been updated.`,
        className: "bg-blue-600/20 backdrop-blur-sm text-white border-blue-500/30",
      })
    } else {
      // Adding new server
      const newProxmoxServer: ServerItem = {
        id: `prox-${Date.now()}`,
        name: data.name,
        type: "Proxmox Server",
        details: data.url,
        url: data.url,
        username: data.username,
      }
      setServers((prev) => [...prev, newProxmoxServer])
      toast({
        title: "Proxmox Server Added! 🚀",
        description: `Proxmox server "${newProxmoxServer.name}" has been added.`,
        className: "bg-blue-600/20 backdrop-blur-sm text-white border-blue-500/30",
      })
    }
    setIsLoadingAddEdit(false)
    setIsProxmoxModalOpen(false)
    setEditingProxmoxServer(null)
  }

  const openAddProxmoxModal = () => {
    setEditingProxmoxServer(null)
    setIsProxmoxModalOpen(true)
  }

  const openEditProxmoxModal = (server: ServerItem) => {
    setEditingProxmoxServer(server)
    setIsProxmoxModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white overflow-hidden">
      {/* Animated Background Circles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute top-3/4 right-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl animate-bounce"
          style={{ animationDuration: "3s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-48 h-48 bg-purple-500/20 rounded-full blur-2xl animate-ping"
          style={{ animationDuration: "4s" }}
        ></div>
        <div
          className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-blue-700/25 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 lg:px-6 h-16 flex items-center border-b border-white/10 backdrop-blur-sm">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center">
            <Server className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold">Nucleus</span>
        </Link>
        <Link
          href="/"
          className="ml-auto flex items-center gap-2 text-sm font-medium hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </header>

      {/* Manage Servers Section */}
      <section className="relative z-10 px-4 py-8">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold mb-4">
              Manage{" "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Your Servers
              </span>
            </h1>
            <p className="text-slate-300 text-lg">View, delete, and add new server connections</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Existing Servers */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <HardDrive className="w-5 h-5" />
                  Existing Servers
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Your currently managed Nucleus and Proxmox servers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {servers.length === 0 ? (
                  <p className="text-slate-400 text-center py-4">No servers found. Add one below!</p>
                ) : (
                  <div className="space-y-3">
                    {servers.map((server) => (
                      <div
                        key={server.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                      >
                        <div>
                          <p className="text-white font-medium">{server.name}</p>
                          <p className="text-xs text-slate-400">
                            {server.type} {server.details && `(${server.details})`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          {server.type === "Proxmox Server" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditProxmoxModal(server)}
                              className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10 bg-transparent"
                            >
                              <Edit className="w-4 h-4" />
                              <span className="sr-only">Edit {server.name}</span>
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteServer(server.id, server.name)}
                            disabled={isLoadingDelete === server.id}
                            className="bg-red-600/80 hover:bg-red-700/80 text-white"
                          >
                            {isLoadingDelete === server.id ? (
                              <Zap className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                            <span className="sr-only">Delete {server.name}</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Add Server Button */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 flex flex-col items-center justify-center p-6">
              <CardTitle className="text-white flex items-center gap-2 mb-4">
                <PlusCircle className="w-6 h-6" />
                Add New Server
              </CardTitle>
              <CardDescription className="text-slate-300 text-center mb-6">
                Connect a new Proxmox server or create a new Nucleus test server.
              </CardDescription>
              <div className="flex flex-col gap-4 w-full max-w-xs">
                <Button
                  onClick={openAddProxmoxModal}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white w-full"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add Proxmox Server
                </Button>
                <Link href="/create-server" className="w-full">
                  <Button
                    variant="outline"
                    className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10 bg-transparent w-full"
                  >
                    <Server className="w-4 h-4 mr-2" />
                    Create Nucleus Server
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <ProxmoxServerModal
        isOpen={isProxmoxModalOpen}
        onOpenChange={setIsProxmoxModalOpen}
        initialData={editingProxmoxServer}
        onSubmit={handleProxmoxSubmit}
        isLoading={isLoadingAddEdit}
      />
    </div>
  )
}

