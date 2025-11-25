import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/services/api";
import { UploadDocumentResponse } from "@/types/file";
import { Content, CreateContentRequest } from "@/types/content";
import { FormErrorTracker } from "@/components/ui/form-error-tracker";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

type FormData = z.infer<typeof formSchema>;

interface ContentFormProps {
  contentId?: string | null;
  onComplete: (newContent: Content) => void;
}

const ContentForm = ({ contentId, onComplete }: ContentFormProps) => {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const existingContent = null;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.name.toLowerCase();
    if (!fileType.endsWith(".pdf") && !fileType.endsWith(".txt")) {
      toast({
        title: "Invalid file type",
        description: "Only PDF and TXT files are supported",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    setSelectedFile(file);
  };

  const addContent = async (contentName: string): Promise<boolean> => {
    try {
      const formData = new FormData();

      formData.append("file", selectedFile as Blob);

      const { data: file } = await api.post<UploadDocumentResponse>(
        "file/document/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const contentDataRequest: CreateContentRequest = {
        fileId: file.id,
        name: contentName,
        type: "file",
      };

      await api.post("/content", contentDataRequest);

      return true;
    } catch (error) {
      console.error("Erro no addContent", error);

      return false;
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!selectedFile && !existingContent) {
      toast({
        title: "File required",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const success = await addContent(data.name);

    setIsLoading(false);

    if (success) {
      toast({
        title: contentId ? "Content updated" : "Content created",
        description: `${data.name} has been ${
          contentId ? "updated" : "saved"
        } successfully`,
      });

      const newContent: Content = {
        id: contentId || "",
        name: data.name,
        type: "file",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      onComplete(newContent);
    } else {
      toast({
        title: "Error uploading file",
        description: "There was an error uploading the file",
        variant: "destructive",
      });
    }
  };

  return (
    <FormErrorTracker
      form={form}
      formId="content-form"
      formName="Content Upload Form"
      contextInfo={{
        contentId: contentId || "new",
        pageType: "content-management",
      }}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter content name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <FormLabel>File</FormLabel>
            <FormControl>
              <Input
                type="file"
                accept=".pdf,.txt"
                onChange={handleFileChange}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 pb-10"
              />
            </FormControl>
            <p className="text-sm text-muted-foreground">
              Only PDF and TXT files are supported
            </p>
          </FormItem>

          <div className="flex justify-end gap-4">
            <Button type="submit" isLoading={form.formState.isSubmitting}>
              {contentId ? "Save Changes" : "Create Content"}
            </Button>
          </div>
        </form>
      </Form>
    </FormErrorTracker>
  );
};

export default ContentForm;
