import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import MainLayout from "@/components/layout/MainLayout";
import { getCustomerById } from "@/services/customer";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Phone } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const CustomerDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    data: customer,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => getCustomerById(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load customer details. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const handleBack = () => {
    navigate("/customers");
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleBack}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">
            Customer Details
          </h1>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-12 bg-muted rounded animate-pulse" />
            <div className="h-64 bg-muted rounded animate-pulse" />
          </div>
        ) : customer ? (
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  {customer.phone}
                </CardTitle>
                <CardDescription>
                  Created on {formatDate(customer.createdAt)}
                  <br />
                  Last updated on {formatDate(customer.updatedAt)}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Custom Fields</CardTitle>
                <CardDescription>
                  Additional information about this customer
                </CardDescription>
              </CardHeader>
              <CardContent>
                {customer.customFields.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">
                    No custom fields available for this customer
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Field Name</TableHead>
                        <TableHead>Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customer.customFields.map((field, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {field.name}
                          </TableCell>
                          <TableCell>{field.value}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-12 border rounded-lg">
            <h3 className="font-medium text-lg">Customer not found</h3>
            <p className="text-muted-foreground mb-4">
              The customer you're looking for doesn't exist or has been removed
            </p>
            <Button onClick={handleBack}>Back to Customers</Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default CustomerDetailsPage;
