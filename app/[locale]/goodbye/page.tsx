'use client'
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function GoodbyePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center space-y-6 shadow-lg">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <span className="text-4xl">👋</span>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Até logo!
          </h1>
          <p className="text-gray-600">
            Sua assinatura foi encerrada com sucesso. Foi um prazer ter você conosco!
            Esperamos te ver novamente em breve na FluencyLab School.
          </p>
        </div>

        <div className="pt-4 border-t">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.location.href = '/'}
          >
            Voltar para a Home
          </Button>
        </div>
      </Card>
    </div>
  );
}
