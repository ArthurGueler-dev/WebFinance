"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function WelcomeHeader() {
  const { data: session } = useSession();
  const [greeting, setGreeting] = useState("");
  const [dateString, setDateString] = useState("");
  
  useEffect(() => {
    // Define a saudação com base na hora do dia
    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) return "Bom dia";
      if (hour >= 12 && hour < 18) return "Boa tarde";
      return "Boa noite";
    };
    
    // Define a string da data: dia da semana + número do dia + mês
    const getDateString = () => {
      const date = new Date();
      
      // Dias da semana em português
      const weekdays = [
        "domingo", "segunda-feira", "terça-feira", 
        "quarta-feira", "quinta-feira", "sexta-feira", "sábado"
      ];
      
      // Meses em português
      const months = [
        "janeiro", "fevereiro", "março", "abril", "maio", "junho",
        "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
      ];
      
      const weekday = weekdays[date.getDay()];
      const day = date.getDate();
      const month = months[date.getMonth()];
      
      return `${weekday}, ${day} de ${month}`;
    };
    
    setGreeting(getGreeting());
    setDateString(getDateString());
    
    // Atualiza a cada minuto para manter a saudação correta
    const interval = setInterval(() => {
      setGreeting(getGreeting());
      setDateString(getDateString());
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  const firstName = session?.user?.name?.split(" ")[0] || "Usuário";
  
  return (
    <div className="mb-4 bg-gradient-to-r from-primary/5 to-transparent p-3 rounded-lg">
      <h1 className="text-xl font-semibold tracking-tight text-primary/90">
        {greeting}, <span className="font-bold">{firstName}</span>!
      </h1>
      <p className="text-sm font-medium text-muted-foreground">
        {dateString}
      </p>
    </div>
  );
} 