"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { CameraIcon, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

export default function UserProfileButton() {
  const { data: session } = useSession();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  
  // Inicializa a imagem do perfil - em produção, você buscaria isso do banco de dados
  useEffect(() => {
    const savedImage = localStorage.getItem("profileImage");
    if (savedImage) {
      setImageUrl(savedImage);
    }
  }, []);

  // Função para lidar com o upload da imagem
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImageUrl(result);
        localStorage.setItem("profileImage", result);
        toast({
          title: "Foto atualizada",
          description: "Sua foto de perfil foi atualizada com sucesso.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Obtem as iniciais do nome do usuário para o fallback do avatar
  const getUserInitials = () => {
    if (!session?.user?.name) return "U";
    return session.user.name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
            <Avatar>
              <AvatarImage src={imageUrl} alt={session?.user?.name || "User"} />
              <AvatarFallback>{getUserInitials()}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Meu Perfil</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsProfileOpen(true)}>
            <CameraIcon className="mr-2 h-4 w-4" />
            <span>Alterar foto</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Foto de perfil</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={imageUrl} alt={session?.user?.name || "User"} />
              <AvatarFallback className="text-lg">{getUserInitials()}</AvatarFallback>
            </Avatar>
            <label htmlFor="profile-image" className="cursor-pointer">
              <div className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-primary-foreground">
                <CameraIcon className="h-4 w-4" />
                <span>Selecionar imagem</span>
              </div>
              <Input
                id="profile-image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 