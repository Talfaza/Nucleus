"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Server, ArrowLeft, PlusCircle, Trash2, HardDrive, Zap, Edit, Play, Power, Eye } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { ProxmoxServerModal } from "@/components/proxmox-server-modal"
import { AuthGuard, useAuth } from "@/components/auth-guard"
import axios from "axios"

interface ServerItem {
  id: string
  name: string
  type: "Nucleus Server" | "Proxmox Server"
  details?: string
  url?: string
  username?: string
}

interface ProxConfig {
  ID: number
  user_id: number
  server_name: string
  username: string
  host: string
  port: string
  password: string
  CreatedAt: string
  UpdatedAt: string
}

interface LXCConfig {
  ID: number
  user_id: number
  name: string
  packages: string // JSON string
  CreatedAt: string
  UpdatedAt: string
}

function ManageServersPageContent() {
  const [servers, setServers] = useState<ServerItem[]>([])
  const [isProxmoxModalOpen, setIsProxmoxModalOpen] = useState(false)
  const [editingProxmoxServer, setEditingProxmoxServer] = useState<ServerItem | null>(null)
  const [isLoadingAddEdit, setIsLoadingAddEdit] = useState(false)
  const [isLoadingDelete, setIsLoadingDelete] = useState<string | null>(null)
  const [isLoadingShutdown, setIsLoadingShutdown] = useState<string | null>(null)
  const [isLoadingStart, setIsLoadingStart] = useState<string | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const { toast } = useToast()

  // Load LXC servers and Proxmox servers
  useEffect(() => {
    const loadServers = async () => {
      try {
        // LXC servers
        const lxcRes = await axios.get('http://localhost:7402/lxc', { withCredentials: true })
        const lxcConfigs: LXCConfig[] = lxcRes.data
        const lxcServers: ServerItem[] = lxcConfigs.map(cfg => ({
          id: `lxc-${cfg.ID}`,
          name: cfg.name,
          type: "Nucleus Server" as const,
          details: (() => {
            try {
              const obj = JSON.parse(cfg.packages || '{}') as Record<string, string>
              const entries = Object.entries(obj)
              if (entries.length === 0) return undefined
              // Show up to 3 packages
              return entries.slice(0, 3).map(([k, v]) => `${k}:${v}`).join(', ')
            } catch { return undefined }
          })(),
        }))

        const response = await axios.get('http://localhost:7790/prox', {
          withCredentials: true,
        })
        
        const proxConfigs: ProxConfig[] = response.data
        const proxServers: ServerItem[] = proxConfigs.map(config => ({
          id: `prox-${config.ID}`,
          name: config.server_name || `${config.username}@${config.host}`,
          type: "Proxmox Server" as const,
          details: `${config.host}:${config.port}`,
          url: `https://${config.host}:${config.port}`,
          username: config.username,
        }))
        
        setServers([...lxcServers, ...proxServers])
      } catch (error) {
        console.error('Failed to load servers:', error)
        toast({
          title: "Error",
          description: "Failed to load servers",
          className: "bg-red-600/20 backdrop-blur-sm text-white border-red-500/30",
        })
      } finally {
        setIsLoadingData(false)
      }
    }

    loadServers()
  }, [])

  const handleDeleteServer = async (id: string, name: string) => {
    setIsLoadingDelete(id)
    
    try {
      const server = servers.find(s => s.id === id)
      
      if (server?.type === "Proxmox Server") {
        // Delete from backend
        const configId = id.replace('prox-', '')
        await axios.delete(`http://localhost:7790/prox/${configId}`, {
          withCredentials: true,
        })
        
        // Remove from frontend state
        setServers((prev) => prev.filter((server) => server.id !== id))
        toast({
          title: "Proxmox Server Deleted! 🗑️",
          description: `Proxmox server "${name}" has been successfully removed.`,
          className: "bg-blue-600/20 backdrop-blur-sm text-white border-blue-500/30",
        })
      } else if (server?.type === "Nucleus Server") {
        // For LXC servers, we need to destroy the actual container first
        try {
          // Get Proxmox server details
          const proxRes = await axios.get('http://localhost:7790/prox', { withCredentials: true })
          const proxConfigs: ProxConfig[] = proxRes.data
          
          if (proxConfigs.length === 0) {
            throw new Error('No Proxmox server configured')
          }
          
          const proxConfig = proxConfigs[0] // Use the first Proxmox server
          
          // Get all LXC containers and grep for the VMID
          const listCommand = `pct list`
          const grepCommand = `pct list | grep "${name}"`
          
          console.log('Searching for container with name:', name)
          console.log('Using command:', grepCommand)
          
          const findResponse = await axios.post('http://localhost:7789/execute', {
            host: proxConfig.host.replace('https://', '').replace(':8006', ''),
            port: "22",
            username: proxConfig.username,
            password: proxConfig.password,
            command: grepCommand,
          }, { withCredentials: false })
          
          const containerLine = findResponse.data.output?.trim()
          console.log('Found container line:', containerLine)
          
          // Extract VMID from the first column
          const containerId = containerLine ? containerLine.split(/\s+/)[0] : null
          console.log('Extracted container ID:', containerId)
          
          if (containerId && containerId.match(/^\d+$/)) {
            // First shut down the LXC container gracefully
            const shutdownCommand = `pct shutdown ${containerId}`
            
            try {
              await axios.post('http://localhost:7789/execute', {
                host: proxConfig.host.replace('https://', '').replace(':8006', ''),
                port: "22",
                username: proxConfig.username,
                password: proxConfig.password,
                command: shutdownCommand,
              }, { withCredentials: false })
              
              console.log(`LXC container ${containerId} shutdown initiated`)
              
              // Wait a moment for shutdown to complete
              await new Promise(resolve => setTimeout(resolve, 3000))
            } catch (shutdownError) {
              console.log(`Shutdown failed for container ${containerId}, proceeding with force destroy`)
            }
            
            // Then destroy the LXC container
            const destroyCommand = `pct destroy ${containerId} --force`
            
            await axios.post('http://localhost:7789/execute', {
              host: proxConfig.host.replace('https://', '').replace(':8006', ''),
              port: "22",
              username: proxConfig.username,
              password: proxConfig.password,
              command: destroyCommand,
            }, { withCredentials: false })
            
            console.log(`LXC container ${containerId} destroyed successfully`)
          } else {
            console.log('No LXC container found with that name, proceeding with config deletion only')
          }
        } catch (lxcError) {
          console.error('Error destroying LXC container:', lxcError)
          // Continue with config deletion even if container destruction fails
        }
        
        // Delete the configuration from lxc-service
        const configId = id.replace('lxc-', '')
        await axios.delete(`http://localhost:7402/lxc/${configId}`, {
          withCredentials: true,
        })
        
        // Play delete sound
        try {
          console.log('Playing delete sound...')
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          
          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)
          
          // Quick descending tone for delete
          oscillator.frequency.setValueAtTime(1000, audioContext.currentTime)
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1)
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.2)
          
          gainNode.gain.setValueAtTime(0.8, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.1, audioContext.currentTime + 0.3)
          
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.3)
          
          console.log('Delete sound played successfully')
        } catch (error) {
          console.log('Could not play delete sound:', error)
        }
        
        // Remove from frontend state
        setServers((prev) => prev.filter((server) => server.id !== id))
        toast({
          title: "Nucleus Server Deleted! 🗑️",
          description: `Nucleus server "${name}" and its LXC container have been successfully removed.`,
          className: "bg-red-600/20 backdrop-blur-sm text-white border-red-500/30",
        })
      }
    } catch (error) {
      console.error('Failed to delete server:', error)
      toast({
        title: "Error",
        description: "Failed to delete server",
        className: "bg-red-600/20 backdrop-blur-sm text-white border-red-500/30",
      })
    } finally {
      setIsLoadingDelete(null)
    }
  }

  const handleShutdownServer = async (id: string, name: string) => {
    setIsLoadingShutdown(id)
    
    try {
      const server = servers.find(s => s.id === id)
      
      if (server?.type === "Nucleus Server") {
        // Get Proxmox server details
        const proxRes = await axios.get('http://localhost:7790/prox', { withCredentials: true })
        const proxConfigs: ProxConfig[] = proxRes.data
        
        if (proxConfigs.length === 0) {
          throw new Error('No Proxmox server configured')
        }
        
        const proxConfig = proxConfigs[0] // Use the first Proxmox server
        
        // Get all LXC containers and grep for the VMID
        const grepCommand = `pct list | grep "${name}"`
        
        console.log('Searching for container to shutdown:', name)
        console.log('Using command:', grepCommand)
        
        const findResponse = await axios.post('http://localhost:7789/execute', {
          host: proxConfig.host.replace('https://', '').replace(':8006', ''),
          port: "22",
          username: proxConfig.username,
          password: proxConfig.password,
          command: grepCommand,
        }, { withCredentials: false })
        
        const containerLine = findResponse.data.output?.trim()
        console.log('Found container line:', containerLine)
        
        // Extract VMID from the first column
        const containerId = containerLine ? containerLine.split(/\s+/)[0] : null
        console.log('Extracted container ID for shutdown:', containerId)
        
        if (containerId && containerId.match(/^\d+$/)) {
          // Shut down the LXC container gracefully
          const shutdownCommand = `pct shutdown ${containerId}`
          
          await axios.post('http://localhost:7789/execute', {
            host: proxConfig.host.replace('https://', '').replace(':8006', ''),
            port: "22",
            username: proxConfig.username,
            password: proxConfig.password,
            command: shutdownCommand,
          }, { withCredentials: false })
          
          console.log(`LXC container ${containerId} shutdown initiated`)
          
          // Play shutdown sound
          try {
            console.log('Playing shutdown sound...')
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
            const oscillator = audioContext.createOscillator()
            const gainNode = audioContext.createGain()
            
            oscillator.connect(gainNode)
            gainNode.connect(audioContext.destination)
            
            // Descending tone for shutdown
            oscillator.frequency.setValueAtTime(1200, audioContext.currentTime)
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1)
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2)
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.3)
            
            gainNode.gain.setValueAtTime(0.8, audioContext.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.1, audioContext.currentTime + 0.4)
            
            oscillator.start(audioContext.currentTime)
            oscillator.stop(audioContext.currentTime + 0.4)
            
            console.log('Shutdown sound played successfully')
          } catch (error) {
            console.log('Could not play shutdown sound:', error)
          }
          
          toast({
            title: "Server Shutdown! ⏹️",
            description: `Nucleus server "${name}" is being shut down gracefully.`,
            className: "bg-yellow-600/20 backdrop-blur-sm text-white border-yellow-500/30",
          })
        } else {
          toast({
            title: "Container Not Found",
            description: `Could not find LXC container for server "${name}"`,
            className: "bg-red-600/20 backdrop-blur-sm text-white border-red-500/30",
          })
        }
      }
    } catch (error) {
      console.error('Failed to shutdown server:', error)
      toast({
        title: "Error",
        description: "Failed to shutdown server",
        className: "bg-red-600/20 backdrop-blur-sm text-white border-red-500/30",
      })
    } finally {
      setIsLoadingShutdown(null)
    }
  }

  const handleStartServer = async (id: string, name: string) => {
    setIsLoadingStart(id)
    
    try {
      const server = servers.find(s => s.id === id)
      
      if (server?.type === "Nucleus Server") {
        // Get Proxmox server details
        const proxRes = await axios.get('http://localhost:7790/prox', { withCredentials: true })
        const proxConfigs: ProxConfig[] = proxRes.data
        
        if (proxConfigs.length === 0) {
          throw new Error('No Proxmox server configured')
        }
        
        const proxConfig = proxConfigs[0] // Use the first Proxmox server
        
        // Get all LXC containers and grep for the VMID
        const grepCommand = `pct list | grep "${name}"`
        
        console.log('Searching for container to start:', name)
        console.log('Using command:', grepCommand)
        
        const findResponse = await axios.post('http://localhost:7789/execute', {
          host: proxConfig.host.replace('https://', '').replace(':8006', ''),
          port: "22",
          username: proxConfig.username,
          password: proxConfig.password,
          command: grepCommand,
        }, { withCredentials: false })
        
        const containerLine = findResponse.data.output?.trim()
        console.log('Found container line:', containerLine)
        
        // Extract VMID from the first column
        const containerId = containerLine ? containerLine.split(/\s+/)[0] : null
        console.log('Extracted container ID for start:', containerId)
        
        if (containerId && containerId.match(/^\d+$/)) {
          // Start the LXC container
          const startCommand = `pct start ${containerId}`
          
          await axios.post('http://localhost:7789/execute', {
            host: proxConfig.host.replace('https://', '').replace(':8006', ''),
            port: "22",
            username: proxConfig.username,
            password: proxConfig.password,
            command: startCommand,
          }, { withCredentials: false })
          
          console.log(`LXC container ${containerId} start initiated`)
          
          // Play start sound
          try {
            console.log('Playing start sound...')
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
            const oscillator = audioContext.createOscillator()
            const gainNode = audioContext.createGain()
            
            oscillator.connect(gainNode)
            gainNode.connect(audioContext.destination)
            
            // Ascending tone for start
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime)
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1)
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.2)
            oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.3)
            
            gainNode.gain.setValueAtTime(0.8, audioContext.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.1, audioContext.currentTime + 0.4)
            
            oscillator.start(audioContext.currentTime)
            oscillator.stop(audioContext.currentTime + 0.4)
            
            console.log('Start sound played successfully')
          } catch (error) {
            console.log('Could not play start sound:', error)
          }
          
          toast({
            title: "Server Started! ▶️",
            description: `Nucleus server "${name}" is starting up.`,
            className: "bg-blue-600/20 backdrop-blur-sm text-white border-blue-500/30",
          })
        } else {
          toast({
            title: "Container Not Found",
            description: `Could not find LXC container for server "${name}"`,
            className: "bg-red-600/20 backdrop-blur-sm text-white border-red-500/30",
          })
        }
      }
    } catch (error) {
      console.error('Failed to start server:', error)
      toast({
        title: "Error",
        description: "Failed to start server",
        className: "bg-red-600/20 backdrop-blur-sm text-white border-red-500/30",
      })
    } finally {
      setIsLoadingStart(null)
    }
  }

  const handleOpenShell = async (id: string, name: string) => {
    try {
      const server = servers.find(s => s.id === id)
      
      if (server?.type === "Nucleus Server") {
        // Get Proxmox server details
        const proxRes = await axios.get('http://localhost:7790/prox', { withCredentials: true })
        const proxConfigs: ProxConfig[] = proxRes.data
        
        if (proxConfigs.length === 0) {
          throw new Error('No Engine server configured')
        }
        
        const proxConfig = proxConfigs[0] // Use the first Proxmox server
        
        // Get all LXC containers and grep for the VMID
        const grepCommand = `pct list | grep "${name}"`
        
        console.log('Searching for container to open shell:', name)
        console.log('Using command:', grepCommand)
        
        const findResponse = await axios.post('http://localhost:7789/execute', {
          host: proxConfig.host.replace('https://', '').replace(':8006', ''),
          port: "22",
          username: proxConfig.username,
          password: proxConfig.password,
          command: grepCommand,
        }, { withCredentials: false })
        
        const containerLine = findResponse.data.output?.trim()
        console.log('Found container line:', containerLine)
        
        // Extract VMID from the first column
        const containerId = containerLine ? containerLine.split(/\s+/)[0] : null
        console.log('Extracted container ID for shell:', containerId)
        
        if (containerId && containerId.match(/^\d+$/)) {
          // Get the actual hostname from Proxmox server using SSH
          const hostnameCommand = `hostname`
          
          try {
            const hostnameResponse = await axios.post('http://localhost:7789/execute', {
              host: proxConfig.host.replace('https://', '').replace(':8006', ''),
              port: "22",
              username: proxConfig.username,
              password: proxConfig.password,
              command: hostnameCommand,
            }, { withCredentials: false })
            
            const actualHostname = hostnameResponse.data.output?.trim()
            console.log('Engine hostname:', actualHostname)
            
            // Use the actual hostname, fallback to IP if command fails
            const nodeName = actualHostname || proxConfig.host.replace('https://', '').replace(':8006', '')
            
            // Construct the Proxmox console URL
            const consoleUrl = `https://${proxConfig.host.replace('https://', '').replace(':8006', '')}:8006/?console=lxc&xtermjs=1&vmid=${containerId}&vmname=${encodeURIComponent(name)}&node=${nodeName}&cmd=`
            
            console.log(`Opening Proxmox console: ${consoleUrl}`)
            
            // Open the console in a new tab
            window.open(consoleUrl, '_blank')
            
            toast({
              title: "Console Opened! 🖥️",
              description: `Engine console opened for container ${containerId} in a new tab.`,
              className: "bg-cyan-600/20 backdrop-blur-sm text-white border-cyan-500/30",
            })
            
          } catch (hostnameError) {
            console.error('Failed to get hostname, using IP address:', hostnameError)
            
            // Fallback: use IP address as hostname
            const ipAddress = proxConfig.host.replace('https://', '').replace(':8006', '')
            const consoleUrl = `https://${ipAddress}:8006/?console=lxc&xtermjs=1&vmid=${containerId}&vmname=${encodeURIComponent(name)}&node=${ipAddress}&cmd=`
            
            console.log(`Opening Engine console (fallback): ${consoleUrl}`)
            window.open(consoleUrl, '_blank')
            
            toast({
              title: "Console Opened! 🖥️",
              description: `Engine console opened for container ${containerId} in a new tab (using IP fallback).`,
              className: "bg-cyan-600/20 backdrop-blur-sm text-white border-yellow-500/30",
            })
          }
          
        } else {
          toast({
            title: "Container Not Found",
            description: `Could not find LXC container for server "${name}"`,
            className: "bg-red-600/20 backdrop-blur-sm text-white border-red-500/30",
          })
        }
      }
    } catch (error) {
      console.error('Failed to open shell:', error)
      toast({
        title: "Error",
        description: "Failed to open shell",
        className: "bg-red-600/20 backdrop-blur-sm text-white border-red-500/30",
      })
    }
  }

  const handleProxmoxSubmit = async (data: {
    id?: string
    name: string
    url: string
    username: string
    password?: string
  }) => {
    setIsLoadingAddEdit(true)
    
    try {
      // Extract host and port from URL
      const urlParts = data.url.replace(/https?:\/\//, '').split(':')
      const host = urlParts[0]
      const port = urlParts[1] || '8006'

      const proxData = {
        server_name: data.name,
        username: data.username,
        host: host,
        port: port,
        password: data.password || '',
      }

      if (data.id) {
        // Editing existing server
        const configId = data.id.replace('prox-', '')
        const response = await axios.put(`http://localhost:7790/prox/${configId}`, proxData, {
          withCredentials: true,
        })

        const updatedConfig: ProxConfig = response.data
        const updatedServer: ServerItem = {
          id: data.id,
          name: updatedConfig.server_name || data.name,
          type: "Proxmox Server",
          details: `${updatedConfig.host}:${updatedConfig.port}`,
          url: data.url,
          username: updatedConfig.username,
        }

        setServers((prev) =>
          prev.map((server) =>
            server.id === data.id ? updatedServer : server
          )
        )
        
        toast({
          title: "Engine Server Updated! 🔄",
          description: `Engine server "${data.name}" has been updated.`,
          className: "bg-blue-600/20 backdrop-blur-sm text-white border-blue-500/30",
        })
      } else {
        // Check if server with same host already exists
        const existingProxServers = servers.filter(s => s.type === "Proxmox Server")
        const isDuplicate = existingProxServers.some(server => 
          server.details?.includes(host)
        )

        if (isDuplicate) {
          toast({
            title: "Server Already Exists",
            description: `A Engine server with IP ${host} is already configured.`,
            className: "bg-yellow-600/20 backdrop-blur-sm text-white border-yellow-500/30",
          })
          return
        }

        // Adding new server
        const response = await axios.post('http://localhost:7790/prox', proxData, {
          withCredentials: true,
        })

        const newConfig: ProxConfig = response.data
        const newProxmoxServer: ServerItem = {
          id: `prox-${newConfig.ID}`,
          name: newConfig.server_name || data.name,
          type: "Proxmox Server",
          details: `${newConfig.host}:${newConfig.port}`,
          url: data.url,
          username: newConfig.username,
        }
        
        setServers((prev) => [...prev, newProxmoxServer])
        toast({
          title: "Engine Server Added! 🚀",
          description: `Engine server "${newProxmoxServer.name}" has been added.`,
          className: "bg-blue-600/20 backdrop-blur-sm text-white border-blue-500/30",
        })
      }
    } catch (error) {
      console.error('Failed to save prox  mox server:', error)
      toast({
        title: "Error",
        description: "Failed to save Proxmox server configuration",
        className: "bg-red-600/20 backdrop-blur-sm text-white border-red-500/30",
      })
    } finally {
      setIsLoadingAddEdit(false)
      setIsProxmoxModalOpen(false)
      setEditingProxmoxServer(null)
    }
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
            {/* Nucleus Servers */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  Nucleus Servers
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Your test and development servers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {servers.filter(s => s.type === "Nucleus Server").length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-400 mb-4">No Nucleus servers yet</p>
                    <Link href="/create-server">
                      <Button
                        variant="outline"
                        className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10 bg-transparent"
                      >
                        <Server className="w-4 h-4 mr-2" />
                        Create Your First Server
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {servers.filter(s => s.type === "Nucleus Server").map((server) => (
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenShell(server.id, server.name)}
                            className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 bg-transparent"
                            title="Open Shell"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="sr-only">Open Shell for {server.name}</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStartServer(server.id, server.name)}
                            disabled={isLoadingStart === server.id}
                            className="border-green-500/30 text-green-300 hover:bg-green-500/10 bg-transparent"
                          >
                            {isLoadingStart === server.id ? (
                              <Zap className="w-4 h-4 animate-spin" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                            <span className="sr-only">Start {server.name}</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShutdownServer(server.id, server.name)}
                            disabled={isLoadingShutdown === server.id}
                            className="border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/10 bg-transparent"
                          >
                            {isLoadingShutdown === server.id ? (
                              <Zap className="w-4 h-4 animate-spin" />
                            ) : (
                              <Power className="w-4 h-4" />
                            )}
                            <span className="sr-only">Shutdown {server.name}</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteServer(server.id, server.name)}
                            disabled={isLoadingDelete === server.id}
                            className="border-red-500/30 text-red-300 hover:bg-red-500/10 bg-transparent"
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
                    <div className="pt-4 border-t border-white/10">
                      <Link href="/create-server" className="w-full">
                        <Button
                          variant="outline"
                          className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10 bg-transparent w-full"
                        >
                          <PlusCircle className="w-4 h-4 mr-2" />
                          Create Another Server
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Proxmox Servers */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <HardDrive className="w-5 h-5" />
                  Engine Servers
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Your Engine server connections
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {servers.filter(s => s.type === "Proxmox Server").length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-400 mb-4">No Proxmox servers connected</p>
                    <Button
                      onClick={openAddProxmoxModal}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                    >
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Connect Proxmox Server
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {servers.filter(s => s.type === "Proxmox Server").map((server) => (
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditProxmoxModal(server)}
                            className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10 bg-transparent"
                          >
                            <Edit className="w-4 h-4" />
                            <span className="sr-only">Edit {server.name}</span>
                          </Button>
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
                    <div className="pt-4 border-t border-white/10">
                      <Button
                        onClick={openAddProxmoxModal}
                        disabled={servers.filter(s => s.type === "Proxmox Server").length >= 1}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white w-full disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        {servers.filter(s => s.type === "Proxmox Server").length >= 1 ? "One Server Limit" : "Add Another Server"}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
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

export default function ManageServersPage() {
  return (
    <AuthGuard>
      <ManageServersPageContent />
    </AuthGuard>
  )
}
