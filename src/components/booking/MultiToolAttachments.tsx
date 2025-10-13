import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Scissors, Leaf, Shovel, Wind, TreeDeciduous, Plus, X } from 'lucide-react';

interface Attachment {
  name: string;
  problemDescription: string;
}

interface MultiToolAttachmentsProps {
  attachments: Attachment[];
  onChange: (attachments: Attachment[]) => void;
}

const DEFAULT_ATTACHMENT_TYPES = [
  { name: 'Pruner Attachment', icon: Scissors },
  { name: 'Trimmer Attachment', icon: Scissors },
  { name: 'Edger Attachment', icon: Leaf },
  { name: 'Cultivator Attachment', icon: Shovel },
  { name: 'Blower Attachment', icon: Wind },
  { name: 'Hedge Trimmer Attachment', icon: TreeDeciduous },
];

export const MultiToolAttachments: React.FC<MultiToolAttachmentsProps> = ({
  attachments,
  onChange
}) => {
  const [customAttachments, setCustomAttachments] = useState<Array<{ name: string; icon: any }>>([]);
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [showAddField, setShowAddField] = useState(false);

  const allAttachmentTypes = [...DEFAULT_ATTACHMENT_TYPES, ...customAttachments];

  const handleProblemChange = (attachmentName: string, problem: string) => {
    const updated = [...attachments];
    const existing = updated.find(a => a.name === attachmentName);
    
    if (existing) {
      existing.problemDescription = problem;
    } else {
      updated.push({ name: attachmentName, problemDescription: problem });
    }
    
    onChange(updated);
  };

  const handleAddCustomAttachment = () => {
    if (newAttachmentName.trim()) {
      const customName = newAttachmentName.trim() + ' Attachment';
      setCustomAttachments([...customAttachments, { name: customName, icon: Scissors }]);
      setNewAttachmentName('');
      setShowAddField(false);
    }
  };

  const handleRemoveCustomAttachment = (attachmentName: string) => {
    setCustomAttachments(customAttachments.filter(att => att.name !== attachmentName));
    
    // Also remove from attachments data
    const updated = attachments.filter(a => a.name !== attachmentName);
    onChange(updated);
  };

  const getProblemDescription = (attachmentName: string): string => {
    return attachments.find(a => a.name === attachmentName)?.problemDescription || '';
  };

  const isCustomAttachment = (attachmentName: string): boolean => {
    return customAttachments.some(att => att.name === attachmentName);
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg">Multi-Tool Attachments</CardTitle>
        <p className="text-sm text-muted-foreground">
          Specify problem descriptions for each attachment
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {allAttachmentTypes.map(({ name, icon: Icon }) => (
          <div key={name} className="space-y-2">
            <Label htmlFor={`attachment-${name}`} className="flex items-center gap-2 justify-between">
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {name}
              </span>
              {isCustomAttachment(name) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => handleRemoveCustomAttachment(name)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </Label>
            <Textarea
              id={`attachment-${name}`}
              placeholder={`Describe any issues with the ${name.toLowerCase()}...`}
              value={getProblemDescription(name)}
              onChange={(e) => handleProblemChange(name, e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>
        ))}
        
        {showAddField ? (
          <div className="space-y-2 pt-2 border-t">
            <Label htmlFor="new-attachment">New Custom Attachment</Label>
            <div className="flex gap-2">
              <Input
                id="new-attachment"
                placeholder="Enter attachment name..."
                value={newAttachmentName}
                onChange={(e) => setNewAttachmentName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomAttachment();
                  }
                }}
              />
              <Button
                type="button"
                onClick={handleAddCustomAttachment}
                disabled={!newAttachmentName.trim()}
              >
                Add
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddField(false);
                  setNewAttachmentName('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setShowAddField(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Custom Attachment
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
