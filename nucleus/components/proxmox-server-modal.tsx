"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, Server } from "lucide-react";

interface ProxmoxServerModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: {
    id?: string;
    name: string;
    url?: string;
    username?: string;
  } | null;
  onSubmit: (data: {
    id?: string;
    name: string;
    url: string;
    username: string;
    password?: string;
  }) => Promise<void>;
  isLoading: boolean;
}

export function ProxmoxServerModal({
  isOpen,
  onOpenChange,
  initialData,
  onSubmit,
  isLoading,
}: ProxmoxServerModalProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      // Extract IP from URL for editing
      const extractedUrl = initialData.url 
        ? initialData.url.replace(/https?:\/\//, '').replace(':8006', '').replace(/\/.*$/, '')
        : "";
      setUrl(extractedUrl);
      setUsername(initialData.username || "");
      setPassword("");
    } else {
      setName("");
      setUrl("");
      setUsername("");
      setPassword("");
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert IP to full URL format
    const fullUrl = url.startsWith('http') ? url : `https://${url}:8006`;
    
    await onSubmit({
      id: initialData?.id,
      name,
      url: fullUrl,
      username,
      password: password || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            {initialData ? "Edit Proxmox Server" : "Add Proxmox Server"}
          </DialogTitle>
          <DialogDescription className="text-slate-300">
            {initialData
              ? "Update the Proxmox server connection details."
              : "Configure a new Proxmox server connection."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">
              Server Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Proxmox Host 01"
              className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url" className="text-white">
              Server IP
            </Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="192.168.1.100"
              className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-500"
              required
            />
            <p className="text-xs text-slate-400">Enter the IP address of your Proxmox server</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username" className="text-white">
              Username
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="root@pam"
              className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={initialData ? "Leave empty to keep current password" : "Enter password"}
              className="bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:border-blue-500"
              required={!initialData}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              {isLoading ? (
                <>
                  <Zap className="w-4 h-4 mr-2 animate-spin" />
                  {initialData ? "Updating..." : "Adding..."}
                </>
              ) : (
                <>
                  <Server className="w-4 h-4 mr-2" />
                  {initialData ? "Update Server" : "Add Server"}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
