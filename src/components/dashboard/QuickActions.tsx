import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Bot, 
  MessageSquare, 
  Settings, 
  Users,
  Send,
  BarChart3,
  FileText,
  Download
} from 'lucide-react';

const QuickActions = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Ações Rápidas</CardTitle>
        <CardDescription>
          Tarefas comuns e recursos úteis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <Link to="/agents/new">
            <Button variant="outline" className="w-full justify-start">
              <Bot className="mr-2 h-4 w-4" />
              Criar Novo Agente
            </Button>
          </Link>
          
          <Link to="/follow-ups/create">
            <Button variant="outline" className="w-full justify-start">
              <Send className="mr-2 h-4 w-4" />
              Criar Follow-up
            </Button>
          </Link>
          
          <Link to="/integrations/whatsapp/new">
            <Button variant="outline" className="w-full justify-start">
              <MessageSquare className="mr-2 h-4 w-4" />
              Conectar WhatsApp
            </Button>
          </Link>
          
          <Link to="/customers">
            <Button variant="outline" className="w-full justify-start">
              <Users className="mr-2 h-4 w-4" />
              Gerenciar Clientes
            </Button>
          </Link>
          
          <Link to="/conversations">
            <Button variant="outline" className="w-full justify-start">
              <BarChart3 className="mr-2 h-4 w-4" />
              Ver Conversas
            </Button>
          </Link>
          
          <Link to="/customers/export-xlsx">
            <Button variant="outline" className="w-full justify-start">
              <Download className="mr-2 h-4 w-4" />
              Exportar Dados
            </Button>
          </Link>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg mt-4">
          <h4 className="font-medium mb-2 text-blue-900">💡 Dica do Dia</h4>
          <p className="text-sm text-blue-800 mb-3">
            Configure follow-ups automáticos para melhorar o engajamento com seus clientes e aumentar a taxa de conversão.
          </p>
          <Link to="/follow-ups">
            <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700">
              <FileText className="mr-2 h-4 w-4" />
              Ver Follow-ups
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
