
import { Card, CardContent, CardHeader, CardTitle  } from '../components/ui/card';

export function Validation() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Validation</h1>
      <Card>
        <CardHeader>
          <CardTitle>Validation en attente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">✅ Aucune validation en attente</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}