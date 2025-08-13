import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, Star } from 'lucide-react';

const CustomerInsights = () => {
  const insights = {
    totalCustomers: 892,
    newCustomersToday: 23,
    activeCustomers: 456,
    customerGrowth: 15.2,
    customerSatisfaction: 4.2,
    topRegions: [
      { name: 'São Paulo', customers: 234 },
      { name: 'Rio de Janeiro', customers: 156 },
      { name: 'Belo Horizonte', customers: 98 }
    ]
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Clientes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold">{insights.totalCustomers.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">+{insights.newCustomersToday}</p>
            <p className="text-sm text-muted-foreground">Novos hoje</p>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Principais Regiões</h4>
          {insights.topRegions.map((region, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-sm">{region.name}</span>
              <span className="text-sm font-medium">{region.customers}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium">Satisfação</span>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-yellow-600">{insights.customerSatisfaction}/5</p>
            <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
              Excelente
            </Badge>
          </div>
        </div>

        <div className="bg-green-50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">+{insights.customerGrowth}% crescimento</span>
          </div>
          <p className="text-xs text-green-700 mt-1">Este mês</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerInsights;
