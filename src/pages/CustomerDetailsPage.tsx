import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { getCustomerById } from "@/services/customer";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Phone } from "lucide-react";
import { formatPhone } from "@/utils/phone";
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
import { useTranslation } from "react-i18next";
import { useAppLocale } from "@/i18n/LocaleProvider";

const CustomerDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { locale } = useAppLocale();

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
        title: t("common.error"),
        description: t("common.unknownError"),
        variant: "destructive",
      });
    }
  }, [error, t, toast]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(locale, {
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
    <div>
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
            {t("customerDetails.title")}
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
                  {formatPhone(customer.phone)}
                </CardTitle>
                <CardDescription>
                  {t("customerDetails.createdOn", { date: formatDate(customer.createdAt) })}
                  <br />
                  {t("customerDetails.lastUpdatedOn", { date: formatDate(customer.updatedAt) })}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("customerDetails.customFields")}</CardTitle>
                <CardDescription>
                  {t("customerDetails.additionalInformation")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {customer.customFields.length === 0 ? (
                  <p className="text-muted-foreground text-center py-6">
                    {t("customerDetails.noCustomFields")}
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("customerDetails.fieldName")}</TableHead>
                        <TableHead>{t("customerDetails.value")}</TableHead>
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
            <h3 className="font-medium text-lg">{t("customerDetails.notFound")}</h3>
            <p className="text-muted-foreground mb-4">
              {t("customerDetails.notFoundDescription")}
            </p>
            <Button onClick={handleBack}>{t("customerDetails.back")}</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDetailsPage;
