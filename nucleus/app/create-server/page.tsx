"use client"

import type React from "react"

import { useState } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Server, ArrowLeft, Zap, Settings, Clock, Monitor, Package } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { AuthGuard } from "@/components/auth-guard"

function CreateServerPageContent() {
  const [selectedPackages, setSelectedPackages] = useState<string[]>([])
  const [packageVersions, setPackageVersions] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [serverName, setServerName] = useState("")
  const [operatingSystem, setOperatingSystem] = useState("")
  const [cpuCores, setCpuCores] = useState("")
  const [memory, setMemory] = useState("")
  const [duration, setDuration] = useState("")
  const [rootDiskSize, setRootDiskSize] = useState("")

  const { toast } = useToast()

  // Available LXC templates for different distributions
  const availableTemplates = {
    ubuntu: {
      name: "Ubuntu",
      template: "local:vztmpl/ubuntu-22.04-standard_22.04-1_amd64.tar.zst"
    },
  }

  const packages = [
    // Core Development Tools
    {
      id: "build-essential",
      name: "build-essential",
      description: "GCC, make, and other build tools",
      category: "Core Development Tools",
      versions: ["latest", "12.9.0", "11.4.0"],
    },
    {
      id: "python3",
      name: "Python3",
      description: "Python programming language",
      category: "Core Development Tools",
      versions: ["latest", "3.11", "3.10", "3.9"],
    },
    {
      id: "python3-pip",
      name: "Python3-pip",
      description: "Python package installer",
      category: "Core Development Tools",
      versions: ["latest", "22.0.2", "20.0.2"],
    },
    {
      id: "nodejs",
      name: "Node.js",
      description: "JavaScript runtime",
      category: "Core Development Tools",
      versions: ["latest", "20.x", "18.x", "16.x"],
    },
    {
      id: "npm",
      name: "NPM",
      description: "Node package manager",
      category: "Core Development Tools",
      versions: ["latest", "10.x", "9.x", "8.x"],
    },
    {
      id: "yarn",
      name: "Yarn",
      description: "Fast package manager",
      category: "Core Development Tools",
      versions: ["latest", "1.22.x", "3.x"],
    },
    {
      id: "golang",
      name: "Go",
      description: "Go programming language",
      category: "Core Development Tools",
      versions: ["latest", "1.21", "1.20", "1.19"],
    },
    {
      id: "php",
      name: "PHP",
      description: "PHP programming language",
      category: "Core Development Tools",
      versions: ["latest", "8.2", "8.1", "7.4"],
    },
    {
      id: "composer",
      name: "Composer",
      description: "PHP dependency manager",
      category: "Core Development Tools",
      versions: ["latest", "2.6", "2.5"],
    },

    // Containerization & Virtualization
    {
      id: "docker",
      name: "Docker",
      description: "Container platform",
      category: "Containerization & Virtualization",
      versions: ["latest", "24.0", "23.0", "20.10"],
    },
    {
      id: "docker-compose",
      name: "Docker Compose",
      description: "Multi-container Docker applications",
      category: "Containerization & Virtualization",
      versions: ["latest", "2.21", "2.20", "1.29"],
    },
    {
      id: "kubernetes",
      name: "Kubernetes",
      description: "Container orchestration (kubectl)",
      category: "Containerization & Virtualization",
      versions: ["latest", "1.28", "1.27", "1.26"],
    },

    // Web Servers
    {
      id: "nginx",
      name: "Nginx",
      description: "High-performance web server",
      category: "Web Servers",
      versions: ["latest", "1.24", "1.22", "1.20"],
    },
    {
      id: "apache2",
      name: "Apache2",
      description: "HTTP server",
      category: "Web Servers",
      versions: ["latest", "2.4.57", "2.4.52"],
    },

    // DevOps
    {
      id: "ansible",
      name: "Ansible",
      description: "Automation and configuration management",
      category: "DevOps",
      versions: ["latest", "8.5", "7.7", "6.7"],
    },
    {
      id: "terraform",
      name: "Terraform",
      description: "Infrastructure as code",
      category: "DevOps",
      versions: ["latest", "1.6", "1.5", "1.4"],
    },

    // Security & Networking
    {
      id: "ufw",
      name: "UFW",
      description: "Uncomplicated Firewall",
      category: "Security & Networking",
      versions: ["latest", "0.36", "0.35"],
    },

    // Monitoring & Debugging
    {
      id: "htop",
      name: "htop",
      description: "Interactive process viewer",
      category: "Monitoring & Debugging",
      versions: ["latest", "3.2.2", "3.0.5"],
    },
    {
      id: "nmon",
      name: "nmon",
      description: "System performance monitor",
      category: "Monitoring & Debugging",
      versions: ["latest", "16p", "16o"],
    },

    // Version Control & CI/CD
    {
      id: "git",
      name: "Git",
      description: "Version control system",
      category: "Version Control & CI/CD",
      versions: ["latest", "2.42", "2.40", "2.34"],
    },
    {
      id: "jenkins",
      name: "Jenkins",
      description: "CI/CD server",
      category: "Version Control & CI/CD",
      versions: ["latest", "2.426", "2.414", "2.401"],
    },

    // Editors & Terminals
    {
      id: "vim",
      name: "Vim",
      description: "Text editor",
      category: "Editors & Terminals",
      versions: ["latest", "9.0", "8.2"],
    },
    {
      id: "nano",
      name: "Nano",
      description: "Simple text editor",
      category: "Editors & Terminals",
      versions: ["latest", "7.2", "6.4"],
    },
    {
      id: "zsh",
      name: "Zsh",
      description: "Advanced shell",
      category: "Editors & Terminals",
      versions: ["latest", "5.9", "5.8"],
    },

    // Miscellaneous Utilities
    {
      id: "curl",
      name: "cURL",
      description: "Data transfer tool",
      category: "Miscellaneous Utilities",
      versions: ["latest", "8.4", "7.88", "7.81"],
    },
    {
      id: "wget",
      name: "wget",
      description: "Web file downloader",
      category: "Miscellaneous Utilities",
      versions: ["latest", "1.21", "1.20"],
    },
    {
      id: "unzip",
      name: "unzip",
      description: "Archive extraction tool",
      category: "Miscellaneous Utilities",
      versions: ["latest", "6.0", "5.52"],
    },
    {
      id: "zip",
      name: "zip",
      description: "Archive creation tool",
      category: "Miscellaneous Utilities",
      versions: ["latest", "3.0", "2.32"],
    },
    {
      id: "rsync",
      name: "rsync",
      description: "File synchronization tool",
      category: "Miscellaneous Utilities",
      versions: ["latest", "3.2.7", "3.1.3"],
    },
  ]

  // Group packages by category
  const packagesByCategory = packages.reduce(
    (acc, pkg) => {
      if (!acc[pkg.category]) {
        acc[pkg.category] = []
      }
      acc[pkg.category].push(pkg)
      return acc
    },
    {} as Record<string, typeof packages>,
  )

  const togglePackage = (packageId: string) => {
    setSelectedPackages((prev) => {
      if (prev.includes(packageId)) {
        // Remove package and its version
        const newVersions = { ...packageVersions }
        delete newVersions[packageId]
        setPackageVersions(newVersions)
        return prev.filter((id) => id !== packageId)
      } else {
        // Add package with default version
        setPackageVersions((prevVersions) => ({
          ...prevVersions,
          [packageId]: "latest",
        }))
        return [...prev, packageId]
      }
    })
  }

  const updatePackageVersion = (packageId: string, version: string) => {
    setPackageVersions((prev) => ({
      ...prev,
      [packageId]: version,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate required fields
      if (!operatingSystem) {
        toast({
          title: "Missing Operating System",
          description: "Please select an operating system distribution",
          className: "bg-red-600/20 backdrop-blur-sm text-white border-red-500/30",
        })
        setIsLoading(false)
        return
      }



      if (!cpuCores || !memory || !rootDiskSize) {
        toast({
          title: "Missing Server Specifications",
          description: "Please fill in CPU cores, memory, and root disk size",
          className: "bg-red-600/20 backdrop-blur-sm text-white border-red-500/30",
        })
        setIsLoading(false)
        return
      }

      // First save the server configuration to lxc-service
      const payload = {
        name: serverName || "my-test-server",
        packages: packageVersions,
      }

      await axios.post(
        "http://localhost:7402/lxc",
        payload,
        { withCredentials: true, validateStatus: (s) => s >= 200 && s < 300 },
      )

      // Get Proxmox server details to create LXC
      try {
        const proxRes = await axios.get('http://localhost:7790/prox', { withCredentials: true })
        const prox = Array.isArray(proxRes.data) && proxRes.data.length > 0 ? proxRes.data[0] : null
        
        if (prox) {
          // Generate unique CTID (container ID)
          const ctid = Math.floor(Math.random() * 900) + 100 // Random ID between 100-999
          
          // Get the selected template based on OS
          const selectedTemplate = availableTemplates[operatingSystem as keyof typeof availableTemplates]?.template
          
          if (!selectedTemplate) {
            throw new Error(`Template not found for ${operatingSystem}`)
          }
          
          // Use form values for memory, cores, and other settings
          const memoryValue = parseInt(memory)
          const coresValue = parseInt(cpuCores)
          const diskSizeValue = parseInt(rootDiskSize)
          
          // Create the pct command based on the script with dynamic values
          // Use default bridge configuration
          const networkConfig = "name=eth0,bridge=vmbr0,type=veth"
          
          // Create and start the container
          // Use the actual server name as hostname for easier identification
          const serverHostname = serverName || `server-${ctid}`
          const createCommand = `pct create ${ctid} ${selectedTemplate} -memory ${memoryValue} -cores ${coresValue} -hostname "${serverHostname}" -rootfs local-lvm:${diskSizeValue} -password "root123" -unprivileged 1 -net0 ${networkConfig} && pct start ${ctid}`
          
          // Log the create command for debugging
          console.log('Create Command:', createCommand)
          
          // Execute the create command via ssh-service
          const createResponse = await axios.post('http://localhost:7789/execute', {
            host: prox.host.replace('https://', '').replace(':8006', ''), // Extract IP from URL
            port: "22", // SSH port
            username: prox.username,
            password: prox.password, // Note: This should be handled securely in production
            command: createCommand,
          }, { withCredentials: false })
          
          // Wait a moment for the container to fully start
          await new Promise(resolve => setTimeout(resolve, 5000))
          
          // Install selected packages if any
          if (Object.keys(packageVersions).length > 0) {
            const packagesToInstall = Object.entries(packageVersions).map(([pkgName, version]) => {
              if (version === 'latest') {
                return pkgName
              } else {
                // For specific versions, we'll need to handle different package managers
                return `${pkgName}=${version}`
              }
            }).join(' ')
            
            const installCommand = `pct exec ${ctid} -- apt update && pct exec ${ctid} -- apt install -y ${packagesToInstall}`
            
            console.log('Install Command:', installCommand)
            
            // Execute the install command
            const installResponse = await axios.post('http://localhost:7789/execute', {
              host: prox.host.replace('https://', '').replace(':8006', ''), // Extract IP from URL
              port: "22", // SSH port
              username: prox.username,
              password: prox.password,
              command: installCommand,
            }, { withCredentials: false })
            
            console.log('Package installation completed')
          }
          
          const selectedDistro = availableTemplates[operatingSystem as keyof typeof availableTemplates]?.name
          
          // Play success sound
          try {
            console.log('Playing success sound...')
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
            const oscillator = audioContext.createOscillator()
            const gainNode = audioContext.createGain()
            
            oscillator.connect(gainNode)
            gainNode.connect(audioContext.destination)
            
            // Make it much louder and longer
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.2)
            oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.4)
            oscillator.frequency.setValueAtTime(1400, audioContext.currentTime + 0.6)
            
            // Much higher volume - start at 80% and fade slowly
            gainNode.gain.setValueAtTime(0.8, audioContext.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.1, audioContext.currentTime + 0.8)
            
            oscillator.start(audioContext.currentTime)
            oscillator.stop(audioContext.currentTime + 0.8)
            
            console.log('Sound started successfully')
          } catch (error) {
            console.log('Could not play sound:', error)
            
            // Fallback: try to play a simple beep
            try {
              const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
              const oscillator = audioContext.createOscillator()
              const gainNode = audioContext.createGain()
              
              oscillator.connect(gainNode)
              gainNode.connect(audioContext.destination)
              
              oscillator.frequency.setValueAtTime(1000, audioContext.currentTime)
              gainNode.gain.setValueAtTime(1.0, audioContext.currentTime) // Maximum volume
              
              oscillator.start(audioContext.currentTime)
              oscillator.stop(audioContext.currentTime + 0.5)
              
              console.log('Fallback sound played')
            } catch (fallbackError) {
              console.log('Fallback sound also failed:', fallbackError)
            }
          }
          
          toast({
            title: "LXC Container Created! 🐳",
            description: `${selectedDistro} container ${ctid} created successfully with packages installed on Proxmox server`,
            className: "bg-green-600/20 backdrop-blur-sm text-white border-green-500/30",
          })
        } else {
          toast({
            title: "No Proxmox Server Found",
            description: "Please configure a Proxmox server first in the Manage page",
            className: "bg-yellow-600/20 backdrop-blur-sm text-white border-yellow-500/30",
          })
        }
      } catch (sshError) {
        console.error('SSH/LXC creation error:', sshError)
        toast({
          title: "LXC Creation Failed",
          description: "Failed to create LXC container on Proxmox server",
          className: "bg-red-600/20 backdrop-blur-sm text-white border-red-500/30",
        })
      }

      toast({
        title: "Server Saved! 🚀",
        description: "Your server configuration was saved.",
        className: "bg-blue-600/20 backdrop-blur-sm text-white border-blue-500/30",
      })
    } catch (err) {
      console.error('Error saving server:', err)
      toast({
        title: "Error",
        description: "Failed to save server configuration",
        className: "bg-red-600/20 backdrop-blur-sm text-white border-red-500/30",
      })
    } finally {
      setIsLoading(false)
    }
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
        <div className="ml-auto flex items-center gap-4">
          <Link
            href="/manage"
            className="flex items-center gap-2 text-sm font-medium hover:text-blue-400 transition-colors"
          >
            <Server className="w-4 h-4" />
            Manage Servers
          </Link>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium hover:text-blue-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Create Server Form */}
      <section className="relative z-10 px-4 py-8">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold mb-4">
              Create{" "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Test Server
              </span>
            </h1>
            <p className="text-slate-300 text-lg">Configure your automatic test server deployment</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Configuration */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  Basic Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="server-name" className="text-white">
                    Server Name
                  </Label>
                  <Input
                    id="server-name"
                    placeholder="my-test-server"
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-500"
                    value={serverName}
                    onChange={(e) => setServerName(e.target.value)}
                  />
                </div>

          
              </CardContent>
            </Card>

            {/* Operating System */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  Operating System
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Choose the distribution for your server
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="os" className="text-white">
                      Distribution
                    </Label>
                    <Select value={operatingSystem} onValueChange={setOperatingSystem}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-blue-500">
                        <SelectValue placeholder="Select Distribution" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white z-50">
                        {Object.entries(availableTemplates).map(([key, distro]) => (
                          <SelectItem key={key} value={key} className="text-white hover:bg-slate-700 focus:bg-slate-700">
                            {distro.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>



            {/* Server Specifications */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Server Specifications
                </CardTitle>
                <CardDescription className="text-slate-300">Configure the hardware specifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cpu" className="text-white">
                      CPU Cores
                    </Label>
                    <Select value={cpuCores} onValueChange={setCpuCores}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-blue-500">
                        <SelectValue placeholder="Select CPU" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white z-50">
                        <SelectItem value="1" className="text-white hover:bg-slate-700 focus:bg-slate-700">1 Core</SelectItem>
                        <SelectItem value="2" className="text-white hover:bg-slate-700 focus:bg-slate-700">2 Cores</SelectItem>
                        <SelectItem value="4" className="text-white hover:bg-slate-700 focus:bg-slate-700">4 Cores</SelectItem>
                        <SelectItem value="8" className="text-white hover:bg-slate-700 focus:bg-slate-700">8 Cores</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="memory" className="text-white">
                      Memory (RAM)
                    </Label>
                    <Select value={memory} onValueChange={setMemory}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-blue-500">
                        <SelectValue placeholder="Select RAM" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white z-50">
                        <SelectItem value="512" className="text-white hover:bg-slate-700 focus:bg-slate-700">512 MB</SelectItem>
                        <SelectItem value="1024" className="text-white hover:bg-slate-700 focus:bg-slate-700">1 GB</SelectItem>
                        <SelectItem value="2048" className="text-white hover:bg-slate-700 focus:bg-slate-700">2 GB</SelectItem>
                        <SelectItem value="4096" className="text-white hover:bg-slate-700 focus:bg-slate-700">4 GB</SelectItem>
                        <SelectItem value="8192" className="text-white hover:bg-slate-700 focus:bg-slate-700">8 GB</SelectItem>
                        <SelectItem value="16384" className="text-white hover:bg-slate-700 focus:bg-slate-700">16 GB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="root-disk" className="text-white">
                      Root Disk Size (GB)
                    </Label>
                    <Select value={rootDiskSize} onValueChange={setRootDiskSize}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-blue-500">
                        <SelectValue placeholder="Select Disk Size" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white z-50">
                        <SelectItem value="4" className="text-white hover:bg-slate-700 focus:bg-slate-700">4 GB</SelectItem>
                        <SelectItem value="8" className="text-white hover:bg-slate-700 focus:bg-slate-700">8 GB</SelectItem>
                        <SelectItem value="16" className="text-white hover:bg-slate-700 focus:bg-slate-700">16 GB</SelectItem>
                        <SelectItem value="32" className="text-white hover:bg-slate-700 focus:bg-slate-700">32 GB</SelectItem>
                        <SelectItem value="64" className="text-white hover:bg-slate-700 focus:bg-slate-700">64 GB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>



            {/* Packages */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Packages & Technologies
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Select the packages and technologies to install on your server
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(packagesByCategory).map(([category, categoryPackages]) => (
                    <div key={category} className="space-y-3">
                      <h3 className="text-lg font-semibold text-white border-b border-white/20 pb-2">{category}</h3>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {categoryPackages.map((pkg) => (
                          <div
                            key={pkg.id}
                            className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                          >
                            <div className="flex items-start space-x-3">
                              <Checkbox
                                id={pkg.id}
                                checked={selectedPackages.includes(pkg.id)}
                                onCheckedChange={() => togglePackage(pkg.id)}
                                className="mt-1 border-white/30 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                              />
                              <div className="flex-1 min-w-0">
                                <Label htmlFor={pkg.id} className="text-white font-medium cursor-pointer text-sm">
                                  {pkg.name}
                                </Label>
                                <p className="text-xs text-slate-400 mt-1">{pkg.description}</p>
                              </div>
                            </div>
                            {selectedPackages.includes(pkg.id) && (
                              <div className="mt-3 ml-7">
                                <Label className="text-xs text-slate-300 mb-1 block">Version</Label>
                                <Select
                                  value={packageVersions[pkg.id] || "latest"}
                                  onValueChange={(value) => updatePackageVersion(pkg.id, value)}
                                >
                                  <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-blue-500 h-8 text-xs w-full">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-slate-800 border-slate-700 text-white z-50">
                                    {pkg.versions.map((version) => (
                                      <SelectItem key={version} value={version} className="text-xs text-white hover:bg-slate-700 focus:bg-slate-700">
                                        {version}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Server Lifetime */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Server Lifetime
                </CardTitle>

              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-white">
                      Duration
                    </Label>
                    <Select value={duration} onValueChange={setDuration}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-blue-500">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white z-50">
                        <SelectItem value="1h" className="text-white hover:bg-slate-700 focus:bg-slate-700">1 Hour</SelectItem>
                        <SelectItem value="6h" className="text-white hover:bg-slate-700 focus:bg-slate-700">6 Hours</SelectItem>
                        <SelectItem value="12h" className="text-white hover:bg-slate-700 focus:bg-slate-700">12 Hours</SelectItem>
                        <SelectItem value="24h" className="text-white hover:bg-slate-700 focus:bg-slate-700">24 Hours</SelectItem>
                        <SelectItem value="7d" className="text-white hover:bg-slate-700 focus:bg-slate-700">7 Days</SelectItem>
                        <SelectItem value="30d" className="text-white hover:bg-slate-700 focus:bg-slate-700">30 Days</SelectItem>
                        <SelectItem value="permanent" className="text-white hover:bg-slate-700 focus:bg-slate-700">Permanent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-center">
              <Button
                type="submit"
                disabled={isLoading}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-12"
              >
                {isLoading ? (
                  <>
                    <Zap className="w-4 h-4 mr-2 animate-spin" />
                    Creating Server...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Create Test Server
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </section>
    </div>
  )
}

export default function CreateServerPage() {
  return (
    <AuthGuard>
      <CreateServerPageContent />
    </AuthGuard>
  )
}
