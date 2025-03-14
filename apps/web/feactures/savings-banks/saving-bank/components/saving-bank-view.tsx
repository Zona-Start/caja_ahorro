import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from '@repo/shadcn/card';
import { SavingBankForm } from './saving-bank-form';
 
  export function SavingBankView() {
    return (
    
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
                Datos De la Caja de Ahorro
            </CardTitle>
            <CardDescription>
                Información general de la caja
            </CardDescription>
          </CardHeader>
          <CardContent>
          <SavingBankForm />
          </CardContent>
        </Card>

    );
  }
  