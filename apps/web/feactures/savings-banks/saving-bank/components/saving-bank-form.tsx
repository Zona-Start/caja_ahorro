'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/shadcn/button';
import { Input } from '@repo/shadcn/input'
import { Label } from '@repo/shadcn/label'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
  } from '@repo/shadcn/form';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { SavingBankFormValue, savingFormSchema } from '../schemas/saving-bank';


export function SavingBankForm() {
    const [loading, startTransition] = useTransition();
    const [error, SetError] = useState<string | null>(null);
    const defaultValues = {
        id: 0,
        name: '',
        rif: '',
        address: '',
        phone: '',
        email: '',
        personContact: '',
        phoneContact: '',
    };
    const form = useForm<SavingBankFormValue>({
        resolver: zodResolver(savingFormSchema),
        defaultValues,
    })
    const onSubmit = async (data: SavingBankFormValue) => {
        startTransition(async () => {
          try {
            console.log(data);
            
            toast.success('Ingreso Exitoso!');
          } catch (error) {
            toast.error('Hubo un error');
          }
        });
      };

    
    return (
        <>
        <div className='flex flex-col justify-center gap-4 p-4'>
            <div className="grid grid-col-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
                <div className='item-end justify-end'><Label>Razón Social </Label></div>
                <div className='item-end justify-end'><Label>Caprebicentenario</Label></div>

            </div>
            <div className="grid grid-col-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
                <div className='item-end justify-end'><Label>RIF</Label></div>
                <div className='item-end justify-end'><Label>J-35353454543</Label></div>
            </div>
            <div className="grid grid-col-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
                <div className='item-end justify-end'><Label>Dirección</Label></div>
                <div className='item-end justify-end'><Label>Altamira</Label></div>

            </div>
            <div className="grid grid-col-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
                <div className='item-end justify-end'><Label>Teléfono Caja </Label></div>
                <div className='item-end justify-end'><Label>No Registra</Label></div>
            </div>
            <div className="grid grid-col-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
                <div className='item-end justify-end'><Label>Email Caja </Label></div>
                <div className='item-end justify-end'><Label>No Registra</Label></div>
            </div>
            <div className="grid grid-col-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
                <div className='item-end justify-end'><Label>Persona de Contacto</Label></div>
                <div className='item-end justify-end'><Label>No Registra</Label></div>
            </div>
            <div className="grid grid-col-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
                <div className='item-end justify-end'><Label>Teléfono Contacto</Label></div>
                <div className='item-end justify-end'><Label>No Registra</Label></div>
            </div>
        </div>
        
      
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full space-y-2"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Razón Social</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
  
            <FormField
              control={form.control}
              name="rif"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rif</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono Caja</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo Electronico Caja</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="personContact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Persona de Contacto</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="phoneContact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono de Contacto</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && <FormMessage>{error}</FormMessage>}
            <Button disabled={loading}  className="w-full">
              Cancelar
            </Button>
            <Button disabled={loading} type="submit" className="w-full">
              Guardar
            </Button>
          </form>
        </Form>
      </>

    );
  }
  