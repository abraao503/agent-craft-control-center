import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, MessageSquare, UserPlus, Bot, Send, CheckCircle, Clock } from 'lucide-react';

const RecentActivity = () => {
  const activities = [
    {
      id: 'act-001',
      type: 'new_conversation',
      title: 'Nova conversa iniciada',
      description: 'Cliente iniciou conversa com HealthBot',
      timestamp: '10:30',
      icon: MessageSquare,
      iconColor: 'text-blue-600'
    },
    {
      id: 'act-002',
      type: 'follow_up_sent',
      title: 'Follow-up enviado',
      description: 'Mensagem enviada para 23 clientes',
      timestamp: '10:15',
      icon: Send,
      iconColor: 'text-green-600'
    },
    {
      id: 'act-003',
      type: 'new_customer',
      title: 'Novo cliente',
      description: 'João Silva foi registrado',
      timestamp: '10:00',
      icon: UserPlus,
      iconColor: 'text-purple-600'
    },
    {
      id: 'act-004',
      type: 'agent_activated',
      title: 'Agente ativado',
      description: 'SalesAssistant foi ativado',
      timestamp: '09:45',
      icon: Bot,
      iconColor: 'text-indigo-600'
    },
    {
      id: 'act-005',
      type: 'conversation_resolved',
      title: 'Conversa resolvida',
      description: 'Atendimento finalizado com sucesso',
      timestamp: '09:30',
      icon: CheckCircle,
      iconColor: 'text-green-600'
    }
  ];

  const getActivityBadge = (type: string) => {
    switch (type) {
      case 'new_conversation':
        return <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Conversa</Badge>;
      case 'follow_up_sent':
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Follow-up</Badge>;
      case 'new_customer':
        return <Badge variant="default" className="bg-purple-100 text-purple-800 hover:bg-purple-100">Cliente</Badge>;
      case 'agent_activated':
        return <Badge variant="default" className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100">Agente</Badge>;
      case 'conversation_resolved':
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Resolvido</Badge>;
      default:
        return <Badge variant="secondary">Atividade</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Atividade Recente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity) => {
            const IconComponent = activity.icon;
            return (
              <div key={activity.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className={`p-2 rounded-full bg-gray-100 ${activity.iconColor}`}>
                  <IconComponent className="w-4 h-4" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium">{activity.title}</h4>
                    {getActivityBadge(activity.type)}
                  </div>
                  <p className="text-xs text-muted-foreground">{activity.description}</p>
                </div>
                
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{activity.timestamp}</span>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h5 className="font-medium text-blue-900 mb-2">📊 Resumo de Hoje</h5>
          <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <p><strong>12</strong> conversas</p>
              <p><strong>23</strong> follow-ups</p>
            </div>
            <div>
              <p><strong>8</strong> resolvidas</p>
              <p><strong>5</strong> clientes</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
