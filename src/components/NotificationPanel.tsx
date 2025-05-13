"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface Notification {
  id: string;
  title: string;
  message: string;
  date: Date;
  read: boolean;
}

export default function NotificationPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      title: "Bem-vindo ao WebFinance",
      message: "Obrigado por usar nosso sistema de finanças pessoais!",
      date: new Date(),
      read: false,
    }
  ]);

  const unreadCount = notifications.filter(note => !note.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(note => 
        note.id === id ? { ...note, read: true } : note
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(note => ({ ...note, read: true }))
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-4 py-2 font-medium">
          <span>Notificações</span>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead} 
              className="text-xs"
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((note) => (
              <DropdownMenuItem 
                key={note.id} 
                className={`flex flex-col items-start px-4 py-3 ${note.read ? '' : 'bg-muted/50'}`}
                onClick={() => markAsRead(note.id)}
              >
                <div className="flex w-full justify-between">
                  <span className="font-medium">{note.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(note.date).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{note.message}</p>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="px-4 py-3 text-center text-sm text-muted-foreground">
              Nenhuma notificação
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 