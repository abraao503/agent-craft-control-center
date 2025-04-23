
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CONTENTS, addContent } from '@/services/mockData';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
});

type FormData = z.infer<typeof formSchema>;

interface ContentFormProps {
  contentId?: string | null;
  onComplete: () => void;
}

const ContentForm = ({ contentId, onComplete }: ContentFormProps) => {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const existingContent = contentId ? CONTENTS.find(c => c.id === contentId) : null;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: existingContent?.name || '',
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileType = file.name.toLowerCase();
    if (!fileType.endsWith('.pdf') && !fileType.endsWith('.txt')) {
      toast({
        title: "Invalid file type",
        description: "Only PDF and TXT files are supported",
        variant: "destructive",
      });
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
  };

  const onSubmit = (data: FormData) => {
    if (!selectedFile && !existingContent) {
      toast({
        title: "File required",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    const fileType = (selectedFile?.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'txt') as 'pdf' | 'txt';
    
    // In a real app, we would upload the file to storage here
    // For now, we'll just create the content with a mock fileId
    const newContent = addContent(
      data.name,
      selectedFile ? `file-${selectedFile.name}` : existingContent!.fileId,
      fileType
    );

    toast({
      title: contentId ? "Content updated" : "Content created",
      description: `${newContent.name} has been ${contentId ? 'updated' : 'saved'} successfully`,
    });

    onComplete();
  };

  return (
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
              className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
          </FormControl>
          <p className="text-sm text-muted-foreground">
            Only PDF and TXT files are supported
          </p>
        </FormItem>

        <div className="flex justify-end gap-4">
          <Button type="submit">
            {contentId ? 'Save Changes' : 'Create Content'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ContentForm;
