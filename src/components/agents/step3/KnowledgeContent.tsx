
import { useState } from 'react';
import { AgentFormData } from '@/types/agent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Upload } from 'lucide-react';

interface KnowledgeContentProps {
  formData: AgentFormData;
  updateFormData: (data: Partial<AgentFormData>) => void;
}

const KnowledgeContent = ({ formData, updateFormData }: KnowledgeContentProps) => {
  const [newContent, setNewContent] = useState('');

  const addContent = () => {
    if (newContent.trim() === '') return;
    
    const updatedContents = [...formData.contentsIds, newContent.trim()];
    updateFormData({ contentsIds: updatedContents });
    setNewContent('');
  };

  const removeContent = (index: number) => {
    const updatedContents = [...formData.contentsIds];
    updatedContents.splice(index, 1);
    updateFormData({ contentsIds: updatedContents });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // In a real app, you would upload these files to storage and get back content IDs
    const newContents = [...formData.contentsIds];
    
    Array.from(files).forEach(file => {
      // Using file name as a mock content ID
      newContents.push(`file-${file.name}`);
    });
    
    updateFormData({ contentsIds: newContents });
    e.target.value = ''; // Reset input
  };

  return (
    <div className="form-container">
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Knowledge Content</h3>
        <p className="text-sm text-muted-foreground">
          Add documents, articles, FAQs, or other content that your agent can use to answer questions.
        </p>
      </div>

      <div className="space-y-6">
        <div className="border rounded-lg p-4">
          <Label htmlFor="upload" className="block mb-2">Upload Files</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-muted-foreground">
              Drag and drop files here, or click to select files
            </p>
            <Input
              id="upload"
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <Button 
              variant="outline" 
              onClick={() => document.getElementById('upload')?.click()}
              className="mt-4"
            >
              Select Files
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Add Content ID manually</Label>
          <div className="flex space-x-2">
            <Input
              id="content"
              placeholder="Enter content ID or URL"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
            />
            <Button 
              variant="outline" 
              onClick={addContent}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <Label className="block mb-2">Current Contents ({formData.contentsIds.length})</Label>
          {formData.contentsIds.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">
              No content added yet
            </p>
          ) : (
            <div className="border rounded-md p-4 space-y-2">
              {formData.contentsIds.map((content, index) => (
                <div key={index} className="flex justify-between items-center">
                  <Badge variant="secondary" className="flex-grow mr-2 px-3 py-1 h-auto text-left font-normal">
                    {content}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeContent(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeContent;
