import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Plus, X, Check } from 'lucide-react';
import { jobBookingDB } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

interface ServiceNoteTemplatesProps {
  selectedTemplates: string[];
  onTemplatesChange: (templates: string[]) => void;
}

export const ServiceNoteTemplates: React.FC<ServiceNoteTemplatesProps> = ({
  selectedTemplates,
  onTemplatesChange
}) => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<string[]>([
    'Full Service',
    'Blade Sharpen',
    'Carburetor Clean',
    'Chain Sharpen',
    'Recoil Cord Replacement',
    'Oil Change',
    'Spark Plug Replacement',
    'Air Filter Clean/Replace',
    'Fuel System Service',
    'Engine Tune-Up',
    'Belt Replacement',
    'Tire Repair',
    'Deck Clean & Adjust',
    'Safety Check'
  ]);
  const [newTemplate, setNewTemplate] = useState('');
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      await jobBookingDB.init();
      const savedTemplates = await jobBookingDB.getServiceTemplates();
      if (savedTemplates.length > 0) {
        setTemplates(savedTemplates);
      }
    } catch (error) {
      console.error('Error loading service templates:', error);
    }
  };

  const saveTemplates = async (updatedTemplates: string[]) => {
    try {
      await jobBookingDB.saveServiceTemplates(updatedTemplates);
      setTemplates(updatedTemplates);
    } catch (error) {
      console.error('Error saving service templates:', error);
      toast({
        title: "Error",
        description: "Failed to save service templates",
        variant: "destructive"
      });
    }
  };

  const addTemplate = async () => {
    if (!newTemplate.trim()) return;
    
    const trimmedTemplate = newTemplate.trim();
    if (templates.includes(trimmedTemplate)) {
      toast({
        title: "Duplicate Template",
        description: "This template already exists",
        variant: "destructive"
      });
      return;
    }

    const updatedTemplates = [...templates, trimmedTemplate];
    await saveTemplates(updatedTemplates);
    setNewTemplate('');
    setIsAddingTemplate(false);
    
    toast({
      title: "Success",
      description: "Service template added successfully"
    });
  };

  const removeTemplate = async (templateToRemove: string) => {
    const updatedTemplates = templates.filter(t => t !== templateToRemove);
    await saveTemplates(updatedTemplates);
    
    // Remove from selected templates if it was selected
    if (selectedTemplates.includes(templateToRemove)) {
      onTemplatesChange(selectedTemplates.filter(t => t !== templateToRemove));
    }
    
    toast({
      title: "Success",
      description: "Service template removed successfully"
    });
  };

  const toggleTemplate = (template: string) => {
    if (selectedTemplates.includes(template)) {
      onTemplatesChange(selectedTemplates.filter(t => t !== template));
    } else {
      onTemplatesChange([...selectedTemplates, template]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Service Note Templates
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddingTemplate(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Template
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAddingTemplate && (
          <div className="flex gap-2">
            <Input
              value={newTemplate}
              onChange={(e) => setNewTemplate(e.target.value)}
              placeholder="Enter new service template"
              onKeyPress={(e) => e.key === 'Enter' && addTemplate()}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={addTemplate}
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAddingTemplate(false);
                setNewTemplate('');
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
        
        <div>
          <Label>Available Templates (click to select/deselect):</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {templates.map((template) => {
              const isSelected = selectedTemplates.includes(template);
              return (
                <Badge
                  key={template}
                  variant={isSelected ? "default" : "outline"}
                  className="cursor-pointer relative group"
                  onClick={() => toggleTemplate(template)}
                >
                  {template}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 h-4 w-4 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTemplate(template);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </Badge>
              );
            })}
          </div>
        </div>

        {selectedTemplates.length > 0 && (
          <div>
            <Label>Selected Templates:</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedTemplates.map((template) => (
                <Badge key={template} variant="default">
                  {template}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};